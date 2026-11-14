# Smart Clinic OS — Phase 6 Privacy & Regulatory Compliance Review
## Compliance with DPDP Act 2023, IT Act 2000 & NMC Guidelines

---

## 1. Digital Personal Data Protection Act (DPDP Act) 2023

1. **Purpose Limitation:** Patient health records and diagnostic documents are processed solely for clinical consultation and continuous outpatient care.
2. **Explicit Consent & Revocability:** Cross-clinic record sharing is strictly opt-in via `RecordSharingConsent`. Patients can revoke consent at any time from their mobile app.
3. **Data Principal Rights:** Patients can download, review, and request copies of their full health records (Prescriptions, Lab Reports, Timeline).
4. **Data Minimization in Public QR Codes:** Public QR codes on prescriptions resolve only to doctor registration credentials and verification status, revealing zero diagnostic or medication details to unauthorized third parties.

---

## 2. National Medical Commission (NMC) & Telemedicine Guidelines

1. **Doctor Identification:** Every prescription displays the Doctor's Full Name, Medical Registration Number, State/National Medical Council, and Clinic Branch.
2. **Format of Prescription:** Includes structured sections for Chief Complaints, Examination Findings, Provisional/Confirmed Diagnosis, Medication Salt & Dosage, Food Timing, and Next Review Date.
3. **Audit Trail:** Any voiding or replacement requires a documented rationale preserved in the database audit log.

