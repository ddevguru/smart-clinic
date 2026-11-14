# Smart Clinic OS — RBAC & Tenant Isolation Validation
**Phase 3 Deliverable • Indian Healthcare SaaS Platform**

---

## 1. Overview of Phase 3 RBAC Matrix

Phase 3 validates fine-grained permission enforcement across three primary clinic actors:
1. `CLINIC_OWNER`
2. `RECEPTIONIST`
3. `DOCTOR`

| Permission Code | Capability Description | `CLINIC_OWNER` | `RECEPTIONIST` | `DOCTOR` |
| :--- | :--- | :---: | :---: | :---: |
| `clinic.view` | View clinic profile & operational metrics | ✅ | ✅ | ✅ |
| `clinic.update` | Modify clinic profile & CEA registration | ✅ | ❌ | ❌ |
| `branch.manage` | Add or configure satellite branches | ✅ | ❌ | ❌ |
| `doctor.onboard` | Onboard doctors and configure fee tiers | ✅ | ❌ | ❌ |
| `staff.manage` | Add or modify clinic staff roles | ✅ | ❌ | ❌ |
| `patient.create` | Register new patients into directory | ✅ | ✅ | ❌ |
| `patient.view` | Search directory & view contact records | ✅ | ✅ | ✅ |
| `patient.update` | Update patient demographic/contact data | ✅ | ✅ | ❌ |
| `appointment.create` | Schedule appointments & walk-ins | ✅ | ✅ | ❌ |
| `appointment.view` | View appointments & waiting queues | ✅ | ✅ | ✅ |
| `appointment.update` | Reschedule, check in, cancel, or complete | ✅ | ✅ | ✅ |
| `queue.manage` | Call next token, manage waiting room | ✅ | ✅ | ✅ |
| `consultation.create`| Author & save clinical notes / diagnoses | ❌ | ❌ | ✅ |
| `consultation.view` | Inspect clinical examination findings | ✅ | ❌ | ✅ |
| `billing.view` | View payment records & print receipts | ✅ | ✅ | ❌ |
| `billing.manage` | Collect cash/UPI fee & issue refunds | ✅ | ✅ | ❌ |

---

## 2. Security Validation Tests

1. **Cross-Tenant Barrier Test (`test_cross_tenant_isolation_clinic_ops`):**
   - User authenticated as Owner of Clinic B attempts to access `/api/v1/clinic/dashboard/overview` of Clinic A by providing Clinic A's UUID.
   - Result: HTTP `403 Forbidden` (`TenantAccessError: User is not an authorized member of this clinic`).
2. **Medical Confidentiality Test:**
   - Receptionist attempting to draft clinical consultation notes receives HTTP `403 Forbidden` (`PermissionDeniedError: lacks permission: consultation.create`).
3. **Financial Protection Test:**
   - Unauthenticated callers or doctors without billing permissions cannot collect fees or create financial adjustments.

