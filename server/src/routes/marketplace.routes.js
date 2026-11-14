const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const MarketplaceService = require('../services/marketplaceService');

// ==========================================
// 1. Public Discovery Endpoints
// ==========================================

// GET /api/v1/marketplace/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await MarketplaceService.getCategories();
    return res.status(200).json({ success: true, data: { categories } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/marketplace/services
router.get('/services', async (req, res) => {
  const { category_id, category_code } = req.query;
  try {
    const target = category_id || category_code;
    let services;
    if (target) {
      services = await MarketplaceService.getServicesByCategory(target);
    } else {
      const sRes = await query(`
        SELECT s.*, sc.name as category_name, sc.code as category_code
        FROM healthcare_services s
        JOIN healthcare_service_categories sc ON s.category_id = sc.id
        WHERE s.is_active = true
        ORDER BY s.display_order ASC;
      `);
      services = sRes.rows;
    }
    return res.status(200).json({ success: true, data: { services } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/marketplace/providers
// Discover approved providers with service area & category filtering
router.get('/providers', async (req, res) => {
  const { category_code, service_id, city, postal_code, provider_type } = req.query;
  try {
    const providers = await MarketplaceService.searchProviders({
      categoryCode: category_code,
      serviceId: service_id,
      city,
      postalCode: postal_code,
      providerType: provider_type
    });
    return res.status(200).json({ success: true, data: { providers } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/marketplace/providers/:id
router.get('/providers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const dossier = await MarketplaceService.getProviderDossier(id);
    if (!dossier) {
      return res.status(404).json({ success: false, error: { message: 'Healthcare provider not found.' } });
    }
    return res.status(200).json({ success: true, data: dossier });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/marketplace/availability
router.get('/availability', async (req, res) => {
  const { provider_id, date, time = '10:00', duration } = req.query;
  if (!provider_id || !date) {
    return res.status(400).json({ success: false, error: { message: 'provider_id and date are required.' } });
  }
  try {
    const check = await MarketplaceService.checkProviderAvailability(provider_id, date, time, duration ? parseInt(duration, 10) : 45);
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();
    const schedRes = await query('SELECT * FROM provider_availability WHERE provider_id = $1 AND day_of_week = $2 AND is_active = true', [provider_id, dayOfWeek]);
    const slots = [];
    if (schedRes.rows.length > 0) {
      const sch = schedRes.rows[0];
      const [sH] = sch.start_time.split(':').map(Number);
      const [eH] = sch.end_time.split(':').map(Number);
      for (let h = sH; h < eH; h++) {
        slots.push({
          start_time: `${String(h).padStart(2, '0')}:00`,
          end_time: `${String(h).padStart(2, '0')}:45`,
          status: 'AVAILABLE'
        });
      }
    }
    return res.status(200).json({ success: true, data: { ...check, slots } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/marketplace/providers/:id/availability
router.get('/providers/:id/availability', async (req, res) => {
  const { id } = req.params;
  const { date, time, duration } = req.query;
  if (!date || !time) {
    return res.status(400).json({ success: false, error: { message: 'date and time are required query parameters.' } });
  }
  try {
    const check = await MarketplaceService.checkProviderAvailability(id, date, time, duration ? parseInt(duration, 10) : 45);
    return res.status(200).json({ success: true, data: check });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ==========================================
// 2. Authenticated Patient Endpoints
// ==========================================

// POST /api/v1/marketplace/bookings
router.post('/bookings', authenticateToken, async (req, res) => {
  const {
    patient_id,
    provider_id,
    service_id,
    service_address,
    city = 'Bengaluru',
    postal_code,
    latitude,
    longitude,
    contact_phone,
    scheduled_date,
    scheduled_start_time,
    patient_notes,
    payment_method = 'RAZORPAY'
  } = req.body;

  if (!service_id || !service_address || !scheduled_date || !scheduled_start_time) {
    return res.status(400).json({
      success: false,
      error: { message: 'service_id, service_address, scheduled_date, and scheduled_start_time are required.' }
    });
  }

  try {
    // If patient_id not provided, resolve or create patient profile for current user
    let resolvedPatientId = patient_id;
    if (!resolvedPatientId) {
      const pRes = await query('SELECT id FROM patients WHERE user_id = $1 LIMIT 1', [req.user.id]);
      if (pRes.rows.length > 0) {
        resolvedPatientId = pRes.rows[0].id;
      } else {
        let clinicId = null;
        if (provider_id) {
          const pr = await query('SELECT associated_clinic_id FROM healthcare_provider_profiles WHERE id = $1', [provider_id]);
          if (pr.rows.length > 0) clinicId = pr.rows[0].associated_clinic_id;
        }
        if (!clinicId) {
          const cRes = await query('SELECT id FROM clinics LIMIT 1');
          clinicId = cRes.rows.length > 0 ? cRes.rows[0].id : null;
        }
        const newPatientId = uuidv4();
        await query(`
          INSERT INTO patients (id, clinic_id, user_id, full_name, phone_number, gender, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, 'OTHER', true, NOW(), NOW());
        `, [newPatientId, clinicId, req.user.id, req.user.full_name || 'Home Care Patient', req.user.phone_number || contact_phone || '+919999999999']);
        resolvedPatientId = newPatientId;
      }
    }

    const booking = await MarketplaceService.createBooking({
      patientId: resolvedPatientId,
      bookedByUserId: req.user.id,
      providerId: provider_id || null,
      serviceId: service_id,
      address: service_address,
      city,
      postalCode: postal_code,
      latitude,
      longitude,
      contactPhone: contact_phone || req.user.phone_number || '+919876543210',
      scheduledDate: scheduled_date,
      scheduledStartTime: scheduled_start_time,
      patientNotes: patient_notes,
      paymentMethod: payment_method
    });

    return res.status(201).json({
      success: true,
      data: {
        message: 'Home healthcare visit booked successfully!',
        booking
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/marketplace/my-bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bRes = await query(`
      SELECT
        b.*,
        s.name as service_name,
        sc.name as category_name,
        p.full_name as provider_name,
        p.provider_type,
        p.phone_number as provider_phone
      FROM home_visit_bookings b
      JOIN healthcare_services s ON b.service_id = s.id
      JOIN healthcare_service_categories sc ON b.service_category_id = sc.id
      LEFT JOIN healthcare_provider_profiles p ON b.provider_id = p.id
      WHERE b.booked_by_user_id = $1
      ORDER BY b.created_at DESC;
    `, [req.user.id]);

    return res.status(200).json({ success: true, data: { bookings: bRes.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/marketplace/bookings/:id
router.get('/bookings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const bRes = await query(`
      SELECT
        b.*,
        s.name as service_name,
        s.default_duration_minutes,
        sc.name as category_name,
        p.full_name as provider_name,
        p.provider_type,
        p.qualification as provider_qualification,
        p.rating_avg as provider_rating,
        p.user_id as provider_user_id
      FROM home_visit_bookings b
      JOIN healthcare_services s ON b.service_id = s.id
      JOIN healthcare_service_categories sc ON b.service_category_id = sc.id
      LEFT JOIN healthcare_provider_profiles p ON b.provider_id = p.id
      WHERE b.id = $1;
    `, [id]);

    if (bRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Booking not found.' } });
    }
    const booking = bRes.rows[0];

    // Status history
    const histRes = await query(`
      SELECT * FROM home_visit_status_history
      WHERE booking_id = $1
      ORDER BY created_at ASC;
    `, [id]);

    // Service documentation if completed
    let serviceRecord = null;
    if (booking.status === 'COMPLETED') {
      const recRes = await query('SELECT * FROM home_visit_service_records WHERE booking_id = $1', [id]);
      serviceRecord = recRes.rows[0] || null;
    }

    // Mask address if requester is unauthorized
    const displayAddress = MarketplaceService.maskAddressForPrivacy(booking, req.user.id, req.userRole);

    return res.status(200).json({
      success: true,
      data: {
        booking: {
          ...booking,
          service_address: displayAddress
        },
        status_history: histRes.rows,
        service_record: serviceRecord
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/marketplace/bookings/:id/cancel
router.post('/bookings/:id/cancel', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { reason = 'Cancelled by patient' } = req.body;
  try {
    const updated = await MarketplaceService.transitionBookingStatus(
      id,
      'CANCELLED',
      req.user.id,
      req.userRole || 'PATIENT',
      { reason }
    );
    return res.status(200).json({
      success: true,
      data: {
        message: 'Home visit booking cancelled.',
        booking: updated
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/marketplace/review and /bookings/:id/review
router.post(['/review', '/bookings/:id/review'], authenticateToken, async (req, res) => {
  const id = req.params.id || req.body.booking_id;
  const { rating, punctuality_rating, review_text, review_comment } = req.body;

  if (!rating || !id) {
    return res.status(400).json({ success: false, error: { message: 'booking_id and rating (1-5 stars) are required.' } });
  }

  try {
    const review = await MarketplaceService.submitReview({
      bookingId: id,
      patientUserId: req.user.id,
      rating: parseInt(rating, 10),
      punctualityRating: punctuality_rating ? parseInt(punctuality_rating, 10) : parseInt(rating, 10),
      reviewText: review_text || review_comment || ''
    });

    return res.status(201).json({
      success: true,
      data: {
        message: 'Verified patient review submitted successfully!',
        review
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// ==========================================
// 3. Provider Operations Endpoints
// ==========================================

// Helper to resolve provider profile from authenticated user
async function resolveProviderProfile(userId) {
  const res = await query('SELECT * FROM healthcare_provider_profiles WHERE user_id = $1', [userId]);
  return res.rows[0] || null;
}

// GET /api/v1/marketplace/provider/dashboard
router.get('/provider/dashboard', authenticateToken, async (req, res) => {
  try {
    const provider = await resolveProviderProfile(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, error: { message: 'Healthcare provider profile not registered.' } });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's bookings
    const todayRes = await query(`
      SELECT b.*, s.name as service_name, p.full_name as patient_name
      FROM home_visit_bookings b
      JOIN healthcare_services s ON b.service_id = s.id
      JOIN patients p ON b.patient_id = p.id
      WHERE b.provider_id = $1 AND b.scheduled_date = $2
      ORDER BY b.scheduled_start_time ASC;
    `, [provider.id, todayStr]);

    // Active / upcoming requests
    const upcomingRes = await query(`
      SELECT b.*, s.name as service_name, p.full_name as patient_name
      FROM home_visit_bookings b
      JOIN healthcare_services s ON b.service_id = s.id
      JOIN patients p ON b.patient_id = p.id
      WHERE b.provider_id = $1
        AND b.status IN ('REQUESTED', 'ASSIGNED', 'ACCEPTED', 'CONFIRMED', 'PROVIDER_EN_ROUTE', 'ARRIVED', 'SERVICE_IN_PROGRESS')
      ORDER BY b.scheduled_date ASC, b.scheduled_start_time ASC
      LIMIT 10;
    `, [provider.id]);

    // Earnings
    const earnRes = await query(`
      SELECT
        COALESCE(SUM(provider_payable_amount), 0) as total_earnings,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count
      FROM home_visit_bookings
      WHERE provider_id = $1;
    `, [provider.id]);

    return res.status(200).json({
      success: true,
      data: {
        provider,
        today_visits: todayRes.rows,
        upcoming_visits: upcomingRes.rows,
        metrics: {
          total_earnings: parseFloat(earnRes.rows[0].total_earnings),
          completed_visits: parseInt(earnRes.rows[0].completed_count, 10),
          average_rating: parseFloat(provider.rating_avg),
          review_count: provider.rating_count
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST or PATCH /api/v1/marketplace/provider/bookings/:id/status
const handleStatusUpdate = async (req, res) => {
  const { id } = req.params;
  const { status, notes, reason } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, error: { message: 'status is required.' } });
  }

  try {
    const updated = await MarketplaceService.transitionBookingStatus(
      id,
      status.toUpperCase(),
      req.user.id,
      'PROVIDER',
      { notes, reason }
    );
    return res.status(200).json({
      success: true,
      data: {
        message: `Visit status updated to ${status}.`,
        booking: updated
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
};
router.post('/provider/bookings/:id/status', authenticateToken, handleStatusUpdate);
router.patch('/provider/bookings/:id/status', authenticateToken, handleStatusUpdate);

// POST or PATCH /api/v1/marketplace/provider/bookings/:id/complete
const handleCompleteBooking = async (req, res) => {
  const { id } = req.params;
  const {
    clinical_observations,
    clinical_notes,
    vitals,
    vital_signs,
    procedure_notes,
    checklist_completed,
    follow_up_recommendation,
    recommendations,
    prescription_id,
    specimen_identifiers
  } = req.body;

  try {
    const updated = await MarketplaceService.transitionBookingStatus(
      id,
      'COMPLETED',
      req.user.id,
      'PROVIDER',
      {
        clinicalObservations: clinical_observations || clinical_notes,
        vitals: vitals || vital_signs,
        procedureNotes: procedure_notes,
        checklist: checklist_completed,
        notes: follow_up_recommendation || recommendations,
        prescriptionId: prescription_id,
        specimens: specimen_identifiers
      }
    );

    // Retrieve service record
    const sRecRes = await query('SELECT * FROM home_visit_service_records WHERE booking_id = $1', [id]);
    const sRecord = sRecRes.rows[0] || null;
    if (sRecord && sRecord.vitals) {
      sRecord.vital_signs = sRecord.vitals;
    }

    return res.status(200).json({
      success: true,
      data: {
        message: 'Home healthcare visit completed and clinical documentation saved.',
        booking: updated,
        service_record: sRecord
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
};
router.post('/provider/bookings/:id/complete', authenticateToken, handleCompleteBooking);
router.patch('/provider/bookings/:id/complete', authenticateToken, handleCompleteBooking);

// PUT /api/v1/marketplace/provider/availability
router.put('/provider/availability', authenticateToken, async (req, res) => {
  const { schedule } = req.body; // Array of { day_of_week, start_time, end_time, max_daily_visits }
  try {
    const provider = await resolveProviderProfile(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, error: { message: 'Provider profile not found.' } });
    }

    if (Array.isArray(schedule)) {
      for (const item of schedule) {
        await query(`
          INSERT INTO provider_availability (id, provider_id, day_of_week, start_time, end_time, max_daily_visits, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, true)
          ON CONFLICT (provider_id, day_of_week) DO UPDATE SET
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            max_daily_visits = EXCLUDED.max_daily_visits,
            is_active = true;
        `, [uuidv4(), provider.id, item.day_of_week, item.start_time || '09:00', item.end_time || '18:00', item.max_daily_visits || 6]);
      }
    }

    return res.status(200).json({ success: true, data: { message: 'Availability schedule updated successfully.' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ==========================================
// 4. Super Admin Management Endpoints
// ==========================================

// GET /api/v1/marketplace/admin/overview
router.get('/admin/overview', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const analytics = await MarketplaceService.getSuperAdminMarketplaceAnalytics();
    return res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/marketplace/admin/providers
router.get('/admin/providers', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  const { status } = req.query;
  try {
    let sql = `
      SELECT p.*, c.name as associated_clinic_name
      FROM healthcare_provider_profiles p
      LEFT JOIN clinics c ON p.associated_clinic_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      params.push(status.toUpperCase());
      sql += ` AND p.verification_status = $${params.length}`;
    }
    sql += ` ORDER BY p.created_at DESC;`;
    const pRes = await query(sql, params);
    return res.status(200).json({ success: true, data: { providers: pRes.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST or PATCH /api/v1/marketplace/admin/providers/:id/verify
const handleProviderVerify = async (req, res) => {
  const { id } = req.params;
  const status = req.body.verification_status || req.body.status || 'APPROVED';
  const notes = req.body.verification_notes || req.body.notes || 'Verified by Super Admin';

  try {
    const updated = await query(`
      UPDATE healthcare_provider_profiles SET
        verification_status = $1,
        verification_notes = $2,
        verified_at = NOW(),
        verified_by_user_id = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `, [status.toUpperCase(), notes, req.user.id, id]);

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Provider profile not found.' } });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: `Provider verification status updated to ${status}.`,
        provider: updated.rows[0]
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
};
router.post('/admin/providers/:id/verify', authenticateToken, requireRoles('SUPER_ADMIN'), handleProviderVerify);
router.patch('/admin/providers/:id/verify', authenticateToken, requireRoles('SUPER_ADMIN'), handleProviderVerify);

// ==========================================
// 5. Clinic Home Healthcare Management
// ==========================================

// GET /api/v1/marketplace/clinic/overview
router.get('/clinic/overview', authenticateToken, async (req, res) => {
  const clinicId = req.headers['x-clinic-id'] || req.query.clinic_id;
  try {
    const [bRes, pRes] = await Promise.all([
      query(`
        SELECT b.*, s.name as service_name, p.full_name as provider_name
        FROM home_visit_bookings b
        JOIN healthcare_services s ON b.service_id = s.id
        LEFT JOIN healthcare_provider_profiles p ON b.provider_id = p.id
        WHERE b.clinic_id = $1
        ORDER BY b.scheduled_date DESC
        LIMIT 20;
      `, [clinicId]),
      query(`
        SELECT * FROM healthcare_provider_profiles
        WHERE associated_clinic_id = $1;
      `, [clinicId])
    ]);

    return res.status(200).json({
      success: true,
      data: {
        bookings: bRes.rows,
        providers: pRes.rows
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
