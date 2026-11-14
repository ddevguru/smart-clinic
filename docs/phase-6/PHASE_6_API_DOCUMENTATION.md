# Smart Clinic OS — Phase 6 API Documentation
## Digital Prescriptions & Electronic Health Records (EHR)

**Base URL:** `/api/v1`  
**Authentication:** Bearer JWT in `Authorization` header  
**Tenant Context:** `X-Clinic-ID` header required for clinic staff endpoints

---

## 1. Clinic EHR Endpoints (Doctor & Clinic Staff)

### 1.1 Create Prescription Draft
- **Endpoint:** `POST /clinic/ehr/prescriptions`
- **Required Permission:** `consultation.create` (Doctor only)
- **Request Body:**
```json
{
  "patient_id": "UUID",
  "appointment_id": "UUID",
  "chief_complaints": "Dry cough and fever for 3 days",
  "examination_findings": "Throat congested, Temp 100.2F",
  "diagnosis": "Acute Upper Respiratory Tract Infection",
  "diagnosis_type": "PROVISIONAL",
  "treatment_plan": "Hydration, antipyretics",
  "advice_and_precautions": "Avoid cold beverages, warm saline gargles",
  "follow_up_date": "2026-11-16",
  "follow_up_instructions": "Review if fever persists",
  "medications": [
    {
      "medicine_name": "Paracetamol 650mg",
      "generic_name": "Paracetamol",
      "dosage": "1 tablet",
      "route": "ORAL",
      "frequency": "1-0-1",
      "duration": "3 days",
      "food_instructions": "AFTER_FOOD"
    }
  ]
}
```
- **Response (201 Created):** Returns prescription object with `status: "DRAFT"` and generated `prescription_number`.

### 1.2 Update Prescription Draft
- **Endpoint:** `PATCH /clinic/ehr/prescriptions/<uuid:id>`
- **Required Permission:** `consultation.create` (Doctor only)
- **Rules:** Cannot modify prescriptions in `FINALIZED`, `PUBLISHED`, or `VOIDED` states (returns HTTP 400).

### 1.3 Finalize & Digitally Sign Prescription
- **Endpoint:** `POST /clinic/ehr/prescriptions/<uuid:id>/finalize`
- **Required Permission:** `consultation.create` (Doctor only)
- **Request Body:** `{"publish": true}`
- **Operation:**
  1. Sets status to `FINALIZED` (or `PUBLISHED` if publish=true).
  2. Generates vector A4 PDF with doctor registration credentials and verification QR.
  3. Computes and saves SHA-256 checksum.
  4. Locks version content permanently.

### 1.4 Create Corrected Version (v2+)
- **Endpoint:** `POST /clinic/ehr/prescriptions/<uuid:id>/correction`
- **Required Permission:** `consultation.create` (Doctor only)
- **Request Body:** Requires `correction_reason` (string) along with updated medications and clinical findings.
- **Operation:** Increments `current_version_number`, sets old version `is_latest: false`, generates new PDF with version tag and checksum.

### 1.5 Void Prescription
- **Endpoint:** `POST /clinic/ehr/prescriptions/<uuid:id>/void`
- **Required Permission:** `consultation.create` (Doctor only)
- **Request Body:** Requires `void_reason` (string).
- **Operation:** Sets status to `VOIDED`. Marks QR verification invalid. Preserves historical audit records.

### 1.6 Download Prescription PDF
- **Endpoint:** `GET /clinic/ehr/prescriptions/<uuid:id>/pdf`
- **Headers:** `Authorization`, `X-Clinic-ID`
- **Response:** `200 OK`, `Content-Type: application/pdf`, `Content-Disposition: inline; filename="Prescription-RX-....pdf"`

---

## 2. Public Verification Endpoint (Privacy-Preserving QR)

### 2.1 Verify Prescription Authenticity
- **Endpoint:** `GET /discovery/verify-rx/<token>`
- **Authentication:** None (Public)
- **Privacy Guarantees:** DPDP Act & Medical Confidentiality compliant. Exposes zero private health info (no patient name, no diagnosis, no medications).
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "status": "PUBLISHED",
    "prescription_number": "RX-202611-0001",
    "version_number": 1,
    "doctor_name": "Dr. Vikram Sen",
    "medical_registration_number": "KMC-887766",
    "registration_council": "Karnataka Medical Council",
    "clinic_name": "Manipal Care Clinic",
    "issue_date": "2026-11-11",
    "checksum": "a8fbc892..."
  }
}
```

---

## 3. Patient Portal Mobile Endpoints

### 3.1 List Prescriptions
- **Endpoint:** `GET /patient/prescriptions`
- **Response:** List of published and historical prescriptions issued to the authenticated patient.

### 3.2 Patient PDF Download
- **Endpoint:** `GET /patient/prescriptions/<id>/pdf`
- **Response:** Signed vector PDF for patient mobile review and sharing.

### 3.3 Patient Health Timeline
- **Endpoint:** `GET /patient/timeline`
- **Response:** Chronological stream of encounters, diagnoses, and lab tests.

### 3.4 Patient Medical Documents
- **Endpoint:** `GET /patient/documents`
- **Endpoint:** `GET /patient/documents/<id>/download`
- **Response:** Lab reports and radiology documents uploaded by authorized clinics.

