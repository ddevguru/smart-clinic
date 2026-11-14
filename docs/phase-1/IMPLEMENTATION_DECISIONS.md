# Smart Clinic OS — Phase 1 Implementation Decisions

**Document ID:** SCO-P1-DEC-001  
**Version:** 1.0.0 (Phase 1 Execution)  
**Status:** Approved & Recorded  
**Scope:** Technical Invariants, Architectural Trade-Offs & Deviations  

---

## 1. Architectural & Technology Selection Decisions

### Decision 1.1: Backend Framework Alignment (Python Flask)
- **Context:** During Phase 0 discovery, two potential backend runtimes were discussed (Python Flask and Node.js Express).
- **Decision:** In accordance with the Phase 1 specification, the core backend platform is formally implemented in **Python 3.12+ using Flask**, **SQLAlchemy 2.x**, **Flask-Migrate/Alembic**, **Flask-JWT-Extended**, **Redis**, and **Celery**.
- **Rationale:** Python provides superior clinical safety tooling, medical NLP/OCR expansion capabilities for later phases, mature ORM declarative typing via SQLAlchemy 2.x, and battle-tested asynchronous task execution via Celery.

### Decision 1.2: SQLAlchemy 2.0 Modern Declarative Mappings
- **Decision:** Use SQLAlchemy 2.0 modern style (`Mapped[T]`, `mapped_column(...)`, `DeclarativeBase`) rather than legacy 1.x `Column(...)` syntax.
- **Rationale:** Provides strict static type safety, autocompletion, clean relationship definitions, and native support for Python 3.12 type annotations.

### Decision 1.3: Multi-Tenancy Enforcement Strategy
- **Decision:** Implement **Application-Layer Tenant Context with Membership Verification** backed by strict database foreign keys, and architect the schema for future PostgreSQL Row-Level Security (RLS).
- **Invariants:**
  1. No client-supplied `clinic_id` (via header, URL, or body) is ever trusted without querying the database to verify the requesting user possesses an active `ClinicMembership` in that clinic.
  2. The resolved tenant context is bound to Flask's `g.tenant_clinic_id` and `g.tenant_membership`.
  3. Every repository or service query accessing clinic-scoped data must include `filter_by(clinic_id=g.tenant_clinic_id)`.
  4. Platform-level Super Admins access cross-clinic data only through explicitly decorated administrative endpoints checking `platform.clinics.manage` permissions.

### Decision 1.4: OTP Hashing & Storage
- **Decision:** OTPs are never stored in plaintext in the database or logs.
- **Implementation:**
  - When an OTP is generated (e.g., `482910`), the plaintext is dispatched via the configured OTP provider (or returned in debug response during development).
  - The database records a salted cryptographic hash (`sha256(otp + salt)`) along with `expires_at` (120 seconds TTL), `resend_available_at` (30 seconds cooldown), and `max_attempts` (3 attempts).
  - Once verified or expired, the record is marked inactive.

### Decision 1.5: JWT Token Management & Revocation
- **Decision:** Dual-token model with Redis-backed revocation blacklist.
  - **Access Token:** Short-lived (15 minutes), containing `sub` (user_id), `roles`, `token_type: "access"`.
  - **Refresh Token:** Long-lived (30 days), containing `sub` (user_id), `token_type: "refresh"`, with unique `jti`.
  - **Revocation:** On `/api/v1/auth/logout`, the `jti` is stored in Redis with a TTL equal to the token's remaining validity. Incoming requests verify the `jti` against Redis.

### Decision 1.6: Dynamic RBAC vs Static Role Checks
- **Decision:** Implement a dual-level authorization model:
  - **Roles:** Broad identity groups (`SUPER_ADMIN`, `CLINIC_OWNER`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`, `HEALTHCARE_PROVIDER`).
  - **Permissions:** Granular actions (`clinic.view`, `clinic.update`, `staff.manage`, `patient.view`, `consultation.create`).
  - **Enforcement:** Route decorators check granular permissions rather than role names, allowing clinics to customize role capabilities in future phases without code refactoring.

### Decision 1.7: Mock Providers for Local Development
- **Decision:** Implement a `MockOTPProvider` that logs OTPs to local development console and provides a deterministic test OTP (`482910` or randomly generated), enabled strictly when `FLASK_ENV=development` or `TESTING=True`.
- **Invariants:** Under production configurations (`FLASK_ENV=production`), the mock provider is blocked, requiring explicit production SMS/WhatsApp API gateway credentials.

---

## 2. Scope Boundaries Maintained in Phase 1

- ❌ **No UI Modifications:** Phase 0 frontend prototypes (Patient App, Clinic Web, Super Admin) are preserved intact.
- ❌ **No Clinical OPD Booking/Prescription Execution:** Booking algorithms, live queue WebSockets, and prescription signing belong to Phase 2, 3, and 4.
- ❌ **No External Third-Party Paid APIs:** Google Maps Routes, Razorpay live gateway, and commercial SMS gateways remain mocked/stubbed in Phase 1.
