# Smart Clinic OS — RBAC & Permission Matrix (Phase 2)

---

### 1. Overview

Smart Clinic OS implements a multi-tenant Role-Based Access Control (RBAC) engine. Permissions are grouped into platform governance (Super Admin) and clinic-level operations (Clinic Owner, Doctor, Receptionist, Nurse, Patient).

Every endpoint in `/api/v1/admin/*` enforces platform-level authorization via `@require_super_admin(permission_code)`, while tenant endpoints enforce boundary validation via `@require_tenant_membership(permission_code)`.

---

### 2. Comprehensive RBAC Matrix

| Permission Code | Description | Super Admin | Clinic Owner | Doctor | Receptionist | Patient |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `platform.dashboard.view` | View platform-wide metrics & registrations | **YES** | NO | NO | NO | NO |
| `platform.clinics.view` | View all clinic dossiers and compliance files | **YES** | NO | NO | NO | NO |
| `platform.clinics.create` | Platform-level clinic creation | **YES** | NO | NO | NO | NO |
| `platform.clinics.verify` | Approve / review clinics & request corrections | **YES** | NO | NO | NO | NO |
| `platform.clinics.reject` | Reject clinic registrations with formal reason | **YES** | NO | NO | NO | NO |
| `platform.clinics.suspend` | Suspend verified clinic tenant operations | **YES** | NO | NO | NO | NO |
| `platform.clinics.activate`| Lift suspension and reactivate clinic | **YES** | NO | NO | NO | NO |
| `platform.doctors.view` | View all platform doctors and uploaded degrees | **YES** | NO | NO | NO | NO |
| `platform.doctors.verify` | Approve or reject doctor medical credentials | **YES** | NO | NO | NO | NO |
| `platform.staff.view` | Platform-level staff membership audits | **YES** | NO | NO | NO | NO |
| `platform.subscriptions.view`| Platform subscription plan administration | **YES** | NO | NO | NO | NO |
| `platform.settings.manage` | Global platform governance settings | **YES** | NO | NO | NO | NO |
| `platform.audit_logs.view`| System-wide immutable security audit trail | **YES** | NO | NO | NO | NO |
| `clinic.view` | View clinic profile and branches | **YES** | **YES** | **YES** | **YES** | **YES** |
| `clinic.update` | Edit clinic details and profile | **YES** | **YES** | NO | NO | NO |
| `branch.manage` | Create, edit, and deactivate facility branches | **YES** | **YES** | NO | NO | NO |
| `branch.view` | View clinic branches and operating hours | **YES** | **YES** | **YES** | **YES** | **YES** |
| `schedule.manage` | Configure weekly branch hours and doctor slots | NO | **YES** | NO | NO | NO |
| `doctor.onboard` | Onboard doctor and upload credentials | NO | **YES** | NO | NO | NO |
| `staff.manage` | Onboard and assign roles to staff members | **YES** | **YES** | NO | NO | NO |
| `staff.view` | View clinic staff roster | **YES** | **YES** | NO | NO | NO |
| `appointment.view` | View clinic appointment calendars | NO | **YES** | **YES** | **YES** | **YES** |
| `queue.manage` | Call tokens and manage live patient queues | NO | **YES** | **YES** | **YES** | NO |
| `consultation.create` | Create clinical consultation records | NO | NO | **YES** | NO | NO |
| `prescription.publish`| Author and digitally sign prescriptions | NO | NO | **YES** | NO | NO |

---

### 3. Middleware Enforcement Decorators

#### `@require_super_admin(permission_code: str | None = None)`
- Verifies that the JWT is signed and valid.
- Verifies user exists in the database and is active.
- Queries the database `Role` table to confirm the user possesses the `SUPER_ADMIN` system role.
- If `permission_code` is passed, verifies that the user's role is granted that exact permission in `role_permissions`.
- Rejects unauthorized requests with **HTTP 403 Forbidden**.

#### `@require_tenant_membership(permission_code: str | None = None)`
- Extracts `clinic_id` from the URL parameters, headers (`X-Clinic-ID`), or query strings.
- Validates that the clinic exists and is active.
- If the actor is a verified Super Admin, grants cross-tenant administrative access and sets `g.is_super_admin_access = True`.
- For standard clinic users, queries `clinic_memberships` to ensure the user is an active member of that clinic.
- Validates that the user's assigned role in that clinic possesses the required permission code.
- Rejects non-members with **HTTP 403 Forbidden**.

