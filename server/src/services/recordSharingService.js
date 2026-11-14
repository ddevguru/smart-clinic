const { query } = require('../config/db');
const crypto = require('crypto');

class RecordSharingService {
  /**
   * Create a patient-controlled time-limited signed record sharing token
   */
  async createShareLink({ patientId, recipientName, recipientEmailOrPhone, sharedRecords = ['PRESCRIPTION', 'LAB_REPORT', 'CLINICAL_NOTE'], durationHours = 24 }) {
    const hours = Math.max(1, Math.min(durationHours, 168)); // 1 hour to 7 days
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    const token = 'rec_share_' + crypto.randomBytes(18).toString('hex');

    const res = await query(`
      INSERT INTO medical_record_shares (
        patient_id, share_token, recipient_name, recipient_email_or_phone,
        shared_records, expires_at, status, access_count
      ) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', 0)
      RETURNING *
    `, [
      patientId,
      token,
      recipientName || 'External Consulting Doctor',
      recipientEmailOrPhone || null,
      JSON.stringify(sharedRecords),
      expiresAt
    ]);

    const share = res.rows[0];
    return {
      share_id: share.id,
      share_token: share.share_token,
      share_url: `/api/v1/records/shared/${share.share_token}`,
      recipient_name: share.recipient_name,
      shared_records: share.shared_records,
      duration_hours: hours,
      expires_at: share.expires_at,
      status: share.status
    };
  }

  /**
   * Access shared medical records using the signed token
   */
  async accessSharedRecords(token, ipAddress = '127.0.0.1', userAgent = 'Unknown') {
    const shareRes = await query(`
      SELECT s.*, p.full_name as patient_name, p.gender, p.date_of_birth, p.phone_number
      FROM medical_record_shares s
      JOIN patients p ON s.patient_id = p.id
      WHERE s.share_token = $1
    `, [token]);

    if (shareRes.rows.length === 0) {
      throw new Error('Invalid or non-existent record share link');
    }

    const share = shareRes.rows[0];

    // Check status
    if (share.status === 'REVOKED') {
      throw new Error('This medical record share link has been revoked by the patient');
    }

    // Check expiry
    if (new Date(share.expires_at) < new Date()) {
      if (share.status !== 'EXPIRED') {
        await query(`UPDATE medical_record_shares SET status = 'EXPIRED' WHERE id = $1`, [share.id]);
      }
      throw new Error('This medical record share link has expired');
    }

    // Log the access in record_access_logs
    await query(`
      INSERT INTO record_access_logs (share_id, ip_address, user_agent, record_types_accessed, accessed_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [share.id, ipAddress, userAgent, JSON.stringify(share.shared_records)]);

    // Increment access count
    await query(`
      UPDATE medical_record_shares
      SET access_count = access_count + 1, updated_at = NOW()
      WHERE id = $1
    `, [share.id]);

    // Fetch corresponding permitted records
    const categories = Array.isArray(share.shared_records) ? share.shared_records : [];
    const medicalData = {};

    if (categories.includes('PRESCRIPTION')) {
      const rxRes = await query(`
        SELECT id, prescription_number, created_at, status
        FROM prescriptions
        WHERE patient_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [share.patient_id]);
      medicalData.prescriptions = rxRes.rows;
    }

    if (categories.includes('LAB_REPORT')) {
      const labRes = await query(`
        SELECT id, file_name, source_lab, report_date, overall_confidence, status, extracted_data
        FROM ai_lab_report_extractions
        WHERE patient_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [share.patient_id]);
      medicalData.lab_reports = labRes.rows;
    }

    if (categories.includes('CLINICAL_NOTE')) {
      const notesRes = await query(`
        SELECT cn.id, cn.diagnosis_summary as diagnosis, cn.clinical_notes, cn.created_at
        FROM consultation_notes cn
        JOIN appointments a ON cn.appointment_id = a.id
        WHERE a.patient_id = $1
        ORDER BY cn.created_at DESC
        LIMIT 5
      `, [share.patient_id]);
      medicalData.clinical_notes = notesRes.rows;
    }

    return {
      share_id: share.id,
      patient_name: share.patient_name,
      patient_gender: share.gender,
      expires_at: share.expires_at,
      status: share.status,
      access_count: share.access_count + 1,
      categories_permitted: share.shared_records,
      records: medicalData,
      disclaimer: 'Authorized strictly for intended clinical review under patient consent. Unauthorized redistribution is prohibited under HIPAA and Indian Digital Personal Data Protection (DPDP) Act.'
    };
  }

  /**
   * Patient immediately revokes an active share link
   */
  async revokeShare(patientId, shareId) {
    let res;
    if (patientId) {
      res = await query(`
        UPDATE medical_record_shares
        SET status = 'REVOKED',
            revoked_at = NOW(),
            updated_at = NOW()
        WHERE id = $1 AND patient_id = $2
        RETURNING *
      `, [shareId, patientId]);
    } else {
      res = await query(`
        UPDATE medical_record_shares
        SET status = 'REVOKED',
            revoked_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [shareId]);
    }

    if (res.rows.length === 0) {
      throw new Error('Share link not found or unauthorized');
    }

    return res.rows[0];
  }

  /**
   * List all share links created by patient
   */
  async getPatientShares(patientId) {
    const res = await query(`
      SELECT s.*, 
             (SELECT COUNT(*)::int FROM record_access_logs WHERE share_id = s.id) as total_logged_views,
             (SELECT accessed_at FROM record_access_logs WHERE share_id = s.id ORDER BY accessed_at DESC LIMIT 1) as last_viewed_at
      FROM medical_record_shares s
      WHERE s.patient_id = $1
      ORDER BY s.created_at DESC
    `, [patientId]);

    return res.rows;
  }
}

module.exports = new RecordSharingService();
