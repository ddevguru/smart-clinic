# Phase 4 Database Changes & Schema Architecture

### Overview
Alembic Migration Revision: `0c2e95dfc72a_phase_4_hybrid_booking_and_live_queue.py`  
Applied to PostgreSQL Database: `smart_clinic_os`

---

### New Tables

#### 1. `queue_sessions`
Tracks active daily clinic queue progression per doctor, branch, and calendar date.
- `id`: UUID (Primary Key)
- `clinic_id`: UUID, FK `clinics.id` ON DELETE CASCADE
- `branch_id`: UUID, FK `clinic_branches.id` ON DELETE CASCADE
- `doctor_id`: UUID, FK `doctor_profiles.id` ON DELETE CASCADE
- `session_date`: Date (Indexed)
- `is_active`: Boolean (Default: True)
- `is_paused`: Boolean (Default: False)
- `pause_reason`: Text (Nullable)
- `paused_at`: TIMESTAMPTZ (Nullable)
- `started_at`: TIMESTAMPTZ (Nullable)
- `closed_at`: TIMESTAMPTZ (Nullable)
- **Constraint**: `uq_queue_session_daily` UNIQUE (`clinic_id`, `branch_id`, `doctor_id`, `session_date`)

#### 2. `queue_token_counters`
Maintains atomic daily counters for sequential token numbers (e.g. `A001`, `A002`).
- `id`: UUID (Primary Key)
- `clinic_id`: UUID, FK `clinics.id` ON DELETE CASCADE
- `branch_id`: UUID, FK `clinic_branches.id` ON DELETE CASCADE
- `doctor_id`: UUID, FK `doctor_profiles.id` ON DELETE CASCADE
- `counter_date`: Date (Indexed)
- `prefix`: VARCHAR(4) (Default: 'A')
- `current_counter`: Integer (Default: 0)
- `updated_at`: TIMESTAMPTZ (Default: `now()`)
- **Constraint**: `uq_queue_token_counter_daily` UNIQUE (`clinic_id`, `branch_id`, `doctor_id`, `counter_date`)

#### 3. `queue_entries`
Individual ticket and patient progression record in unified live queue.
- `id`: UUID (Primary Key)
- `queue_session_id`: UUID, FK `queue_sessions.id` ON DELETE CASCADE
- `appointment_id`: UUID, FK `appointments.id` ON DELETE CASCADE (Unique)
- `clinic_id`: UUID, FK `clinics.id` ON DELETE CASCADE
- `branch_id`: UUID, FK `clinic_branches.id` ON DELETE CASCADE
- `doctor_id`: UUID, FK `doctor_profiles.id` ON DELETE RESTRICT
- `patient_id`: UUID, FK `patients.id` ON DELETE RESTRICT
- `token_number`: VARCHAR(16) (Indexed)
- `token_sequence`: Integer (Indexed)
- `booking_source`: VARCHAR(32) ('FIXED_SLOT', 'LIVE_QUEUE', 'WALK_IN')
- `queue_status`: VARCHAR(32) ('WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW', 'ON_HOLD')
- `priority_flag`: Boolean (Default: False)
- `priority_reason`: Text (Nullable)
- `priority_assigned_by_id`: UUID, FK `users.id`
- `estimated_wait_minutes`: Integer (Default: 0)
- `joined_at`: TIMESTAMPTZ (Default: `now()`)
- `called_at`: TIMESTAMPTZ (Nullable)
- `consultation_started_at`: TIMESTAMPTZ (Nullable)
- `completed_at`: TIMESTAMPTZ (Nullable)
- `cancelled_at`: TIMESTAMPTZ (Nullable)
- `created_by_user_id`: UUID, FK `users.id`

#### 4. `queue_state_history`
Audit log for all queue state transitions.
- `id`: UUID (Primary Key)
- `queue_entry_id`: UUID, FK `queue_entries.id` ON DELETE CASCADE
- `actor_user_id`: UUID, FK `users.id` ON DELETE SET NULL
- `from_status`: VARCHAR(32)
- `to_status`: VARCHAR(32)
- `reason`: Text (Nullable)
- `created_at`: TIMESTAMPTZ (Default: `now()`, Indexed)

#### 5. `queue_pause_history`
Audit log for queue pause and resume operations.
- `id`: UUID (Primary Key)
- `queue_session_id`: UUID, FK `queue_sessions.id` ON DELETE CASCADE
- `actor_user_id`: UUID, FK `users.id` ON DELETE SET NULL
- `pause_reason`: Text (Nullable)
- `paused_at`: TIMESTAMPTZ (Default: `now()`)
- `resumed_at`: TIMESTAMPTZ (Nullable)

#### 6. `queue_policies`
Branch and doctor-specific queue configuration parameters.
- `id`: UUID (Primary Key)
- `clinic_id`: UUID, FK `clinics.id` ON DELETE CASCADE
- `branch_id`: UUID, FK `clinic_branches.id` ON DELETE CASCADE (Nullable)
- `doctor_id`: UUID, FK `doctor_profiles.id` ON DELETE CASCADE (Nullable)
- `allow_live_queue`: Boolean (Default: True)
- `allow_walk_ins`: Boolean (Default: True)
- `max_daily_capacity`: Integer (Default: 60)
- `avg_consultation_minutes`: Integer (Default: 15)
- `grace_period_minutes`: Integer (Default: 15)
- `auto_call_next`: Boolean (Default: False)
- `min_advance_booking_hours`: Integer (Default: 1)
- `max_advance_booking_days`: Integer (Default: 30)
- **Constraint**: `uq_queue_policy_scope` UNIQUE (`clinic_id`, `branch_id`, `doctor_id`)

---

### Column Additions to Existing Tables

#### `doctor_schedules`
- `break_start_time`: VARCHAR(8) Nullable (e.g. `11:00`)
- `break_end_time`: VARCHAR(8) Nullable (e.g. `11:30`)

