# Phase 4 Implementation Plan
## Hybrid Appointment Booking & Unified Live Queue Management Engine

### 1. Architectural Scope & Objectives
Smart Clinic OS Phase 4 establishes a production-grade outpatient scheduling engine uniting three appointment entry modalities into one unified queue for every clinic branch and doctor:
1. **FIXED_SLOT**: Pre-scheduled appointment with defined time slot based on doctor working hours, branch operating hours, break timings, consultation duration, and conflict detection.
2. **LIVE_QUEUE**: Patient joins the doctor's active daily queue remotely or on-the-day without a fixed time slot.
3. **WALK_IN**: Receptionist directly registers walk-in patients into the active queue.

All three sources map to unified ordering, unique sequential daily token generation, real-time queue progression, waiting-time estimation, and role-based doctor/receptionist workflows.

---

### 2. Implementation Milestones

#### Milestone 1: Database Architecture & Migrations
- Create `backend/app/models/queue.py`:
  - `QueueSession`: Daily active queue lifecycle per (clinic_id, branch_id, doctor_id, session_date).
  - `QueueTokenCounter`: Concurrency-safe atomic token counter with unique constraint on `(clinic_id, branch_id, doctor_id, counter_date)`.
  - `QueueEntry`: Outpatient queue ticket linked to `appointment_id`, `patient_id`, `doctor_id`, `branch_id`, tracking state transitions, token numbers (`A001`, `A002`), sequence numbers, wait estimates, and priority flags.
  - `QueueStateHistory`: State transition audit log (`actor_user_id`, `from_status`, `to_status`, `timestamp`, `reason`).
  - `QueuePauseHistory`: Queue pause/resume audit log (`actor_user_id`, `pause_reason`, `paused_at`, `resumed_at`).
  - `QueuePolicy`: Configurable policy per doctor/branch (`allow_live_queue`, `allow_walk_in`, `max_daily_capacity`, `avg_consultation_minutes`, `grace_period_minutes`).
- Extend `DoctorSchedule` with optional break timings (`break_start_time`, `break_end_time`).
- Add slot uniqueness constraint on `Appointment` (`clinic_id`, `branch_id`, `doctor_id`, `appointment_date`, `appointment_time`) for active appointments to prevent double-booking at database level.
- Run Alembic migration `phase_4_hybrid_booking_and_live_queue`.

#### Milestone 2: Slot Availability & Booking Services
- Enhance `AppointmentService`:
  - `get_available_slots(clinic_id, branch_id, doctor_id, appointment_date)`: Computes available slots using doctor schedule, branch schedule, consultation duration, breaks, and existing active appointments.
  - Slot re-validation inside transactional boundary with `SELECT ... FOR UPDATE` or unique index violation handling to strictly prevent double booking under concurrency.
  - Slot release upon appointment cancellation or rescheduling.

#### Milestone 3: Concurrency-Safe Queue & Token Engine
- Implement `QueueService`:
  - `get_or_create_daily_session(...)`: Initialises or fetches daily `QueueSession`.
  - `generate_next_token(...)`: Atomic sequence increment on `QueueTokenCounter` using PostgreSQL `SELECT ... FOR UPDATE` ensuring duplicate tokens are mathematically impossible under concurrent load. Formats as `A001`, `A002`, etc.
  - `join_live_queue(...)`: Creates unified `Appointment` + `QueueEntry` for remote patients.
  - `register_walk_in(...)`: Creates unified `Appointment` + `QueueEntry` for reception walk-ins.
  - Priority assignment (`set_priority`): Marks priority with staff attribution and reason.

#### Milestone 4: Queue State Machine & Doctor Controls
- State transitions strictly validated in service:
  - `WAITING` -> `CALLED`
  - `CALLED` -> `IN_CONSULTATION`
  - `IN_CONSULTATION` -> `COMPLETED`
  - `CALLED` -> `SKIPPED`
  - `SKIPPED` -> `CALLED` (Recall)
  - `WAITING` -> `ON_HOLD`
  - `ON_HOLD` -> `WAITING`
  - `WAITING` / `CALLED` -> `CANCELLED`
  - `CALLED` -> `NO_SHOW`
- Doctor operations:
  - `call_next(session_id, doctor_id)`
  - `start_consultation(entry_id, doctor_id)`
  - `complete_consultation(entry_id, doctor_id)`
  - `skip_patient(entry_id, doctor_id)`
  - `recall_patient(entry_id, doctor_id)`
  - `hold_patient(entry_id, doctor_id)`
  - `resume_patient(entry_id, doctor_id)`
  - `pause_queue(session_id, reason, doctor_id)`
  - `resume_queue(session_id, doctor_id)`

#### Milestone 5: Waiting-Time Estimation Engine
- Transparent rule-based estimation algorithm:
  - `estimated_wait_minutes = (patients_ahead_in_waiting_or_called) * average_consultation_time`
  - If a patient is currently `IN_CONSULTATION`, compute elapsed time and subtract from estimated duration.
  - Factor in queue pause status (freeze wait countdown, flag as `PAUSED`).
  - Bound estimates (minimum 0 minutes, marked as approximate).

#### Milestone 6: Real-Time Sockets & Notification Events
- Configure `Flask-SocketIO`:
  - Room isolation: `clinic_{clinic_id}_doctor_{doctor_id}_{branch_id}`.
  - Emit events: `queue.patient_joined`, `queue.patient_called`, `queue.consultation_started`, `queue.consultation_completed`, `queue.patient_skipped`, `queue.patient_cancelled`, `queue.patient_on_hold`, `queue.patient_resumed`, `queue.paused`, `queue.resumed`, `queue.position_updated`.
  - Strip PHI / PII from socket payloads (emit only token number, status, position, wait estimate).
  - Notification triggers with safe development logger.

#### Milestone 7: REST API Endpoints & OpenAPI Documentation
- Register `/api/v1/queue` blueprint with endpoints:
  - `GET /api/v1/queue/slots` (Slot availability lookup)
  - `POST /api/v1/queue/book-slot` (Fixed slot booking)
  - `POST /api/v1/queue/join-live` (Live queue booking)
  - `POST /api/v1/queue/walk-in` (Walk-in registration)
  - `GET /api/v1/queue/live` (Active queue status & entries)
  - `POST /api/v1/queue/call-next`
  - `POST /api/v1/queue/start`
  - `POST /api/v1/queue/complete`
  - `POST /api/v1/queue/skip`
  - `POST /api/v1/queue/recall`
  - `POST /api/v1/queue/hold`
  - `POST /api/v1/queue/resume`
  - `POST /api/v1/queue/pause`
  - `POST /api/v1/queue/unpause`
  - `POST /api/v1/queue/cancel-entry`
  - `GET /api/v1/queue/policies` & `PUT /api/v1/queue/policies`

#### Milestone 8: Frontend UI (Receptionist & Doctor Views)
- Extend `components/ClinicWebLive.js`:
  - Receptionist Queue View:
    - Queue summary metric cards (waiting, in consultation, completed, paused status).
    - Unified live queue table (Token, Patient, Source, Position, Wait Time, Status, Actions).
    - Walk-in registration modal (Patient search/create + token assignment).
    - Fixed slot calendar tab (doctor schedule slots, booking modal).
  - Doctor Queue View:
    - Live consultation banner (Current Token, Patient, In-Consultation timer).
    - Next Patient call preview.
    - Doctor action buttons: Call Next, Start Consultation, Complete Consultation, Skip, Hold, Pause Queue.
    - Skipped / On-Hold quick recall drawer.
  - Mint/Teal styling exclusively (`#BFEDE5`, `#18A99A`, `#087F79`, `#F5FAF9`, `#183B3A`). Zero Tailwind CSS.

#### Milestone 9: Automated Testing Suite & Verification
- `test_phase4_queue_and_booking.py`:
  - Fixed-slot generation and conflict rejection.
  - Concurrency test: simultaneous bookings of the same slot.
  - Concurrency test: simultaneous token generation verifying 0 duplicate tokens.
  - Unified queue ordering (live queue + walk-in in single sequence).
  - Queue state machine transitions and invalid transition rejections.
  - Doctor queue controls (call, start, complete, skip, recall, hold, pause, resume).
  - Waiting time estimation formula checks.
  - Cross-tenant queue isolation security tests.
- Full pytest test suite execution.
- Next.js build verification.

