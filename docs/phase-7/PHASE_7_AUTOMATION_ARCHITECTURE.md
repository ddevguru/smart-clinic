# Phase 7 — Background Automation Architecture
## Job Scheduling, Dispatch Queues & Idempotency Engine

### 1. Architectural Design
The background automation architecture delivers resilient scheduled tasks without blocking Node.js event-loop threads.

```
+-----------------------------------------------------------+
|                   Background Scheduler                    |
|        (Cron / Node Worker / Celery / Redis Queue)        |
+-----------------------------------------------------------+
                             |
                             v
           +-----------------------------------+
           |    AutomationService Scan Job     |
           | (Appointment Reminders: 24h, 2h)  |
           +-----------------------------------+
                             |
                             v
       +-------------------------------------------+
       |       Idempotency Gate Check              |
       |  Key: reminder:appt:{id}:{interval_hours} |
       |  Table: automation_job_logs               |
       +-------------------------------------------+
            |                               |
       [Already Run]                  [New Trigger]
            |                               |
          Skip                 +------------------------+
                               | Dispatch Notification  |
                               | (SMS / WhatsApp / App) |
                               +------------------------+
                                            |
                                            v
                               +------------------------+
                               | Commit Record to       |
                               | automation_job_logs    |
                               +------------------------+
```

### 2. Idempotency Key Specification
To prevent duplicate SMS or WhatsApp messages when background cron jobs overlap:
- 24-hour reminder: `reminder:appt:<appointment_id>:24h`
- 2-hour reminder: `reminder:appt:<appointment_id>:2h`
- 30-minute reminder: `reminder:appt:<appointment_id>:30m`
- Token Called alert: `queue:token_called:<queue_entry_id>`
- Turn Approaching alert: `queue:turn_approaching:<queue_entry_id>`
- Doctor Delay alert: `delay:<event_id>:<patient_id>`

### 3. Settings Control by Clinic Owner
Each clinic maintains isolated settings in `automation_settings`:
- `reminders_enabled` (boolean)
- `reminder_intervals_hours` (integer array, e.g. `[24, 2, 0]`)
- `queue_alerts_enabled` (boolean)
- `turn_approaching_threshold` (number of patients ahead, e.g. 2)
- `delay_alerts_enabled` (boolean)
- `delay_threshold_minutes` (e.g. 15 minutes)
- `traffic_departure_enabled` (boolean)
- `default_arrival_buffer_minutes` (10–15 minutes)

