# Smart Clinic OS — Complete Software Requirements Specification (SRS)

**Document ID:** SCO-P0-DOC-002  
**Version:** 1.0.0 (Phase 0 Deliverable)  
**Standard:** IEEE 830-1998 / ISO/IEC/IEEE 29148:2018 Compliant  
**Target Systems:** Patient Mobile (Flutter), Clinic Web (Next.js), Super Admin (Next.js), Backend (Node.js/Express/PostgreSQL)  

---

## 1. Introduction

### 1.1 Purpose
This document provides the exhaustive Software Requirements Specification (SRS) for **Smart Clinic OS**. It formally specifies all functional capabilities, non-functional performance and security thresholds, role-based access rights, business logic invariants, and acceptance criteria required for enterprise-grade execution across the Indian healthcare market.

### 1.2 Scope
Smart Clinic OS covers outpatient scheduling, live queue virtualization, dynamic transit departure notification, electronic medical record management, clinical prescription authoring, clinic financial management, multi-branch chain administration, home healthcare gig dispatch, and platform-wide super administration.

---

## 2. Overall Description & Operational Model

### 2.1 User Classes & Permissions Matrix (RBAC)

Smart Clinic OS strictly enforces Role-Based Access Control (RBAC) across six primary actor classes:

| Capability / Resource | Patient | Receptionist | Doctor | Clinic Owner | Provider (Home) | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Search Clinics & Doctors** | Read | Read | Read | Read | Read | Read |
| **Book / Cancel Own Appointments** | Create / Update | Create / Update | Update | Read | None | Full Admin |
| **Walk-In Registration & Token Issue** | None | Create / Update | None | Read | None | None |
| **Live Queue View & Advance Token** | Read (Own token) | Full Control | Full Control | Read | None | Read |
| **Emergency Queue Override** | None | Create (With Reason) | Approve / Reject | Read | None | Audit Read |
| **Consultation & Prescription Write** | None | None | Create / Publish | None | None | None |
| **View Full Medical History** | Own / Family | Demographics Only | Patient in Session | Anonymized Stats | None | Anonymized Stats |
| **Billing & Cash / UPI Collection** | View / Pay | Create / Update | Read summary | Full Control | None | Audit Read |
| **Staff & Doctor Onboarding** | None | None | None | Full Control | None | Verify / Deactivate |
| **Home Care Gig Accept & Complete** | Request | None | None | None | Accept / Execute | Audit Read |
| **Platform Subscription & Plans** | None | None | None | Manage / Pay | None | Full Control |
| **System Audit Logs & Global Settings** | None | None | None | Branch Logs | None | Full Control |

---

## 3. Detailed Functional Requirements

### Module 3.1: Patient Identity & Profile Management
- **FR-PAT-01:** System shall authenticate patients via mobile phone number with SMS/WhatsApp OTP verification (6-digit, 120s TTL).
- **FR-PAT-02:** System shall allow a master patient account to create up to 8 linked family dependent profiles (e.g., child, parent, spouse) with date of birth, blood group, allergies, and chronic conditions.
- **FR-PAT-03:** System shall generate a unique 14-digit Smart Clinic Health ID (SCHID) for each patient, architecturally mappable to India's ABHA (Ayushman Bharat Health Account) standards.
- **FR-PAT-04:** Patient shall be able to grant or revoke time-bound digital consent for doctors to access past medical records (default: consultation duration + 24 hours).

### Module 3.2: Clinic & Doctor Discovery Engine
- **FR-DIS-01:** System shall provide geo-spatial search by GPS coordinates, pin code, specialty (e.g., Pediatrics, Dermatology), clinic name, or doctor name.
- **FR-DIS-02:** Search results shall display consultation fee, verified credentials (MCI/NMC registration number), distance in kilometers, current live queue wait time, next available slot, and patient ratings.
- **FR-DIS-03:** System shall present clinic profiles with branch locations, operating hours, photos, accepted payment methods (UPI/Cash/Card), parking availability, and wheelchair accessibility indicators.

### Module 3.3: Hybrid Appointment & Live Queue Engine
- **FR-QUE-01 (Dual Booking Modes):** System shall support both:
  1. *Fixed Slot Mode:* Specific 15/20/30-minute calendar slots.
  2. *Live Virtual Queue Mode:* Day-of token issuance where the patient joins the digital waiting list.
- **FR-QUE-02 (Walk-In Integration):** Receptionists can register walk-in patients in under 30 seconds; the system issues a physical/SMS token seamlessly interleaved into the unified queue schedule.
- **FR-QUE-03 (Token Invariants & Race Prevention):** Tokens must be strictly monotonic, unique per doctor per clinic per day (`TKN-001`, `TKN-002`). Concurrency locks (Redis Mutex) must prevent token collisions during simultaneous booking requests.
- **FR-QUE-04 (Dynamic Wait Time Recalculation):** System must recalculate estimated wait time ($\text{EWT}$) upon:
  - Doctor marking a consultation as complete or starting a new token.
  - Doctor entering a delay status (e.g., "Surgery / Emergency - delayed 20 min").
  - Token cancellation, patient no-show flag, or emergency token insertion.
  - Formula: $\text{EWT} = (\text{Queue Position Ahead} \times \text{Avg Doctor Consult Duration}) + \text{Doctor Drift Offset}$.
- **FR-QUE-05 (Emergency Priority Override):** Receptionist or Doctor may insert an Emergency Token (`TKN-EMG-01`) to the top of the queue. The system shall demand a mandatory clinical reason, log the authorizing staff ID, and instantly push real-time delay notifications to all downstream patients.
- **FR-QUE-06 (QR Code Self Check-In):** Clinics shall display dynamic QR codes at reception. Patients arriving physically scan the QR code via their app to transition their status from `BOOKED / TRAVELING` to `CHECKED_IN / AT_CLINIC`.

### Module 3.4: Doctor Consultation & Digital Prescription Studio
- **FR-CON-01:** Doctor dashboard shall display the active live queue, waiting room attendees, and consultation timer.
- **FR-CON-02:** System shall provide an interactive Consultation Workspace featuring:
  - Chief complaints with auto-complete.
  - Clinical vitals recording (BP, Pulse, SpO2, Temperature, Weight, BMI calculation).
  - Diagnosis with ICD-10 search and custom doctor favorites.
- **FR-CON-03 (Prescription Authoring):** Rapid prescription editor allowing drug search by generic or Indian brand name, auto-suggesting strength, form (Tablet, Syrup, Injection), frequency (1-0-1), timing (Before Food, After Food), duration (days), and special instructions in English or Hindi.
- **FR-CON-04 (Doctor Authentication & Publishing):** Prescriptions can only be legally published by a doctor with an active, verified medical council registration number. Upon final confirmation, the prescription is digitally signed, rendered into a tamper-evident PDF with clinic header, and instantly dispatched to the patient's mobile app and WhatsApp.
- **FR-CON-05 (Follow-Up Scheduling):** Doctor can set recommended follow-up date (e.g., "5 days"), which auto-generates a patient calendar reminder and reserves priority booking window.

### Module 3.5: Digital Health Records (EHR) & Lab OCR
- **FR-REC-01:** Centralized repository for patient prescriptions, doctor consultation summaries, external lab test PDFs, and imaging scans.
- **FR-REC-02:** System shall provide optical character recognition (OCR) and document indexing for uploaded lab test images, extracting key biomarkers (e.g., HbA1c, Fasting Blood Sugar, Hemoglobin) for health tracking trends.
- **FR-REC-03:** All medical records must be encrypted at rest (AES-256) and transmitted exclusively over TLS 1.3.

### Module 3.6: Smart Traffic & Departure Intelligence
- **FR-TRF-01:** Integration with Google Maps Routes API calculating real-time drive/transit duration from patient's current GPS location to the clinic.
- **FR-TRF-02 (Departure Alert):** System computes Optimal Departure Time:
  $$\text{Departure Time} = \text{Estimated Consultation Slot} - (\text{Transit Duration} + \text{Buffer Time [15 min]})$$
- **FR-TRF-03:** System triggers progressive push notifications:
  - *Prep Notice:* "Your turn is estimated in 45 minutes. Traffic to clinic is heavy (28 mins travel)."
  - *Leave Now Alert:* "Doctor is on schedule. Please depart now to arrive for Token #12 without waiting."
  - *Clinic Delay Alert:* "Doctor was called for an emergency. Your token time is pushed back by 25 mins. Please delay your departure."

### Module 3.7: Home Healthcare Marketplace
- **FR-HHC-01:** Patients can book verified home services: Doctor Home Visit, Registered Nurse (injection, IV, wound care, catheterization), Physiotherapist, Phlebotomist (home sample collection), and Elder Care.
- **FR-HHC-02:** Provider onboarding requires Aadhaar e-KYC, Nursing/Medical Council Registration certificate upload, background verification check, and bank account validation.
- **FR-HHC-03:** Geofenced gig matching: System notifies nearby verified providers within an 8km service radius. First qualified responder accepts the dispatch.
- **FR-HHC-04:** Live provider tracking on patient map with estimated arrival time, OTP verification upon arrival at patient residence, and digital clinical checklist completion.

### Module 3.8: SaaS Subscription & Clinic Financials
- **FR-SAS-01:** Support automated monthly/annual recurring subscription management via Razorpay Subscriptions / UPI Autopay.
- **FR-SAS-02:** Automatic tier enforcement: Starter (1 doctor, basic queue), Professional (5 doctors, traffic routes, WhatsApp), Enterprise (Multi-branch, custom analytics).
- **FR-SAS-03:** Clinic Point-of-Sale (POS) module: Generates GST-compliant itemized receipts for consultations, diagnostic procedures, and pharmacy items; supports Cash, UPI QR, and Card payments.

### Module 3.9: Super Admin Governance & Platform Operations
- **FR-ADM-01:** Global clinic and doctor verification workflow with approval/rejection audit trail.
- **FR-ADM-02:** Real-time platform metrics: Monthly Recurring Revenue (MRR), total active clinics, daily consultations, queue punctuality index, and provider payout ledgers.
- **FR-ADM-03:** Comprehensive immutable audit log capturing every administrative action, permission elevation, and data export.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance & Latency
- **NFR-PERF-01:** Mobile app initial cold launch time $\le 1.8$ seconds on standard 4G Android devices.
- **NFR-PERF-02:** Live queue updates dispatched to clients via WebSocket within $< 250$ milliseconds of queue state mutation.
- **NFR-PERF-03:** Search queries across 50,000+ doctors and clinics return results within $< 300$ milliseconds.
- **NFR-PERF-04:** Digital prescription PDF generation and delivery completed within $< 2$ seconds.

### 4.2 Scalability & Concurrency
- **NFR-SCAL-01:** Backend architected to support 250,000 daily active patients and 10,000 concurrent clinic desk sessions with horizontal pod auto-scaling.
- **NFR-SCAL-02:** Database connection pooling configured with PgBouncer supporting up to 5,000 transactions per second (TPS).

### 4.3 Security & Regulatory Compliance
- **NFR-SEC-01:** Compliance with India's Digital Personal Data Protection (DPDP) Act 2023, requiring explicit patient consent collection, purpose specification, and right-to-erasure workflows.
- **NFR-SEC-02:** End-to-end data encryption: AES-256 for all stored medical records and database volumes; TLS 1.3 for all data in transit.
- **NFR-SEC-03:** Strict multi-tenant isolation: Tenant ID (`clinic_id`) partition enforced on every query with PostgreSQL Row-Level Security (RLS) to ensure zero cross-clinic data leakage.
- **NFR-SEC-04:** OWASP Top 10 API Security compliance (rate limiting, parameterized queries, CORS isolation, JWT rotation with HttpOnly secure cookies).

### 4.4 Availability & Disaster Recovery
- **NFR-AVAIL-01:** 99.95% system uptime SLA during clinic operating hours (07:00 to 23:00 IST).
- **NFR-AVAIL-02:** Recovery Point Objective (RPO) $\le 5$ minutes; Recovery Time Objective (RTO) $\le 30$ minutes with automated multi-zone failover.

---

## 5. Verification & Acceptance Criteria Matrix

| Module | Verification Method | Acceptance Criteria |
| :--- | :--- | :--- |
| **Live Queue Engine** | Concurrency Load Test | 100 simultaneous bookings cannot yield duplicate token IDs. Tokens remain strictly chronological. |
| **Traffic Integration** | Mock Route Simulation | System recalculates departure time within 10s of route delay spike or doctor consultation extension. |
| **Prescription Studio** | Usability & Clinical Audit | Doctor creates, validates, signs, and dispatches a 4-drug prescription in $< 60$ seconds. |
| **Multi-Tenancy** | Penetration / Boundary Test | Clinic A administrator cannot read, update, or enumerate Clinic B patient or financial records under any payload. |
| **Mobile Responsiveness** | Device Emulation Testing | Patient screens render pixel-perfect across Android viewport sizes (360x640 to 412x915) adhering to Mint/Teal palette. |
