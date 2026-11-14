# Phase 4 Queue State Machine Specification

### State Machine Definition

The Smart Clinic OS queue engine validates all status transitions according to outpatient clinical practice.

```
       [WAITING] ───────────────► [CALLED] ───────────────► [IN_CONSULTATION]
         │  │                       │   │                         │
         │  └──────► [ON_HOLD]      │   └──► [SKIPPED]            ▼
         │             │            │           │            [COMPLETED]
         │             │ (Resume)   │           │ (Recall)
         │             ▼            │           ▼
         │         [WAITING]        │        [CALLED]
         │                          │
         └─────────────┬────────────┘
                       │
                       ▼
                  [CANCELLED] / [NO_SHOW]
```

---

### Permitted Transitions Matrix

| Current State | Allowed Next States | Trigger Event | Actor Authorized |
|---|---|---|---|
| `WAITING` | `CALLED` | Doctor / Staff calls next ticket | Doctor, Clinic Owner, Receptionist |
| `WAITING` | `ON_HOLD` | Patient step-aside / tests | Doctor, Receptionist |
| `WAITING` | `CANCELLED` | Patient leaves or cancels visit | Doctor, Receptionist |
| `CALLED` | `IN_CONSULTATION` | Patient enters doctor room | Doctor, Clinic Owner (Receptionist forbidden) |
| `CALLED` | `SKIPPED` | Patient does not respond to call | Doctor, Clinic Owner |
| `CALLED` | `NO_SHOW` | Patient marked absent | Doctor, Clinic Owner, Receptionist |
| `CALLED` | `CANCELLED` | Patient cancelled after call | Doctor, Receptionist |
| `IN_CONSULTATION` | `COMPLETED` | Consultation concluded | Doctor, Clinic Owner (Receptionist forbidden) |
| `SKIPPED` | `CALLED` | Recalled to consultation desk | Doctor, Clinic Owner |
| `SKIPPED` | `CANCELLED` | Cancelled from skipped state | Doctor, Receptionist |
| `ON_HOLD` | `WAITING` | Returned from diagnostics | Doctor, Receptionist |
| `ON_HOLD` | `CANCELLED` | Cancelled from hold | Doctor, Receptionist |

Terminal states: `COMPLETED`, `CANCELLED`, `NO_SHOW` (immutable).

---

### Transition Side Effects & Auditing
1. `WAITING` -> `CALLED`: Sets `called_at = now()`, recalculates remaining estimates for queue.
2. `CALLED` -> `IN_CONSULTATION`: Sets `consultation_started_at = now()`, synchronizes linked `Appointment.status = "IN_CONSULTATION"`.
3. `IN_CONSULTATION` -> `COMPLETED`: Sets `completed_at = now()`, synchronizes linked `Appointment.status = "COMPLETED"`.
4. Any transition: Inserts immutable row in `queue_state_history` with `actor_user_id`, `from_status`, `to_status`, `reason`, and timestamp.

