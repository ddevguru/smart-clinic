# Smart Clinic OS — Phase 1 Implementation Plan

**Document ID:** SCO-P1-PLAN-001  
**Version:** 1.0.0 (Phase 1 Execution)  
**Author:** Backend Architecture & Security Engineering Team  
**Runtime:** Python 3.12+, Flask, PostgreSQL 16+, SQLAlchemy 2.x, Alembic, Redis, Celery  

---

## 1. Executive Summary & Phase 1 Scope

Phase 1 establishes the production-grade **Core Backend and Platform Foundation** for **Smart Clinic OS**. Following the architectural decisions and database specifications formulated during Phase 0, Phase 1 transitions theoretical designs into executable, tested, and secure backend micro-modules.

### Phase 1 Core Objectives:
1. **Application Factory & Architecture:** Implement a modular Flask application factory with Blueprint isolation, typed configuration, and structured JSON responses.
2. **Database & Migrations:** Implement SQLAlchemy 2.0 declarative models for foundational multi-tenant entities (`User`, `Clinic`, `ClinicMembership`, `Role`, `Permission`, `RolePermission`, `AuditLog`, `OTPVerification`) using UUID primary keys, UTC timestamps, and Alembic migrations.
3. **Multi-Tenancy Security:** Enforce tenant isolation where every clinic-scoped request verifies active membership and role permissions before executing tenant-bound queries.
4. **Authentication & Cryptography:** Implement dual authentication:
   - SMS/WhatsApp OTP challenge-response with cryptographic hashing (`argon2id` / `sha256`), configurable expiry (120s), rate-limiting, and development mock provider.
   - JWT access (15-min) and refresh (30-day) tokens with revocation tracking (`jti`).
   - Secure Argon2/bcrypt password authentication for administrative and clinic staff.
5. **Role-Based Access Control (RBAC):** Backend-enforced permission authorization decorators verifying fine-grained permissions (`clinic.view`, `clinic.update`, `staff.manage`, `patient.view`, `platform.clinics.verify`).
6. **Clinic & Membership APIs:** Implement RESTful endpoints for clinic profile management and staff membership assignment with audit logging.
7. **Asynchronous Background Processing:** Configure Celery with Redis broker for background maintenance tasks (expired OTP purge, audit log archival, system health checks).
8. **DevOps & Containerization:** Provide production-ready `Dockerfile` and `docker-compose.yml` defining Flask, PostgreSQL, Redis, and Celery worker services.
9. **Automated Testing Suite:** Comprehensive `pytest` test suite covering model constraints, OTP lifecycle, JWT authentication, RBAC authorization, and multi-tenant isolation.

---

## 2. Directory Layout & Module Structure

```
backend/
├── app/
│   ├── __init__.py               # Application factory create_app()
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py           # Typed environment configurations (Dev, Test, Prod)
│   │
│   ├── extensions/
│   │   ├── __init__.py           # Extension initialization
│   │   ├── database.py           # SQLAlchemy 2.x db instance
│   │   ├── jwt.py                # Flask-JWT-Extended manager & callbacks
│   │   ├── migrate.py            # Flask-Migrate / Alembic
│   │   ├── redis_client.py       # Redis connection pool
│   │   └── celery_app.py         # Celery instance factory
│   │
│   ├── common/
│   │   ├── __init__.py
│   │   ├── responses.py          # Unified success & error JSON envelopes
│   │   ├── exceptions.py         # Custom application HTTP exceptions
│   │   ├── validators.py         # Request validators (Phone normalization, E.164)
│   │   ├── pagination.py         # Reusable query pagination helper
│   │   └── permissions.py        # Permission constants catalog
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py               # DeclarativeBase, UUIDPrimaryKeyMixin, TimestampMixin
│   │   ├── user.py               # User entity
│   │   ├── clinic.py             # Clinic & ClinicMembership entities
│   │   ├── rbac.py               # Role, Permission, RolePermission entities
│   │   ├── audit.py              # AuditLog entity
│   │   └── otp.py                # OTPVerification entity
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py         # /api/v1/auth/ endpoints
│   │   │   ├── services.py       # Authentication & token business logic
│   │   │   ├── otp_provider.py   # Mock & pluggable OTP provider interface
│   │   │   └── schemas.py        # Marshmallow / validation schemas
│   │   ├── users/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py         # /api/v1/users/ endpoints
│   │   │   ├── services.py       # User management business logic
│   │   │   └── schemas.py
│   │   ├── clinics/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py         # /api/v1/clinics/ endpoints
│   │   │   ├── services.py       # Clinic & membership business logic
│   │   │   └── schemas.py
│   │   └── audit/
│   │       ├── __init__.py
│   │       ├── routes.py         # /api/v1/audit-logs/ endpoints
│   │       └── services.py       # Audit logging utility
│   │
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── request_id.py         # Correlation ID (X-Request-ID) injector
│   │   ├── tenant_context.py     # Tenant context resolution & RLS hook
│   │   └── error_handler.py      # Global exception interceptor
│   │
│   ├── tasks/
│   │   ├── __init__.py
│   │   └── background_tasks.py   # Celery tasks (OTP cleanup, health checks)
│   │
│   └── api/
│       ├── __init__.py
│       └── v1.py                 # Master API v1 Blueprint aggregator
│
├── migrations/                   # Alembic version files
├── tests/
│   ├── conftest.py               # Pytest fixtures (client, db_session, auth_tokens)
│   ├── unit/                     # Model constraints & validation unit tests
│   ├── integration/              # API endpoints integration tests
│   └── security/                 # Multi-tenant isolation & privilege tests
│
├── docker/                       # Docker deployment assets
├── Dockerfile                    # Multi-stage production Dockerfile
├── docker-compose.yml            # Local dev stack (Flask, PostgreSQL, Redis, Celery)
├── requirements.txt              # Pinned Python dependencies
├── wsgi.py                       # WSGI entry point for Gunicorn
├── pytest.ini                    # Test runner configuration
├── .env.example                  # Environment configuration template
└── README.md                     # Backend setup documentation
```

---

## 3. Step-by-Step Implementation Sequence

| Step | Technical Task | Deliverable | Acceptance Criteria |
| :---: | :--- | :--- | :--- |
| **1** | Implementation Planning & Decisions | `IMPLEMENTATION_PLAN.md`, `IMPLEMENTATION_DECISIONS.md` | Clear roadmap resolving tech choices and Phase 0 alignment. |
| **2** | Backend Scaffold & Dependencies | `requirements.txt`, `backend/app/__init__.py`, `wsgi.py` | Python 3.12 virtual environment initialized with pinned libraries. |
| **3** | Core Configuration & Extensions | `settings.py`, `database.py`, `jwt.py`, `redis_client.py` | Type-safe configuration with Dev/Test/Prod profiles. |
| **4** | Foundational Data Models | `User`, `Clinic`, `ClinicMembership`, `Role`, `Permission`, `AuditLog`, `OTPVerification` | SQLAlchemy 2.0 declarative models with UUID and constraints. |
| **5** | Database Migrations | Alembic migration scripts in `migrations/` | Initial schema migration executes cleanly on PostgreSQL. |
| **6** | Seed Roles & Permissions | Default RBAC permission seeder script | Seeds 6 standard roles and 18 core permissions. |
| **7** | OTP & Authentication Service | `auth/services.py`, `otp_provider.py`, `auth/routes.py` | OTP request, verification, JWT issuance, refresh, and logout. |
| **8** | Tenant Context Middleware | `tenant_context.py`, `@require_tenant_membership` | Strict tenant validation verifying clinic membership. |
| **9** | Clinic & Membership APIs | `clinics/routes.py`, `clinics/services.py` | CRUD for clinics and role-based staff assignments. |
| **10** | Celery & Redis Integration | `celery_app.py`, `background_tasks.py` | Celery worker initializes and executes background maintenance. |
| **11** | API Documentation & Error Envelopes | Global error handler, OpenAPI/Swagger JSON | Consistent JSON success/error envelopes across all endpoints. |
| **12** | Docker & Compose Stack | `Dockerfile`, `docker-compose.yml`, `.env.example` | Multi-container stack boots Flask, PG, Redis, and Celery. |
| **13** | Automated Testing Suite | `tests/unit/`, `tests/integration/`, `tests/security/` | Comprehensive test suite verifying auth and tenant isolation. |
| **14** | Documentation & Reporting | `docs/phase-1/` complete suite & root `README.md` | All 12 documentation deliverables complete. |
