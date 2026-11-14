# Smart Clinic OS — Phase 3 Implementation Plan
## Complete Clinic Management Web Application

---

### 1. Objective and Scope

Phase 3 implements the complete, production-grade **Clinic Management Web Application** of Smart Clinic OS. It bridges facility onboarding (Phase 2) and the real-time queue engine (Phase 4) by delivering dedicated, database-connected interfaces for the three daily operational roles:

1. **Clinic Owner:** Operational intelligence, financial metrics, branch management, doctor & staff oversight, and master schedules.
2. **Receptionist:** Patient registration, rapid search, basic slot appointment scheduling, walk-in registration, check-ins, payment collection, and receipts.
3. **Doctor:** Distraction-free clinical overview, assigned appointment timeline, authorized patient history access, and consultation workspace notes draft.

#### Scope Boundaries & Invariants:
- All features connect to real backend Flask APIs and PostgreSQL data. Zero mock/static dashboards.
- Role-based authorization enforced strictly at the database/JWT middleware level (`@require_tenant_membership`).
- Pure Mint/Teal healthcare design system (`#BFEDE5`, `#E5F7F3`, `#18A99A`, `#087F79`). Zero Tailwind CSS.
- Real-time WebSockets, dynamic live queues, traffic departure alerts, and payment gateways (Razorpay) belong strictly to Phase 4+.

---

### 2. Work Breakdown & Milestones

```
[Phase 3 Implementation Milestones]
 ├─ Milestone 1: Architectural Design & Implementation Documentation (Plan & Decisions)
 ├─ Milestone 2: Relational Schema Design & Alembic Migration (Patients, Appointments, Notes, Payments)
 ├─ Milestone 3: Patient Management Domain Module (Backend Services, Duplicate Prevention, Search)
 ├─ Milestone 4: Appointment & Walk-in Domain Module (Overlap Prevention, Status Transitions)
 ├─ Milestone 5: Consultation Notes & Medical Summary Module (Doctor Notes Draft, History)
 ├─ Milestone 6: Billing & Receipt Domain Module (Payment Collection, Receipts, Adjustments)
 ├─ Milestone 7: Clinic Analytics & Dashboard Services (Owner & Receptionist Metrics)
 ├─ Milestone 8: Centralized API Client & Frontend State Management
 ├─ Milestone 9: Clinic Owner Web Application Experience (KPIs, Profile, Branches, Doctors, Staff, Schedules)
 ├─ Milestone 10: Receptionist Web Application Experience (Patient Registry, Slot Booking, Walk-ins, Cash Desk)
 ├─ Milestone 11: Doctor Web Application Experience (Consultation Queue, Patient Dossier, Notes Studio)
 ├─ Milestone 12: Comprehensive Automated Test Suite (Pytest Unit/Integration/Security & Next.js Build)
 └─ Milestone 13: Documentation & Phase 3 Sign-Off
```

---

### 3. Detailed Milestone Specifications

#### Milestone 1: Architectural Design & Implementation Documentation
- Author `docs/phase-3/IMPLEMENTATION_PLAN.md` and `docs/phase-3/IMPLEMENTATION_DECISIONS.md`.
- Formalize role permission contracts, appointment state machine, and financial recording invariants.

#### Milestone 2: Relational Schema & Alembic Migration
- Define SQLAlchemy 2.0 models:
  - `Patient`: Clinic-scoped patient registry with normalized E.164 phone number, emergency contacts, medical history summaries.
  - `Appointment`: Clinical appointment records with branch, doctor, patient, date, time slot, source (`ONLINE`, `WALK_IN`, `PHONE`), and status.
  - `ConsultationNote`: Doctor clinical notes draft, symptoms, diagnosis summary, follow-up scheduling.
  - `PaymentRecord`: Consultation billing records, payment method (`CASH`, `UPI`, `CARD`, `OTHER`), receipt generation, and status.
  - `PaymentAdjustment`: Immutable financial adjustment and refund tracking.
- Generate and apply Alembic migration `xxxx_phase_3_clinic_management.py`.

#### Milestone 3: Patient Management Domain Module
- `POST /api/v1/clinic/patients`: Register patient. Normalizes phone to E.164. Rejects accidental duplicates within same clinic.
- `GET /api/v1/clinic/patients`: Searchable (name, phone), filterable, and paginated patient directory.
- `GET /api/v1/clinic/patients/<id>`: Full patient dossier with visit history.
- `PATCH /api/v1/clinic/patients/<id>`: Update contact, address, or emergency info.

#### Milestone 4: Appointment & Walk-In Scheduling Module
- `POST /api/v1/clinic/appointments`: Book appointment. Validates doctor branch assignment and enforces transactional overlap prevention.
- `GET /api/v1/clinic/appointments`: Filterable by date, doctor, branch, status, source.
- `GET /api/v1/clinic/appointments/<id>`: Detailed appointment view.
- `PATCH /api/v1/clinic/appointments/<id>`: Update appointment details.
- `POST /api/v1/clinic/appointments/<id>/check-in`: Mark patient as checked in (`CHECKED_IN`, sets `checked_in_at`).
- `POST /api/v1/clinic/appointments/<id>/complete`: Complete consultation (`COMPLETED`, sets `completed_at`).
- `POST /api/v1/clinic/appointments/<id>/cancel`: Cancel with mandatory cancellation reason.
- `POST /api/v1/clinic/walk-ins`: Instant walk-in registration combining patient search/creation and appointment creation with `source='WALK_IN'`.

#### Milestone 5: Consultation Notes Module
- `GET /api/v1/clinic/appointments/<id>/notes`: Fetch clinical notes draft. (Access-controlled to doctors & owners).
- `PUT /api/v1/clinic/appointments/<id>/notes`: Author or update consultation notes draft, symptoms, and diagnosis.
- `GET /api/v1/clinic/patients/<id>/medical-summary`: Authorized summary of previous consultations for doctor review.

#### Milestone 6: Billing & Receipts Module
- `POST /api/v1/clinic/payments`: Record consultation payment (`CASH`, `UPI`, `CARD`, `OTHER`), issue unique receipt number (`RCP-YYYYMM-XXXX`).
- `GET /api/v1/clinic/payments`: Payment ledger with date and method filters.
- `GET /api/v1/clinic/payments/<id>/receipt`: Printable digital receipt payload with clinic details and tax breakdown.
- `POST /api/v1/clinic/payments/<id>/adjustments`: Record financial correction or refund with mandatory audit reason.

#### Milestone 7: Clinic Analytics & Dashboard Services
- `GET /api/v1/clinic/dashboard/overview`: Real-time aggregated statistics for Clinic Owner.
- `GET /api/v1/clinic/dashboard/receptionist`: Operational snapshot for Receptionist (checked-in, waiting, today's collections).
- `GET /api/v1/clinic/dashboard/doctor`: Personalized schedule and patient queue for Doctor.

#### Milestone 8 to 11: Frontend Role-Tailored Applications
- Built using Next.js 14 App Router under `app/clinic/` and reusable modules in `components/clinic/`:
  - **Clinic Owner Portal:** KPI metrics, revenue cards, branch management, doctor roster, staff memberships, and operating schedules.
  - **Receptionist Portal:** Rapid walk-in modal, patient registration, slot booking modal, check-in action, and receipt generator.
  - **Doctor Portal:** Consultation queue, patient timeline, medical history drawer, and clinical notes editor.
  - **Clinic Switcher & Role Selector:** Allows multi-clinic practitioners or multi-role users to switch context cleanly.

#### Milestone 12 & 13: Testing & Completion Sign-Off
- Pytest test suite covering owner metrics, receptionist walk-ins, doctor workflows, appointment overlap prevention, and cross-tenant security.
- Next.js production build verification.
- Documentation suite in `docs/phase-3/` and updated master `README.md`.

