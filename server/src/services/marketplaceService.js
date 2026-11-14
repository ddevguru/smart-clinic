const { query, pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const TravelEstimationService = require('./travelEstimationService');

class MarketplaceService {
  /**
   * Get active service categories with service count
   */
  static async getCategories() {
    const res = await query(`
      SELECT
        c.*,
        count(s.id) as service_count
      FROM healthcare_service_categories c
      LEFT JOIN healthcare_services s ON c.id = s.category_id AND s.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.display_order ASC;
    `);
    return res.rows;
  }

  /**
   * Get active services by category code or ID
   */
  static async getServicesByCategory(categoryIdOrCode) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryIdOrCode);
    let catRes;
    if (isUuid) {
      catRes = await query('SELECT * FROM healthcare_service_categories WHERE id = $1', [categoryIdOrCode]);
    } else {
      catRes = await query('SELECT * FROM healthcare_service_categories WHERE code = $1', [categoryIdOrCode.toUpperCase()]);
    }
    if (catRes.rows.length === 0) return [];
    const cat = catRes.rows[0];

    const servRes = await query(`
      SELECT * FROM healthcare_services
      WHERE category_id = $1 AND is_active = true
      ORDER BY display_order ASC;
    `, [cat.id]);

    return servRes.rows.map(s => ({ ...s, category_name: cat.name, category_code: cat.code }));
  }

  /**
   * Search and filter verified healthcare providers
   * Strictly returns ONLY APPROVED providers
   */
  static async searchProviders({
    categoryCode,
    serviceId,
    city = 'Bengaluru',
    postalCode,
    date,
    providerType
  } = {}) {
    let sql = `
      SELECT DISTINCT
        p.id,
        p.full_name,
        p.provider_type,
        p.qualification,
        p.specialty,
        p.experience_years,
        p.registration_number,
        p.registration_council,
        p.languages,
        p.profile_photo_url,
        p.rating_avg,
        p.rating_count,
        p.verification_status,
        c.name as clinic_name,
        ps.custom_price,
        s.base_price,
        COALESCE(ps.custom_price, s.base_price) as service_fee,
        s.name as service_name,
        s.code as service_code,
        s.default_duration_minutes,
        sc.name as category_name,
        sc.code as category_code
      FROM healthcare_provider_profiles p
      JOIN provider_services ps ON p.id = ps.provider_id AND ps.is_offered = true
      JOIN healthcare_services s ON ps.service_id = s.id AND s.is_active = true
      JOIN healthcare_service_categories sc ON s.category_id = sc.id AND sc.is_active = true
      LEFT JOIN clinics c ON p.associated_clinic_id = c.id
      LEFT JOIN provider_service_areas psa ON p.id = psa.provider_id
      WHERE p.verification_status = 'APPROVED'
        AND p.is_active = true
    `;
    const params = [];

    if (categoryCode) {
      params.push(categoryCode.toUpperCase());
      sql += ` AND sc.code = $${params.length}`;
    }

    if (serviceId) {
      params.push(serviceId);
      sql += ` AND s.id = $${params.length}`;
    }

    if (providerType) {
      params.push(providerType.toUpperCase());
      sql += ` AND p.provider_type = $${params.length}`;
    }

    if (city) {
      params.push(`%${city}%`);
      sql += ` AND psa.city ILIKE $${params.length}`;
    }

    if (postalCode) {
      params.push(postalCode);
      sql += ` AND psa.postal_code = $${params.length}`;
    }

    sql += ` ORDER BY p.rating_avg DESC, p.experience_years DESC;`;
    const res = await query(sql, params);
    return res.rows;
  }

  /**
   * Get detailed provider dossier with verified credentials
   */
  static async getProviderDossier(providerId) {
    const pRes = await query(`
      SELECT
        p.*,
        c.name as associated_clinic_name
      FROM healthcare_provider_profiles p
      LEFT JOIN clinics c ON p.associated_clinic_id = c.id
      WHERE p.id = $1;
    `, [providerId]);

    if (pRes.rows.length === 0) return null;
    const provider = pRes.rows[0];

    // Services offered
    const servRes = await query(`
      SELECT
        s.*,
        ps.custom_price,
        COALESCE(ps.custom_price, s.base_price) as final_price,
        sc.name as category_name,
        sc.code as category_code
      FROM provider_services ps
      JOIN healthcare_services s ON ps.service_id = s.id
      JOIN healthcare_service_categories sc ON s.category_id = sc.id
      WHERE ps.provider_id = $1 AND ps.is_offered = true;
    `, [providerId]);

    // Service areas
    const areaRes = await query(`
      SELECT * FROM provider_service_areas WHERE provider_id = $1;
    `, [providerId]);

    // Availability schedule
    const availRes = await query(`
      SELECT * FROM provider_availability WHERE provider_id = $1 AND is_active = true ORDER BY day_of_week ASC;
    `, [providerId]);

    // Verified reviews
    const revRes = await query(`
      SELECT
        r.id, r.rating, r.punctuality_rating, r.review_text, r.created_at,
        p.full_name as patient_name
      FROM provider_reviews r
      JOIN patients p ON r.patient_id = p.id
      WHERE r.provider_id = $1 AND r.is_moderated = true
      ORDER BY r.created_at DESC
      LIMIT 10;
    `, [providerId]);

    return {
      provider,
      services: servRes.rows,
      service_areas: areaRes.rows,
      availability: availRes.rows,
      reviews: revRes.rows
    };
  }

  /**
   * Check Provider Availability for a specific date and time slot
   */
  static async checkProviderAvailability(providerId, dateStr, startTime, durationMinutes = 45) {
    const provRes = await query('SELECT * FROM healthcare_provider_profiles WHERE id = $1', [providerId]);
    if (provRes.rows.length === 0) {
      return { available: false, reason: 'Provider profile does not exist.' };
    }
    const provider = provRes.rows[0];
    if (provider.verification_status !== 'APPROVED') {
      return { available: false, reason: `Provider verification status is ${provider.verification_status}. Only approved providers may accept bookings.` };
    }

    const bookingDate = new Date(dateStr);
    const dayOfWeek = bookingDate.getDay(); // 0 = Sun, 1 = Mon ...

    const availRes = await query(`
      SELECT * FROM provider_availability
      WHERE provider_id = $1 AND day_of_week = $2 AND is_active = true;
    `, [providerId, dayOfWeek]);

    if (availRes.rows.length === 0) {
      return { available: false, reason: 'Provider is not scheduled for home visits on this day of the week.' };
    }
    const schedule = availRes.rows[0];

    // Check shift working hours
    if (startTime < schedule.start_time || startTime >= schedule.end_time) {
      return { available: false, reason: `Requested time ${startTime} is outside provider operating hours (${schedule.start_time} - ${schedule.end_time}).` };
    }

    // Check maximum daily visits
    const countRes = await query(`
      SELECT count(*) as cnt FROM home_visit_bookings
      WHERE provider_id = $1
        AND scheduled_date = $2
        AND status NOT IN ('CANCELLED', 'REJECTED');
    `, [providerId, dateStr]);

    if (parseInt(countRes.rows[0].cnt, 10) >= schedule.max_daily_visits) {
      return { available: false, reason: `Provider has reached maximum daily home visit capacity (${schedule.max_daily_visits} visits) on this date.` };
    }

    // Check time conflict with other bookings (including 30-min travel/prep buffer)
    const [startH, startM] = startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = startMinutes + durationMinutes;

    const existingAppts = await query(`
      SELECT scheduled_start_time, scheduled_end_time FROM home_visit_bookings
      WHERE provider_id = $1
        AND scheduled_date = $2
        AND status NOT IN ('CANCELLED', 'REJECTED');
    `, [providerId, dateStr]);

    const buffer = schedule.buffer_minutes || 30;

    for (const b of existingAppts.rows) {
      const [bStartH, bStartM] = b.scheduled_start_time.split(':').map(Number);
      const [bEndH, bEndM] = b.scheduled_end_time.split(':').map(Number);
      const bStartMin = bStartH * 60 + bStartM - buffer;
      const bEndMin = bEndH * 60 + bEndM + buffer;

      // Overlap check
      if (startMinutes < bEndMin && endMinutes > bStartMin) {
        return {
          available: false,
          reason: `Time slot conflict: Provider has an overlapping commitment around ${b.scheduled_start_time} including travel buffer.`
        };
      }
    }

    return { available: true };
  }

  /**
   * Generate sequential booking reference: HV-YYYYMMDD-XXXX
   */
  static async generateBookingReference() {
    const today = new Date();
    const dateCode = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `HV-${dateCode}-`;

    const countRes = await query(`
      SELECT count(*) as cnt FROM home_visit_bookings
      WHERE booking_reference LIKE $1;
    `, [`${prefix}%`]);

    const seq = parseInt(countRes.rows[0].cnt, 10) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  /**
   * Create a new Home Visit Booking
   */
  static async createBooking({
    patientId,
    bookedByUserId,
    providerId,
    serviceId,
    address,
    city = 'Bengaluru',
    postalCode,
    latitude,
    longitude,
    contactPhone,
    scheduledDate,
    scheduledStartTime,
    patientNotes,
    paymentMethod = 'RAZORPAY'
  }) {
    // 1. Fetch Service details
    const servRes = await query(`
      SELECT s.*, sc.name as category_name, sc.id as cat_id
      FROM healthcare_services s
      JOIN healthcare_service_categories sc ON s.category_id = sc.id
      WHERE s.id = $1 AND s.is_active = true;
    `, [serviceId]);

    if (servRes.rows.length === 0) {
      throw new Error('Healthcare service not found or deactivated.');
    }
    const service = servRes.rows[0];

    // 2. Compute End Time
    const [startH, startM] = scheduledStartTime.split(':').map(Number);
    const duration = service.default_duration_minutes || 45;
    const endTotalMinutes = startH * 60 + startM + duration;
    const endH = String(Math.floor(endTotalMinutes / 60)).padStart(2, '0');
    const endM = String(endTotalMinutes % 60).padStart(2, '0');
    const scheduledEndTime = `${endH}:${endM}`;

    // 3. Provider validation if patient-selected
    let provider = null;
    let servicePrice = parseFloat(service.base_price);
    let clinicId = null;

    if (providerId) {
      const availCheck = await this.checkProviderAvailability(providerId, scheduledDate, scheduledStartTime, duration);
      if (!availCheck.available) {
        throw new Error(availCheck.reason);
      }

      const pRes = await query('SELECT * FROM healthcare_provider_profiles WHERE id = $1', [providerId]);
      provider = pRes.rows[0];
      clinicId = provider.associated_clinic_id || null;

      // Check custom service price
      const psRes = await query('SELECT custom_price FROM provider_services WHERE provider_id = $1 AND service_id = $2', [providerId, serviceId]);
      if (psRes.rows.length > 0 && psRes.rows[0].custom_price) {
        servicePrice = parseFloat(psRes.rows[0].custom_price);
      }
    }

    // 4. Calculate Travel & Distance Estimate
    const travelEstimate = TravelEstimationService.estimateTravel({
      patientLat: latitude,
      patientLon: longitude,
      patientAddress: address,
      scheduledTime: scheduledStartTime
    });

    const travelCharge = travelEstimate.distance_km > 10 ? 150.00 : 50.00;
    const subtotal = servicePrice + travelCharge;
    const taxAmount = +(subtotal * 0.18).toFixed(2);
    const totalAmount = +(subtotal + taxAmount).toFixed(2);

    // Platform Commission (15%) & Provider Payable (85% of service subtotal)
    const commissionRate = 15.00;
    const platformCommission = +(servicePrice * 0.15).toFixed(2);
    const providerPayable = +(servicePrice * 0.85).toFixed(2);

    const bookingRef = await this.generateBookingReference();
    const bookingId = uuidv4();
    const initialStatus = providerId ? 'REQUESTED' : 'PENDING_ASSIGNMENT';
    const assignmentType = providerId ? 'PATIENT_SELECTED' : 'PLATFORM_ASSISTED';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insRes = await client.query(`
        INSERT INTO home_visit_bookings (
          id, booking_reference, patient_id, booked_by_user_id,
          provider_id, service_id, service_category_id, clinic_id,
          assignment_type, status, scheduled_date, scheduled_start_time,
          scheduled_end_time, estimated_travel_minutes, estimated_travel_distance_km,
          service_address, city, postal_code, latitude, longitude,
          contact_phone, patient_notes, service_price, travel_charge,
          tax_amount, total_amount, currency, payment_status, payment_method,
          commission_rate_pct, platform_commission_amount, provider_payable_amount,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, 'INR', 'PENDING', $27,
          $28, $29, $30,
          NOW(), NOW()
        ) RETURNING *;
      `, [
        bookingId, bookingRef, patientId, bookedByUserId,
        providerId || null, serviceId, service.cat_id, clinicId,
        assignmentType, initialStatus, scheduledDate, scheduledStartTime,
        scheduledEndTime, travelEstimate.travel_duration_minutes, travelEstimate.distance_km,
        address, city, postalCode || '560001', latitude || null, longitude || null,
        contactPhone, patientNotes || '', servicePrice, travelCharge,
        taxAmount, totalAmount, paymentMethod,
        commissionRate, platformCommission, providerPayable
      ]);

      // Status history
      await client.query(`
        INSERT INTO home_visit_status_history (
          id, booking_id, from_status, to_status, changed_by_user_id, reason, notes, created_at
        ) VALUES (
          gen_random_uuid(), $1, NULL, $2, $3, 'Home visit booking created by patient', $4, NOW()
        );
      `, [bookingId, initialStatus, bookedByUserId, `Service: ${service.name}`]);

      await client.query('COMMIT');
      return insRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Transition Booking Status with State Machine Validation
   */
  static async transitionBookingStatus(bookingId, newStatus, actorUserId, actorRole, {
    reason,
    notes,
    providerId,
    vitals,
    clinicalObservations,
    procedureNotes,
    checklist,
    prescriptionId,
    specimens
  } = {}) {
    const validTransitions = {
      REQUESTED: ['ACCEPTED', 'REJECTED', 'PENDING_ASSIGNMENT', 'CANCELLED'],
      PENDING_ASSIGNMENT: ['ASSIGNED', 'CANCELLED'],
      ASSIGNED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED: ['CONFIRMED', 'PROVIDER_EN_ROUTE', 'CANCELLED', 'RESCHEDULED'],
      CONFIRMED: ['PROVIDER_EN_ROUTE', 'CANCELLED', 'RESCHEDULED'],
      PROVIDER_EN_ROUTE: ['ARRIVED', 'CANCELLED'],
      ARRIVED: ['SERVICE_IN_PROGRESS', 'NO_SHOW', 'CANCELLED'],
      SERVICE_IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
      REJECTED: ['PENDING_ASSIGNMENT', 'CANCELLED'],
      NO_SHOW: []
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const bRes = await client.query('SELECT * FROM home_visit_bookings WHERE id = $1 FOR UPDATE', [bookingId]);
      if (bRes.rows.length === 0) throw new Error('Home visit booking not found.');
      const booking = bRes.rows[0];

      const currentStatus = booking.status;
      const allowed = validTransitions[currentStatus] || [];

      if (!allowed.includes(newStatus) && actorRole !== 'SUPER_ADMIN') {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}.`);
      }

      let assignedProviderId = booking.provider_id;
      if (newStatus === 'ASSIGNED' && providerId) {
        assignedProviderId = providerId;
      }

      const isCompleted = newStatus === 'COMPLETED';
      let completedAt = booking.completed_at;
      let cancelledAt = booking.cancelled_at;
      if (isCompleted) completedAt = new Date();
      if (newStatus === 'CANCELLED') cancelledAt = new Date();

      const newPaymentStatus = isCompleted ? 'PAID' : (booking.payment_status || 'PENDING');

      const updRes = await client.query(`
        UPDATE home_visit_bookings SET
          status = $1,
          provider_id = COALESCE($2, provider_id),
          completed_at = COALESCE($3, completed_at),
          cancelled_at = COALESCE($4, cancelled_at),
          cancellation_reason = COALESCE($5, cancellation_reason),
          payment_status = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING *;
      `, [newStatus, assignedProviderId, completedAt, cancelledAt, reason || null, newPaymentStatus, bookingId]);

      // Record in history
      await client.query(`
        INSERT INTO home_visit_status_history (
          id, booking_id, from_status, to_status, changed_by_user_id, reason, notes, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
        );
      `, [bookingId, currentStatus, newStatus, actorUserId, reason || null, notes || null]);

      // If COMPLETED, record clinical documentation
      if (newStatus === 'COMPLETED') {
        await client.query(`
          INSERT INTO home_visit_service_records (
            id, booking_id, provider_id, started_at, completed_at,
            clinical_observations, vitals, procedure_notes, checklist_completed,
            follow_up_recommendation, specimen_identifiers, prescription_id, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, NOW() - INTERVAL '45 minutes', NOW(),
            $3, $4::jsonb, $5, $6::jsonb,
            $7, $8::jsonb, $9, NOW()
          );
        `, [
          bookingId, assignedProviderId,
          clinicalObservations || 'Home healthcare service delivered according to professional guidelines.',
          JSON.stringify(vitals || { pulse: 74, bp: '120/80', spo2: 98, temp: '98.4 F' }),
          procedureNotes || 'Vital checks and procedure completed smoothly.',
          JSON.stringify(checklist || ['Patient identity verified', 'Sterile kit unpacked', 'Vitals checked', 'Documentation provided']),
          notes || 'Routine follow-up in 10-14 days or as necessary.',
          JSON.stringify(specimens || []),
          prescriptionId || null
        ]);
      }

      await client.query('COMMIT');
      return updRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Mask sensitive patient address for privacy
   * Precise street address is ONLY revealed to assigned provider when status is active/en route
   */
  static maskAddressForPrivacy(booking, userId, userRole) {
    const isPatient = booking.booked_by_user_id === userId;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const activeProviderStatuses = ['ACCEPTED', 'CONFIRMED', 'PROVIDER_EN_ROUTE', 'ARRIVED', 'SERVICE_IN_PROGRESS', 'COMPLETED'];
    const isAssignedProvider = booking.provider_user_id === userId && activeProviderStatuses.includes(booking.status);

    if (isPatient || isSuperAdmin || isAssignedProvider) {
      return booking.service_address;
    }

    // Return masked locality only
    return `[Address Protected] ${booking.city || 'Bengaluru'} - ${booking.postal_code || '560001'}`;
  }

  /**
   * Submit patient review for a completed home visit
   * Strictly enforces that only completed visits can be reviewed
   */
  static async submitReview({ bookingId, patientUserId, rating, punctualityRating, reviewText }) {
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5 stars.');

    const bRes = await query(`
      SELECT b.*, p.id as patient_table_id
      FROM home_visit_bookings b
      JOIN patients p ON b.patient_id = p.id
      WHERE b.id = $1;
    `, [bookingId]);

    if (bRes.rows.length === 0) throw new Error('Booking not found.');
    const booking = bRes.rows[0];

    if (booking.status !== 'COMPLETED') {
      throw new Error('Only completed home healthcare visits can be reviewed.');
    }

    if (!booking.provider_id) {
      throw new Error('No provider attached to this booking.');
    }

    // Check duplicate
    const exRes = await query('SELECT id FROM provider_reviews WHERE booking_id = $1', [bookingId]);
    if (exRes.rows.length > 0) {
      throw new Error('A verified review has already been submitted for this visit.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const revId = uuidv4();
      const insRev = await client.query(`
        INSERT INTO provider_reviews (
          id, booking_id, provider_id, patient_id, rating, punctuality_rating, review_text, is_verified_visit, is_moderated, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, true, true, NOW()
        ) RETURNING *;
      `, [revId, bookingId, booking.provider_id, booking.patient_id, rating, punctualityRating || rating, reviewText || '']);

      // Recalculate provider average rating
      const avgRes = await client.query(`
        SELECT
          ROUND(AVG(rating), 2) as new_avg,
          count(*) as new_cnt
        FROM provider_reviews
        WHERE provider_id = $1 AND is_moderated = true;
      `, [booking.provider_id]);

      await client.query(`
        UPDATE healthcare_provider_profiles SET
          rating_avg = $1,
          rating_count = $2,
          updated_at = NOW()
        WHERE id = $3;
      `, [avgRes.rows[0].new_avg, avgRes.rows[0].new_cnt, booking.provider_id]);

      await client.query('COMMIT');
      return insRev.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Super Admin Overview & Marketplace Analytics
   */
  static async getSuperAdminMarketplaceAnalytics() {
    const [bkStats, provStats, catBreakdown] = await Promise.all([
      query(`
        SELECT
          count(*) as total_bookings,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bookings,
          COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_bookings,
          COUNT(CASE WHEN status IN ('REQUESTED', 'PENDING_ASSIGNMENT', 'ASSIGNED', 'ACCEPTED', 'PROVIDER_EN_ROUTE', 'ARRIVED', 'SERVICE_IN_PROGRESS') THEN 1 END) as active_bookings,
          COALESCE(SUM(total_amount), 0) as gmv,
          COALESCE(SUM(platform_commission_amount), 0) as total_commissions,
          COALESCE(SUM(provider_payable_amount), 0) as total_provider_payouts
        FROM home_visit_bookings;
      `),
      query(`
        SELECT
          count(*) as total_providers,
          COUNT(CASE WHEN verification_status = 'APPROVED' THEN 1 END) as approved_count,
          COUNT(CASE WHEN verification_status = 'SUBMITTED' OR verification_status = 'UNDER_REVIEW' THEN 1 END) as pending_verification_count,
          COUNT(CASE WHEN verification_status = 'REJECTED' THEN 1 END) as rejected_count,
          COUNT(CASE WHEN verification_status = 'SUSPENDED' THEN 1 END) as suspended_count
        FROM healthcare_provider_profiles;
      `),
      query(`
        SELECT
          sc.name, sc.code,
          count(b.id) as booking_count,
          COALESCE(SUM(b.total_amount), 0) as total_revenue
        FROM healthcare_service_categories sc
        LEFT JOIN home_visit_bookings b ON sc.id = b.service_category_id
        GROUP BY sc.name, sc.code
        ORDER BY booking_count DESC;
      `)
    ]);

    const b = bkStats.rows[0];
    const p = provStats.rows[0];

    return {
      financials: {
        gmv: parseFloat(b.gmv),
        platform_commission_revenue: parseFloat(b.total_commissions),
        provider_payable_total: parseFloat(b.total_provider_payouts),
        currency: 'INR'
      },
      bookings: {
        total: parseInt(b.total_bookings, 10),
        active: parseInt(b.active_bookings, 10),
        completed: parseInt(b.completed_bookings, 10),
        cancelled: parseInt(b.cancelled_bookings, 10)
      },
      providers: {
        total: parseInt(p.total_providers, 10),
        approved: parseInt(p.approved_count, 10),
        pending_verification: parseInt(p.pending_verification_count, 10),
        rejected: parseInt(p.rejected_count, 10),
        suspended: parseInt(p.suspended_count, 10)
      },
      metrics: {
        total_bookings: parseInt(b.total_bookings, 10),
        total_gmv: parseFloat(b.gmv),
        platform_commission: parseFloat(b.total_commissions),
        active_providers: parseInt(p.approved_count, 10)
      },
      categories_breakdown: catBreakdown.rows
    };
  }
}

module.exports = MarketplaceService;
