# Smart Clinic OS — REST API Specification

**Document ID:** SCO-P0-DOC-007  
**Version:** 1.0.0 (Phase 0 Deliverable)  
**Base URL:** `https://api.smartclinicos.in/api/v1`  
**Protocol:** HTTPS / TLS 1.3  
**Format:** JSON (`Content-Type: application/json`)  

---

## 1. Global Conventions & Standards

### 1.1 Authentication & Request Headers
All protected endpoints require Bearer JWT authentication:
```http
Authorization: Bearer <jwt_access_token>
X-Clinic-ID: <clinic_uuid>  # Required for Clinic Staff & Doctor endpoints
X-Request-ID: <uuidv4>       # Distributed tracing correlation ID
```

### 1.2 Unified Success & Error Envelope
All endpoints respond with a consistent response schema:

#### Success Response Envelope
```json
{
  "success": true,
  "timestamp": "2026-11-08T18:15:00.123Z",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total_records": 142,
    "has_more": true
  }
}
```

#### Error Response Envelope
```json
{
  "success": false,
  "timestamp": "2026-11-08T18:15:00.123Z",
  "error": {
    "code": "ERR_QUEUE_TOKEN_COLLISION",
    "message": "Token #14 was just claimed. Please re-query the current queue position.",
    "details": [
      { "field": "token_number", "issue": "Conflict with active slot" }
    ],
    "request_id": "b3f81e3a-7a52-4809-915b-16dcf38f9b90"
  }
}
```

---

## 2. API Endpoints by Module

### Module 2.1: Authentication & Patient Identity

#### `POST /api/v1/auth/patient/otp-request`
Dispatches OTP for patient mobile login.
- **Request:**
  ```json
  {
    "mobile_number": "+919876543210",
    "channel": "SMS" // or "WHATSAPP"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "session_id": "otp_sess_90f23a",
      "expires_in_seconds": 120,
      "message": "OTP sent to +91 98765 43210"
    }
  }
  ```

#### `POST /api/v1/auth/patient/otp-verify`
Verifies OTP and returns auth tokens.
- **Request:**
  ```json
  {
    "session_id": "otp_sess_90f23a",
    "otp_code": "482910"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "def5020...",
      "is_new_patient": false,
      "patient": {
        "id": "e6a2b8e4-1845-42cf-9023-bf729d5b0011",
        "schid": "SCH-2026-891023",
        "full_name": "Rajesh Varma",
        "dependents_count": 2
      }
    }
  }
  ```

---

### Module 2.2: Clinic & Doctor Discovery

#### `GET /api/v1/discovery/search`
Geo-spatial discovery for clinics and doctors.
- **Query Parameters:**
  - `lat=12.9716&lng=77.5946`
  - `specialty=Pediatrics`
  - `radius_km=10`
  - `has_live_queue=true`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "doctor_id": "d04a91cf-5012-4eb2-a9dc-1c4b8276f501",
        "doctor_name": "Dr. Sunita Deshmukh",
        "qualifications": "MBBS, MD (Pediatrics), FIAP",
        "experience_years": 14,
        "specialty": "Pediatrician",
        "consultation_fee": 600,
        "clinic_name": "Metro Health Pediatric Care",
        "branch_name": "Koramangala Branch",
        "distance_km": 3.4,
        "rating": 4.88,
        "review_count": 312,
        "live_queue": {
          "is_active": true,
          "current_token": 9,
          "tokens_waiting": 5,
          "estimated_wait_mins": 35
        },
        "next_fixed_slot": "2026-11-09T17:30:00+05:30"
      }
    ]
  }
  ```

---

### Module 2.3: Hybrid Appointments & Live Queue

#### `POST /api/v1/queue/join-token`
Allows patient to join the live virtual queue for today's OPD session.
- **Request:**
  ```json
  {
    "clinic_id": "c100a91f-0012-4eb2-a9dc-1c4b8276f900",
    "doctor_id": "d04a91cf-5012-4eb2-a9dc-1c4b8276f501",
    "patient_id": "e6a2b8e4-1845-42cf-9023-bf729d5b0011",
    "dependent_id": "f5193b2a-7711-4ca0-98cc-31295b28198a", // Daughter Ananya
    "chief_complaint": "Persistent fever and dry cough for 2 days"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "token_id": "tkn_78201a",
      "token_number": 14,
      "token_display": "TKN-014",
      "queue_status": "WAITING",
      "patients_ahead": 4,
      "active_token_now": "TKN-009",
      "estimated_wait_minutes": 28,
      "estimated_consultation_time": "2026-11-08T18:45:00+05:30",
      "qr_checkin_payload": "CLINICOS:CHECKIN:c100a91f:tkn_78201a"
    }
  }
  ```

#### `POST /api/v1/queue/walk-in-register`
Receptionist endpoint to register a walk-in patient.
- **Request:**
  ```json
  {
    "clinic_id": "c100a91f-0012-4eb2-a9dc-1c4b8276f900",
    "doctor_id": "d04a91cf-5012-4eb2-a9dc-1c4b8276f501",
    "patient_name": "Rohan Patel",
    "mobile_number": "+919811223344",
    "gender": "MALE",
    "age": 29,
    "chief_complaint": "Ear pain & headache",
    "collected_fee": 600,
    "payment_mode": "UPI"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "patient_schid": "SCH-2026-990145",
      "token_number": 15,
      "token_display": "TKN-015",
      "sms_confirmation_dispatched": true
    }
  }
  ```

---

### Module 2.4: Doctor Consultation & Prescription Studio

#### `POST /api/v1/consultations/{consultation_id}/publish-rx`
Publishes doctor-signed digital prescription.
- **Request:**
  ```json
  {
    "doctor_id": "d04a91cf-5012-4eb2-a9dc-1c4b8276f501",
    "diagnosis": "Acute Bronchitis (J20.9)",
    "vitals": {
      "bp_systolic": 118,
      "bp_diastolic": 78,
      "pulse": 82,
      "temperature_f": 100.4,
      "spo2": 98,
      "weight_kg": 16.5
    },
    "medications": [
      {
        "drug_name": "Augmentin Duo Oral Suspension (Amoxicillin + Clavulanic Acid)",
        "strength": "228.5 mg/5ml",
        "dosage_form": "SYRUP",
        "frequency": "1-0-1",
        "timing": "AFTER_FOOD",
        "duration_days": 5,
        "instructions": "5 ml twice daily after food"
      },
      {
        "drug_name": "Crocin DS (Paracetamol)",
        "strength": "240 mg/5ml",
        "dosage_form": "SYRUP",
        "frequency": "SOS (When fever > 100°F)",
        "timing": "AFTER_FOOD",
        "duration_days": 3,
        "instructions": "Max 4 times in 24 hours with minimum 4-hr gap"
      }
    ],
    "general_advice": "Ensure adequate oral hydration. Steam inhalation twice daily.",
    "follow_up_days": 4
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "rx_id": "rx_a90184b2",
      "rx_number": "RX-2026-11-00892",
      "pdf_download_url": "https://vault.smartclinicos.in/prescriptions/rx_a90184b2.pdf?token=exp...",
      "digital_signature_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "dispatched_to_patient_app": true,
      "dispatched_to_whatsapp": true
    }
  }
  ```

---

### Module 2.5: Smart Traffic & Departure Intelligence

#### `GET /api/v1/transit/departure-advisory`
Computes optimal departure time connecting Google Routes with queue pace.
- **Request:**
  `GET /api/v1/transit/departure-advisory?token_id=tkn_78201a&origin_lat=12.9352&origin_lng=77.6245`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "route": {
        "transit_duration_minutes": 24,
        "traffic_condition": "HEAVY_CONGESTION",
        "distance_km": 6.8,
        "via_road": "Hosur Rd / Outer Ring Rd"
      },
      "queue_estimate": {
        "current_token": "TKN-009",
        "your_token": "TKN-014",
        "estimated_consultation_time": "2026-11-08T18:45:00+05:30"
      },
      "departure_advisory": {
        "recommended_departure_time": "2026-11-08T18:06:00+05:30",
        "buffer_minutes": 15,
        "status_code": "LEAVE_IN_20_MINS",
        "guidance_message": "Depart by 6:06 PM to reach comfortably before Token #14 without waiting in clinic."
      }
    }
  }
  ```

---

### Module 2.6: SaaS Billing & Super Admin Endpoints

#### `GET /api/v1/admin/analytics/platform-summary`
Super Admin dashboard overview.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "total_clinics": 482,
      "active_doctors": 1840,
      "total_patients": 348290,
      "mrr_inr": 2840000,
      "today_consultations": 8420,
      "average_queue_wait_mins": 14.2,
      "system_uptime_percentage": 99.98
    }
  }
  ```
