# Smart Clinic OS — Phase 6 Database Schema Specification
## Electronic Health Records & Digital Prescriptions (EHR)

**Migration Version:** `8f1e3c2a4b5d`  
**Down Revision:** `0c2e95dfc72a` (Phase 4 Queue & Booking)

---

## 1. Entity Relationship Overview

```
                      +-------------------+
                      |      Clinics      |
                      +---------+---------+
                                |
             +------------------+------------------+
             |                                     |
+------------v------------+              +---------v---------+
|      Prescriptions      |              | Medical_Documents |
+------------+------------+              +---------+---------+
             |                                     |
+------------v------------+                        |
|  Prescription_Versions  |                        |
+------------+------------+                        |
             |                                     |
+------------v------------+              +---------v---------+
| Prescription_Medications|              | Follow_Up_Records |
+-------------------------+              +-------------------+
```

---

## 2. Table Definitions

### 2.1 `prescriptions`
Root container representing a prescription issued for an outpatient encounter.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `clinic_id` | UUID | FK -> clinics.id | Multi-tenant clinic scope |
| `appointment_id` | UUID | FK -> appointments.id | Linked consultation encounter |
| `patient_id` | UUID | FK -> patients.id | Recipient patient |
| `doctor_id` | UUID | FK -> doctor_profiles.id | Prescribing doctor |
| `prescription_number` | VARCHAR(64) | UNIQUE, NOT NULL | Sequential number (`RX-YYYYMM-XXXX`) |
| `status` | VARCHAR(32) | NOT NULL, DEFAULT 'DRAFT' | `DRAFT`, `FINALIZED`, `PUBLISHED`, `VOIDED` |
| `current_version_id` | UUID | NULLABLE | Pointer to latest active version |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Update timestamp |

### 2.2 `prescription_versions`
Immutable versioned snapshot of the prescription clinical content.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Version record ID |
| `prescription_id` | UUID | FK -> prescriptions.id | Parent prescription |
| `version_number` | INTEGER | NOT NULL | Version integer (1, 2, 3...) |
| `diagnosis` | VARCHAR(255) | NULLABLE | Clinical ICD or text diagnosis |
| `diagnosis_type` | VARCHAR(32) | NOT NULL | `PROVISIONAL` or `CONFIRMED` |
| `chief_complaints` | TEXT | NULLABLE | Patient symptoms reported |
| `clinical_history` | TEXT | NULLABLE | Relevant medical past history |
| `examination_findings` | TEXT | NULLABLE | Vitals and physical assessment |
| `treatment_plan` | TEXT | NULLABLE | Therapeutic strategy |
| `advice_and_precautions`| TEXT | NULLABLE | Dietary & lifestyle instructions |
| `follow_up_instructions`| TEXT | NULLABLE | Review trigger criteria |
| `follow_up_date` | DATE | NULLABLE | Recommended follow-up date |
| `correction_reason` | TEXT | NULLABLE | Mandatory for v > 1 |
| `void_reason` | TEXT | NULLABLE | Mandatory if status == 'VOIDED' |
| `pdf_storage_path` | VARCHAR(512) | NULLABLE | Path to generated vector PDF |
| `document_checksum` | VARCHAR(64) | NULLABLE | SHA-256 integrity hash of PDF |
| `verification_token` | VARCHAR(64) | UNIQUE | Public non-sensitive QR verification token |
| `is_latest` | BOOLEAN | NOT NULL, DEFAULT TRUE | Latest version indicator |
| `finalized_at` | TIMESTAMPTZ | NULLABLE | Digital signing timestamp |

### 2.3 `prescription_medications`
Structured drug items associated with a prescription version.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Medication entry ID |
| `version_id` | UUID | FK -> prescription_versions.id | Parent version |
| `medicine_name` | VARCHAR(255) | NOT NULL | Brand or common drug name |
| `generic_name` | VARCHAR(255) | NULLABLE | Active pharmacological salt |
| `dosage` | VARCHAR(64) | NOT NULL | Dose strength (e.g. 650mg, 1 tab) |
| `route` | VARCHAR(64) | NOT NULL | `ORAL`, `TOPICAL`, `INJECTION`, etc. |
| `frequency` | VARCHAR(64) | NOT NULL | Timing (`1-0-1`, `OD`, `SOS`, etc.) |
| `duration` | VARCHAR(64) | NOT NULL | Course length (`3 days`, `5 days`) |
| `food_instructions` | VARCHAR(64) | NOT NULL | `AFTER_FOOD`, `BEFORE_FOOD`, etc. |
| `additional_instructions` | TEXT | NULLABLE | Clinical notes for patient |

### 2.4 `patient_medical_profiles`
Persistent clinical record tracking allergies and baseline health facts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Profile ID |
| `clinic_id` | UUID | FK -> clinics.id | Tenant scope |
| `patient_id` | UUID | FK -> patients.id | Patient owner |
| `blood_group` | VARCHAR(16) | NULLABLE | ABO & Rh typing |
| `allergies` | TEXT | NULLABLE | Drug/Food allergy list |
| `chronic_conditions`| TEXT | NULLABLE | Long-term morbidities |
| `past_medical_history` | TEXT | NULLABLE | Prior hospitalizations/surgeries |
| `last_updated_by_doctor_id` | UUID | FK -> doctor_profiles.id | Attending updater |

### 2.5 `medical_documents`
Digital diagnostic and laboratory records.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Document ID |
| `clinic_id` | UUID | FK -> clinics.id | Tenant scope |
| `patient_id` | UUID | FK -> patients.id | Associated patient |
| `appointment_id` | UUID | FK -> appointments.id | Optional visit link |
| `title` | VARCHAR(255) | NOT NULL | Document title |
| `document_type` | VARCHAR(64) | NOT NULL | `LAB_REPORT`, `RADIOLOGY_SCAN`, etc. |
| `file_storage_path` | VARCHAR(512) | NOT NULL | Storage locator |
| `file_size_bytes` | BIGINT | NOT NULL | Size in bytes |
| `mime_type` | VARCHAR(128) | NOT NULL | MIME content type |
| `document_checksum` | VARCHAR(64) | NOT NULL | SHA-256 hash of file |
| `notes` | TEXT | NULLABLE | Clinical remarks |

