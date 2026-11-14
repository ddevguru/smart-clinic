# Smart Clinic OS — Super Admin & Onboarding API Specification (Phase 2)

---

### 1. Base URL & Security Standards

- **Base URL:** `/api/v1`
- **Authentication:** Bearer JWT in `Authorization` header (`Bearer <access_token>`).
- **Authorization:** Verified on the backend against database roles and permissions (`@require_super_admin`, `@require_tenant_membership`).
- **Standard Response Envelope:**
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "page": 1, "page_size": 15, "total": 42 },
    "message": "Operation completed successfully"
  }
  ```

---

### 2. Super Admin Endpoints (`/api/v1/admin`)

| Method | Endpoint | Description | Permission Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/dashboard/overview` | Platform KPI metrics and real-time database counts | `platform.dashboard.view` |
| `GET` | `/admin/dashboard/clinic-trends` | Distribution by type, status, and 6-month monthly trends | `platform.dashboard.view` |
| `GET` | `/admin/clinics` | Searchable, filterable, paginated clinic directory | `platform.clinics.view` |
| `GET` | `/admin/clinics/<id>` | Comprehensive clinic dossier (branches, docs, staff, history)| `platform.clinics.view` |
| `POST` | `/admin/clinics/<id>/review` | Transition clinic status to `UNDER_REVIEW` | `platform.clinics.verify` |
| `POST` | `/admin/clinics/<id>/approve` | Approve and activate clinic tenant | `platform.clinics.verify` |
| `POST` | `/admin/clinics/<id>/request-correction`| Request specific corrections with notes | `platform.clinics.verify` |
| `POST` | `/admin/clinics/<id>/reject` | Reject clinic registration with mandatory reason | `platform.clinics.reject` |
| `POST` | `/admin/clinics/<id>/suspend` | Suspend verified clinic operations | `platform.clinics.suspend` |
| `POST` | `/admin/clinics/<id>/reactivate` | Lift suspension and restore active status | `platform.clinics.activate` |
| `GET` | `/admin/clinics/<id>/documents/<doc_id>/download` | Securely stream compliance document | `platform.clinics.view` |
| `GET` | `/admin/doctors` | List doctors across all clinics for credential verification | `platform.doctors.view` |
| `GET` | `/admin/doctors/<id>` | Full doctor credential dossier and certificates | `platform.doctors.view` |
| `POST` | `/admin/doctors/<id>/approve` | Approve doctor qualifications and council registration | `platform.doctors.verify` |
| `POST` | `/admin/doctors/<id>/reject` | Reject doctor credentials with reason | `platform.doctors.verify` |
| `GET` | `/admin/doctors/<id>/credentials/<cred_id>/download` | Stream uploaded degree or council certificate | `platform.doctors.view` |

---

### 3. Clinic Onboarding Endpoints (`/api/v1/onboarding`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/onboarding/clinics` | Initialize or fetch onboarding draft for current owner | JWT (Clinic Owner) |
| `GET` | `/onboarding/clinics/me` | Fetch full onboarding dossier, documents, and status | JWT (Clinic Owner) |
| `PATCH`| `/onboarding/clinics/me` | Update basic info, premises address, and metadata | JWT (Clinic Owner) |
| `POST` | `/onboarding/clinics/me/documents` | Multipart file upload for compliance certificates | JWT (Clinic Owner) |
| `GET` | `/onboarding/clinics/me/documents/<id>/download` | Securely stream uploaded document | JWT (Clinic Owner) |
| `POST` | `/onboarding/clinics/me/submit` | Validate completeness and submit for verification | JWT (Clinic Owner) |

---

### 4. Branch Management Endpoints (`/api/v1/clinics/<id>/branches`)

| Method | Endpoint | Description | Permission Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/clinics/<id>/branches` | Add physical facility branch | `branch.manage` |
| `GET` | `/clinics/<id>/branches` | List all branches of the clinic | `branch.view` |
| `GET` | `/clinics/<id>/branches/<b_id>` | Get branch details with operating hours | `branch.view` |
| `PATCH`| `/clinics/<id>/branches/<b_id>`| Update branch contact, address, or operating status | `branch.manage` |
| `PUT` | `/clinics/<id>/branches/<b_id>/schedules` | Configure weekly opening, closing, and break hours | `schedule.manage` |
| `GET` | `/clinics/<id>/branches/<b_id>/schedules` | Get operating schedule for branch | `branch.view` |

---

### 5. Doctor & Staff Management Endpoints (`/api/v1/clinics/<id>/doctors`)

| Method | Endpoint | Description | Permission Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/clinics/<id>/doctors` | Onboard doctor profile with medical council details | `doctor.onboard` |
| `GET` | `/clinics/<id>/doctors` | List doctors associated with clinic | `clinic.view` |
| `GET` | `/clinics/<id>/doctors/<d_id>` | Get doctor profile and uploaded credentials | `clinic.view` |
| `POST` | `/clinics/<id>/doctors/<d_id>/credentials` | Upload qualification degrees or licenses | `doctor.onboard` |
| `PUT` | `/clinics/<id>/doctors/<d_id>/schedules` | Configure doctor consultation hours by branch & day | `schedule.manage` |
| `GET` | `/clinics/<id>/doctors/<d_id>/schedules` | Get doctor consultation hours | `clinic.view` |

