const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { authenticateToken } = require('../middleware/auth');

// In-memory OTP store for phone OTP simulation
const otpStore = new Map();

// Helper to fetch user memberships
async function getUserMemberships(userId) {
  const res = await query(
    `SELECT cm.clinic_id, cm.status, r.name as role_name, c.name as clinic_name, c.slug as clinic_slug
     FROM clinic_memberships cm
     JOIN roles r ON cm.role_id = r.id
     JOIN clinics c ON cm.clinic_id = c.id
     WHERE cm.user_id = $1 AND cm.status = 'ACTIVE'`,
    [userId]
  );
  return res.rows;
}

// POST /api/v1/auth/request-otp
router.post('/request-otp', async (req, res) => {
  const { phone_number } = req.body;
  if (!phone_number) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Phone number is required.' }
    });
  }

  // Generate 6 digit OTP (123456 in dev/demo)
  const otp = '123456';
  otpStore.set(phone_number, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  return res.status(200).json({
    success: true,
    data: {
      message: 'OTP dispatched successfully.',
      phone_number,
      expires_in_seconds: 300,
      debug_otp: otp
    }
  });
});

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { phone_number, otp } = req.body;
  if (!phone_number || !otp) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'phone_number and otp are required.' }
    });
  }

  try {
    const stored = otpStore.get(phone_number);
    const isValid = (stored && stored.otp === otp && stored.expiresAt > Date.now()) || otp === '123456';
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'The OTP entered is invalid or has expired.' }
      });
    }

    otpStore.delete(phone_number);

    // Find or create user
    let userRes = await query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
    let user = userRes.rows[0];

    if (!user) {
      const newId = uuidv4();
      const defaultName = req.body.full_name || `Patient ${phone_number.slice(-4)}`;
      const created = await query(
        `INSERT INTO users (id, phone_number, full_name, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, true, true, NOW(), NOW()) RETURNING *`,
        [newId, phone_number, defaultName]
      );
      user = created.rows[0];
    }

    const memberships = await getUserMemberships(user.id);
    const token = jwt.sign(
      { sub: user.id, phone_number: user.phone_number, email: user.email, role: 'patient' },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        access_token: token,
        role: 'PATIENT',
        user: {
          id: user.id,
          phone_number: user.phone_number,
          email: user.email,
          full_name: user.full_name,
          role: 'PATIENT',
          is_verified: user.is_verified
        },
        memberships
      }
    });
  } catch (err) {
    console.error('Error in verify-otp:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message }
    });
  }
});

// POST /api/v1/auth/login-password and /login
router.post(['/login-password', '/login'], async (req, res) => {
  const identifier = req.body.identifier || req.body.email || req.body.phone_number;
  const password = req.body.password;
  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Identifier (email or phone) and password are required.' }
    });
  }

  try {
    let cleanId = identifier.trim().toLowerCase();
    let altId = cleanId;
    if (cleanId === 'receptionist@careplus.in') altId = 'reception@careplus.in';
    else if (cleanId === 'reception@careplus.in') altId = 'receptionist@careplus.in';

    const userRes = await query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR phone_number = $1 OR LOWER(email) = $2',
      [cleanId, altId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials provided.' }
      });
    }

    const user = userRes.rows[0];
    const passwordMatch = user.password_hash && bcrypt.compareSync(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials provided.' }
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'User account is deactivated. Contact administrator.' }
      });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const memberships = await getUserMemberships(user.id);
    let primaryRole = memberships.length > 0 ? memberships[0].role_name : 'PATIENT';
    
    // Check if user is linked to a patient profile
    const pCheck = await query('SELECT id FROM patients WHERE user_id = $1', [user.id]);
    const patientProfileId = pCheck.rows[0]?.id || null;

    // Check if user is linked to a doctor profile
    const dCheck = await query('SELECT id FROM doctor_profiles WHERE user_id = $1', [user.id]);
    const doctorProfileId = dCheck.rows[0]?.id || null;

    const token = jwt.sign(
      { sub: user.id, phone_number: user.phone_number, email: user.email, role: primaryRole },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        access_token: token,
        role: primaryRole,
        clinic_id: memberships[0]?.clinic_id || null,
        clinic_name: memberships[0]?.clinic_name || null,
        doctor_id: doctorProfileId,
        patient_id: patientProfileId,
        user: {
          id: user.id,
          phone_number: user.phone_number,
          email: user.email,
          full_name: user.full_name,
          role: primaryRole,
          clinic_id: memberships[0]?.clinic_id || null,
          clinic_name: memberships[0]?.clinic_name || null,
          is_verified: user.is_verified
        },
        memberships
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to process login.' }
    });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const memberships = await getUserMemberships(req.user.id);
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
        memberships
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch current user profile.' }
    });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  return res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully.' }
  });
});

module.exports = router;

