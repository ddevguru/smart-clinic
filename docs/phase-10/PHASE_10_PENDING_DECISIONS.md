# SMART CLINIC OS — PHASE 10 PENDING DECISIONS & ROADMAP
## Operational Considerations & Phase 11 Readiness

### 1. Production TURN Server Infrastructure

- **Current Implementation:** Utilizes public Google STUN server (`stun:stun.l.google.com:19302`) for NAT traversal.
- **Production Requirement:** For symmetric NATs and enterprise hospital firewalls that block direct UDP/TCP peer-to-peer traffic, a managed TURN server (such as Coturn or Twilio Network Traversal Service) must be provisioned with dynamic time-limited credentials.

---

### 2. National Health Authority (NHA) ABDM Production Gateway Keys

- **Current Implementation:** Connected to the NHA ABDM Sandbox environment with simulated verification and FHIR R4 profile builder.
- **Production Requirement:** Smart Clinic OS entity registration with the National Health Authority to receive production bridge credentials, client ID, and private encryption keys for live HIP/HIU integration.

---

### 3. Commercial SLA Agreements with Diagnostic & Pharmacy Chains

- **Current Implementation:** Integrates standardized webhook ingestion, barcode generation, stock checks, and dispatch APIs with Metropolis, Dr. Lal PathLabs, Apollo Pharmacy, and MedPlus.
- **Production Requirement:** Execution of formal business-associate and HIPAA/DPDP data sharing agreements (B2B commercial contracts) with each respective provider.

---

### 4. Phase 11 Readiness

Phase 10 is 100% complete with all tests passing and documentation written. The team will wait for explicit instruction and sign-off before proceeding with Phase 11.

