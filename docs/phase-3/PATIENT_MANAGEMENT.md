# Smart Clinic OS — Patient Management & Directory Architecture
**Phase 3 Deliverable • Indian Healthcare SaaS Platform**

---

## 1. Executive Summary & Regulatory Context

In India, healthcare applications must comply with the **Digital Personal Data Protection (DPDP) Act 2023** and medical ethics guidelines from the National Medical Commission (NMC).

Patient records in Smart Clinic OS are:
1. **Tenant-Scoped:** A patient registered at Clinic A does not have their medical profile exposed to Clinic B.
2. **Normalized Phone Scoping:** Mobile numbers are normalized to E.164 standard (`+91XXXXXXXXXX`) to prevent duplicate records caused by variations in dialing prefixes (`0`, `91`, bare 10-digit).
3. **Audit-Logged:** Every patient registration and contact update is recorded in the immutable audit trail.

---

## 2. Database Schema (`patients` table)

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key (v4) |
| `clinic_id` | `UUID` | FK `clinics.id` (CASCADE, indexed) |
| `full_name` | `VARCHAR(160)` | Patient's legal full name (not null) |
| `phone_number` | `VARCHAR(20)` | E.164 normalized mobile number (not null, indexed) |
| `email` | `VARCHAR(255)` | Optional email address |
| `gender` | `VARCHAR(16)` | `MALE`, `FEMALE`, `OTHER` |
| `date_of_birth` | `DATE` | Patient date of birth |
| `blood_group` | `VARCHAR(8)` | `A+`, `A-`, `B+`, `B-`, `O+`, `O-`, `AB+`, `AB-` |
| `address` | `TEXT` | Residential address |
| `emergency_contact_name` | `VARCHAR(160)` | Primary guardian / next of kin name |
| `emergency_contact_phone` | `VARCHAR(20)` | Guardian contact phone |
| `chronic_conditions` | `TEXT` | Pre-existing conditions (e.g. Hypertension, Asthma) |
| `allergies` | `TEXT` | Known drug/food allergies (e.g. Penicillin) |
| `registered_by_user_id` | `UUID` | FK `users.id` (Staff member who registered patient) |
| `is_active` | `BOOLEAN` | Active status flag (default `True`) |
| `created_at` | `TIMESTAMPTZ` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | Record update timestamp |

### Database Constraints:
- `uq_clinic_patient_phone`: `UNIQUE (clinic_id, phone_number)`
  Prevents duplicate patient profiles within the same clinic while allowing the same patient to legitimately register at independent clinics across town.

---

## 3. Patient APIs & Operations

### 3.1 Register Patient (`POST /api/v1/clinic/patients`)
- **Headers:** `X-Clinic-ID`, `Authorization: Bearer <jwt>`
- **Permission:** `patient.create` (Clinic Owner, Receptionist)
- **Validation:**
  - Validates and normalizes phone number to E.164 format via `normalize_phone_number()`.
  - Checks for existing patient with matching phone in this clinic.
  - Returns `409 Conflict` if duplicate detected with helpful error message.
  - Commits `Patient` record and logs `PATIENT_REGISTERED` audit event.

### 3.2 Search & List Patients (`GET /api/v1/clinic/patients`)
- **Permission:** `patient.view`
- **Query Parameters:**
  - `query`: Text string matched via `ILIKE` on `full_name` or `phone_number`.
  - `page`: Page index (default 1).
  - `page_size`: Items per page (default 20, max 100).
- **Output Envelope:** Paginated list of patients with total count and meta envelope.

### 3.3 Patient Profile (`GET /api/v1/clinic/patients/<id>`)
- Returns demographic details, address, registration timestamp, and complete consultation history for that patient within this clinic.

### 3.4 Patient Medical Summary (`GET /api/v1/clinic/patients/<id>/medical-summary`)
- Scoped medical view for clinical consultation:
  - Patient Full Name, Phone, Age, Gender.
  - Blood Group.
  - Allergies & Sensitivities.
  - Chronic Conditions.
  - Total Past Consultations Count.
  - Most recent past consultation notes and diagnoses.

