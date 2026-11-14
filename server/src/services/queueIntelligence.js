const { query } = require('../config/db');

/**
 * Smart Queue Intelligence Engine
 * Computes dynamic waiting times, expected consultation turn, confidence metrics, and doctor delay detection.
 */
class QueueIntelligenceService {

  /**
   * Calculate dynamic queue estimation for a specific queue entry or appointment
   */
  static async calculateEntryEstimate(queueEntryId, clinicId) {
    // 1. Fetch queue entry with associated doctor, session, and policy
    const entryRes = await query(`
      SELECT qe.*, 
             qs.is_active as session_active, qs.is_paused, qs.pause_reason, qs.paused_at,
             dp.consultation_duration_minutes,
             qp.avg_consultation_minutes, qp.grace_period_minutes,
             a.appointment_time, a.appointment_date
      FROM queue_entries qe
      LEFT JOIN queue_sessions qs ON qe.queue_session_id = qs.id
      JOIN doctor_profiles dp ON qe.doctor_id = dp.id
      LEFT JOIN queue_policies qp ON qp.doctor_id = dp.id AND qp.clinic_id = qe.clinic_id
      LEFT JOIN appointments a ON qe.appointment_id = a.id
      WHERE qe.id = $1 AND qe.clinic_id = $2
    `, [queueEntryId, clinicId]);

    if (entryRes.rows.length === 0) {
      throw new Error(`Queue entry not found: ${queueEntryId}`);
    }

    const entry = entryRes.rows[0];
    const doctorId = entry.doctor_id;
    const sessionId = entry.queue_session_id;

    // If entry is already completed or cancelled, return finished status
    if (entry.queue_status === 'COMPLETED' || entry.queue_status === 'CANCELLED') {
      return {
        queue_entry_id: entry.id,
        queue_status: entry.queue_status,
        patients_ahead: 0,
        estimated_waiting_minutes: 0,
        expected_turn_at: entry.completed_at || entry.updated_at,
        estimation_confidence: 'HIGH',
        confidence_reasons: ['Consultation concluded'],
        is_delayed: false,
        delay_minutes: 0
      };
    }

    // If currently in consultation:
    if (entry.queue_status === 'IN_CONSULTATION') {
      return {
        queue_entry_id: entry.id,
        queue_status: 'IN_CONSULTATION',
        patients_ahead: 0,
        estimated_waiting_minutes: 0,
        expected_turn_at: entry.consultation_started_at || new Date(),
        estimation_confidence: 'HIGH',
        confidence_reasons: ['Patient is currently inside consultation room'],
        is_delayed: false,
        delay_minutes: 0
      };
    }

    // 2. Count patients ahead in the queue:
    // A patient is ahead if status is 'WAITING', 'CALLED', or 'IN_CONSULTATION' AND:
    // - (they have priority_flag = true and current entry doesn't) OR
    // - (priority matches and their token_sequence < current entry token_sequence)
    const aheadRes = await query(`
      SELECT id, token_number, token_sequence, queue_status, priority_flag,
             consultation_started_at, called_at
      FROM queue_entries
      WHERE queue_session_id = $1
        AND queue_status IN ('WAITING', 'CALLED', 'IN_CONSULTATION')
        AND id != $2
        AND (
          (priority_flag = true AND $3 = false)
          OR (priority_flag = $3 AND token_sequence < $4)
        )
      ORDER BY priority_flag DESC, token_sequence ASC
    `, [sessionId, entry.id, entry.priority_flag, entry.token_sequence]);

    const patientsAhead = aheadRes.rows;
    const patientsAheadCount = patientsAhead.length;

    // 3. Determine doctor's average consultation duration:
    // Prefer recent completed consultations today; fallback to policy or profile
    const recentDurationsRes = await query(`
      SELECT EXTRACT(EPOCH FROM (completed_at - consultation_started_at))/60 as duration_min
      FROM queue_entries
      WHERE queue_session_id = $1
        AND queue_status = 'COMPLETED'
        AND consultation_started_at IS NOT NULL
        AND completed_at IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT 10
    `, [sessionId]);

    const recentDurations = recentDurationsRes.rows
      .map(r => Math.round(parseFloat(r.duration_min)))
      .filter(d => d >= 2 && d <= 60); // filter realistic consultation lengths

    let effectiveConsultationMinutes = entry.avg_consultation_minutes || entry.consultation_duration_minutes || 15;
    let hasRecentHistory = false;

    if (recentDurations.length >= 2) {
      const sum = recentDurations.reduce((a, b) => a + b, 0);
      effectiveConsultationMinutes = Math.round(sum / recentDurations.length);
      hasRecentHistory = true;
    }

    // Ensure minimum reasonable consultation duration
    effectiveConsultationMinutes = Math.max(5, effectiveConsultationMinutes);

    // 4. Calculate ongoing consultation elapsed time
    let activeConsultationRemaining = 0;
    const activePatient = patientsAhead.find(p => p.queue_status === 'IN_CONSULTATION');
    if (activePatient && activePatient.consultation_started_at) {
      const elapsedMin = Math.round((Date.now() - new Date(activePatient.consultation_started_at).getTime()) / 60000);
      activeConsultationRemaining = Math.max(2, effectiveConsultationMinutes - elapsedMin);
    } else if (patientsAhead.some(p => p.queue_status === 'CALLED')) {
      activeConsultationRemaining = effectiveConsultationMinutes;
    }

    // 5. Total estimated waiting minutes calculation
    // If someone is in room: activeConsultationRemaining + (other waiting ahead * effectiveConsultationMinutes)
    const waitingPatientsCount = patientsAhead.filter(p => p.queue_status === 'WAITING').length;
    let totalEstimatedMinutes = activeConsultationRemaining + (waitingPatientsCount * effectiveConsultationMinutes);

    // 6. Handle Queue Pause
    let isPaused = entry.is_paused === true;
    let pauseBufferMinutes = 0;
    if (isPaused) {
      pauseBufferMinutes = 15; // default expected pause hold
      totalEstimatedMinutes += pauseBufferMinutes;
    }

    // Ensure minimum wait time if patients ahead
    if (patientsAheadCount > 0 && totalEstimatedMinutes <= 0) {
      totalEstimatedMinutes = 5;
    }

    // 7. Calculate Expected Turn Time (UTC Date)
    const now = new Date();
    const expectedTurnAt = new Date(now.getTime() + totalEstimatedMinutes * 60000);

    // 8. Doctor Delay Detection
    let isDelayed = false;
    let delayMinutes = 0;
    let delayReason = entry.pause_reason || null;

    if (entry.appointment_time && entry.appointment_date) {
      const scheduledDateTimeStr = `${new Date(entry.appointment_date).toISOString().split('T')[0]}T${entry.appointment_time}:00`;
      const scheduledTime = new Date(scheduledDateTimeStr);
      if (!isNaN(scheduledTime.getTime())) {
        const diffMinutes = Math.round((expectedTurnAt.getTime() - scheduledTime.getTime()) / 60000);
        if (diffMinutes > 10) {
          isDelayed = true;
          delayMinutes = diffMinutes;
        }
      }
    }

    // Check delay event logs for doctor
    const delayLogRes = await query(`
      SELECT delay_minutes, reason 
      FROM delay_event_logs 
      WHERE doctor_id = $1 AND clinic_id = $2 AND created_at >= NOW() - INTERVAL '4 hours'
      ORDER BY created_at DESC LIMIT 1
    `, [doctorId, clinicId]);

    if (delayLogRes.rows.length > 0) {
      isDelayed = true;
      delayMinutes = Math.max(delayMinutes, delayLogRes.rows[0].delay_minutes);
      if (delayLogRes.rows[0].reason) delayReason = delayLogRes.rows[0].reason;
    }

    // 9. Queue Confidence Score: HIGH | MEDIUM | LOW
    const confidenceReasons = [];
    let estimationConfidence = 'HIGH';

    if (isPaused) {
      estimationConfidence = 'LOW';
      confidenceReasons.push(`Queue currently paused (${entry.pause_reason || 'Doctor on break'})`);
    } else if (patientsAheadCount > 10) {
      estimationConfidence = 'LOW';
      confidenceReasons.push('High volume: More than 10 patients ahead');
    } else if (!hasRecentHistory) {
      estimationConfidence = 'MEDIUM';
      confidenceReasons.push('Based on standard consultation baseline (no recent completed turns today)');
    } else {
      confidenceReasons.push('Calibrated against recent completed consultations today');
    }

    if (patientsAheadCount <= 3 && !isPaused && hasRecentHistory) {
      estimationConfidence = 'HIGH';
      confidenceReasons.push('Doctor actively consulting; queue moving steadily');
    }

    if (isDelayed) {
      confidenceReasons.push(`Doctor running approximately ${delayMinutes} mins behind schedule`);
    }

    // Update queue entry with latest estimated wait minutes
    await query(`
      UPDATE queue_entries 
      SET estimated_wait_minutes = $1, updated_at = NOW() 
      WHERE id = $2
    `, [totalEstimatedMinutes, entry.id]);

    return {
      queue_entry_id: entry.id,
      token_number: entry.token_number,
      queue_status: entry.queue_status,
      priority_flag: entry.priority_flag,
      patients_ahead: patientsAheadCount,
      estimated_waiting_minutes: totalEstimatedMinutes,
      expected_turn_at: expectedTurnAt.toISOString(),
      avg_consultation_minutes: effectiveConsultationMinutes,
      is_paused: isPaused,
      pause_reason: entry.pause_reason,
      estimation_confidence: estimationConfidence,
      confidence_reasons: confidenceReasons,
      is_delayed: isDelayed,
      delay_minutes: delayMinutes,
      delay_reason: delayReason,
      clinic_id: entry.clinic_id,
      branch_id: entry.branch_id,
      doctor_id: entry.doctor_id
    };
  }

  /**
   * Recalculate estimates for all active entries in a session (e.g. after doctor calls/completes a patient)
   */
  static async refreshSessionEstimates(sessionId, clinicId, io = null) {
    const entries = await query(`
      SELECT id FROM queue_entries 
      WHERE queue_session_id = $1 AND queue_status IN ('WAITING', 'CALLED', 'IN_CONSULTATION')
      ORDER BY priority_flag DESC, token_sequence ASC
    `, [sessionId]);

    const updatedEstimates = [];
    for (const row of entries.rows) {
      try {
        const estimate = await this.calculateEntryEstimate(row.id, clinicId);
        updatedEstimates.push(estimate);

        // Emit Socket.IO event if io instance provided
        if (io) {
          io.to(`clinic:${clinicId}`).emit('queue:estimate_updated', estimate);
          io.to(`entry:${row.id}`).emit('queue:estimate_updated', estimate);
        }
      } catch (err) {
        console.error(`Failed to refresh estimate for entry ${row.id}:`, err.message);
      }
    }
    return updatedEstimates;
  }
}

module.exports = QueueIntelligenceService;

