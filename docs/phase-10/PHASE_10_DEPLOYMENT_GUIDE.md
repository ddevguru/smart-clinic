# SMART CLINIC OS — PHASE 10 DEPLOYMENT & OPERATION GUIDE
## Configuration, Database Migrations & Production Readiness

### 1. Environment Configuration

Add the following environment variables to your deployment environment or `server/.env`:

```env
# Server Port
PORT=5000

# Database Connection (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=smart_clinic_os

# JWT Secret
JWT_SECRET=production_jwt_secret_key_32_chars_long

# Teleconsultation Media Bridge
TELECONSULTATION_HMAC_SECRET=production_tele_hmac_secret_key
WEBRTC_STUN_URL=stun:stun.l.google.com:19302

# ABDM Integration (NHA Sandbox / Production)
ABDM_SANDBOX_URL=https://dev.abdm.gov.in/gateway/v0.5
ABDM_CLIENT_ID=your_abdm_client_id
ABDM_CLIENT_SECRET=your_abdm_client_secret

# Diagnostic Lab Integrations
METROPOLIS_WEBHOOK_SECRET=metropolis_prod_secret_2026
LALPATH_WEBHOOK_SECRET=lalpath_prod_secret_2026

# Pharmacy Integrations
APOLLO_API_KEY=apollo_pharmacy_prod_key_2026
MEDPLUS_API_KEY=medplus_pharmacy_prod_key_2026
```

---

### 2. Database Migration Execution

Execute the Phase 10 migration script against the PostgreSQL database:

```bash
cd c:\clinicos\server
node src/migrations/migration_phase10.js
```

---

### 3. Application Start Commands

#### Backend API Service:
```bash
cd c:\clinicos\server
node src/server.js
```

#### Frontend Web Portals:
```bash
cd c:\clinicos
npm run dev
```

#### Patient Android Application:
```bash
cd c:\clinicos\patient_app
flutter run
```

