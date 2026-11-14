# Smart Clinic OS — Privacy & Healthcare Regulatory Compliance

**Document ID:** `SCOS-P11-PRV-007`  
**Compliance Mandates:**
- Digital Personal Data Protection Act (DPDP Act, 2023 - India)
- Ayushman Bharat Digital Mission (ABDM) & ABHA Specifications
- National Medical Commission (NMC) Telemedicine Practice Guidelines
- Digital Information Security in Healthcare Act (DISHA Draft Standards)

---

## 1. Compliance Matrix

| Regulatory Requirement | Technical Implementation in Smart Clinic OS | Compliance Status |
| :--- | :--- | :---: |
| **Notice & Purpose Specification** | Patients receive clear notice during onboarding and record sharing stating the specific purpose, duration, and recipient of health records. | **COMPLIANT** |
| **Consent Management** | Dedicated `medical_record_shares` table with granular consent flags, expiry timestamps, and instant revocation via `DELETE /records/share/:id`. | **COMPLIANT** |
| **Right to Erasure / Revocation** | Patients can revoke access to shared health records at any time. Revoked tokens immediately block external access with HTTP 403. | **COMPLIANT** |
| **Data Minimization** | Receptionist dashboards are strictly restricted: receptionists cannot view clinical consultation notes or diagnostic summaries; only demographic and billing data is displayed. | **COMPLIANT** |
| **Audit Trails** | Every view, download, export, and modification of patient medical records is logged to `audit_logs` with actor ID, IP address, timestamp, and action code. | **COMPLIANT** |
| **ABHA Linking & FHIR R4** | Patients can link their 14-digit ABHA ID (`/abdm/verify-abha`). Medical records export in standardized FHIR R4 Document Bundle JSON. | **COMPLIANT** |
| **Telemedicine Clinical Safety** | Teleconsultation records store doctor registration numbers, prescription timestamps, and verification tokens required by NMC guidelines. | **COMPLIANT** |
| **AI Safety & Human Oversight** | AI clinical SOAP documentation is strictly advisory (DRAFT). The system prohibits autonomous prescribing; doctors must review and sign off before finalization. | **COMPLIANT** |
| **Emergency Triage Protocol** | Queries indicating medical emergencies (chest pain, severe dyspnea, acute trauma) bypass AI chat and trigger prominent National Emergency Helpline (112/108) instructions. | **COMPLIANT** |

---

## 2. Patient Data Access Control Hierarchy

```
[ Patient / Data Principal ]
         │
         ├── Owns Health Record Archive
         ├── Can share time-bound link (1 to 30 days)
         ├── Can revoke link instantly
         │
         ├──► [ Attending Doctor ]
         │        Full Clinical Access (SOAP notes, vitals, prescriptions, lab results)
         │
         ├──► [ Receptionist / Front Desk ]
         │        Demographics + Queue Token + Consultation Billing ONLY
         │        (Clinical history hidden)
         │
         ├──► [ Home Healthcare Provider ]
         │        Address + Scheduled Service + Vital Signs ONLY
         │
         └──► [ External Specialist (Shared Link) ]
                  Read-only view of approved categories until token expiry
```

