# Smart Clinic OS — Phase 3 Complete API Documentation
**Phase 3 Deliverable • Indian Healthcare SaaS Platform**

---

## 1. Overview & Authentication Standards

All Phase 3 endpoints are exposed under `/api/v1/clinic/...` and require:
1. `Authorization: Bearer <access_token>` header.
2. Tenant context resolution via:
   - Header: `X-Clinic-ID: <clinic_uuid>` (Preferred)
   - Route argument: `/clinics/<clinic_id>/...`
   - Query parameter: `?clinic_id=<clinic_uuid>`

Standard JSON responses follow the platform envelope:
```json
{
  "success": true,
  "message": "Human readable status",
  "data": { ... },
  "request_id": "req-...",
  "timestamp": "2026-11-11T..."
}
```

---

## 2. Clinic Operations & Dashboards (`/api/v1/clinic/...`)

### `GET /api/v1/clinic/dashboard/overview`
- **Description:** Clinic Owner executive analytics (revenue, visit funnel, doctor counts, 7-day trend).
- **Permission:** `clinic.view`
- **Response:** Object with `metrics`, `status_distribution`, `source_distribution`, `weekly_trend`, `recent_appointments`.

### `GET /api/v1/clinic/dashboard/receptionist`
- **Description:** Front desk waiting room queue, today's schedule, cash collections, and recent patient registrations.
- **Permission:** `appointment.view`
- **Response:** Object with `metrics`, `checked_in_queue`, `upcoming_appointments`, `completed_appointments`, `recent_patients`.

### `GET /api/v1/clinic/dashboard/doctor`
- **Description:** Doctor OPD clinical workspace with waiting queue for assigned doctor.
- **Parameters:** `doctor_id` (optional UUID, defaults to authenticated user's profile).
- **Permission:** `appointment.view`
- **Response:** Object with `doctor_profile`, `metrics`, `waiting_queue`, `completed_consultations`, `upcoming_schedule`.

### `GET /api/v1/clinic/profile`
- **Description:** Clinic operational profile and address metadata.
- **Permission:** `clinic.view`

### `PATCH /api/v1/clinic/profile`
- **Description:** Update clinic contact details, address, or registration number.
- **Permission:** `clinic.update`

---

## 3. Patient Management (`/api/v1/clinic/patients`)

### `POST /api/v1/clinic/patients`
- **Description:** Register a new patient in the clinic directory.
- **Permission:** `patient.create`
- **Request Body:**
  ```json
  {
    "full_name": "Arjun Singhania",
    "phone_number": "+919845112233",
    "gender": "MALE",
    "date_of_birth": "1990-04-12",
    "blood_group": "O+",
    "address": "Indiranagar, Bengaluru",
    "allergies": "Sulfa drugs",
    "chronic_conditions": "Mild Hypertension"
  }
  ```
- **Responses:**
  - `201 Created`: Patient registered.
  - `409 Conflict`: Phone number already registered in this clinic.

### `GET /api/v1/clinic/patients`
- **Description:** Paginated search in patient directory.
- **Parameters:** `query` (search name/phone), `page` (default 1), `page_size` (default 20).
- **Permission:** `patient.view`

### `GET /api/v1/clinic/patients/<id>`
- **Description:** Get full patient profile and consultation visit history.
- **Permission:** `patient.view`

### `GET /api/v1/clinic/patients/<id>/medical-summary`
- **Description:** Medical summary (blood group, allergies, conditions, visit count).
- **Permission:** `patient.view`

---

## 4. Appointments & Walk-Ins (`/api/v1/clinic/appointments`, `/api/v1/clinic/walk-ins`)

### `POST /api/v1/clinic/appointments`
- **Description:** Schedule a consultation appointment.
- **Permission:** `appointment.create`
- **Request Body:**
  ```json
  {
    "patient_id": "uuid",
    "doctor_id": "uuid",
    "branch_id": "uuid",
    "appointment_date": "2026-11-12",
    "appointment_time": "10:30",
    "appointment_source": "PHONE",
    "consultation_fee": 600.0,
    "appointment_notes": "Routine checkup"
  }
  ```
- **Responses:**
  - `201 Created`: Scheduled.
  - `409 Conflict`: Doctor already has an active appointment at that slot.

### `POST /api/v1/clinic/walk-ins`
- **Description:** Rapid front-desk walk-in registration with auto check-in.
- **Permission:** `appointment.create`
- **Request Body:**
  ```json
  {
    "full_name": "Deepak Walkin Patient",
    "phone_number": "+919777888999",
    "gender": "MALE",
    "doctor_id": "uuid",
    "branch_id": "uuid",
    "consultation_fee": 600.0,
    "appointment_notes": "Walk-in fever"
  }
  ```
- **Responses:**
  - `201 Created`: Patient created/resolved, appointment created with status `CHECKED_IN`.

### `POST /api/v1/clinic/appointments/<id>/check-in`
- **Description:** Receptionist marks scheduled patient checked in.
- **Permission:** `appointment.update`

### `POST /api/v1/clinic/appointments/<id>/complete`
- **Description:** Doctor completes consultation visit.
- **Permission:** `appointment.update` or `consultation.create`

### `POST /api/v1/clinic/appointments/<id>/cancel`
- **Description:** Cancel appointment with mandatory reason.
- **Permission:** `appointment.update`
- **Request Body:** `{"reason": "Patient requested cancellation"}`

### `GET /api/v1/clinic/appointments/<id>/notes`
- **Description:** Doctor retrieves consultation notes draft.
- **Permission:** `consultation.view`

### `PUT /api/v1/clinic/appointments/<id>/notes`
- **Description:** Doctor updates clinical notes, symptoms, and provisional diagnosis.
- **Permission:** `consultation.create`
- **Request Body:**
  ```json
  {
    "symptoms": "High grade fever 102F...",
    "clinical_notes": "Pharyngeal congestion...",
    "diagnosis": "Acute Pharyngitis (ICD-10: J02.9)",
    "follow_up_advice": "Adequate hydration..."
  }
  ```

---

## 5. Billing & Receipts (`/api/v1/clinic/payments`)

### `POST /api/v1/clinic/payments`
- **Description:** Record consultation payment and generate digital receipt.
- **Permission:** `billing.manage`
- **Request Body:**
  ```json
  {
    "patient_id": "uuid",
    "appointment_id": "uuid",
    "amount": 600.0,
    "payment_method": "UPI",
    "payment_reference": "UPI-REF-202611-9876",
    "notes": "Consultation OPD Fee"
  }
  ```

### `GET /api/v1/clinic/payments`
- **Description:** List clinic payments with date, status, and method filters.
- **Permission:** `billing.view`

### `GET /api/v1/clinic/payments/<id>/receipt`
- **Description:** Printable receipt data including clinic, patient, and doctor details.
- **Permission:** `billing.view`

### `POST /api/v1/clinic/payments/<id>/adjustments`
- **Description:** Issue refund or accounting discount adjustment.
- **Permission:** `billing.manage`
- **Request Body:**
  ```json
  {
    "adjustment_type": "REFUND",
    "adjustment_amount": 200.0,
    "reason": "Senior citizen discount applied"
  }
  ```

