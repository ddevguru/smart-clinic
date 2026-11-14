# Smart Clinic OS — Phase 2 Implementation Decisions

---

### Architectural Decisions & Design Rationale

This document details key technical decisions, architectural patterns, and trade-offs adopted for Phase 2: Super Admin Panel and Clinic Onboarding.

---

### 1. Document Storage Architecture

#### Context
Clinic registration requires submitting sensitive compliance documentation (e.g. Clinical Establishments Act licenses, GST certificates, Pollution Control NOCs, and Medical Council registration certificates). Exposing these via public CDN URLs violates Indian DPDP Act 2023 regulations.

#### Decision
- Implement a pluggable `StorageProvider` interface in `backend/app/common/storage.py` with standard methods:
  - `save(file_obj, destination_dir, filename) -> (storage_path, file_size, mime_type)`
  - `open(storage_path) -> binary stream`
  - `delete(storage_path) -> bool`
- For local development and test execution, provide `LocalStorageProvider` storing documents inside a sandboxed private directory (`backend/storage/documents/<clinic_id>/`).
- **Access Control:** No direct web-server directory indexing or static file serving is permitted. Files are served exclusively through authenticated streaming endpoints (`/api/v1/onboarding/clinics/me/documents/<id>/download` and `/api/v1/admin/clinics/<id>/documents/<doc_id>/download`) requiring a valid JWT and verified ownership or `platform.clinics.view` permission.
- File integrity: Validate file extensions and MIME types (`application/pdf`, `image/jpeg`, `image/png`) and limit uploads to 10 MB per file. Filenames are hashed with UUIDs to eliminate path traversal (`../`) and overwrite risks.

---

### 2. Clinic Verification State Machine

#### Context
Ad-hoc or unvalidated status mutations risk clinics entering inconsistent operational states (e.g. a suspended clinic directly becoming verified without audit rationale, or an unsubmitted draft being approved).

#### Decision
Implement a deterministic finite state machine (FSM) enforced in the business service layer:

```
                  ┌──────────────┐
                  │    DRAFT     │
                  └──────┬───────┘
                         │ Submit
                         ▼
                  ┌──────────────┐
       ┌─────────►│  SUBMITTED   │◄─────────┐
       │          └──────┬───────┘          │
       │                 │ Start Review     │ Resubmit
       │                 ▼                  │
       │          ┌──────────────┐          │
       │          │ UNDER_REVIEW │          │
       │          └──┬────┬────┬─┘          │
       │Request      │    │    │            │
       │Correction   │    │    └────────────┤
       ▼             │    │                 │
┌──────────────┐     │    │           ┌─────┴──────────┐
│NEEDS_CORRECT.│◄────┘    │           │    REJECTED    │
└──────────────┘          ▼           └────────────────┘
                   ┌──────────────┐   (Terminal / Appeal)
                   │   APPROVED   │
                   └──────┬───────┘
                          │ Suspend / Reactivate
                          ▼
                   ┌──────────────┐
                   │  SUSPENDED   │
                   └──────────────┘
```

#### Transition Rules:
1. `DRAFT` can only transition to `SUBMITTED`.
2. `SUBMITTED` transitions to `UNDER_REVIEW` when an admin opens the review workflow.
3. `UNDER_REVIEW` can transition to:
   - `APPROVED` (Clinic becomes active tenant).
   - `NEEDS_CORRECTION` (Requires structured correction notes from admin; owner is notified).
   - `REJECTED` (Requires mandatory administrative reason).
4. `NEEDS_CORRECTION` transitions back to `SUBMITTED` when the owner updates the requested fields and clicks "Resubmit".
5. `APPROVED` can transition to `SUSPENDED` with mandatory reason.
6. `SUSPENDED` can transition back to `APPROVED` via `reactivate` action.
7. Any attempt to bypass these transitions raises `ValidationError (HTTP 400)`.

---

### 3. Super Admin Authentication & Privilege Verification

#### Context
A multi-tenant system must prevent horizontal privilege escalation (clinic owners accessing admin endpoints) and vertical privilege escalation (tampered JWT payloads claiming admin privileges).

#### Decision
- Super Admin access is never determined by client-supplied payload claims alone.
- The `@require_super_admin` decorator performs a two-tier check:
  1. Validates the JWT signature and extracts `sub` (User ID).
  2. Queries the database to verify the user has an active `SUPER_ADMIN` system role.
  3. If a specific `permission_code` is requested (e.g. `platform.clinics.verify`), validates that the user possesses that exact permission in `role_permissions`.
- Any non-admin attempting to access `/api/v1/admin/*` receives `HTTP 403 Forbidden` with a standardized audit alert logged.

---

### 4. Branch Management & Physical Facility Hierarchy

#### Context
Clinics range from single-room general practices to multi-branch polyclinics across different localities. Clinical scheduling and doctor consultations are physically branch-bound.

#### Decision
- Introduce `ClinicBranch` as the primary operational unit for outpatient scheduling.
- Upon initial clinic approval, the clinic's main registered address automatically seeds its `is_main_branch=True` primary branch.
- Owners can add additional branches (`ClinicBranch`) specifying local contact details, physical address, and geo-coordinates.
- Operating schedules (`ClinicBranchSchedule`) and doctor consultation timings (`DoctorSchedule`) link directly to specific branches, allowing different operating hours per facility.

---

### 5. Doctor & Staff Registration & Verification

#### Context
Under Indian Telemedicine Practice Guidelines 2020 and the National Medical Commission (NMC) Act, doctors must be registered with a State Medical Council or NMC. Unverified practitioners must not issue prescriptions.

#### Decision
- In Phase 2, doctor onboarding registers medical council details:
  - Council Name (e.g. Karnataka Medical Council, Maharashtra Medical Council).
  - Medical Registration Number.
  - Qualification degree(s) and specialty.
  - Uploaded council registration certificate and photo ID.
- Doctor profiles maintain their own verification lifecycle (`PENDING` -> `UNDER_REVIEW` -> `APPROVED` | `REJECTED`).
- Doctors can only be scheduled for consultations at branches where they are registered and verified.
- We explicitly state in all interfaces that credentials are admin-reviewed against uploaded documentation, avoiding false claims of automated real-time council API synchronization.

---

### 6. Frontend Architecture & Design Alignment

#### Context
The existing Next.js prototype at `/` demonstrates the Phase 0 visual direction using pure semantic CSS and tokens in `design/design-system/tokens.css`. We need fully functional, live-API-integrated Super Admin and Clinic Onboarding experiences without disrupting existing Phase 0 prototype screens.

#### Decision
- Implement production routes using Next.js 14 App Router:
  - `/admin/login`: Secure Super Admin authentication with JWT storage in `localStorage` / HTTP-only cookies.
  - `/admin/dashboard`: Real-time analytics and KPI cards.
  - `/admin/clinics`: Searchable, filterable clinic directory.
  - `/admin/clinics/[id]`: Comprehensive review dossier with document download and action modals.
  - `/admin/verification`: Dedicated verification queue.
  - `/admin/doctors`: Medical practitioner credential audits.
  - `/admin/audit-logs`: Security and governance event stream.
  - `/onboarding/register`: 5-step registration wizard for prospective clinic owners.
  - `/onboarding/status`: Real-time status tracker with correction response interface.
  - `/onboarding/branches`: Branch and schedule configuration.
  - `/onboarding/doctors`: Doctor profile and staff management.
- **Styling Rule:** Strictly follow the Phase 0 Mint & Teal healthcare tokens (`#BFEDE5`, `#E5F7F3`, `#18A99A`, `#087F79`). Zero Tailwind CSS. CSS Modules and semantic CSS classes only.

---

### 7. Notification & Event Dispatch Strategy

#### Context
Status changes (submission, correction requests, approval, rejection) must alert clinic owners and staff.

#### Decision
- Implement an event-driven `NotificationService` in `backend/app/common/notifications.py`.
- For development and Phase 2 testing, events are recorded in an internal event queue / audit log and output to the application log with delivery timestamps.
- Ready for seamless plug-in of Twilio/Gupshup SMS and AWS SES / SendGrid in later phases.

