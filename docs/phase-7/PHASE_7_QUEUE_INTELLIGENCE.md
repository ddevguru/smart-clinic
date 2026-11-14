# Phase 7 — Queue Intelligence Engine
## Dynamic Waiting-Time & Expected Turn Estimation

### 1. Algorithm Overview
The Queue Intelligence Engine replaces static token multiplication ($N \times \text{fixed minutes}$) with an adaptive, multi-factor calculation model:

$$\text{Estimated Wait (minutes)} = (N \times \text{avg\_duration}) - \text{ongoing\_elapsed} + \text{doctor\_delay} + \text{pause\_offset}$$

Where:
- $N$: Number of patients ahead in the queue with active status (`WAITING` or `CALLED`).
- $\text{avg\_duration}$: Rolling average duration of the last 5 completed consultations for this doctor in the current session (default: 15 minutes if no historical completions exist).
- $\text{ongoing\_elapsed}$: Time elapsed since the currently active patient was marked `IN_CONSULTATION`. Capped at $1.5 \times \text{avg\_duration}$ to prevent negative wait anomalies.
- $\text{doctor\_delay}$: Operational delay reported by the doctor via the OPD portal.
- $\text{pause\_offset}$: Buffer if the doctor is on a temporary pause/break.

### 2. Confidence Indicator Model
Queue estimates carry a transparent confidence metric:

| Level | Criteria | Transparent User Reason |
| :--- | :--- | :--- |
| **HIGH** | Session is active, not paused, doctor on schedule, $\ge 3$ consultations completed today to establish rolling cadence. | "Calibrated with active doctor OPD pace & recent consultation durations." |
| **MEDIUM** | Session active, but doctor has completed $< 3$ patients today, or moderate queue variance detected. | "Estimated from baseline schedule. Calibrating with doctor pace." |
| **LOW** | Doctor has reported active operational delay, session is paused, or high cancellation rate. | "Doctor delayed or queue paused. Time subject to ongoing clinic procedures." |

### 3. Real-Time Recalibration
Whenever any of the following events occur, the backend triggers an automated recalibration:
- A patient is called (`queue.routes.js: /:id/call`).
- A consultation starts or completes (`queue.routes.js: /:id/complete`).
- Doctor broadcasts an operational delay (`automation.routes.js: /delay-alert`).
- Receptionist pauses or resumes queue session.

Recalibrated wait times are broadcast over WebSocket (`io.to('clinic:${clinicId}')`) to all connected dashboards and patient apps.

