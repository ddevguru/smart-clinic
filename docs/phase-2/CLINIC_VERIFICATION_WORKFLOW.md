# Smart Clinic OS — Clinic Verification Lifecycle (Phase 2)

---

### 1. Overview

The Clinic Verification Lifecycle enforces governance over all outpatient facilities operating on Smart Clinic OS. All status transitions are validated by a deterministic backend finite state machine (FSM) and recorded in an immutable audit timeline (`clinic_verification_history`).

---

### 2. State Machine Diagram

```
                 ┌────────────────┐
                 │     DRAFT      │  (Initial self-registration)
                 └───────┬────────┘
                         │ Submit (Owner)
                         ▼
                 ┌────────────────┐
      ┌─────────►│   SUBMITTED    │◄─────────┐
      │          └───────┬────────┘          │
      │                  │ Start Review      │
      │                  ▼                   │
      │          ┌────────────────┐          │ Resubmit (Owner)
      │          │  UNDER_REVIEW  │          │
      │          └──┬────┬─────┬──┘          │
      │Request      │    │     │             │
      │Correction   │    │     └─────────────┤
      ▼             │    │                   │
┌──────────────┐    │    │            ┌──────┴─────────┐
│NEEDS_CORRECT.│◄───┘    │            │    REJECTED    │
└──────────────┘         ▼            └────────────────┘
                  ┌──────────────┐    (Terminal state)
                  │   APPROVED   │
                  └──────┬───────┘
                         │ Suspend / Reactivate
                         ▼
                  ┌──────────────┐
                  │  SUSPENDED   │
                  └──────────────┘
```

---

### 3. Verification State Descriptions

| Status | Actor with Authority | Description & Operational Impact |
| :--- | :--- | :--- |
| `DRAFT` | Clinic Owner | Registration draft initiated; facility is unverified and hidden from search. |
| `SUBMITTED` | Clinic Owner | Registration completed and queued in Super Admin Verification Queue. |
| `UNDER_REVIEW` | Super Admin | Administrator has opened the review dossier and is actively inspecting documents. |
| `NEEDS_CORRECTION`| Super Admin | Clarification or document re-upload requested with detailed field-specific notes. |
| `APPROVED` | Super Admin | Legal and clinical compliance confirmed; tenant activated for branch & doctor setup. |
| `REJECTED` | Super Admin | Registration denied due to invalid credentials or regulatory non-compliance. |
| `SUSPENDED` | Super Admin | Facility operations halted due to audit issues, license expiration, or complaints. |

---

### 4. Transition Rules & API Endpoints

1. **Start Review (`POST /api/v1/admin/clinics/<id>/review`):**
   - Pre-condition: Current status must be `SUBMITTED`, `PENDING`, or `DRAFT`.
   - Post-condition: Transitions to `UNDER_REVIEW`. Logs admin notes.
2. **Approve Clinic (`POST /api/v1/admin/clinics/<id>/approve`):**
   - Pre-condition: Current status must be `SUBMITTED`, `UNDER_REVIEW`, or `NEEDS_CORRECTION`.
   - Post-condition: Transitions to `APPROVED`, sets `is_active = True`, marks all attached documents `VERIFIED`. Dispatches approval notification.
3. **Request Correction (`POST /api/v1/admin/clinics/<id>/request-correction`):**
   - Pre-condition: Valid comments (min 5 chars) and optional field name.
   - Post-condition: Transitions to `NEEDS_CORRECTION`, inserts `ClinicCorrectionRequest`. Dispatches notification to owner.
4. **Reject Clinic (`POST /api/v1/admin/clinics/<id>/reject`):**
   - Pre-condition: Mandatory clear legal/clinical rationale (min 5 chars).
   - Post-condition: Transitions to `REJECTED`, sets `rejection_reason`. Terminal state.
5. **Suspend Clinic (`POST /api/v1/admin/clinics/<id>/suspend`):**
   - Pre-condition: Clinic must be currently `APPROVED`. Mandatory suspension reason.
   - Post-condition: Transitions to `SUSPENDED`, sets `is_active = False`.
6. **Reactivate Clinic (`POST /api/v1/admin/clinics/<id>/reactivate`):**
   - Pre-condition: Clinic must be currently `SUSPENDED`.
   - Post-condition: Restores status to `APPROVED`, sets `is_active = True`.

