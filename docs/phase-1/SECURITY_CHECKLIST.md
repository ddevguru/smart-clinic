# Smart Clinic OS — Security Architecture & Verification Checklist

**Document ID:** SCO-P1-SEC-001  
**Version:** 1.0.0 (Phase 1 Baseline)  
**Standard:** OWASP Top 10 API Security 2023 / Indian DPDP Act 2023 Principles  

---

## 1. Security Verification Matrix

| Security Domain | Control Implemented | Status | Verification Method |
| :--- | :--- | :---: | :--- |
| **Password Storage** | Bcrypt with 12 salt rounds (`bcrypt.gensalt(12)`). | ✅ PASSED | `test_user_password_hashing` unit test verifies hash and password check. |
| **OTP Security** | Salted SHA-256 hash stored. Never plaintext. 120s TTL, 30s resend cooldown, 3-attempt hard cap. | ✅ PASSED | `test_otp_verification_logic`, `test_request_otp_cooldown_enforcement`. |
| **JWT Access Security** | 15-minute access token expiry, Bearer token extraction, Redis JTI blacklist. | ✅ PASSED | `test_password_login_and_logout` verifies revoked token rejection (401). |
| **Multi-Tenant Isolation** | `@require_tenant_membership` verifies active clinic membership on every clinic-scoped request. | ✅ PASSED | `test_cross_tenant_read_isolation`, `test_cross_tenant_update_isolation`, `test_cross_tenant_membership_isolation`. |
| **Privilege Escalation** | `verification_status` and platform governance hard-blocked for regular clinic staff. | ✅ PASSED | `test_verification_status_requires_super_admin` verifies 403 rejection. |
| **SQL Injection** | 100% parameterized queries via SQLAlchemy 2.x declarative ORM. Raw string formatting strictly prohibited. | ✅ PASSED | Static code audit; all DB operations use typed `Select` or ORM methods. |
| **Input Validation** | Marshmallow schemas validate all request JSON payloads (length, format, regex). | ✅ PASSED | `test_request_otp_invalid_phone`, schema tests. |
| **Information Leakage** | Generic authentication error messages; global error handler masks internal DB tracebacks. | ✅ PASSED | Global error handler returns structured JSON without server stack traces. |
| **Audit Trail** | Administrative mutations (clinic creation, staff additions, role updates) logged to `audit_logs`. | ✅ PASSED | Verified in clinic and user service execution. |
| **Request Correlation** | Unique `X-Request-ID` assigned to every incoming request and returned in response. | ✅ PASSED | Verified across all test response envelopes. |

---

## 2. Explicit Prohibitions Enforced in Phase 1

1. ❌ **No Hardcoded Credentials:** All secrets (JWT secret, DB URL, Redis URL) loaded exclusively from environment variables or defaults clearly flagged for development.
2. ❌ **No Plaintext Secret Logging:** `app.logger` and Celery tasks strictly forbid logging passwords, OTPs, or private patient tokens.
3. ❌ **No Client-Provided Role Trust:** Roles and permissions are retrieved and validated solely from database records on the backend.
4. ❌ **No Unverified Clinic ID Usage:** Clinic ID supplied by client is cross-examined against database membership tables before executing any tenant queries.

