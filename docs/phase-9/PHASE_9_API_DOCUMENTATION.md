# PHASE 9 — REST API DOCUMENTATION

Base Path: `/api/v1/marketplace`

---

## 1. Public Discovery Endpoints

### 1.1 `GET /api/v1/marketplace/categories`
Returns active healthcare service categories with service count.
- **Auth:** None (Public)
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "categories": [
        { "id": "...", "name": "Doctor Home Visit", "code": "DOCTOR_VISIT", "service_count": 2 },
        { "id": "...", "name": "Nursing Services", "code": "NURSING", "service_count": 2 }
      ]
    }
  }
  ```

### 1.2 `GET /api/v1/marketplace/services`
Retrieves services catalog. Filterable by `category_code` or `category_id`.
- **Query Params:** `category_code=NURSING`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "services": [
        {
          "id": "...",
          "name": "Sterile Wound Dressing & Suture Care",
          "code": "NURSE_WOUND_DRESSING",
          "sac_code": "999312",
          "base_price": "650.00",
          "default_duration_minutes": 45
        }
      ]
    }
  }
  ```

### 1.3 `GET /api/v1/marketplace/providers`
Discovers approved providers. Strictly excludes unverified or suspended providers.
- **Query Params:** `postal_code=560038`, `category_code=NURSING`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "providers": [
        {
          "id": "...",
          "full_name": "Sister Mary Varghese",
          "provider_type": "NURSE",
          "qualification": "B.Sc Nursing, RN",
          "rating_avg": "5.00",
          "verification_status": "APPROVED"
        }
      ]
    }
  }
  ```

---

## 2. Patient Booking Endpoints

### 2.1 `POST /api/v1/marketplace/bookings`
Books a new home healthcare visit.
- **Auth:** Bearer Token (Patient)
- **Request Body:**
  ```json
  {
    "service_id": "...",
    "provider_id": "...",
    "scheduled_date": "2026-11-14",
    "scheduled_start_time": "10:00",
    "service_address": "Flat 402, Green Acres Apt, Indiranagar",
    "city": "Bengaluru",
    "postal_code": "560038",
    "contact_phone": "+919876543299",
    "patient_notes": "Post-surgery wound care"
  }
  ```
- **Response:** Status 201 Created with sequential `HV-YYYYMMDD-XXXX` identifier.

### 2.2 `GET /api/v1/marketplace/bookings/:id`
Retrieves booking details with address privacy guard.

### 2.3 `POST /api/v1/marketplace/review`
Submits verified patient review after completion.
- **Request Body:**
  ```json
  {
    "booking_id": "...",
    "rating": 5,
    "punctuality_rating": 5,
    "review_comment": "Excellent bedside manner and very punctual."
  }
  ```

---

## 3. Provider Operations Endpoints

### 3.1 `GET /api/v1/marketplace/provider/dashboard`
Returns today's visits, upcoming bookings, and net payout earnings for the authenticated provider.

### 3.2 `POST /api/v1/marketplace/provider/bookings/:id/status`
Updates visit lifecycle state (`ACCEPTED`, `PROVIDER_EN_ROUTE`, `ARRIVED`, `SERVICE_IN_PROGRESS`).

### 3.3 `POST /api/v1/marketplace/provider/bookings/:id/complete`
Documents clinical observations, vital signs (BP, Pulse, Temp, SpO2), checklist, and marks booking `COMPLETED`.

---

## 4. Super Admin Management Endpoints

### 4.1 `GET /api/v1/marketplace/admin/overview`
Returns marketplace GMV, 15% platform commissions, total visits, and active provider metrics.

### 4.2 `POST /api/v1/marketplace/admin/providers/:id/verify`
Updates provider status (`APPROVED`, `REJECTED`, `SUSPENDED`) with audit justification notes.

