# Smart Clinic OS — Core Backend API Reference (Phase 1)

**Document ID:** SCO-P1-API-001  
**Version:** 1.0.0 (Phase 1 Baseline)  
**Base URL:** `http://localhost:5000/api/v1`  
**Interactive Docs:** `http://localhost:5000/api/v1/docs` (Swagger UI)  
**OpenAPI Specification:** `http://localhost:5000/api/v1/openapi.json`  

---

## 1. Global Conventions

### Headers
```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
X-Request-ID: <correlation_id> (Optional, generated if missing)
X-Clinic-ID: <clinic_uuid> (Optional tenant context header)
```

### Standard Response Schemas

#### Success Envelope (200, 201)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "request_id": "req-d2b57f0f641f",
  "timestamp": "2026-11-09T04:15:00.000000+00:00",
  "meta": { "page": 1, "limit": 20, "total_records": 100, "has_more": true }
}
```

#### Error Envelope (400, 401, 403, 404, 409, 429, 500)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "phone_number", "issue": "Invalid format" }
  ],
  "error_code": "VALIDATION_ERROR",
  "request_id": "req-d2b57f0f641f",
  "timestamp": "2026-11-09T04:15:00.000000+00:00"
}
```

---

## 2. API Endpoints Catalog

### 2.1 Authentication (`/auth`)

| Method | Endpoint | Access | Summary |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/request-otp` | Public | Request a 6-digit OTP challenge for Indian mobile number. |
| `POST` | `/auth/verify-otp` | Public | Verify OTP and receive JWT access/refresh tokens. |
| `POST` | `/auth/login-password` | Public | Staff/Admin login using email/phone and password. |
| `POST` | `/auth/refresh` | Refresh JWT | Issue fresh access token from valid refresh token. |
| `POST` | `/auth/logout` | Bearer JWT | Revoke active access token in Redis blacklist. |
| `GET` | `/auth/me` | Bearer JWT | Retrieve authenticated user profile and memberships. |

### 2.2 User Management (`/users`)

| Method | Endpoint | Permission | Summary |
| :--- | :--- | :---: | :--- |
| `GET` | `/users/me` | Authenticated | Retrieve self profile. |
| `PATCH`| `/users/me` | Authenticated | Update self name and email. |
| `GET` | `/users` | `staff.view` | List users with pagination and search filter. |
| `GET` | `/users/{id}` | `staff.view` | Retrieve specific user details. |
| `POST` | `/users` | `staff.manage`| Administrative user creation. |
| `PATCH`| `/users/{id}` | `staff.manage`| Administrative user update (status, email, phone). |

### 2.3 Clinic Management (`/clinics`)

| Method | Endpoint | Permission | Summary |
| :--- | :--- | :---: | :--- |
| `POST` | `/clinics` | Authenticated | Create a new clinic tenant; creator is granted CLINIC_OWNER. |
| `GET` | `/clinics` | Authenticated | List accessible clinics (Admin sees all; user sees member clinics). |
| `GET` | `/clinics/{id}` | `clinic.view` | Retrieve single clinic profile (tenant protected). |
| `PATCH`| `/clinics/{id}` | `clinic.update`| Update clinic profile (verification_status requires Super Admin). |
| `POST` | `/clinics/{id}/members` | `staff.manage`| Add user as Doctor/Receptionist/Owner to clinic. |
| `GET` | `/clinics/{id}/members` | `staff.view` | List staff members within clinic. |
| `PATCH`| `/clinics/{id}/members/{m_id}` | `staff.manage`| Update staff member role or status. |

### 2.4 Audit & Platform Health

| Method | Endpoint | Permission | Summary |
| :--- | :--- | :---: | :--- |
| `GET` | `/audit-logs` | `platform.audit.view` | Query immutable platform audit logs with filters. |
| `GET` | `/health` | Public | Health check verifying API status and uptime. |
| `GET` | `/openapi.json` | Public | Complete OpenAPI 3.0.0 specification JSON. |
| `GET` | `/docs` | Public | Interactive Swagger UI API documentation. |

