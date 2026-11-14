# Smart Clinic OS — Authentication Flow & Security Architecture

**Document ID:** SCO-P1-AUTH-001  
**Version:** 1.0.0 (Phase 1 Baseline)  
**Standard:** NIST SP 800-63B / OWASP Authentication Best Practices  

---

## 1. Authentication Mechanisms

Smart Clinic OS operates a dual authentication system tailored for Indian healthcare realities:
1. **Primary Patient & Staff Mobile Authentication:** OTP (One-Time Password) challenge-response via SMS/WhatsApp with cryptographic salted hashing.
2. **Administrative & Clinic Staff Authentication:** Bcrypt salted password authentication (`rounds=12`) with optional 2FA.

---

## 2. OTP Lifecycle & Security Invariants

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant API as /api/v1/auth/request-otp
    participant Svc as AuthService
    participant DB as PostgreSQL
    participant Provider as OTP Provider (Mock/SMS)

    Patient->>API: POST { "phone_number": "9876543210" }
    API->>Svc: Validate & Normalize to +919876543210
    Svc->>DB: Check for Active Unexpired OTP & Cooldown
    alt Cooldown Active (< 30s since last request)
        Svc-->>API: 429 RateLimitExceeded ("Wait 24s")
        API-->>Patient: 429 Too Many Requests
    else Cooldown Cleared
        Svc->>Svc: Generate 6-Digit Code (secrets.randbelow)
        Svc->>Svc: Compute Salted Hash SHA-256(code + phone)
        Svc->>DB: Insert OTPVerification (TTL: 120s, Max Attempts: 3)
        Svc->>Provider: send_otp(+919876543210, code)
        Provider-->>Patient: SMS / WhatsApp Delivery
        Svc-->>API: { success: true, expires_in: 120, cooldown: 30 }
        API-->>Patient: 200 OK (OTP Dispatched)
    end

    Note over Patient, DB: Verification Stage
    Patient->>API: POST /api/v1/auth/verify-otp { phone, code: "482910", name: "Rohan" }
    API->>Svc: verify_otp_service(...)
    Svc->>DB: Query Latest Active OTP Record
    Svc->>Svc: Increment Attempt Count & Compare SHA-256 Hash
    alt Invalid Hash & Attempts Left
        Svc->>DB: Commit attempt_count = 1
        Svc-->>Patient: 401 Unauthorized ("Invalid OTP. 2 attempts left.")
    else Valid Hash
        Svc->>DB: Mark is_verified = TRUE
        Svc->>DB: Retrieve or Provision User (Patient Role)
        Svc->>Svc: Issue JWT Access (15m) + Refresh (30d)
        Svc-->>Patient: 200 OK (access_token, refresh_token, user_profile)
    end
```

---

## 3. JWT Token Model & Revocation Blacklist

### 3.1 Token Payloads
- **Access Token:**
  ```json
  {
    "sub": "user-uuid-here",
    "iat": 1794200000,
    "exp": 1794200900,
    "jti": "random-uuid-token-id",
    "type": "access",
    "phone_number": "+919876543210",
    "full_name": "Rohan Deshmukh"
  }
  ```
- **Refresh Token:**
  ```json
  {
    "sub": "user-uuid-here",
    "iat": 1794200000,
    "exp": 1796792000,
    "jti": "unique-refresh-uuid",
    "type": "refresh"
  }
  ```

### 3.2 Revocation via Redis Blocklist
Upon `POST /api/v1/auth/logout`:
1. The token's `jti` is extracted from the JWT payload.
2. The remaining seconds until expiration (`exp - now`) are computed.
3. The key `jwt_blacklist:<jti>` is set in Redis with the remaining TTL.
4. Future incoming requests containing this token fail Flask-JWT-Extended's `token_in_blocklist_loader` check and return `401 TOKEN_REVOKED`.

