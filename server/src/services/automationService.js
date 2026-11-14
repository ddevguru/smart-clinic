const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

/**
 * Smart Clinic OS Background Automation & Notification Engine
 * Manages appointment reminders, queue change alerts, doctor delay notifications, and idempotent job logging.
 */
class AutomationService {

  /**
   * Log an automated job or notification delivery
   */
  static async logJob({
    jobType,
    clinicId = null,
    recipientUserId = null,
    appointmentId = null,
    queueEntryId = null,
    channel = 'PUSH',
    status = 'SENT',
    idempotencyKey = null,
    payload = {},
    errorMessage = null
  }) {
    // Check if idempotency key already exists to prevent duplicate notifications
    if (idempotencyKey) {
      const existing = await query(
        'SELECT id, status FROM automation_job_logs WHERE idempotency_key = $1',
        [idempotencyKey]
      );
      if (existing.rows.length > 0) {
        return { duplicate: true, log: existing.rows[0] };
      }
    }

    const id = uuidv4();
    const res = await query(`
      INSERT INTO automation_job_logs (
        id, job_type, clinic_id, recipient_user_id, appointment_id,
        queue_entry_id, channel, status, error_message, idempotency_key,
        payload, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `, [
      id, jobType, clinicId, recipientUserId, appointmentId,
      queueEntryId, channel, status, errorMessage, idempotencyKey,
      JSON.stringify(payload)
    ]);

    return { duplicate: false, log: res.rows[0] };
  }

  /**
   * Process automated appointment reminders
   * Checks for upcoming appointments at 24h, 2h, and 30m windows
   */
  static async processUpcomingAppointmentReminders(io = null) {
    const intervals = [
      { name: '24h', minHours: 23, maxHours: 25, label: 'Tomorrow' },
      { name: '2h', minHours: 1.5, maxHours: 2.5, label: 'in 2 Hours' },
      { name: '30m', minHours: 0.3, maxHours: 0.8, label: 'in 30 Minutes' }
    ];

    const results = [];

    for (const interval of intervals) {
      // Find eligible appointments
      const apptRes = await query(`
        SELECT a.id, a.clinic_id, a.branch_id, a.doctor_id, a.patient_id,
               a.appointment_date, a.appointment_time, a.status,
               p.full_name as patient_name, p.phone_number, p.user_id as patient_user_id,
               u.full_name as doctor_name, dp.specialty,
               c.name as clinic_name,
               aset.reminders_enabled
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctor_profiles dp ON a.doctor_id = dp.id
        JOIN users u ON dp.user_id = u.id
        JOIN clinics c ON a.clinic_id = c.id
        LEFT JOIN automation_settings aset ON aset.clinic_id = a.clinic_id
        WHERE a.status = 'SCHEDULED'
          AND (aset.reminders_enabled IS NULL OR aset.reminders_enabled = true)
          AND (a.appointment_date + a.appointment_time::time) >= NOW() + ($1 || ' hours')::INTERVAL
          AND (a.appointment_date + a.appointment_time::time) <= NOW() + ($2 || ' hours')::INTERVAL
      `, [interval.minHours, interval.maxHours]);

      for (const appt of apptRes.rows) {
        const idempKey = `reminder:appt:${appt.id}:${interval.name}`;

        // Verify patient preferences
        let shouldSend = true;
        if (appt.patient_user_id) {
          const prefRes = await query('SELECT appointment_reminders FROM notification_preferences WHERE user_id = $1', [appt.patient_user_id]);
          if (prefRes.rows.length > 0 && prefRes.rows[0].appointment_reminders === false) {
            shouldSend = false;
          }
        }

        if (shouldSend) {
          const message = `Reminder: Your appointment with ${appt.doctor_name} at ${appt.clinic_name} is ${interval.label} at ${appt.appointment_time}.`;
          const logRes = await this.logJob({
            jobType: `APPOINTMENT_REMINDER_${interval.name.toUpperCase()}`,
            clinicId: appt.clinic_id,
            recipientUserId: appt.patient_user_id,
            appointmentId: appt.id,
            channel: 'PUSH',
            status: 'SENT',
            idempotencyKey: idempKey,
            payload: {
              title: `Appointment Reminder (${interval.label})`,
              body: message,
              appointment_id: appt.id,
              doctor_name: appt.doctor_name,
              time: appt.appointment_time
            }
          });

          if (!logRes.duplicate) {
            results.push({ apptId: appt.id, interval: interval.name, status: 'SENT' });
            if (io && appt.patient_user_id) {
              io.to(`user:${appt.patient_user_id}`).emit('notification:reminder', {
                title: `Appointment Reminder (${interval.label})`,
                body: message,
                appointment_id: appt.id
              });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Broadcast Smart Queue Notification (e.g. Turn Approaching, Token Called, Delay Alert)
   */
  static async sendQueueNotification({
    queueEntryId,
    clinicId,
    eventType, // 'TURN_APPROACHING' | 'TOKEN_CALLED' | 'DOCTOR_DELAY' | 'QUEUE_PAUSED' | 'QUEUE_RESUMED'
    message,
    metadata = {},
    io = null
  }) {
    const entryRes = await query(`
      SELECT qe.*, p.user_id as patient_user_id, p.full_name as patient_name
      FROM queue_entries qe
      JOIN patients p ON qe.patient_id = p.id
      WHERE qe.id = $1 AND qe.clinic_id = $2
    `, [queueEntryId, clinicId]);

    if (entryRes.rows.length === 0) return null;
    const entry = entryRes.rows[0];

    const idempKey = `queue:${eventType}:${queueEntryId}:${Math.floor(Date.now() / 300000)}`; // 5-minute deduplication window

    const logRes = await this.logJob({
      jobType: `QUEUE_NOTIFICATION_${eventType}`,
      clinicId,
      recipientUserId: entry.patient_user_id,
      queueEntryId,
      appointmentId: entry.appointment_id,
      channel: 'PUSH',
      status: 'SENT',
      idempotencyKey: idempKey,
      payload: {
        event_type: eventType,
        token_number: entry.token_number,
        message,
        ...metadata
      }
    });

    if (io) {
      io.to(`clinic:${clinicId}`).emit(`queue:${eventType.toLowerCase()}`, {
        queue_entry_id: queueEntryId,
        token_number: entry.token_number,
        message,
        metadata
      });

      if (entry.patient_user_id) {
        io.to(`user:${entry.patient_user_id}`).emit('notification:queue', {
          event_type: eventType,
          token_number: entry.token_number,
          message,
          metadata
        });
      }
    }

    return logRes;
  }

  /**
   * Record Doctor Delay and trigger notification to all waiting patients
   */
  static async recordDoctorDelay({
    clinicId,
    branchId = null,
    doctorId,
    delayMinutes,
    reason,
    recordedByUserId,
    io = null
  }) {
    // 1. Count affected patients
    const todayStr = new Date().toISOString().split('T')[0];
    const sessionRes = await query(`
      SELECT id FROM queue_sessions 
      WHERE doctor_id = $1 AND clinic_id = $2 AND session_date = $3 AND is_active = true
    `, [doctorId, clinicId, todayStr]);

    const sessionId = sessionRes.rows[0]?.id || null;

    let affectedCount = 0;
    let waitingEntries = [];
    if (sessionId) {
      const waitRes = await query(`
        SELECT id, patient_id, token_number FROM queue_entries
        WHERE queue_session_id = $1 AND queue_status = 'WAITING'
      `, [sessionId]);
      affectedCount = waitRes.rows.length;
      waitingEntries = waitRes.rows;
    }

    // 2. Insert delay_event_logs
    const delayId = uuidv4();
    await query(`
      INSERT INTO delay_event_logs (
        id, clinic_id, branch_id, doctor_id, queue_session_id,
        delay_minutes, reason, affected_patient_count, recorded_by_user_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [delayId, clinicId, branchId, doctorId, sessionId, delayMinutes, reason || 'Clinical procedure delay', affectedCount, recordedByUserId]);

    // 3. Notify affected patients
    for (const entry of waitingEntries) {
      await this.sendQueueNotification({
        queueEntryId: entry.id,
        clinicId,
        eventType: 'DOCTOR_DELAY',
        message: `OPD Update: Doctor is running approximately ${delayMinutes} mins behind schedule due to ${reason || 'unforeseen clinical consultation'}. Your token ${entry.token_number} will be adjusted automatically.`,
        metadata: { delay_minutes: delayMinutes, reason },
        io
      });
    }

    return {
      delay_id: delayId,
      delay_minutes: delayMinutes,
      reason,
      affected_patient_count: affectedCount
    };
  }
}

module.exports = AutomationService;

