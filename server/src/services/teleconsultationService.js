const { query } = require('../config/db');
const crypto = require('crypto');

const TELECONSULT_SECRET = process.env.TELECONSULT_SECRET || 'teleconsult_hmac_secret_key_smartclinic_phase10';

class TeleconsultationService {
  /**
   * Create or retrieve a teleconsultation room for an appointment
   */
  async createRoom({ appointmentId, clinicId, doctorId, patientId }) {
    // Check if room already exists for this appointment
    const existing = await query(`SELECT * FROM teleconsultation_rooms WHERE appointment_id = $1`, [appointmentId]);
    if (existing.rows.length > 0) {
      if (existing.rows[0].status === 'COMPLETED') {
        const roomCode = 'ROOM-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const tokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const doctorToken = crypto
          .createHmac('sha256', TELECONSULT_SECRET)
          .update(`${roomCode}:DOCTOR:${appointmentId}:${tokenExpiresAt.getTime()}`)
          .digest('hex');
        const patientToken = crypto
          .createHmac('sha256', TELECONSULT_SECRET)
          .update(`${roomCode}:PATIENT:${appointmentId}:${tokenExpiresAt.getTime()}`)
          .digest('hex');

        const updated = await query(`
          UPDATE teleconsultation_rooms
          SET room_code = $1, doctor_token = $2, patient_token = $3, token_expires_at = $4,
              status = 'SCHEDULED', patient_joined_at = NULL, doctor_joined_at = NULL, started_at = NULL, ended_at = NULL, updated_at = NOW()
          WHERE id = $5
          RETURNING *
        `, [roomCode, doctorToken, patientToken, tokenExpiresAt, existing.rows[0].id]);
        return this.formatRoomResponse(updated.rows[0]);
      }
      return this.formatRoomResponse(existing.rows[0]);
    }

    const roomCode = 'ROOM-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const tokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours validity

    const doctorToken = crypto
      .createHmac('sha256', TELECONSULT_SECRET)
      .update(`${roomCode}:DOCTOR:${appointmentId}:${tokenExpiresAt.getTime()}`)
      .digest('hex');

    const patientToken = crypto
      .createHmac('sha256', TELECONSULT_SECRET)
      .update(`${roomCode}:PATIENT:${appointmentId}:${tokenExpiresAt.getTime()}`)
      .digest('hex');

    const roomUrl = `/teleconsult/${roomCode}`;

    const res = await query(`
      INSERT INTO teleconsultation_rooms (
        appointment_id, clinic_id, doctor_id, patient_id,
        room_code, room_url, doctor_token, patient_token,
        token_expires_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SCHEDULED')
      RETURNING *
    `, [
      appointmentId,
      clinicId,
      doctorId,
      patientId,
      roomCode,
      roomUrl,
      doctorToken,
      patientToken,
      tokenExpiresAt
    ]);

    // Mark appointment as teleconsultation
    await query(`UPDATE appointments SET is_teleconsultation = true WHERE id = $1`, [appointmentId]);

    return this.formatRoomResponse(res.rows[0]);
  }

  /**
   * Get room by roomCode
   */
  async getRoomByCode(roomCode) {
    const res = await query(`
      SELECT r.*, 
             p.full_name as patient_name,
             p.phone_number as patient_phone,
             u.full_name as doctor_name,
             dp.specialty as doctor_specialty,
             c.name as clinic_name
      FROM teleconsultation_rooms r
      LEFT JOIN patients p ON r.patient_id = p.id
      LEFT JOIN doctor_profiles dp ON r.doctor_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      LEFT JOIN clinics c ON r.clinic_id = c.id
      WHERE r.room_code = $1
    `, [roomCode]);

    if (res.rows.length === 0) {
      throw new Error(`Teleconsultation room ${roomCode} not found`);
    }

    return this.formatRoomResponse(res.rows[0]);
  }

  /**
   * Participant joins the room (Waiting Room or In Call)
   */
  async joinRoom(roomCode, participantRole, token) {
    const room = await this.getRoomByCode(roomCode);

    // Validate token expiry
    if (new Date(room.token_expires_at) < new Date()) {
      throw new Error('Teleconsultation session token has expired');
    }

    // Validate participant token
    if (participantRole === 'DOCTOR' && room.doctor_token !== token) {
      throw new Error('Invalid doctor authentication token for this room');
    }
    if (participantRole === 'PATIENT' && room.patient_token !== token) {
      throw new Error('Invalid patient authentication token for this room');
    }

    let newStatus = room.status;
    let updateFields = '';
    const params = [roomCode];

    if (participantRole === 'PATIENT') {
      if (room.status === 'SCHEDULED') {
        newStatus = 'WAITING_ROOM';
      } else if (room.doctor_joined_at) {
        newStatus = 'IN_CALL';
      }
      updateFields = ', patient_joined_at = NOW()';
    } else if (participantRole === 'DOCTOR') {
      newStatus = 'IN_CALL';
      updateFields = ', doctor_joined_at = NOW(), started_at = COALESCE(started_at, NOW())';
    }

    const updated = await query(`
      UPDATE teleconsultation_rooms
      SET status = $1 ${updateFields}, updated_at = NOW()
      WHERE room_code = $2
      RETURNING *
    `, [newStatus, roomCode]);

    return this.formatRoomResponse(updated.rows[0]);
  }

  /**
   * End video consultation
   */
  async endRoom(roomCode, doctorUserId, notes = '') {
    const room = await this.getRoomByCode(roomCode);

    const endedAt = new Date();
    const startedAt = room.started_at ? new Date(room.started_at) : new Date(room.created_at);
    const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));

    const updated = await query(`
      UPDATE teleconsultation_rooms
      SET status = 'COMPLETED',
          ended_at = $1,
          duration_seconds = $2,
          notes = $3,
          updated_at = NOW()
      WHERE room_code = $4
      RETURNING *
    `, [endedAt, durationSeconds, notes, roomCode]);

    return this.formatRoomResponse(updated.rows[0]);
  }

  formatRoomResponse(room) {
    return {
      ...room,
      ice_servers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      media_capabilities: {
        audio: true,
        video: true,
        screen_share: true,
        recording_supported: true
      }
    };
  }
}

module.exports = new TeleconsultationService();
