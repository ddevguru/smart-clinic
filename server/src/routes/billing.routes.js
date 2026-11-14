const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken, requireClinicTenant } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireClinicTenant);

// POST /api/v1/clinic/billing/record
// Record consultation or service payment
router.post('/record', async (req, res) => {
  const clinicId = req.clinicId;
  const { appointment_id, patient_id, amount, payment_method, payment_reference, notes } = req.body;

  if (!patient_id || !amount) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'patient_id and amount are required.' }
    });
  }

  try {
    // Generate sequential receipt number: RCP-YYYYMMDD-XXXX
    const today = new Date();
    const dateCode = today.toISOString().slice(0, 10).replace(/-/g, '');
    const countRes = await query(
      "SELECT COUNT(*) FROM payment_records WHERE clinic_id = $1 AND receipt_number LIKE $2",
      [clinicId, `RCP-${dateCode}-%`]
    );
    const seq = parseInt(countRes.rows[0].count, 10) + 1;
    const receiptNumber = `RCP-${dateCode}-${seq.toString().padStart(4, '0')}`;

    const paymentId = uuidv4();
    const result = await query(
      `INSERT INTO payment_records (
        id, clinic_id, appointment_id, patient_id, receipt_number,
        amount, payment_method, payment_status, payment_reference,
        notes, recorded_by_user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PAID', $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [
        paymentId, clinicId, appointment_id || null, patient_id, receiptNumber,
        parseFloat(amount), payment_method || 'CASH', payment_reference || null,
        notes || null, req.user.id
      ]
    );

    const payment = result.rows[0];

    // Fetch patient info for receipt
    const patientRes = await query('SELECT full_name, phone_number FROM patients WHERE id = $1', [patient_id]);
    const clinicRes = await query('SELECT name, address, phone FROM clinics WHERE id = $1', [clinicId]);

    return res.status(201).json({
      success: true,
      data: {
        payment,
        receipt: {
          receipt_number: payment.receipt_number,
          amount: payment.amount,
          payment_method: payment.payment_method,
          payment_date: payment.created_at,
          patient_name: patientRes.rows[0]?.full_name,
          patient_phone: patientRes.rows[0]?.phone_number,
          clinic_name: clinicRes.rows[0]?.name,
          clinic_address: clinicRes.rows[0]?.address
        }
      }
    });
  } catch (err) {
    console.error('Payment record error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to record payment.' } });
  }
});

// GET /api/v1/clinic/billing/receipt/:id
router.get('/receipt/:id', async (req, res) => {
  const { id } = req.params;
  const clinicId = req.clinicId;

  try {
    const paymentRes = await query(
      `SELECT pr.*,
              p.full_name as patient_name, p.phone_number as patient_phone,
              c.name as clinic_name, c.address as clinic_address, c.phone as clinic_phone,
              u.full_name as collected_by
       FROM payment_records pr
       JOIN patients p ON pr.patient_id = p.id
       JOIN clinics c ON pr.clinic_id = c.id
       JOIN users u ON pr.recorded_by_user_id = u.id
       WHERE pr.id = $1 AND pr.clinic_id = $2`,
      [id, clinicId]
    );

    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Payment record not found.' } });
    }

    return res.status(200).json({ success: true, data: { receipt: paymentRes.rows[0] } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to retrieve receipt.' } });
  }
});

// GET /api/v1/clinic/billing/payments
router.get('/payments', async (req, res) => {
  const clinicId = req.clinicId;
  const { limit = 50 } = req.query;

  try {
    const payments = await query(
      `SELECT pr.*,
              p.full_name as patient_name, p.phone_number as patient_phone,
              u.full_name as recorded_by_name
       FROM payment_records pr
       JOIN patients p ON pr.patient_id = p.id
       JOIN users u ON pr.recorded_by_user_id = u.id
       WHERE pr.clinic_id = $1
       ORDER BY pr.created_at DESC LIMIT $2`,
      [clinicId, parseInt(limit, 10)]
    );

    return res.status(200).json({ success: true, data: { payments: payments.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch payments.' } });
  }
});

module.exports = router;

