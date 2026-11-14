# PHASE 9 — PRODUCTION DEPLOYMENT & DATABASE MIGRATION GUIDE

## 1. Prerequisites

- **Node.js:** v20.x or v22.x LTS
- **PostgreSQL:** 15+ or 16+
- **Environment Variables:**
  - `PORT=5000`
  - `DATABASE_URL=postgresql://postgres:<password>@localhost:5432/smart_clinic_os`
  - `JWT_SECRET=<secure_random_key>`
  - `RAZORPAY_KEY_ID=<rzp_live_key>`
  - `RAZORPAY_KEY_SECRET=<rzp_live_secret>`

---

## 2. Database Migration Steps

Execute the Phase 9 migration script to create all 12 relational tables and seed verified healthcare providers:

```bash
# From workspace root
node server/src/migrations/migration_phase9.js
```

### Verification Query:
```sql
SELECT count(*) FROM healthcare_service_categories WHERE is_active = true;
-- Expected output: 6

SELECT count(*) FROM healthcare_services WHERE is_active = true;
-- Expected output: 7

SELECT count(*) FROM healthcare_provider_profiles WHERE verification_status = 'APPROVED';
-- Expected output: 4
```

---

## 3. Starting the Node Express Server

```bash
cd server
npm start
# Health Check Verification
curl http://localhost:5000/api/v1/health
```

---

## 4. Running the Verification Test Suites

```bash
# 1. Phase 9 Home Healthcare Marketplace Test
node server/test/phase9.test.js

# 2. Phase 8 SaaS Subscription & Billing Test
node server/test/phase8.test.js

# 3. Phase 7 Automation & Traffic Test
node server/test/phase7.test.js

# 4. Phase 1-6 Full Platform Test
node server/test/api.test.js
```

All test suites must report 0 failures before opening ingress traffic to production users.

