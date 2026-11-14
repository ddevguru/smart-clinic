# Smart Clinic OS — Phase 5 API Integration Guide

## 1. Overview
The Patient Flutter application interfaces with the Flask REST backend at `/api/v1` and the Socket.IO server at root port `5000`.

### Base URLs
- **Android Emulator**: `http://10.0.2.2:5000/api/v1`
- **Physical Device / Production**: Configurable host URL (e.g. `https://api.smartclinicos.com/api/v1`)

---

## 2. Authentication & Authorization

### 2.1 Request OTP Challenge
- **Endpoint**: `POST /api/v1/auth/request-otp`
- **Payload**:
  ```json
  {
    "phone_number": "+919876543210"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "phone_number": "+919876543210",
      "expires_in_seconds": 120,
      "cooldown_seconds": 30,
      "debug_otp": "482910"
    }
  }
  ```

### 2.2 Verify OTP Challenge
- **Endpoint**: `POST /api/v1/auth/verify-otp`
- **Payload**:
  ```json
  {
    "phone_number": "+919876543210",
    "otp_code": "482910",
    "full_name": "Aarav Sharma"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "access_token": "<JWT_ACCESS_TOKEN>",
      "refresh_token": "<JWT_REFRESH_TOKEN>",
      "is_new_user": false,
      "user": {
        "id": "uuid-v4",
        "phone_number": "+919876543210",
        "full_name": "Aarav Sharma",
        "is_verified": true
      }
    }
  }
  ```

---

## 3. Public Discovery Endpoints

### 3.1 Discover Clinics
- **Endpoint**: `GET /api/v1/discovery/clinics?search=&city=&specialty=&limit=20&offset=0`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "clinics": [
        {
          "id": "cln-uuid",
          "name": "Apollo Clinic Koramangala",
          "city": "Bangalore",
          "address": "80 Feet Road, 4th Block",
          "specialties": ["General Medicine", "Pediatrics"],
          "active_doctors_count": 4,
          "rating": 4.8,
          "review_count": 124
        }
      ],
      "total": 1
    }
  }
  ```

### 3.2 Discover Doctors
- **Endpoint**: `GET /api/v1/discovery/doctors?search=&specialty=&clinic_id=&limit=20&offset=0`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "doctors": [
        {
          "id": "doc-uuid",
          "doctor_name": "Dr. Rajesh Rao",
          "specialty": "Cardiology",
          "qualification": "MBBS, MD",
          "experience_years": 12,
          "consultation_fee": 600.0,
          "clinic_name": "Apollo Clinic",
          "rating": 4.9
        }
      ]
    }
  }
  ```

### 3.3 Available Slot Computation
- **Endpoint**: `GET /api/v1/discovery/slots?clinic_id=<uuid>&branch_id=<uuid>&doctor_id=<uuid>&date=YYYY-MM-DD`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "start_time": "10:00",
        "end_time": "10:15",
        "duration_minutes": 15,
        "is_available": true,
        "reason": null
      },
      {
        "start_time": "11:00",
        "end_time": "11:15",
        "duration_minutes": 15,
        "is_available": false,
        "reason": "BREAK"
      }
    ]
  }
  ```

---

## 4. Patient Booking & Live Queue Endpoints

### 4.1 Book Fixed Slot
- **Endpoint**: `POST /api/v1/patient/book-slot`
- **Headers**: `Authorization: Bearer <JWT>`
- **Payload**:
  ```json
  {
    "clinic_id": "<uuid>",
    "branch_id": "<uuid>",
    "doctor_id": "<uuid>",
    "appointment_date": "2026-11-12",
    "appointment_time": "10:00",
    "notes": "Routine checkup"
  }
  ```

### 4.2 Join Live Queue
- **Endpoint**: `POST /api/v1/patient/join-live`
- **Headers**: `Authorization: Bearer <JWT>`
- **Payload**:
  ```json
  {
    "clinic_id": "<uuid>",
    "branch_id": "<uuid>",
    "doctor_id": "<uuid>",
    "notes": "Remote live queue ticket"
  }
  ```

### 4.3 Active Queue Ticket & Wait Time
- **Endpoint**: `GET /api/v1/patient/queue-ticket`
- **Headers**: `Authorization: Bearer <JWT>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "active_ticket": {
        "id": "entry-uuid",
        "token_number": "A004",
        "token_sequence": 4,
        "queue_status": "WAITING",
        "patients_ahead": 2,
        "estimated_wait_minutes": 30,
        "is_paused": false,
        "pause_reason": null,
        "doctor": { "doctor_name": "Dr. Rajesh Rao", "specialty": "Cardiology" },
        "clinic": { "name": "Apollo Clinic", "address": "80 Feet Road" }
      }
    }
  }
  ```

### 4.4 List Appointments & Cancel
- **List**: `GET /api/v1/patient/appointments?filter=UPCOMING|COMPLETED|CANCELLED`
- **Cancel**: `POST /api/v1/patient/appointments/<uuid>/cancel` with `{"reason": "Schedule conflict"}`

