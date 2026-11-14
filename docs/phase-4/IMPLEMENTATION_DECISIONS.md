# Phase 4 Implementation Decisions & Architectural Invariants

### 1. Unified Appointment Record vs Independent Queue Ticket
- **Decision:** Every queue entry (`QueueEntry`) is anchored to an authoritative `Appointment` entity in `appointments`.
- **Rationale:**
  - Preserves consistency with Phase 3 reporting, billing, consultation notes, and receptionist views.
  - Walk-ins and live queue registrants automatically generate an `Appointment` with `appointment_source="WALK_IN"` or `appointment_source="ONLINE"`.
  - For `FIXED_SLOT` bookings, the `Appointment` has both a specific `appointment_time` and can optionally enter the queue on the day of appointment upon check-in or booking.
  - Ensures a single source of truth for doctor schedules and clinic billing receipts.

### 2. Concurrency-Safe Sequential Token Generation
- **Decision:** We implement a dedicated sequence table `queue_token_counters` with row-level locking (`SELECT ... FOR UPDATE`).
- **Rationale:**
  - Using `COUNT(*)` or `MAX(token_sequence)` causes severe race conditions under concurrent registration where two receptionists or online patients get the identical token number.
  - `QueueTokenCounter` stores `(clinic_id, branch_id, doctor_id, counter_date, current_counter, prefix)`.
  - On token request, the row for the target doctor and date is locked within the transaction, incremented, and formatted (e.g., `A001`, `A002`). If no row exists, it is initialized atomically with `current_counter=1`.
  - Cancelled tokens are never reused, guaranteeing sequential auditability.

### 3. Queue State Machine Enforcement
- **Decision:** Strict backend state-transition validation matrix.
- **Matrix:**
  - `WAITING`: Can transition to `CALLED`, `ON_HOLD`, `CANCELLED`.
  - `CALLED`: Can transition to `IN_CONSULTATION`, `SKIPPED`, `NO_SHOW`, `CANCELLED`.
  - `IN_CONSULTATION`: Can transition to `COMPLETED` (and updates linked `Appointment` to `COMPLETED`).
  - `SKIPPED`: Can transition to `CALLED` (Recall).
  - `ON_HOLD`: Can transition to `WAITING` (Resume).
  - Terminal states: `COMPLETED`, `CANCELLED`, `NO_SHOW` (immutable).
- **Audit:** Every transition writes to `queue_state_history` with `actor_user_id`, `from_status`, `to_status`, `reason`, and `timestamp`.

### 4. Rule-Based Wait Time Estimation Model
- **Decision:** Transparent deterministic formula rather than opaque ML.
- **Formula:**
  - Let $N_{ahead}$ be the count of non-terminal, active entries ahead in queue (`WAITING` and `CALLED`).
  - Let $D_{avg}$ be the doctor's configured consultation duration (minutes), defaulting to 15.
  - If a patient is `IN_CONSULTATION`:
    - Calculate elapsed minutes $T_{elapsed} = \max(0, \text{now} - \text{consultation\_started\_at})$.
    - Remaining consultation time $R_{curr} = \max(1, D_{avg} - T_{elapsed})$.
    - For waiting patients: $\text{Wait} = R_{curr} + (N_{ahead} - 1) \times D_{avg}$.
  - If no patient is currently in consultation:
    - $\text{Wait} = N_{ahead} \times D_{avg}$.
  - If queue `is_paused`:
    - Queue is marked paused, elapsed time is frozen, and estimates reflect that consultations are temporarily suspended.

### 5. Double-Booking Prevention on Fixed Slots
- **Decision:** Enforce at database and service layer.
- **Mechanisms:**
  - Unique partial index / constraint: `(clinic_id, branch_id, doctor_id, appointment_date, appointment_time)` where `status NOT IN ('CANCELLED')`.
  - Service-level revalidation inside the database transaction before committing appointment creation.

### 6. Real-Time Socket Architecture
- **Decision:** Socket.IO with Flask-SocketIO in async mode with threading/eventlet, emitting events only after successful database commit.
- **Rationale:**
  - Socket events are broadcast-only mirrors. If a client disconnects, the REST API `GET /api/v1/queue/live` recovers the full authoritative state.
  - Zero PII / PHI is broadcast over WebSockets: only `token_number`, `queue_status`, `position`, `estimated_wait_minutes`, and `patient_initials`/masked name are emitted.

