# Smart Clinic OS — Phase 3 Implementation Decisions

---

### Architectural Decisions & Design Rationale

This document records the architectural choices, data isolation strategies, and technical trade-offs adopted for Phase 3: Complete Clinic Management Web Application.

---

### 1. Unified Appointment Model for Scheduled and Walk-In Patients

#### Context
A major operational dilemma in Indian outpatient care is the disconnect between scheduled online appointments and spontaneous in-person walk-ins. In many systems, receptionists maintain physical register books for walk-ins while using a digital system for bookings, leading to double-booked doctors and chaotic waiting rooms.

#### Decision
- Both scheduled appointments and walk-in visits share the single `Appointment` database table.
- Distinguish the origin via `appointment_source`:
  - `ONLINE` (Pre-booked via patient app or web)
  - `WALK_IN` (Created directly at the clinic desk by receptionist)
  - `PHONE` (Telephonic booking registered by receptionist)
- Walk-in appointments immediately receive status `CHECKED_IN` and automatically capture `checked_in_at = utc_now()`.
- **Phase 4 Alignment:** Because walk-ins are first-class `Appointment` records, they seamlessly join the unified live queue in Phase 4 without schema refactoring or parallel queuing tables.

---

### 2. Transactional Appointment Overlap Prevention

#### Context
Doctors operate on fixed consultation durations (e.g. 15 or 20 minutes). Allowing concurrent active appointments for the same practitioner at the same time slot leads to patient dissatisfaction and provider burnout.

#### Decision
- Implement a transactional validation check in `AppointmentService.create_appointment`:
  ```sql
  SELECT id FROM appointments
  WHERE doctor_id = :doctor_id
    AND appointment_date = :appointment_date
    AND appointment_time = :appointment_time
    AND status NOT IN ('CANCELLED', 'NO_SHOW')
  FOR UPDATE;
  ```
- If an active appointment already exists at that exact time for that doctor, the system rejects the booking with `ConflictError (HTTP 409)`: *"Doctor already has an active appointment at this date and time."*

---

### 3. Patient Identity & Multi-Tenancy Boundary

#### Context
Patients frequently visit different unrelated clinics (e.g. Clinic A for dental care, Clinic B for pediatrics). Should patient records be global or tenant-scoped?

#### Decision
- `Patient` records in Phase 3 are clinic-scoped (`clinic_id` foreign key) to guarantee strict regulatory privacy under the Indian DPDP Act 2023. Clinic A cannot view patients or medical records registered by Clinic B without explicit consent.
- An optional `user_id` foreign key connects the local `Patient` record to the global platform `User` entity when the patient authenticates via their phone number.
- Receptionists can quickly search existing patients in their own clinic by phone number or name before creating a new record, preventing duplicate entries for the same patient within that facility.

---

### 4. Immutable Payment Records & Adjustments

#### Context
Healthcare financial accounting requires strict auditability. Allowing silent edits or direct deletions of payment records creates opportunities for employee fraud and violates GST invoicing rules.

#### Decision
- The `PaymentRecord` table is append-only for creation. Once recorded, the `amount` and `payment_method` cannot be modified.
- Every payment automatically generates a sequential, human-readable receipt number (`RCP-YYYYMM-XXXX`).
- Financial corrections, discounts, or refunds are handled through a dedicated `PaymentAdjustment` table with mandatory administrative rationale and actor tracking (`authorized_by_user_id`).
- When a full refund is processed, the parent payment record's `payment_status` transitions to `REFUNDED`.

---

### 5. Protected Consultation Notes & Role Separation

#### Context
Indian Telemedicine Practice Guidelines and DPDP Act standards dictate that clinical consultation notes, provisional diagnoses, and symptoms are confidential medical data accessible only to authorized healthcare practitioners.

#### Decision
- Clinical notes are stored in `ConsultationNote`, isolated from receptionist-facing administrative appointment data.
- Access to `GET /api/v1/clinic/appointments/<id>/notes` and `PUT .../notes` requires `consultation.view` and `consultation.create` permissions (granted to `DOCTOR` and `CLINIC_OWNER`).
- Receptionists accessing appointment details see only administrative operational fields (`patient_name`, `appointment_time`, `status`, `fee`, `checked_in_at`) and cannot read clinical notes.

---

### 6. Role-Based Navigation & Frontend Architecture

#### Context
A single web application serves Clinic Owners, Receptionists, and Doctors. However, their day-to-day UX requirements are fundamentally different:
- **Clinic Owner:** Executive analytics, staff permissions, facility expansion, revenue monitoring.
- **Receptionist:** High-speed keyboard navigation, quick search, walk-in registration, cash collection.
- **Doctor:** Quiet, distraction-free consultation room, quick patient timeline review, clinical notes drafting.

#### Decision
- Implement a unified Next.js App Router portal at `/clinic` that dynamically tailors its layout, sidebar navigation, and actions based on the active role (`CLINIC_OWNER`, `RECEPTIONIST`, `DOCTOR`).
- Users with multiple authorized clinic memberships or multi-role privileges (e.g. an Owner who is also a practicing Doctor) can switch contexts using a clean header selector without re-authenticating.
- All frontend interactions call centralized methods in `services/api.js` with comprehensive loading, error, and empty state handling.

