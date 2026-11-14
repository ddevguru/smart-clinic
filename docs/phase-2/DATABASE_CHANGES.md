# Smart Clinic OS — Database Schema Additions & Migration (Phase 2)

---

### 1. Overview & Migration Summary

Phase 2 introduces new relational entities to support multi-branch facility management, compliance document tracking, immutable verification histories, doctor credential audits, and structured bilateral communication.

- **Alembic Revision ID:** `4ff23f589639`
- **Revises:** `c10af94057b2` (Initial Phase 1 core backend models)
- **Database Engine:** PostgreSQL 16+
- **Applied Status:** Migrated cleanly to PostgreSQL (`smart_clinic_os` and `smart_clinic_os_test`).

---

### 2. Schema Diff & New Tables

#### 2.1 Table Alterations: `clinics`
- Added column `website` (`VARCHAR(255)`).
- Added column `established_year` (`INTEGER`).
- Added column `rejection_reason` (`TEXT`).
- Added column `suspension_reason` (`TEXT`).
- Extended column `verification_status` to `VARCHAR(32)` to accommodate: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `NEEDS_CORRECTION`, `APPROVED`, `REJECTED`, `SUSPENDED`.

#### 2.2 New Table: `clinic_documents`
Stores metadata for uploaded compliance documents.
- `id` (`UUID PK`)
- `clinic_id` (`UUID FK -> clinics.id ON DELETE CASCADE`, indexed)
- `document_type` (`VARCHAR(64)`) — `REGISTRATION_CERTIFICATE`, `ESTABLISHMENT_LICENSE`, `TAX_ID`, `POLLUTION_CONTROL_NOC`, `OTHER`
- `file_name` (`VARCHAR(255)`)
- `storage_path` (`VARCHAR(512)`)
- `file_size` (`INTEGER`)
- `mime_type` (`VARCHAR(128)`)
- `uploaded_by_user_id` (`UUID FK -> users.id ON DELETE SET NULL`)
- `verification_status` (`VARCHAR(32)`, default `PENDING`)
- `rejection_reason` (`TEXT`)
- `created_at`, `updated_at` (`TIMESTAMPTZ`)

#### 2.3 New Table: `clinic_verification_history`
Immutable audit trail of status transitions.
- `id` (`UUID PK`)
- `clinic_id` (`UUID FK -> clinics.id ON DELETE CASCADE`, indexed)
- `admin_user_id` (`UUID FK -> users.id ON DELETE SET NULL`)
- `from_status` (`VARCHAR(32)`)
- `to_status` (`VARCHAR(32)`)
- `reason` (`TEXT`)
- `admin_notes` (`TEXT`)
- `created_at` (`TIMESTAMPTZ`, indexed)

#### 2.4 New Table: `clinic_correction_requests`
Formal bilateral communication channel between Super Admin and Clinic Owner.
- `id` (`UUID PK`)
- `clinic_id` (`UUID FK -> clinics.id ON DELETE CASCADE`, indexed)
- `admin_user_id` (`UUID FK -> users.id ON DELETE SET NULL`)
- `field_name` (`VARCHAR(64)`)
- `comments` (`TEXT`)
- `status` (`VARCHAR(32)`, default `PENDING`)
- `resolution_notes` (`TEXT`)
- `created_at`, `updated_at` (`TIMESTAMPTZ`)

#### 2.5 New Table: `clinic_branches`
Physical branches of clinic facilities.
- `id` (`UUID PK`)
- `clinic_id` (`UUID FK -> clinics.id ON DELETE CASCADE`, indexed)
- `name` (`VARCHAR(160)`)
- `is_main_branch` (`BOOLEAN`, default `False`)
- `phone` (`VARCHAR(20)`)
- `email` (`VARCHAR(255)`)
- `address` (`TEXT`)
- `city` (`VARCHAR(64)`, indexed)
- `state` (`VARCHAR(64)`)
- `postal_code` (`VARCHAR(16)`, indexed)
- `latitude` (`NUMERIC(10, 7)`)
- `longitude` (`NUMERIC(10, 7)`)
- `operating_status` (`VARCHAR(32)`, default `ACTIVE`)
- `is_active` (`BOOLEAN`, default `True`)
- `created_at`, `updated_at` (`TIMESTAMPTZ`)

#### 2.6 New Table: `clinic_branch_schedules`
Weekly operating hours and break windows for each branch.
- `id` (`UUID PK`)
- `branch_id` (`UUID FK -> clinic_branches.id ON DELETE CASCADE`, indexed)
- `day_of_week` (`INTEGER`, 0=Mon, 6=Sun)
- `opening_time` (`VARCHAR(8)`, default `09:00`)
- `closing_time` (`VARCHAR(8)`, default `20:00`)
- `break_start_time` (`VARCHAR(8)`)
- `break_end_time` (`VARCHAR(8)`)
- `is_closed` (`BOOLEAN`, default `False`)
- Unique constraint: `(branch_id, day_of_week)`
- `created_at`, `updated_at` (`TIMESTAMPTZ`)

#### 2.7 New Table: `doctor_profiles`
Professional credentials and consultation settings.
- `id` (`UUID PK`)
- `user_id` (`UUID FK -> users.id ON DELETE CASCADE`, indexed)
- `clinic_id` (`UUID FK -> clinics.id ON DELETE CASCADE`, indexed)
- `primary_branch_id` (`UUID FK -> clinic_branches.id ON DELETE SET NULL`)
- `qualification` (`VARCHAR(160)`)
- `specialty` (`VARCHAR(100)`)
- `medical_registration_number` (`VARCHAR(64)`, indexed)
- `registration_council` (`VARCHAR(160)`)
- `experience_years` (`INTEGER`, default `0`)
- `consultation_fee` (`NUMERIC(10, 2)`, default `0.00`)
- `consultation_duration_minutes` (`INTEGER`, default `15`)
- `verification_status` (`VARCHAR(32)`, default `PENDING`)
- `rejection_reason` (`TEXT`)
- `is_active` (`BOOLEAN`, default `True`)
- `created_at`, `updated_at` (`TIMESTAMPTZ`)

#### 2.8 New Table: `doctor_credentials`
Uploaded degree certificates, photo IDs, and council proofs.
- `id` (`UUID PK`)
- `doctor_profile_id` (`UUID FK -> doctor_profiles.id ON DELETE CASCADE`, indexed)
- `credential_type` (`VARCHAR(64)`) — `DEGREE_CERTIFICATE`, `COUNCIL_REGISTRATION`, `IDENTITY_PROOF`, `OTHER`
- `file_name` (`VARCHAR(255)`)
- `storage_path` (`VARCHAR(512)`)
- `file_size` (`INTEGER`)
- `mime_type` (`VARCHAR(128)`)
- `verification_status` (`VARCHAR(32)`, default `PENDING`)
- `created_at` (`TIMESTAMPTZ`)

#### 2.9 New Table: `doctor_verification_history`
Audit timeline for doctor credential decisions.
- `id` (`UUID PK`)
- `doctor_profile_id` (`UUID FK -> doctor_profiles.id ON DELETE CASCADE`, indexed)
- `admin_user_id` (`UUID FK -> users.id ON DELETE SET NULL`)
- `from_status` (`VARCHAR(32)`)
- `to_status` (`VARCHAR(32)`)
- `reason` (`TEXT`)
- `admin_notes` (`TEXT`)
- `created_at` (`TIMESTAMPTZ`, indexed)

#### 2.10 New Table: `doctor_schedules`
Doctor availability hours by branch and day of week.
- `id` (`UUID PK`)
- `doctor_profile_id` (`UUID FK -> doctor_profiles.id ON DELETE CASCADE`, indexed)
- `branch_id` (`UUID FK -> clinic_branches.id ON DELETE CASCADE`, indexed)
- `day_of_week` (`INTEGER`, 0-6)
- `start_time` (`VARCHAR(8)`)
- `end_time` (`VARCHAR(8)`)
- `is_available` (`BOOLEAN`, default `True`)
- `created_at`, `updated_at` (`TIMESTAMPTZ`)

