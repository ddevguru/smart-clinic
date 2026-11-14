# Smart Clinic OS — Phase 2 Implementation Plan
## Super Admin Panel & Clinic Onboarding

---

### 1. Objective and Scope

Phase 2 focuses on building production-grade **Super Admin Governance** and **Clinic & Healthcare Provider Onboarding** for Smart Clinic OS. 

This phase bridges the product foundation (Phase 0) and the core platform infrastructure (Phase 1) by enabling healthcare facility owners to register, submit compliance documents, track their verification status, set up branches, onboard doctors and staff, and configure operating schedules. Simultaneously, it provides Super Administrators with an enterprise portal to review, request corrections, approve, reject, suspend, or reactivate clinics and verify medical practitioner credentials with immutable audit logs.

#### Scope Inclusions:
1. **Super Admin Authentication & Governance:**
   - Dedicated admin login flow enforcing backend verification of `SUPER_ADMIN` role and `platform.*` permissions.
   - Comprehensive admin dashboard backed by real-time PostgreSQL metrics and aggregations.
   - Interactive clinic management (filtering, pagination, detailed view, status transitions).
   - Multi-step clinic verification workflow (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `NEEDS_CORRECTION`, `APPROVED`, `REJECTED`, `SUSPENDED`).
   - Doctor credential review and verification workflow.
   - Audit trail explorer for platform governance events.
2. **Clinic Owner Onboarding Experience:**
   - Multi-step registration wizard: Owner account, basic facility info, address & geo-coordinates, document uploads, and final submission.
   - Dedicated onboarding progress & status tracker with real-time feedback (e.g. correction notices with resubmission capability).
   - Branch management foundation (creating main and sub-branches with geo-locations).
   - Doctor and staff onboarding (profiles, council registration, credentials upload).
   - Foundational operating hours and consultation schedule configuration.
3. **Backend Modular Architecture & Storage:**
   - SQLAlchemy 2.0 entities and Alembic migrations for onboarding, documents, branches, schedules, doctor profiles, credentials, and verification histories.
   - Secure private document storage abstraction (`LocalStorageProvider` with authenticated streaming; ready for S3/MinIO in production).
   - Granular RBAC permissions (`platform.*`, `branch.*`, `doctor.*`).
   - Celery/internal notification event logging.
4. **Automated Testing & Security:**
   - Pytest unit, integration, and security tests covering all new workflows, state transitions, and cross-tenant safeguards.
5. **Phase 2 Frontend Implementation:**
   - Next.js 14 App Router application styled strictly with the Phase 0 Mint & Teal CSS Design System (`#BFEDE5`, `#18A99A`, `#087F79`). Zero Tailwind CSS.

#### Explicit Exclusions (Deferred to Later Phases):
- Live queue WebSocket engine & real-time token calling (Phase 3).
- Full OPD consultation room & digital prescription generation (Phase 3/4).
- Patient mobile Flutter application (Phase 4).
- Google Maps Routes API dynamic departure alerts (Phase 5).
- Payment gateway integration & SaaS subscription billing (Phase 6+).

---

### 2. Implementation Milestones & Work Breakdown

```
[Phase 2 Roadmap]
 ├─ Milestone 1: Architectural Design & Implementation Documentation (Plan & Decisions)
 ├─ Milestone 2: Database Schema & Alembic Migration (New entities, FKs, indexes)
 ├─ Milestone 3: Secure Document Storage Abstraction & Service
 ├─ Milestone 4: Backend Onboarding & Clinic Verification API Modules
 ├─ Milestone 5: Branch & Operating Schedule Management Backend
 ├─ Milestone 6: Doctor & Staff Onboarding and Verification Backend
 ├─ Milestone 7: Super Admin Dashboard Metrics & Aggregation APIs
 ├─ Milestone 8: Super Admin Frontend Web Portal (Next.js + Pure CSS)
 ├─ Milestone 9: Clinic Owner Onboarding Frontend Experience (Wizard + Status Tracker)
 ├─ Milestone 10: Event Notifications & Immutable Audit Logging
 ├─ Milestone 11: Comprehensive Test Suite & Security Validation
 └─ Milestone 12: Documentation & Completion Sign-Off
```

---

### 3. Detailed Milestone Specifications

#### Milestone 1: Architectural Design & Implementation Documentation
- Inspect all Phase 0 and Phase 1 artifacts to preserve full compatibility.
- Author `docs/phase-2/IMPLEMENTATION_PLAN.md` and `docs/phase-2/IMPLEMENTATION_DECISIONS.md`.
- Detail the state machine for verification transitions and authorization boundaries.

#### Milestone 2: Database Entities & Alembic Migration
- Define new SQLAlchemy 2.0 models inheriting from `UUIDPrimaryKeyMixin` and `TimestampMixin`:
  - `ClinicDocument`: Private document storage metadata.
  - `ClinicVerificationHistory`: Immutable audit history of verification decisions.
  - `ClinicBranch`: Multi-branch facility records.
  - `ClinicBranchSchedule`: Weekly opening, closing, and break hours.
  - `DoctorProfile`: Clinical qualifications, medical council registration, experience, fee.
  - `DoctorCredential`: Uploaded medical degrees, registration certificates.
  - `DoctorVerificationHistory`: Doctor credential approval/rejection timeline.
  - `DoctorSchedule`: Consultation availability by branch and day of week.
  - `ClinicCorrectionRequest`: Formal bilateral communication channel between Super Admin and Clinic Owner.
- Extend `Clinic` entity with `website`, `established_year`, `rejection_reason`, and `suspension_reason`.
- Create and execute Alembic migration script `xxxx_phase_2_onboarding_and_super_admin.py`.

#### Milestone 3: Document Storage Abstraction
- Create an abstract `StorageProvider` base class with methods: `save(file, destination_path)`, `retrieve(storage_path)`, `delete(storage_path)`.
- Implement `LocalStorageProvider` for development and on-premise deployments:
  - Stores files in `backend/storage/documents/<clinic_id>/`.
  - Enforces strict file type whitelisting (`application/pdf`, `image/jpeg`, `image/png`).
  - Limits file size to 10 MB per document.
  - Generates safe UUID-based filenames to prevent directory traversal and overwrite attacks.
  - Provides streaming endpoints protected by JWT and role authorization (no direct public file serving).

#### Milestone 4: Clinic Onboarding & Verification Backend APIs
- **Onboarding Endpoints:**
  - `POST /api/v1/onboarding/clinics`: Initialize clinic onboarding draft.
  - `GET /api/v1/onboarding/clinics/me`: Retrieve current user's clinic registration and progress.
  - `PATCH /api/v1/onboarding/clinics/me`: Update draft details (basic info, address, contact).
  - `POST /api/v1/onboarding/clinics/me/documents`: Upload verification document.
  - `GET /api/v1/onboarding/clinics/me/documents/<id>/download`: Securely download document.
  - `POST /api/v1/onboarding/clinics/me/submit`: Final submission transitioning status from `DRAFT` or `NEEDS_CORRECTION` to `SUBMITTED`.
  - `GET /api/v1/onboarding/clinics/me/corrections`: Fetch feedback and required corrections.
- **Super Admin Management Endpoints:**
  - `GET /api/v1/admin/clinics`: Search, filter by status/type/city, and paginate clinics.
  - `GET /api/v1/admin/clinics/<id>`: Full clinic dossier (branches, documents, staff, verification history).
  - `POST /api/v1/admin/clinics/<id>/review`: Mark clinic as `UNDER_REVIEW`.
  - `POST /api/v1/admin/clinics/<id>/approve`: Verify and approve clinic.
  - `POST /api/v1/admin/clinics/<id>/request-correction`: Request corrections with specific field instructions.
  - `POST /api/v1/admin/clinics/<id>/reject`: Reject registration with mandatory clinical/legal reason.
  - `POST /api/v1/admin/clinics/<id>/suspend`: Temporarily suspend clinic operations with reason.
  - `POST /api/v1/admin/clinics/<id>/reactivate`: Lift suspension and restore active status.

#### Milestone 5: Branch & Operating Schedule Backend
- `POST /api/v1/clinics/<id>/branches`: Register new facility branch.
- `GET /api/v1/clinics/<id>/branches`: List branches with active status and location.
- `PATCH /api/v1/clinics/<id>/branches/<branch_id>`: Update branch contact, address, or operating status.
- `PUT /api/v1/clinics/<id>/branches/<branch_id>/schedules`: Configure weekly operating timings and breaks.
- `GET /api/v1/clinics/<id>/branches/<branch_id>/schedules`: Fetch operating hours.

#### Milestone 6: Doctor & Staff Onboarding & Verification Backend
- `POST /api/v1/clinics/<id>/doctors`: Onboard doctor profile with medical council details.
- `GET /api/v1/clinics/<id>/doctors`: List doctors associated with clinic.
- `POST /api/v1/clinics/<id>/doctors/<doctor_id>/credentials`: Upload medical license documents.
- `GET /api/v1/admin/doctors`: Platform-wide doctor list with filtering.
- `GET /api/v1/admin/doctors/<id>`: Detailed doctor credential dossier.
- `POST /api/v1/admin/doctors/<id>/approve`: Approve doctor credentials.
- `POST /api/v1/admin/doctors/<id>/reject`: Reject credentials with reason.
- `POST /api/v1/clinics/<id>/staff`: Onboard clinic receptionist or administrative staff.
- `GET /api/v1/clinics/<id>/staff`: List staff memberships.

#### Milestone 7: Super Admin Dashboard Metrics & Aggregation APIs
- `GET /api/v1/admin/dashboard/overview`: Real-time counts of total, approved, pending, rejected, and suspended clinics, total doctors, active owners, and month-over-month growth.
- `GET /api/v1/admin/dashboard/clinic-trends`: Time-series registration aggregations.
- `GET /api/v1/admin/dashboard/verification-stats`: Breakdown by verification status and clinic type.

#### Milestone 8: Super Admin Frontend Web Application
- Build in Next.js 14 under `app/admin/` with pure CSS module styling following Phase 0 Mint & Teal tokens.
- Implement responsive layout: Collapsible left sidebar, top header with admin identity & notifications, main content view.
- Views to deliver:
  1. Admin Login & Session Management (`/admin/login`).
  2. Live Dashboard with dynamic KPI cards and visual distribution charts (`/admin/dashboard`).
  3. Clinic Directory with search, status filters, and pagination (`/admin/clinics`).
  4. Comprehensive Clinic Dossier with document preview, branch listing, staff, and action dialogs (`/admin/clinics/[id]`).
  5. Verification Queue dedicated to pending approvals (`/admin/verification`).
  6. Doctor Directory and Credential Review (`/admin/doctors` and `/admin/doctors/[id]`).
  7. Platform Audit Log Explorer (`/admin/audit-logs`).
  8. Platform Settings (`/admin/settings`).

#### Milestone 9: Clinic Owner Onboarding Frontend Experience
- Build under `app/onboarding/` with intuitive, reassuring UX:
  1. Multi-Step Onboarding Wizard (`/onboarding/register`):
     - Step 1: Owner Profile & Credentials.
     - Step 2: Clinic Profile & Facility Type.
     - Step 3: Physical Address & Geo-coordinates.
     - Step 4: Verification Document Upload with drag-and-drop.
     - Step 5: Summary Review and Formal Submission.
  2. Live Status & Progress Dashboard (`/onboarding/status`):
     - Visual stepper showing `DRAFT` -> `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED`.
     - Active correction request banner with resolution notes and resubmit action.
  3. Branch Setup (`/onboarding/branches`): Create main and additional branches.
  4. Doctor & Staff Setup (`/onboarding/doctors`, `/onboarding/staff`).
  5. Clinic Timings Setup (`/onboarding/schedules`).

#### Milestone 10: Event Notifications & Audit Logging
- Implement internal notification logger recording lifecycle transitions (`CLINIC_REGISTERED`, `CORRECTION_REQUESTED`, `CLINIC_APPROVED`, `CLINIC_REJECTED`, `CLINIC_SUSPENDED`, `DOCTOR_VERIFIED`).
- Guarantee audit record creation on every sensitive state mutation.

#### Milestone 11: Comprehensive Test Suite & Security Verification
- Pytest suite in `backend/tests/`:
  - `test_onboarding_api.py`: Clinic onboarding registration, draft updates, document upload, and submission.
  - `test_verification_workflow.py`: Super Admin review, correction requests, approvals, rejections, suspensions, and reactivations.
  - `test_branches_schedules.py`: Branch creation, conflict checking, and schedule timings.
  - `test_doctor_onboarding.py`: Doctor registration, credential upload, and verification.
  - `test_super_admin_security.py`: Role enforcement, unauthorized access blocking, cross-tenant isolation.
- Target: 100% pass rate.

#### Milestone 12: Documentation & Completion Sign-Off
- Generate all required technical documents in `docs/phase-2/`.
- Update master `README.md`.
- Present Phase 2 completion report and halt for user Phase 3 approval.

