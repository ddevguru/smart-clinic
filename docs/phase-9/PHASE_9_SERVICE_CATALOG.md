# PHASE 9 — HEALTHCARE SERVICE CATALOG SPECIFICATION

## 1. Healthcare Service Categories

The marketplace organizes home medical services into 6 distinct clinical categories:

| Category Code | Display Name | Standard Clinical Scope | Provider Types |
| :--- | :--- | :--- | :--- |
| `DOCTOR_VISIT` | Doctor Home Visit | Bedside consultation, geriatric evaluation, physical examination, prescription issuance. | General Physician, Geriatrician, MD |
| `NURSING` | Nursing Services | IV infusion, IM injections, catheterization, sterile dressing, vital monitoring. | Registered Nurse (RN), GNM, B.Sc Nursing |
| `PHYSIOTHERAPY` | Physiotherapy & Rehab | Orthopedic rehab, stroke recovery, mobility training, post-fracture recovery. | Bachelor of Physiotherapy (BPT), MPT |
| `ELDERLY_CARE` | Elderly Care & Assistance | Attendant care, medication reminders, hygiene support, daily living assistance. | Trained Healthcare Attendant / Caregiver |
| `SAMPLE_COLLECTION` | Diagnostic Sample Collection | Phlebotomy, blood draw, urine/swab collection, cold-chain transport. | Certified Phlebotomist / DMLT |
| `POST_OPERATIVE` | Post-operative Recovery | Suture/staple removal, wound healing checks, infection surveillance. | Surgeon / Clinical Nurse Specialist |

---

## 2. Seeded Catalog Services

Every service is cataloged with an Indian GST Services Accounting Code (SAC), standard duration, and base price:

```json
[
  {
    "code": "DOC_GEN_CONSULT",
    "name": "General Physician Home Consultation",
    "category": "DOCTOR_VISIT",
    "sac_code": "999312",
    "base_price": 1200.00,
    "default_duration_minutes": 45,
    "description": "Comprehensive bedside medical examination and treatment planning."
  },
  {
    "code": "DOC_GERIATRIC_VISIT",
    "name": "Geriatric Specialist Doctor Visit",
    "category": "DOCTOR_VISIT",
    "sac_code": "999312",
    "base_price": 1800.00,
    "default_duration_minutes": 60,
    "description": "Specialized assessment for elderly patients with chronic comorbidities."
  },
  {
    "code": "NURSE_WOUND_DRESSING",
    "name": "Sterile Wound Dressing & Suture Care",
    "category": "NURSING",
    "sac_code": "999312",
    "base_price": 650.00,
    "default_duration_minutes": 45,
    "description": "Antiseptic cleansing, suture inspection, and sterile dressing."
  },
  {
    "code": "NURSE_IV_INJECTION",
    "name": "Injection & IV Infusion Administration",
    "category": "NURSING",
    "sac_code": "999312",
    "base_price": 550.00,
    "default_duration_minutes": 30,
    "description": "Administration of doctor-prescribed intramuscular or intravenous medications."
  },
  {
    "code": "PHYSIO_ORTHO_REHAB",
    "name": "Post-Op Orthopedic Rehabilitation",
    "category": "PHYSIOTHERAPY",
    "sac_code": "999312",
    "base_price": 900.00,
    "default_duration_minutes": 50,
    "description": "Manual therapy, joint mobilization, and guided functional exercise."
  },
  {
    "code": "CARE_DAILY_4HR",
    "name": "Attendant Care & Daily Living Support (4 Hours)",
    "category": "ELDERLY_CARE",
    "sac_code": "999312",
    "base_price": 1200.00,
    "default_duration_minutes": 240,
    "description": "Support for bathing, feeding, ambulation, and vitals recording."
  },
  {
    "code": "LAB_SAMPLE_BLOOD",
    "name": "Home Phlebotomy & Blood Sample Draw",
    "category": "SAMPLE_COLLECTION",
    "sac_code": "999312",
    "base_price": 350.00,
    "default_duration_minutes": 25,
    "description": "Hygienic blood sample collection and prompt lab courier dispatch."
  }
]
```

---

## 3. Custom Pricing Override Model

Providers or affiliated clinics may set custom prices in `provider_services`. When calculating booking totals, the system applies the custom price if present:
$$\text{Effective Service Price} = \text{COALESCE}(\text{custom\_price}, \text{base\_price})$$

