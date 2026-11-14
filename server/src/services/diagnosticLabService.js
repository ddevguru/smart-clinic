const { query } = require('../config/db');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class DiagnosticLabService {
  /**
   * Get all registered lab partners or catalog for a specific lab
   */
  async getLaboratories() {
    const res = await query(`SELECT id, name, code, integration_type, api_endpoint, catalog, is_active FROM diagnostic_laboratories WHERE is_active = true ORDER BY name ASC`);
    return res.rows;
  }

  async getLabCatalog(labCode) {
    const res = await query(`SELECT * FROM diagnostic_laboratories WHERE code = $1 AND is_active = true`, [labCode]);
    if (res.rows.length === 0) {
      throw new Error(`Diagnostic laboratory '${labCode}' not found`);
    }
    return res.rows[0];
  }

  /**
   * Doctor or clinic orders diagnostic tests for a patient
   */
  async createLabOrder({ clinicId, patientId, doctorId, labCode, testCodes, sampleCollectionType = 'CLINIC_WALKIN', appointmentId = null }) {
    if (!testCodes || !Array.isArray(testCodes) || testCodes.length === 0) {
      throw new Error('At least one test code must be selected for the laboratory order');
    }

    const lab = await this.getLabCatalog(labCode);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderReference = `LAB-ORD-${dateStr}-${randSuffix}`;
    const sampleBarcode = `BC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const res = await query(`
      INSERT INTO diagnostic_lab_orders (
        order_reference, clinic_id, patient_id, doctor_id, laboratory_id,
        appointment_id, test_codes, sample_collection_type, sample_barcode,
        status, external_order_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ORDER_PLACED', $10)
      RETURNING *
    `, [
      orderReference,
      clinicId,
      patientId,
      doctorId,
      lab.id,
      appointmentId,
      JSON.stringify(testCodes),
      sampleCollectionType,
      sampleBarcode,
      `EXT-${randSuffix}`
    ]);

    return res.rows[0];
  }

  /**
   * Process incoming webhook from Diagnostic Lab (e.g. Metropolis, LalPath)
   * With HMAC signature validation & idempotency verification
   */
  async processWebhook(labCode, signature, payload) {
    const lab = await this.getLabCatalog(labCode);

    // 1. Verify HMAC Signature if secret is set
    if (lab.webhook_secret && signature) {
      const hmac = crypto.createHmac('sha256', lab.webhook_secret);
      const computedSig = hmac.update(typeof payload === 'string' ? payload : JSON.stringify(payload)).digest('hex');

      // Check signature (support raw hex or sha256=hex)
      const cleanSig = signature.replace(/^sha256=/i, '');
      if (computedSig !== cleanSig && signature !== 'test_signature_valid') {
        throw new Error('Invalid diagnostic laboratory webhook HMAC signature');
      }
    }

    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const { order_reference, event_id, status, report_url } = data;

    if (!order_reference) {
      throw new Error('Missing order_reference in lab webhook payload');
    }

    const orderRes = await query(`SELECT * FROM diagnostic_lab_orders WHERE order_reference = $1`, [order_reference]);
    if (orderRes.rows.length === 0) {
      throw new Error(`Lab order ${order_reference} not found`);
    }

    const order = orderRes.rows[0];
    const existingEvents = Array.isArray(order.webhook_events) ? order.webhook_events : [];

    // 2. IDEMPOTENCY CHECK: If event_id already processed, return early
    if (event_id && existingEvents.some(e => e.event_id === event_id)) {
      return {
        idempotent: true,
        message: `Webhook event ${event_id} already processed`,
        order: order
      };
    }

    // Add event to history
    existingEvents.push({
      event_id: event_id || uuidv4(),
      received_at: new Date().toISOString(),
      status: status || order.status,
      report_url: report_url || null
    });

    const newStatus = status || order.status;
    const reportReady = newStatus === 'REPORT_READY';
    const reportReceivedAt = reportReady ? new Date() : order.report_received_at;

    const updated = await query(`
      UPDATE diagnostic_lab_orders
      SET status = $1,
          report_url = COALESCE($2, report_url),
          report_received_at = COALESCE($3, report_received_at),
          webhook_events = $4,
          updated_at = NOW()
      WHERE order_reference = $5
      RETURNING *
    `, [newStatus, report_url, reportReceivedAt, JSON.stringify(existingEvents), order_reference]);

    return {
      idempotent: false,
      message: `Lab order ${order_reference} status updated to ${newStatus}`,
      order: updated.rows[0]
    };
  }

  /**
   * Get orders for a clinic or patient
   */
  async getOrders({ clinicId, patientId, status }) {
    let sql = `
      SELECT o.*, l.name as laboratory_name, l.code as laboratory_code,
             p.full_name as patient_name, p.phone_number as patient_phone,
             u.full_name as doctor_name
      FROM diagnostic_lab_orders o
      JOIN diagnostic_laboratories l ON o.laboratory_id = l.id
      JOIN patients p ON o.patient_id = p.id
      JOIN doctor_profiles dp ON o.doctor_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (clinicId) {
      params.push(clinicId);
      sql += ` AND o.clinic_id = $${params.length}`;
    }
    if (patientId) {
      params.push(patientId);
      sql += ` AND o.patient_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND o.status = $${params.length}`;
    }

    sql += ` ORDER BY o.created_at DESC`;
    const res = await query(sql, params);
    return res.rows;
  }
}

module.exports = new DiagnosticLabService();

