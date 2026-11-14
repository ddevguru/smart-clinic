# SMART CLINIC OS — PHASE 10 ARCHITECTURE SPECIFICATION
## System Architecture, Entity Relationships & Data Flows

### 1. Architectural Topology

```mermaid
graph TD
    ClientApp[Flutter Patient App & Web Portals] -->|HTTPS / WSS| API_GW[Node Express API Gateway :5000]
    
    subgraph Core Engine
        Auth[Auth & RBAC Service]
        AIService[AI Clinical & Safety Service]
        TeleService[Teleconsultation WebRTC Bridge]
        ABDMService[ABDM / FHIR R4 Engine]
        LabService[Diagnostic Lab Gateway]
        PharmService[Pharmacy Fulfillment Engine]
        IntelService[Clinic Intelligence & Forecasting]
        ShareService[Secure Record Sharing Engine]
    end

    API_GW --> Auth
    API_GW --> AIService
    API_GW --> TeleService
    API_GW --> ABDMService
    API_GW --> LabService
    API_GW --> PharmService
    API_GW --> IntelService
    API_GW --> ShareService

    subgraph Data Layer
        PostgreSQL[(PostgreSQL: smart_clinic_os)]
    end

    Core Engine --> PostgreSQL

    subgraph External Ecosystem
        Metropolis[Metropolis Healthcare API]
        LalPath[Dr. Lal PathLabs API]
        Apollo[Apollo Pharmacy API]
        MedPlus[MedPlus Pharmacy API]
        ABDMGateway[NHA ABDM Sandbox Gateway]
        WebRTCServer[Google STUN / RFC 5389]
    end

    LabService -.-> Metropolis
    LabService -.-> LalPath
    PharmService -.-> Apollo
    PharmService -.-> MedPlus
    ABDMService -.-> ABDMGateway
    TeleService -.-> WebRTCServer
```

---

### 2. Database Schema Extensions (Phase 10)

Twelve dedicated tables and one column modification were executed via `migration_phase10.js`:

1. `appointments.is_teleconsultation` (BOOLEAN DEFAULT false)
2. `ai_consultation_drafts`:
   - `id` (UUID PK), `appointment_id` (FK), `doctor_id` (FK), `dictation_notes` (TEXT), `soap_data` (JSONB), `missing_vitals` (TEXT[]), `differential_diagnoses` (JSONB), `status` (DRAFT/APPROVED/REJECTED), `created_at`, `updated_at`.
3. `ai_lab_report_extractions`:
   - `id` (UUID PK), `medical_document_id` (FK), `extracted_parameters` (JSONB), `abnormal_flags` (TEXT[]), `clinical_summary` (TEXT), `confidence_score` (NUMERIC), `verified_by_doctor_id` (FK), `verified_at` (TIMESTAMPTZ).
4. `teleconsultation_rooms`:
   - `id` (UUID PK), `appointment_id` (FK), `doctor_id` (FK), `patient_id` (FK), `room_code` (VARCHAR), `doctor_token` (VARCHAR), `patient_token` (VARCHAR), `status` (WAITING_ROOM/IN_CALL/COMPLETED), `started_at`, `ended_at`, `ice_servers` (JSONB).
5. `abdm_integrations`:
   - `id` (UUID PK), `clinic_id` (FK), `abha_health_id` (VARCHAR), `bridge_url` (VARCHAR), `client_id` (VARCHAR), `is_verified` (BOOLEAN), `sync_status` (ACTIVE/SUSPENDED).
6. `abdm_consents`:
   - `id` (UUID PK), `patient_id` (FK), `consent_request_id` (VARCHAR), `consent_artifact_id` (VARCHAR), `purpose_code` (VARCHAR), `hi_types` (TEXT[]), `status` (REQUESTED/GRANTED/DENIED/REVOKED), `expiry_at` (TIMESTAMPTZ).
7. `diagnostic_laboratories`:
   - `id` (UUID PK), `name` (VARCHAR), `code` (VARCHAR), `api_endpoint` (VARCHAR), `webhook_secret` (VARCHAR), `is_active` (BOOLEAN).
8. `diagnostic_lab_orders`:
   - `id` (UUID PK), `appointment_id` (FK), `clinic_id` (FK), `patient_id` (FK), `lab_id` (FK), `test_codes` (TEXT[]), `sample_barcode` (VARCHAR), `order_status` (ORDER_PLACED/SAMPLE_COLLECTED/PROCESSING/REPORT_DELIVERED), `result_pdf_url` (VARCHAR).
9. `pharmacy_partners`:
   - `id` (UUID PK), `name` (VARCHAR), `code` (VARCHAR), `api_endpoint` (VARCHAR), `webhook_secret` (VARCHAR), `is_active` (BOOLEAN).
10. `pharmacy_orders`:
    - `id` (UUID PK), `prescription_id` (FK), `patient_id` (FK), `clinic_id` (FK), `pharmacy_id` (FK), `medications_ordered` (JSONB), `order_status` (PENDING/DISPATCHED/DELIVERED/CANCELLED), `delivery_partner` (VARCHAR).
11. `medical_record_shares`:
    - `id` (UUID PK), `patient_id` (FK), `share_token` (VARCHAR UNIQUE), `recipient_name` (VARCHAR), `shared_records` (TEXT[]), `expires_at` (TIMESTAMPTZ), `is_revoked` (BOOLEAN), `revoked_at` (TIMESTAMPTZ).
12. `record_access_logs`:
    - `id` (UUID PK), `share_id` (FK), `ip_address` (VARCHAR), `user_agent` (VARCHAR), `accessed_at` (TIMESTAMPTZ).
13. `platform_integrations`:
    - `id` (UUID PK), `integration_name` (VARCHAR), `integration_category` (VARCHAR), `provider_name` (VARCHAR), `is_active` (BOOLEAN), `config_settings` (JSONB), `last_synced_at` (TIMESTAMPTZ).

