# Smart Clinic OS — Role-Based Access Control (RBAC) & Permission Matrix

**Document ID:** SCO-P1-RBAC-001  
**Version:** 1.0.0 (Phase 1 Baseline)  
**Standard:** NIST Role-Based Access Control (RBAC) Level 2  

---

## 1. System Role Definitions

| Role Identifier | Description | Tenancy Scope |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Platform operator with governance, clinic licensing audit, and compliance authority. | Platform-Wide (Cross-Tenant) |
| **`CLINIC_OWNER`** | Medical director or commercial owner of a specific clinic facility. | Clinic-Scoped |
| **`DOCTOR`** | Licensed medical practitioner authorized to examine patients and sign digital prescriptions. | Clinic-Scoped |
| **`RECEPTIONIST`** | Front-desk desk staff managing queues, walk-ins, check-ins, and point-of-sale collections. | Clinic-Scoped |
| **`PATIENT`** | Patient seeking care, booking consultations, and accessing personal health vaults. | Personal / Family |
| **`HEALTHCARE_PROVIDER`** | Independent registered nurse, physiotherapist, or home care clinician. | Gig / Marketplace |

---

## 2. Granular Permissions Catalog

| Permission Code | Category | Action Permitted |
| :--- | :--- | :--- |
| `clinic.view` | Clinic Profile | Read clinic hours, facilities, and contact details |
| `clinic.update` | Clinic Profile | Modify clinic address, fees, operating rules |
| `clinic.delete` | Clinic Profile | Decommission or deactivate clinic tenant |
| `staff.view` | Staff & HR | Enumerate clinic staff roster and memberships |
| `staff.manage` | Staff & HR | Add, invite, update roles, or suspend staff members |
| `patient.view` | Patient Data | Access patient demographics and medical summary |
| `patient.create` | Patient Data | Register new walk-in or online patient |
| `patient.update` | Patient Data | Update patient profile and emergency contacts |
| `appointment.view` | Appointments | View appointment schedules and calendar bookings |
| `appointment.create` | Appointments | Reserve appointment slot or issue queue token |
| `appointment.update` | Appointments | Reschedule, cancel, or mark patient attendance |
| `queue.manage` | Live Queue | Call next patient, mark in-cabin, or trigger emergency priority |
| `consultation.view` | Clinical Care | Read past consultation notes and clinical history |
| `consultation.create` | Clinical Care | Document examination vitals, chief complaints, diagnosis |
| `prescription.create` | Clinical Care | Draft medications, dosages, frequency, and instructions |
| `prescription.publish` | Clinical Care | Cryptographically sign and publish legally binding prescription |
| `billing.view` | Financials | Inspect daily cash/UPI collection ledgers and invoices |
| `billing.manage` | Financials | Issue GST receipts, record refunds, reconcile POS |
| `subscription.manage` | SaaS Billing | Upgrade, renew, or modify clinic SaaS subscription |
| `platform.clinics.verify` | Platform Admin | Approve or reject Clinical Establishments Act licenses |
| `platform.doctors.verify` | Platform Admin | Verify State Medical Council / NMC credentials |
| `platform.audit.view` | Governance | Query immutable platform audit trails |

---

## 3. Role-to-Permission Mapping Matrix

| Permission Code | SUPER_ADMIN | CLINIC_OWNER | DOCTOR | RECEPTIONIST | PATIENT | HEALTHCARE_PROVIDER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clinic.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `clinic.update` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `clinic.delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `staff.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `staff.manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `patient.view` | ❌ (Anonymized) | ✅ | ✅ | ✅ | Own Only | Service Only |
| `patient.create` | ❌ | ❌ | ❌ | ✅ | Own Family | ❌ |
| `patient.update` | ❌ | ❌ | ❌ | ✅ | Own Family | ❌ |
| `appointment.view` | ❌ | ✅ | ✅ | ✅ | Own Only | Assigned Only |
| `appointment.create` | ❌ | ❌ | ❌ | ✅ | Own Only | ❌ |
| `appointment.update` | ❌ | ❌ | ✅ | ✅ | Own Only | ❌ |
| `queue.manage` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `consultation.view` | ❌ | ❌ | ✅ | ❌ | Own Only | ❌ |
| `consultation.create` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `prescription.create` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `prescription.publish` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `billing.view` | ❌ | ✅ | ❌ | ✅ | Own Receipts | Payout Ledger |
| `billing.manage` | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `subscription.manage` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `platform.clinics.verify`| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `platform.doctors.verify`| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `platform.audit.view` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

