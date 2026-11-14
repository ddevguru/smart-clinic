# Smart Clinic OS — Medical Document Security Specification
## Phase 6 Data Protection

---

## 1. Storage Isolation

- **File Path Structure:**
  `storage/tenants/{clinic_id}/documents/{patient_id}/{uuid}.pdf`
- All uploaded medical documents and generated prescription PDFs are strictly segregated by tenant clinic UUID.
- No direct public web server file exposure (no public Nginx static folder without authentication).
- Downloads are served exclusively through authenticated Flask endpoints (`/api/v1/clinic/ehr/documents/<id>/download` or `/api/v1/patient/documents/<id>/download`) which verify:
  1. Valid Bearer JWT.
  2. Patient ownership or authorized clinic tenant membership.
  3. Active record sharing consent (for cross-clinic requests).

---

## 2. Integrity Verification

Every finalized prescription PDF and uploaded diagnostic document has an immutable SHA-256 hash computed at persistence time:
```python
checksum = hashlib.sha256(pdf_buffer.getvalue()).hexdigest()
```
The checksum is:
- Stored in `prescription_versions.document_checksum`.
- Printed in the verification box on the generated PDF.
- Verified whenever legal or regulatory verification is requested.

---

## 3. Threat Mitigation Matrix

| Threat | Prevention Strategy |
|---|---|
| Unauthorized Prescription Tampering | In-place modifications blocked; version increment + SHA-256 checksum mismatch detection |
| Cross-Tenant Record Leakage | `require_tenant_membership` decorator validates clinic boundary |
| Receptionist Data Snooping | RBAC restricts `consultation.create` and clinical notes access from receptionist roles |
| Malicious File Uploads | MIME type validation, extension whitelist (`.pdf`, `.jpg`, `.png`), size limit (15MB) |

