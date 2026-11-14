# SMART CLINIC OS — PHASE 10 TELECONSULTATION & WEBRTC ENGINE
## Architecture, Token Security & Waiting Room Protocol

### 1. WebRTC Signaling Architecture

Smart Clinic OS teleconsultation enables peer-to-peer audio/video streaming with signaling mediated through the Node.js backend:

- **Signaling Channel:** RESTful room join and token validation + WebSocket status state machine.
- **NAT / Firewall Traversal:** STUN server configuration (`stun:stun.l.google.com:19302`).
- **Cryptographic Access Tokens:** Short-lived HMAC-SHA256 tokens minted per participant.

---

### 2. Token Security Lifecycle

When an appointment is designated as a teleconsultation (`is_teleconsultation = true`):
1. The room is provisioned via `POST /api/v1/teleconsultation/rooms`.
2. A unique human-readable room code is generated: `TELE-XXXX-XXXX`.
3. Separate cryptographic tokens are generated for the Doctor and Patient:
   - `doctor_token`: Contains appointment ID, doctor profile ID, room code, signed with backend secret.
   - `patient_token`: Contains appointment ID, patient ID, room code, signed with backend secret.
4. Tokens expire automatically upon session closure (`COMPLETED`).

---

### 3. Waiting Room State Machine

```
[SCHEDULED] ──► [ROOM CREATED] 
                      │
                      ▼
               [WAITING_ROOM]  (Patient enters room, doctor not yet present)
                      │
                      ▼ (Doctor admits patient)
                  [IN_CALL]    (Encrypted 2-way media streaming)
                      │
                      ▼ (Doctor ends call)
                [COMPLETED]    (Session closed, tokens invalidated)
```

During `IN_CALL`, the doctor interface maintains full access to:
- Real-time patient EHR history
- AI SOAP transcription assistant
- Digital Prescription generation & instant WhatsApp / SMS dispatch

