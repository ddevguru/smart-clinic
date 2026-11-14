# SMART CLINIC OS — PHASE 10 ABDM / ABHA INTEGRATION
## Ayushman Bharat Digital Mission (ABDM) Interoperability & FHIR R4 Profiles

### 1. National Health Authority (NHA) Architecture

Smart Clinic OS establishes the architectural foundations required for milestone compliance with the Ayushman Bharat Digital Mission (ABDM):

- **Milestone 1 (M1):** ABHA creation and verification.
- **Milestone 2 (M2):** Health Information Provider (HIP) — bundling clinical records as standardized FHIR R4 documents.
- **Milestone 3 (M3):** Health Information User (HIU) — managing consent artifacts and secure data exchange via ABDM Gateway.

---

### 2. ABHA Health ID Verification Flow

```
[Patient / Receptionist] 
       │
       ▼
POST /api/v1/abdm/verify-abha { abha_address: "patient@abdm" }
       │
       ▼
[ABDM Service Bridge]
       │
       ├── Validate syntax and domain (@abdm, @sbx)
       ├── Call NHA ABDM Gateway endpoint
       └── Return: { is_valid: true, abha_number: "91-XXXX-XXXX-XXXX", full_name: "..." }
```

---

### 3. FHIR R4 Clinical Document Profile

The `abdmService.buildFhirRecordBundle` transforms internal relational records into standard HL7 FHIR Release 4 JSON bundles:

```json
{
  "resourceType": "Bundle",
  "id": "bundle-uuid",
  "type": "document",
  "timestamp": "2026-11-13T06:00:00.000Z",
  "entry": [
    {
      "resource": {
        "resourceType": "Composition",
        "status": "final",
        "type": { "coding": [{ "system": "http://snomed.info/sct", "code": "371530004", "display": "Clinical consultation report" }] },
        "subject": { "reference": "Patient/uuid" },
        "author": [{ "reference": "Practitioner/uuid" }]
      }
    },
    {
      "resource": {
        "resourceType": "Patient",
        "id": "uuid",
        "name": [{ "text": "Patient Name" }],
        "gender": "male"
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "code": { "text": "Provisional URTI" }
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "medicationCodeableConcept": { "text": "Paracetamol 650mg" },
        "dosageInstruction": [{ "text": "1-0-1 after food for 5 days" }]
      }
    }
  ]
}
```

---

### 4. Consent Artifact Lifecycle

Consents follow the ABDM consent flow:
1. `REQUESTED`: HIU requests access to health data for a specified purpose (e.g., `CAREMGT`).
2. `GRANTED`: Patient authenticates via OTP / ABHA App and approves specific categories (`OPConsultation`, `DiagnosticReport`, `Prescription`).
3. `DENIED` / `REVOKED`: Patient can revoke consent at any time, instantly cutting off HIU data fetching.
4. `EXPIRED`: Time-bound validity automatically halts access after the designated expiration timestamp.

