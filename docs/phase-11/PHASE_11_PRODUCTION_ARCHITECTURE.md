# Smart Clinic OS — Production Architecture Specification

**Document ID:** `SCOS-P11-ARC-002`  
**System Architecture:** Cloud-Native Multi-Tenant Healthcare Operating System  
**Target Environment:** Dockerized Linux VPS / AWS ECS / Google Cloud Run + Managed PostgreSQL 16 & Redis 7  
**Network Tiering:** Nginx Reverse Proxy with TLS 1.3 Termination, WAF Rate Limiting, and WebSocket Upgrade Proxy

---

## 1. System Topology Overview

```
                                  [ INTERNET CLIENTS ]
                                            │
               ┌────────────────────────────┼───────────────────────────┐
               │                            │                           │
        [ Web Portals ]           [ Mobile Patient App ]        [ Webhook Callers ]
     Next.js (Port 3000)            Flutter Android           (Razorpay, Labs, ABDM)
               │                            │                           │
               └────────────────────────────┬───────────────────────────┘
                                            ▼
                               [ NGINX REVERSE PROXY ]
                                  (Port 80 / Port 443)
                               - SSL/TLS Termination
                               - Rate Limiting Zones
                               - Security Headers
                               - Static Asset Cache
                               - WebSocket Connection Upgrades
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
          [ Frontend Server ]                           [ Backend API Cluster ]
          Next.js Node Runner                            Node.js 22 LTS (Express)
          Port 3000 (Internal)                           Port 5000 (Internal)
                                                                   │
                                ┌──────────────────────────────────┤
                                ▼                                  ▼
                     [ Managed PostgreSQL 16 ]             [ Managed Redis 7 ]
                     - Multi-Tenant RDBMS                  - Pub/Sub Queue Sync
                     - PgBouncer Connection Pool           - Distributed Cache
                     - Automated Daily Backups             - Live Socket.IO State
```

---

## 2. Multi-Tenant Isolation Model

Smart Clinic OS utilizes **Logical Separation with Row-Level Enforcement** and **Tenant Context Middleware**:

1. **Tenant Extraction:** Incoming HTTP requests include `X-Clinic-ID` headers or embed tenant claims within cryptographically signed JWT tokens.
2. **Context Binding:** `server/src/middleware/tenantMiddleware.js` resolves the clinic membership from the authenticated user and binds `req.clinicId` to the request lifecycle.
3. **Strict Boundary Validation:** Super Admin routes bypass clinic restrictions (`req.user.role === 'SUPER_ADMIN'`). Staff accounts (Owner, Doctor, Receptionist) cannot query, update, or delete records belonging to any other `clinic_id`.
4. **Data Isolation Invariant:** Every high-volume table contains a `clinic_id` column indexed compositely:
   - `CREATE INDEX idx_appointments_clinic_date ON appointments(clinic_id, appointment_date, status);`
   - `CREATE INDEX idx_queue_entries_clinic ON queue_entries(clinic_id, token_number);`
   - `CREATE INDEX idx_payment_records_clinic ON payment_records(clinic_id, created_at DESC);`

---

## 3. Core Subsystems & Service Responsibilities

### 3.1 Node.js Express Backend (`server/src/`)
- **Port:** `5000` (Internal Docker network)
- **Runtime:** Node.js 22 LTS Alpine
- **Database Driver:** `pg` (Native PostgreSQL client with tuned connection pool)
- **Key Modules:**
  - `appointment.routes.js`: Hybrid booking, walk-in registration, atomic queue locking.
  - `ehr.routes.js`: Digital prescriptions, version tracking, SHA-256 PDF generation.
  - `marketplace.routes.js`: Home healthcare discovery, provider slot scheduling, status state machine.
  - `teleconsultation.routes.js`: WebRTC room token generation and lifecycle management.
  - `ai.routes.js`: Human-in-the-loop SOAP drafting, OCR lab metric extraction, emergency symptom triage.
  - `billing.routes.js`: In-clinic consultation payments, sequential receipt numbers (`RCP-YYYYMMDD-XXXX`).
  - `webhook.routes.js`: Idempotent Razorpay event processing with unique transaction safeguards.

### 3.2 Web Frontend (`/doctor`, `/receptionist`, `/owner`, `/admin`, `/provider`)
- **Port:** `3000`
- **Framework:** Next.js 14
- **Design System:** Pure CSS (Zero Tailwind runtime overhead), Responsive Mint/Teal Healthcare Palette:
  - Deep Forest Primary: `#087F79`
  - Emerald Action: `#18A99A`
  - Mint Light Wash: `#BFEDE5` / `#E5F7F3`
  - Neutral Background: `#F5FAF9`
  - Slate Dark: `#183B3A`
- **Routing Isolation:** Distinct portal URLs preventing cross-role UI confusion.

### 3.3 Flutter Mobile Application (`patient_app/`)
- **Framework:** Flutter 3.24
- **Architecture:** Feature-first Clean Architecture with BLoC / Repository pattern.
- **Key Modules:** Authentication via Phone OTP, Clinic Discovery, Live Queue Waiting Tracker, Teleconsultation Video Caller, Home Healthcare Booking, Medical Record Sharing.

---

## 4. Resilience & Scalability Envelope

1. **State Independence:** The Node.js application process is completely stateless. Session authentication is token-based (JWT) with optional Redis revocation checks.
2. **Horizontal Scaling:** Additional backend containers can be spun up behind Nginx round-robin without session stickiness issues.
3. **Database Concurrency:** Critical transactional operations (such as walk-in queue registration and payment recording) use atomic transactions with row locks (`SELECT ... FOR UPDATE`) preventing token collisions.
4. **Graceful Shutdown:** Process traps `SIGTERM` and `SIGINT`, drains existing in-flight HTTP connections, and closes PostgreSQL pool connections cleanly before exit.

