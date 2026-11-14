# SMART CLINIC OS — PHASE 10 API CATALOG & SPECIFICATION
## Endpoint Routes, Authentication Headers & Request/Response Schemas

### 1. AI Clinical Documentation & Safety (`/api/v1/ai`)
- `POST /api/v1/ai/soap/draft` — Generate structured SOAP draft from dictation notes.
- `POST /api/v1/ai/soap/approve` — Doctor review & approval into consultation notes.
- `POST /api/v1/ai/lab-report/extract` — Tabular parameter extraction & abnormal range flagging.
- `POST /api/v1/ai/assistant/query` — Patient guidance assistant with emergency triage.

### 2. Teleconsultation & Media Engine (`/api/v1/teleconsultation`)
- `POST /api/v1/teleconsultation/rooms` — Provision room with room code and HMAC tokens.
- `POST /api/v1/teleconsultation/rooms/:room_code/join` — Validate token and admit participant.
- `POST /api/v1/teleconsultation/rooms/:room_code/status` — Update room state (`WAITING_ROOM`, `IN_CALL`, `COMPLETED`).

### 3. ABDM & Interoperability (`/api/v1/abdm`)
- `POST /api/v1/abdm/verify-abha` — Validate ABHA address and return profile.
- `GET /api/v1/abdm/fhir/bundle/:appointment_id` — Return HL7 FHIR R4 JSON document bundle.
- `POST /api/v1/abdm/consent/request` — Initiate ABDM consent request.
- `POST /api/v1/abdm/consent/:id/grant` — Grant patient consent.

### 4. Diagnostic Lab Integration (`/api/v1/lab-integration`)
- `GET /api/v1/lab-integration/catalog` — Retrieve available diagnostic test panels.
- `POST /api/v1/lab-integration/orders` — Create laboratory test order with sample barcode.
- `POST /api/v1/lab-integration/webhook/:lab_code` — Ingest lab results with HMAC-SHA256 signature verification.

### 5. Pharmacy Fulfillment (`/api/v1/pharmacy-integration`)
- `GET /api/v1/pharmacy-integration/partners` — Active retail pharmacy partners.
- `POST /api/v1/pharmacy-integration/stock-check` — Real-time medication stock availability.
- `POST /api/v1/pharmacy-integration/orders` — Dispatch prescription order to pharmacy.
- `GET /api/v1/pharmacy-integration/orders/:order_id` — Fulfillment tracking status.

### 6. Clinic Intelligence & Forecasting (`/api/v1/clinic-intelligence`)
- `GET /api/v1/clinic-intelligence/forecast` — 7-14 day moving average patient volume prediction.
- `GET /api/v1/clinic-intelligence/staffing` — Dynamic staffing recommendations.
- `GET /api/v1/clinic-intelligence/heatmap` — Hourly queue congestion matrix.
- `GET /api/v1/clinic-intelligence/no-shows` — Historical and predicted no-show rates.

### 7. Secure Record Sharing (`/api/v1/sharing`)
- `POST /api/v1/sharing/share` — Create time-bound cryptographic record share token.
- `GET /api/v1/sharing/share/view/:token` — View shared records (logs IP/User-Agent).
- `GET /api/v1/sharing/shares/my` — Patient view of active shared links and view counts.
- `DELETE /api/v1/sharing/share/:share_id` — Instant patient revocation.

### 8. Platform Integrations Hub (`/api/v1/admin/integrations`)
- `GET /api/v1/admin/integrations` — Platform directory with masked secrets.
- `POST /api/v1/admin/integrations/:id/toggle` — Enable/disable toggle.
- `POST /api/v1/admin/integrations/:id/sync` — Live on-demand health check ping.

