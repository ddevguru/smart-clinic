# Smart Clinic OS — Phase 4 API Documentation

All endpoints require standard Bearer JWT authentication:  
`Authorization: Bearer <access_token>`  
and tenant clinic isolation header:  
`X-Clinic-ID: <clinic_uuid>`

---

### 1. Slot Availability & Booking Endpoints

#### `GET /api/v1/clinic/queue/slots`
Returns available, booked, and break slots for a doctor, branch, and date.
- **Required Permission**: `appointment.view`
- **Query Parameters**:
  - `branch_id`: UUID
  - `doctor_id`: UUID
  - `date`: YYYY-MM-DD
- **Response**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "start_time": "09:00",
        "end_time": "09:15",
        "duration_minutes": 15,
        "is_available": true,
        "reason": null
      },
      {
        "start_time": "11:00",
        "end_time": "11:15",
        "duration_minutes": 15,
        "is_available": false,
        "reason": "BREAK"
      }
    ]
  }
  ```

#### `POST /api/v1/clinic/queue/book-slot`
Books a fixed consultation slot with concurrency validation.
- **Required Permission**: `appointment.create`
- **Request Body**:
  ```json
  {
    "patient_id": "uuid",
    "doctor_id": "uuid",
    "branch_id": "uuid",
    "appointment_date": "2026-11-12",
    "appointment_time": "10:15",
    "duration_minutes": 15,
    "consultation_fee": 500.0,
    "appointment_notes": "Routine Checkup"
  }
  ```
- **Response Code**: `201 Created` (or `409 Conflict` if slot already booked)

---

### 2. Live Queue & Walk-In Registration

#### `POST /api/v1/clinic/queue/walk-in`
Receptionist walk-in patient registration directly into active queue.
- **Required Permission**: `appointment.create`
- **Request Body**:
  ```json
  {
    "patient_id": "uuid",
    "doctor_id": "uuid",
    "branch_id": "uuid",
    "priority_flag": false,
    "priority_reason": "",
    "consultation_fee": 500.0,
    "notes": "Walk-in entry"
  }
  ```
- **Response Code**: `201 Created`
  ```json
  {
    "status": "success",
    "data": {
      "id": "uuid",
      "token_number": "A001",
      "token_sequence": 1,
      "booking_source": "WALK_IN",
      "queue_status": "WAITING",
      "estimated_wait_minutes": 0
    }
  }
  ```

#### `POST /api/v1/clinic/queue/join-live`
Remote live queue entry.
- **Required Permission**: `appointment.create`
- **Response Code**: `201 Created`

---

### 3. Queue Progression & Doctor Controls

#### `GET /api/v1/clinic/queue/live`
Retrieves live queue summary, active consultation, waiting count, and tickets.
- **Required Permission**: `appointment.view`
- **Query Parameters**: `branch_id`, `doctor_id`, `date` (optional, defaults to today)

#### `POST /api/v1/clinic/queue/call-next`
Calls next patient in queue.
- **Required Permission**: `queue.manage`
- **Request Body**: `{"session_id": "uuid"}`

#### `POST /api/v1/clinic/queue/entries/{entry_id}/start`
Doctor begins consultation.
- **Required Permission**: `queue.manage` (Doctor role required; receptionist forbidden)

#### `POST /api/v1/clinic/queue/entries/{entry_id}/complete`
Doctor completes consultation.
- **Required Permission**: `queue.manage` (Doctor role required; receptionist forbidden)

#### `POST /api/v1/clinic/queue/entries/{entry_id}/skip`
Skips called patient.
- **Request Body**: `{"reason": "Patient not in waiting room"}`

#### `POST /api/v1/clinic/queue/entries/{entry_id}/recall`
Recalls skipped patient back into consultation.

#### `POST /api/v1/clinic/queue/entries/{entry_id}/hold`
Places patient on hold (e.g. awaiting diagnostic tests).
- **Request Body**: `{"reason": "Sent for blood tests"}`

#### `POST /api/v1/clinic/queue/entries/{entry_id}/resume`
Resumes patient from on-hold back to waiting queue.

#### `POST /api/v1/clinic/queue/entries/{entry_id}/cancel`
Cancels queue ticket.
- **Request Body**: `{"reason": "Patient had to leave"}`

#### `POST /api/v1/clinic/queue/entries/{entry_id}/priority`
Sets or removes priority flag.
- **Request Body**: `{"priority_flag": true, "reason": "Elderly patient with high fever"}`

#### `POST /api/v1/clinic/queue/sessions/{session_id}/pause`
Pauses queue progression and freezes wait estimations.
- **Request Body**: `{"reason": "Doctor in emergency ward"}`

#### `POST /api/v1/clinic/queue/sessions/{session_id}/resume`
Resumes active queue and updates estimations.

