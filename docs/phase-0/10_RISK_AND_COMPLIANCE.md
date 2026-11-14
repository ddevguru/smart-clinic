# Smart Clinic OS — Risk Assessment & Regulatory Compliance Framework

**Document ID:** SCO-P0-DOC-010  
**Version:** 1.0.0 (Phase 0 Deliverable)  
**Jurisdiction:** Republic of India  
**Applicable Statutes:** DPDP Act 2023, IT Act 2000 (Section 43A & 72A), Telemedicine Practice Guidelines 2020, Clinical Establishments Act 2010, NMC Code of Medical Ethics  

---

## 1. Regulatory & Legal Compliance Landscape

Operating a clinical SaaS and health data platform in India mandates adherence to a rapidly evolving regulatory matrix:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INDIAN REGULATORY MATRIX                        │
├──────────────────────────┬─────────────────────────┬───────────────────┤
│ STATUTE / FRAMEWORK      │ REGULATORY AUTHORITY    │ SCOPE OF AUDIT    │
├──────────────────────────┼─────────────────────────┼───────────────────┤
│ DPDP Act 2023            │ Data Protection Board   │ Consent, Privacy, │
│                          │ of India (DPBI)         │ Right to Erasure  │
├──────────────────────────┼─────────────────────────┼───────────────────┤
│ Telemedicine Guidelines  │ National Medical        │ Doctor Auth, Rx   │
│ 2020                     │ Commission (NMC)        │ Standards, Video  │
├──────────────────────────┼─────────────────────────┼───────────────────┤
│ Clinical Establishments  │ State Health Depts /    │ Clinic Licensing, │
│ Act 2010                 │ Ministry of Health      │ Minimum Standards │
├──────────────────────────┼─────────────────────────┼───────────────────┤
│ ABDM M1 / M2 / M3        │ National Health         │ ABHA Creation, PHR│
│ Specifications           │ Authority (NHA)         │ Health Information│
├──────────────────────────┼─────────────────────────┼───────────────────┤
│ Drugs & Cosmetics Act    │ CDSCO / State Drugs     │ Schedule H/H1/X   │
│ 1940                     │ Control                 │ Drug Restrictions │
└──────────────────────────┴─────────────────────────┴───────────────────┘
```

---

## 2. Risk Taxonomy & Mitigation Strategies

### 2.1 Healthcare Data Privacy & Security Risks

| Risk Identifier | Threat Scenario | Impact Severity | Probability | Mitigation Strategy & Invariants |
| :--- | :--- | :---: | :---: | :--- |
| **RSK-SEC-01: Multi-Tenant Data Bleed** | Clinic A receptionist queries patient records and inadvertently accesses medical histories belonging to Clinic B. | Critical | Low | PostgreSQL Row-Level Security (RLS) bound to session-level tenant UUID; automated tenant isolation unit tests executed on every CI/CD pull request. |
| **RSK-SEC-02: Prescription Data Tampering** | Patient alters antibiotic dosage or refills restricted medications by modifying a downloaded PDF. | High | Medium | Cryptographic SHA-256 digital signature embedded into PDF; public verification QR code pointing to tamper-evident server verification ledger. |
| **RSK-SEC-03: Unauthorized Medical Record Access** | Staff member snoops on celebrity or family member's clinical consultation notes. | High | Medium | Immutable audit logs recording every `SELECT` query on clinical files; strict role separation where receptionists can view demographics only, not clinical diagnoses. |
| **RSK-SEC-04: Data Sovereignty Violation** | Storing sensitive Indian health data in off-shore cloud regions. | High | Low | Architecture enforces all PostgreSQL, Redis, and S3 object storage buckets reside strictly in AWS Mumbai (`ap-south-1`) or GCP Delhi/Mumbai regions. |

---

### 2.2 Clinical Safety & Medical Liability Risks

| Risk Identifier | Threat Scenario | Impact Severity | Probability | Mitigation Strategy & Invariants |
| :--- | :--- | :---: | :---: | :--- |
| **RSK-CLN-01: Impersonation / Bogus Doctors** | Non-registered medical practitioner signs up, treats patients, and issues valid-looking digital prescriptions. | Critical | Low | Two-step manual and programmatic verification of State Medical Council / National Medical Commission (NMC) registration numbers before prescription publishing permission is granted. |
| **RSK-CLN-02: Unregulated Prescription of Prohibited Drugs** | Doctor attempts to prescribe Schedule X narcotics (e.g., Ketamine, Amphetamines) via teleconsultation or remote clinic workflow. | High | Low | Hard system block preventing Schedule X substances from being published digitally without in-person physical consultation validation flag, adhering to Telemedicine Guidelines 2020. |
| **RSK-CLN-03: Queue Emergency Mismanagement** | Critical emergency patient (e.g., myocardial infarction, severe respiratory trauma) is placed in normal OPD queue instead of immediate hospital triage. | Critical | Medium | Prominent Emergency Priority Override modal in Reception & Doctor dashboards with instant alert banner; in-app clinical warning urging transfer to tertiary emergency departments. |

---

### 2.3 Integration & Third-Party Dependency Risks

| Risk Identifier | Failure Mode | Impact Severity | Probability | Fallback / Redundancy Architecture |
| :--- | :--- | :---: | :---: | :--- |
| **RSK-INT-01: Google Maps Routes API Outage / Cost Spike** | Maps API rate limit exceeded or outage leaves departure intelligence blind. | Medium | Medium | Fallback to historical velocity tables and Haversine distance heuristics; cached route geohash cells to cap external API costs. |
| **RSK-INT-02: Telecom DLT SMS Gateway Delays** | Indian telecom TRAI DLT scrubbing delays OTP delivery beyond 120s timeout. | High | High | Dual-channel OTP dispatch (WhatsApp Business API priority with automated SMS fallback via alternate gateway like MSG91/Fast2SMS). |
| **RSK-INT-03: Razorpay Payment Gateway Downtime** | Patient or clinic unable to complete card/netbanking payments. | Medium | Medium | In-clinic payment engine natively supports Cash & Dynamic UPI QR codes (via NPCI direct intent links) which bypass payment aggregator downtime. |

---

## 3. Patient Consent & DPDP Act 2023 Compliance Architecture

Smart Clinic OS embeds a dedicated **Consent Management Service**:
1. **Notice & Purpose Specification:** Before any clinical data or family profile is created, the patient is presented with clear, multilingual notice (English, Hindi, regional languages) specifying exact purposes: Appointment scheduling, Clinical care, and Prescription delivery.
2. **Granular Consent:** Patient explicitly chooses whether to allow anonymized analytics or pharmacy fulfillment.
3. **Right to Withdraw & Data Erasure:** Patient can request account erasure; the platform retains statutory clinical records for the mandatory 7-year regulatory period in an encrypted cold archive while permanently scrubbing marketing and discovery identities.
4. **Data Protection Officer (DPO):** Platform establishes a designated DPO contact and grievance redressal workflow with mandatory 72-hour incident notification protocol to the Data Protection Board of India.
