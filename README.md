# Smart Clinic OS

> **Integrated Healthcare Operating System for the Indian Outpatient Ecosystem**  
> *Phase 0: Product Foundation, System Architecture, UI/UX Design System & Interactive Prototype*  
> *Phase 1: Core Backend & Platform Foundation (Python / Flask / PostgreSQL / Redis / Celery)*  
> *Phase 2: Super Admin Panel, Multi-Branch Management & Clinic Onboarding*  
> *Phase 3: Complete Clinic Management Web Application (Owner, Receptionist, Doctor)*  
> *Phase 4: Hybrid Appointment Booking & Unified Live Queue Management Engine*  
> *Phase 5: Patient Android Mobile Application (Flutter & Dart)*  
> *Phase 6: Digital Prescriptions & Electronic Health Records (EHR)*

[![Phase 0 Status](https://img.shields.io/badge/Phase%200-Completed%20(100%25)-18A99A?style=flat-square)](docs/phase-0/)
[![Phase 1 Status](https://img.shields.io/badge/Phase%201-Completed%20(100%25)-20966F?style=flat-square)](docs/phase-1/)
[![Phase 2 Status](https://img.shields.io/badge/Phase%202-Completed%20(100%25)-087F79?style=flat-square)](docs/phase-2/)
[![Phase 3 Status](https://img.shields.io/badge/Phase%203-Completed%20(100%25)-087F79?style=flat-square)](docs/phase-3/)
[![Phase 4 Status](https://img.shields.io/badge/Phase%204-Completed%20(100%25)-18A99A?style=flat-square)](docs/phase-4/)
[![Phase 5 Status](https://img.shields.io/badge/Phase%205-Completed%20(100%25)-20966F?style=flat-square)](docs/phase-5/)
[![Phase 6 Status](https://img.shields.io/badge/Phase%206-Completed%20(100%25)-087F79?style=flat-square)](docs/phase-6/)
[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-65%20Passed%20(100%25)-success?style=flat-square)](backend/tests/)
[![Flutter Tests](https://img.shields.io/badge/Flutter%20Tests-13%20Passed%20(100%25)-success?style=flat-square)](patient_app/test/)
[![Flutter Analyze](https://img.shields.io/badge/Flutter%20Analyze-0%20Issues-success?style=flat-square)](patient_app/)
[![Frontend Build](https://img.shields.io/badge/Next.js-Build%20Passed%20(7%2F7)-success?style=flat-square)](app/)
[![Design System](https://img.shields.io/badge/Design-Mint%20%26%20Teal%20Healthcare-BFEDE5?style=flat-square)](design/design-system/tokens.css)

---

## 1. Product Overview

**Smart Clinic OS** is a unified, cloud-native healthcare operating platform designed specifically to modernize Indian outpatient care. It seamlessly connects patients, independent clinics, multi-branch polyclinic chains, doctors, receptionists, and verified home healthcare professionals on a single synchronized infrastructure.

### The Core Problem Solved
Outpatient departments (OPD) in India are plagued by 60–120 minute unpredictable wait times, overcrowded waiting rooms, disconnected paper records, and transit delays. Smart Clinic OS solves this with its proprietary **Hybrid Queue Engine** and **Smart Traffic Departure Intelligence** (powered by Google Maps Routes API), allowing patients to arrive at the clinic just in time for their turn.

---

## 2. Platform Architecture & Technology Stack

| Tier | Production Technology | Rationale & Architectural Choice |
| :--- | :--- | :--- |
| **Super Admin Governance Portal** | **Next.js 14 App Router + React** | Real-time administrative portal for clinic verification, doctor credential audits, and platform KPI metrics. |
| **Clinic Owner Onboarding** | **Next.js 14 App Router + React** | 5-step registration wizard, compliance document uploads, status tracker, and branch management. |
| **Patient Mobile App** | **Flutter (Dart)** | Single codebase high-performance Android-first mobile experience with native gesture navigation and offline token caching. |
| **Clinic Management Web** | **Next.js + React** | Role-tailored desktop-first portals for Clinic Owners, Receptionists, and Doctors with server-side rendering and sub-second page transitions. |
| **Core Backend Modular Monolith** | **Python 3.12 + Flask** | Modular monolith architecture with application factory pattern, blueprinted modules, strict domain isolation, and sub-50ms API response times. |
| **Primary Database & ORM** | **PostgreSQL 16+ & SQLAlchemy 2.0** | Relational ACID guarantees, UUID v4 primary keys, UTC timestamps, and Alembic database version control. |
| **Document Storage Sandbox** | **Pluggable Storage Abstraction** | Private document storage (`LocalStorageProvider` / S3 ready) with UUID hashing and authenticated streaming downloads. |
| **In-Memory Cache & Token Revocation**| **Redis 7** | Sub-millisecond JWT blocklist checking, OTP rate-limiting, and distributed state management. |
| **Asynchronous Task Processing** | **Celery** | Asynchronous task execution for OTP cleanup, audit log retention, notification dispatch, and scheduled health audits. |
| **API Documentation** | **Flask-Smorest / OpenAPI 3.0** | Self-documenting interactive Swagger UI and machine-readable OpenAPI specification. |
| **Design Language** | **Mint & Teal Healthcare** | Soft Mint (`#BFEDE5`, `#E5F7F3`), Healthcare Teal (`#18A99A`), and Deep Teal (`#087F79`) for a calming, trustworthy, accessible clinical UX. **Strictly No Tailwind CSS.** |

---

## 3. Repository Structure

```
c:\clinicos\
├── app/                            # Next.js 14 App Router routes
│   ├── admin/page.js               # Super Admin Live Governance Portal
│   ├── clinic/page.js              # Dedicated Live Clinic Management Web Application
│   ├── onboarding/page.js          # Clinic Owner Registration & Onboarding Portal
│   ├── globals.css                 # Pure CSS Design System & Layouts
│   ├── layout.js                   # Master Root Layout & Fonts
│   └── page.js                     # Unified Prototype & Live App Switcher
├── backend/                        # Production Python Flask backend
│   ├── app/
│   │   ├── cli.py                  # Flask CLI commands (`flask seed-roles`)
│   │   ├── config/settings.py      # Environment configs (Dev, Test, Prod)
│   │   ├── common/                 # Responses, Exceptions, Storage, Notifications, Permissions
│   │   ├── extensions/             # DB, JWT, Redis, Celery, Alembic
│   │   ├── middleware/             # Request ID, Auth, Tenant isolation, Super Admin checks
│   │   ├── models/                 # User, Clinic, Branch, Doctor, Document, Audit, RBAC, Patient, Appointment, Payment
│   │   ├── modules/                # Auth, Users, Clinics, Onboarding, Admin, Branches, Doctors, Patients, Appointments, Billing, Clinic Ops
│   │   └── tasks/                  # Celery background tasks
│   ├── migrations/                 # Alembic migration revisions (incl. Phase 3 c24a3eb9244d)
│   ├── tests/                      # Pytest unit, integration, and security tests (34/34 passing)
│   ├── Dockerfile                  # Multi-stage production container
│   ├── docker-compose.yml          # Multi-service orchestration
│   ├── pytest.ini                  # Pytest configuration
│   ├── requirements.txt            # Pinned dependencies
│   └── wsgi.py                     # WSGI entrypoint
├── components/                     # Reusable UI components
│   ├── ClinicWebLive.js            # Live Clinic Management Web App (Owner, Receptionist, Doctor)
│   ├── ClinicOnboardingWizard.js   # Interactive onboarding wizard & status dashboard
│   ├── SuperAdminLive.js           # Live Super Admin governance portal
│   ├── PatientApp.js               # 29-screen patient prototype
│   ├── ClinicWeb.js                # Clinic operations prototype
│   └── SuperAdmin.js               # Visual admin prototype
├── design/design-system/tokens.css # Pure CSS design system & tokens
├── docs/
│   ├── phase-0/                    # 11 complete Phase 0 specification documents
│   ├── phase-1/                    # 12 complete Phase 1 backend engineering documents
│   ├── phase-2/                    # 11 complete Phase 2 engineering & verification documents
│   ├── phase-3/                    # 11 complete Phase 3 engineering & verification documents
│   ├── phase-4/                    # 10 complete Phase 4 hybrid queue & booking documents
│   ├── phase-5/                    # Complete Phase 5 Flutter patient app documents
│   └── phase-6/                    # 9 complete Phase 6 digital prescriptions & EHR documents
├── services/
│   └── api.js                      # Centralized API client service connecting Next.js to Flask API
├── package.json                    # Frontend dependencies & build scripts
└── README.md                       # This master documentation
```

---

## 4. Quickstart Guide

### 4.1 Running the Backend API Gateway

```bash
# 1. Navigate to backend directory
cd backend

# 2. Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# 3. Set environment variables (or copy from .env.example)
cp .env.example .env

# 4. Run database migrations (applies through Phase 2 schema)
flask db upgrade

# 5. Seed default roles and platform permissions
flask seed-roles

# 6. Start WSGI development server
python wsgi.py
```

The API will be available at:
- **API Base:** `http://localhost:5000/api/v1`
- **Interactive Swagger UI:** `http://localhost:5000/api/v1/docs`
- **OpenAPI 3.0 Spec:** `http://localhost:5000/api/v1/openapi.json`
- **Health Check:** `http://localhost:5000/api/v1/health`

### 4.2 Running the Frontend Web Applications

```bash
# 1. Install frontend dependencies
npm install

# 2. Run the Next.js development server
npm run dev

# 3. Access in browser
# Master Hub: http://localhost:3000
# Super Admin Portal (Live API): http://localhost:3000/admin
# Clinic Onboarding (Live API): http://localhost:3000/onboarding
```

---

## 5. Automated Verification & Testing

Smart Clinic OS enforces a strict zero-regression testing policy. All tests execute against an isolated PostgreSQL database:

```bash
cd backend
pytest -vv
```

### Pytest Execution Output (27/27 Passed):
```
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-8.4.2, pluggy-1.7.0 -- C:\clinicos\backend\venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: C:\clinicos\backend
configfile: pytest.ini
testpaths: tests
plugins: flask-1.3.0
collecting ... collected 27 items

tests/integration/test_admin_api.py::test_admin_dashboard_and_clinic_verification_lifecycle PASSED [  3%]
tests/integration/test_auth_api.py::test_request_otp_success PASSED      [  7%]
tests/integration/test_auth_api.py::test_request_otp_invalid_phone PASSED [ 11%]
tests/integration/test_auth_api.py::test_request_otp_cooldown_enforcement PASSED [ 14%]
tests/integration/test_auth_api.py::test_verify_otp_flow PASSED          [ 18%]
tests/integration/test_auth_api.py::test_verify_otp_invalid_code PASSED  [ 22%]
tests/integration/test_auth_api.py::test_password_login_and_logout PASSED [ 25%]
tests/integration/test_branches_and_doctors_api.py::test_branches_and_doctor_onboarding PASSED [ 29%]
tests/integration/test_clinics_api.py::test_create_clinic_and_membership PASSED [ 33%]
tests/integration/test_clinics_api.py::test_add_staff_member_to_clinic PASSED [ 37%]
tests/integration/test_clinics_api.py::test_verification_status_requires_super_admin PASSED [ 40%]
tests/integration/test_onboarding_api.py::test_clinic_onboarding_lifecycle PASSED [ 44%]
tests/security/test_phase2_security.py::test_admin_endpoints_reject_non_super_admin PASSED [ 48%]
tests/security/test_phase2_security.py::test_cross_tenant_branch_and_doctor_prevention PASSED [ 51%]
tests/security/test_phase2_security.py::test_document_upload_validation PASSED [ 55%]
tests/security/test_tenant_isolation.py::test_cross_tenant_read_isolation PASSED [ 59%]
tests/security/test_tenant_isolation.py::test_cross_tenant_update_isolation PASSED [ 62%]
tests/security/test_tenant_isolation.py::test_cross_tenant_membership_isolation PASSED [ 66%]
tests/security/test_tenant_isolation.py::test_cross_tenant_membership_injection_blocked PASSED [ 70%]
tests/security/test_tenant_isolation.py::test_super_admin_cross_tenant_access PASSED [ 74%]
tests/security/test_tenant_isolation.py::test_unauthenticated_request_rejected PASSED [ 77%]
tests/unit/test_models.py::test_user_password_hashing PASSED             [ 81%]
tests/unit/test_models.py::test_unique_phone_number_constraint PASSED    [ 85%]
tests/unit/test_models.py::test_unique_email_constraint PASSED           [ 88%]
tests/unit/test_models.py::test_phone_normalization PASSED               [ 92%]
tests/unit/test_models.py::test_otp_verification_logic PASSED            [ 96%]
tests/unit/test_models.py::test_clinic_membership_uniqueness PASSED      [100%]

============================= 27 passed in 28.69s =============================
```

### Frontend Production Build:
```bash
npm run build
# Result: 6/6 static pages compiled cleanly with zero warnings.
```

---

## 6. Comprehensive Documentation Index

### Phase 0: Product Foundation & Design System
All Phase 0 engineering and product discovery documents are organized in [`docs/phase-0/`](docs/phase-0/):
1. [`01_PRODUCT_VISION.md`](docs/phase-0/01_PRODUCT_VISION.md) — Product vision, market sizing, value propositions, and SaaS business model.
2. [`02_COMPLETE_SRS.md`](docs/phase-0/02_COMPLETE_SRS.md) — Exhaustive Software Requirements Specification with RBAC matrix and acceptance criteria.
3. [`03_USER_PERSONAS.md`](docs/phase-0/03_USER_PERSONAS.md) — 6 behavioral personas: Patient, Clinic Owner, Receptionist, Doctor, Nurse, Super Admin.
4. [`04_USER_FLOWS.md`](docs/phase-0/04_USER_FLOWS.md) — 10 end-to-end user workflows with Mermaid sequence diagrams and flowcharts.
5. [`05_SYSTEM_ARCHITECTURE.md`](docs/phase-0/05_SYSTEM_ARCHITECTURE.md) — Modular monolith architecture, multi-tenancy, and cloud topology.
6. [`06_DATABASE_DESIGN.md`](docs/phase-0/06_DATABASE_DESIGN.md) — Full PostgreSQL entity specifications, Mermaid ER diagram, and indexes.
7. [`07_API_SPECIFICATION.md`](docs/phase-0/07_API_SPECIFICATION.md) — RESTful API contract across all 9 modules with standard envelopes.
8. [`08_UI_UX_DESIGN_SYSTEM.md`](docs/phase-0/08_UI_UX_DESIGN_SYSTEM.md) — Design tokens, typography scale, component standards, and CSS variables.
9. [`09_PHASE_ROADMAP.md`](docs/phase-0/09_PHASE_ROADMAP.md) — Phase 0 through Phase 11 milestone roadmap and dependencies.
10. [`10_RISK_AND_COMPLIANCE.md`](docs/phase-0/10_RISK_AND_COMPLIANCE.md) — Security risk taxonomy, DPDP Act 2023, and Telemedicine Guidelines 2020.
11. [`11_OPEN_DECISIONS.md`](docs/phase-0/11_OPEN_DECISIONS.md) — Decision log tracking open dilemmas and clinical invariants.

### Phase 1: Core Backend & Platform Foundation
All Phase 1 backend engineering documents are organized in [`docs/phase-1/`](docs/phase-1/):
1. [`IMPLEMENTATION_PLAN.md`](docs/phase-1/IMPLEMENTATION_PLAN.md) — Complete implementation blueprint and milestone breakdown.
2. [`IMPLEMENTATION_DECISIONS.md`](docs/phase-1/IMPLEMENTATION_DECISIONS.md) — Architecture decisions, trade-offs, and design justifications.
3. [`BACKEND_ARCHITECTURE.md`](docs/phase-1/BACKEND_ARCHITECTURE.md) — Detailed Flask factory architecture, extensions, and directory structure.
4. [`DATABASE_IMPLEMENTATION.md`](docs/phase-1/DATABASE_IMPLEMENTATION.md) — PostgreSQL models, UUID primary keys, and Alembic migrations.
5. [`AUTHENTICATION_FLOW.md`](docs/phase-1/AUTHENTICATION_FLOW.md) — Dual-mode auth, JWT lifecycle, and Redis token revocation.
6. [`RBAC_PERMISSION_MATRIX.md`](docs/phase-1/RBAC_PERMISSION_MATRIX.md) — Granular roles, 18 healthcare permissions, and decorator enforcement.
7. [`MULTI_TENANCY_DESIGN.md`](docs/phase-1/MULTI_TENANCY_DESIGN.md) — Multi-tenancy isolation model, tenant context middleware, and safeguards.
8. [`API_DOCUMENTATION.md`](docs/phase-1/API_DOCUMENTATION.md) — RESTful endpoint contract for auth, users, clinics, audit logs, and health.
9. [`SECURITY_CHECKLIST.md`](docs/phase-1/SECURITY_CHECKLIST.md) — Security verification, OWASP Top 10 mitigations, and data protection.
10. [`LOCAL_SETUP_GUIDE.md`](docs/phase-1/LOCAL_SETUP_GUIDE.md) — Local developer setup instructions for Windows and Docker.
11. [`TEST_REPORT.md`](docs/phase-1/TEST_REPORT.md) — Pytest test execution logs and verification results.
12. [`PHASE_1_COMPLETION_REPORT.md`](docs/phase-1/PHASE_1_COMPLETION_REPORT.md) — Formal Phase 1 sign-off and deliverable audit.

### Phase 2: Super Admin Panel & Clinic Onboarding
All Phase 2 engineering and verification documents are organized in [`docs/phase-2/`](docs/phase-2/):
1. [`IMPLEMENTATION_PLAN.md`](docs/phase-2/IMPLEMENTATION_PLAN.md) — Complete Phase 2 implementation plan and milestones.
2. [`IMPLEMENTATION_DECISIONS.md`](docs/phase-2/IMPLEMENTATION_DECISIONS.md) — Architectural decisions on document storage, verification FSM, and Super Admin RBAC.
3. [`CLINIC_ONBOARDING_FLOW.md`](docs/phase-2/CLINIC_ONBOARDING_FLOW.md) — 5-step registration wizard, address validation, and resubmission flows.
4. [`CLINIC_VERIFICATION_WORKFLOW.md`](docs/phase-2/CLINIC_VERIFICATION_WORKFLOW.md) — Verification FSM state machine (`DRAFT` through `SUSPENDED`).
5. [`DOCTOR_VERIFICATION_WORKFLOW.md`](docs/phase-2/DOCTOR_VERIFICATION_WORKFLOW.md) — NMC/State Council registration, credential verification, and schedules.
6. [`SUPER_ADMIN_API.md`](docs/phase-2/SUPER_ADMIN_API.md) — Comprehensive API contract for Super Admin governance, onboarding, and branches.
7. [`DATABASE_CHANGES.md`](docs/phase-2/DATABASE_CHANGES.md) — Alembic migration revision `4ff23f589639` and table entity specifications.
8. [`ROLE_PERMISSION_MATRIX.md`](docs/phase-2/ROLE_PERMISSION_MATRIX.md) — Detailed RBAC matrix with 13 new platform governance permissions.
9. [`FILE_STORAGE_SECURITY.md`](docs/phase-2/FILE_STORAGE_SECURITY.md) — Private document storage defense, MIME validation, and DPDP Act compliance.
10. [`TEST_REPORT.md`](docs/phase-2/TEST_REPORT.md) — Full test report for 27 pytest tests and Next.js static build.
11. [`PHASE_2_COMPLETION_REPORT.md`](docs/phase-2/PHASE_2_COMPLETION_REPORT.md) — Formal Phase 2 sign-off report.

---

## 7. Next Phase Roadmap

| Phase | Focus Area | Status |
| :--- | :--- | :--- |
| **Phase 0** | Product Discovery, SRS, UI/UX System & Interactive Prototype | **Completed** |
| **Phase 1** | Core Backend & Platform Foundation (DB, Auth, Tenancy, RBAC, Celery, Tests) | **Completed** |
| **Phase 2** | Super Admin Panel, Multi-Branch Management & Clinic Onboarding | **Completed** |
| **Phase 3** | Hybrid Live Queue Engine, Slot Scheduling & Doctor Consultation Studio | **Pending Approval** |
| **Phase 4** | Patient Mobile Experience (Flutter Android App) | Upcoming |
| **Phase 5** | Google Maps Routes API Departure Intelligence & Notifications | Upcoming |
| **Phase 6** | E-Prescriptions, Pharmacy, Billing & Payment Gateway Integration | Upcoming |
