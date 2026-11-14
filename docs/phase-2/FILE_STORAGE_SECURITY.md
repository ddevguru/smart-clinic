# Smart Clinic OS — File Storage Security & Compliance (Phase 2)

---

### 1. Overview & Threat Model

Healthcare compliance documents (Clinical Establishment Act certificates, Medical Council degrees, Government Identity proofs) are sensitive personal and organizational data under the **Indian Digital Personal Data Protection (DPDP) Act 2023**.

Exposing these files through public static URLs, S3 public buckets, or predictable paths introduces severe risks:
- Unauthorized competitor intelligence gathering.
- Medical credential spoofing and identity theft.
- Breach of patient and doctor privacy leading to regulatory penalties under Section 33 of the DPDP Act.

---

### 2. File Storage Security Architecture

```
                  Client Upload
                        │
                        ▼
         ┌──────────────────────────────┐
         │     Flask API Middleware     │
         │ - Validate MIME type         │
         │ - Enforce extension whitelist│
         │ - Enforce 10 MB size limit   │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │   UUID Filename Obfuscation  │
         │  (Eliminates path traversal) │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │   Private Storage Sandbox    │
         │ backend/storage/documents/   │
         │   (No public web indexing)   │
         └──────────────────────────────┘
```

---

### 3. Key Defensive Safeguards Implemented

#### 3.1 Strict MIME and Extension Whitelisting
Uploaded files are inspected before disk write:
- **Allowed Extensions:** `.pdf`, `.jpg`, `.jpeg`, `.png`.
- **Allowed MIME Types:** `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`.
- Files with double extensions (`malicious.pdf.exe`), script headers, or unlisted MIME types are rejected immediately with **HTTP 400 Bad Request**.

#### 3.2 File Size Constraints
- Files are limited to **10 MB** (10,485,760 bytes). Seek-based stream inspection rejects oversized files before processing.
- Zero-byte files are rejected.

#### 3.3 Path Traversal Prevention
- All file names and destination folders pass through `werkzeug.utils.secure_filename()`.
- Filenames on disk are prefixed with a 32-character hexadecimal UUID (`<uuid4>_<sanitized_filename>`), preventing directory traversal (`../../`) and accidental or malicious file overwriting.
- Document retrieval enforces normalized path checks: Any path containing `..` or leading `/` is flagged as an illegal traversal attempt and rejected.

#### 3.4 Zero Public Direct File Access
- The private document directory (`backend/storage/documents/`) is **never** registered as a static directory in Flask or Nginx.
- Files can only be downloaded via authenticated streaming endpoints:
  - `GET /api/v1/onboarding/clinics/me/documents/<id>/download` (Requires JWT and verified clinic ownership).
  - `GET /api/v1/admin/clinics/<id>/documents/<doc_id>/download` (Requires JWT and `platform.clinics.view` Super Admin permission).
  - `GET /api/v1/admin/doctors/<id>/credentials/<cred_id>/download` (Requires JWT and `platform.doctors.view` Super Admin permission).
- Non-owners or unauthenticated callers receive **HTTP 403 Forbidden** or **HTTP 401 Unauthorized**.

#### 3.5 Pluggable Cloud Storage Ready
The `StorageProvider` abstract class defined in `backend/app/common/storage.py` allows seamless swapping from `LocalStorageProvider` to `S3StorageProvider` (AWS S3 in Mumbai `ap-south-1` or MinIO) by implementing the `save`, `retrieve`, and `delete` methods without modifying controller logic.

