# Smart Clinic OS — System Architecture & Technical Blueprint

**Document ID:** SCO-P0-DOC-005  
**Version:** 1.0.0 (Phase 0 Deliverable)  
**Standard:** C4 Model & Cloud-Native Micro-Modular Monolith  
**Runtime:** Node.js, Express, PostgreSQL, Redis, Socket.IO, Next.js, Flutter  

---

## 1. Architectural Philosophy

Smart Clinic OS adheres to a **Micro-Modular Monolith** architecture during Phase 0 to Phase 3, avoiding premature microservice complexity while enforcing strict domain isolation, domain-driven boundaries, and zero circular dependencies. 

```
                                  SMART CLINIC OS ECOSYSTEM
                                              │
    ┌───────────────────────────┬─────────────┴─────────────┬───────────────────────────┐
    ▼                           ▼                           ▼                           ▼
[Patient App]           [Clinic Web App]            [Super Admin]            [Provider Mobile/Web]
(Flutter / Android)     (Next.js / React)           (Next.js / React)        (Flutter / Next.js)
    │                           │                           │                           │
    └───────────────────────────┼───────────────────────────┼───────────────────────────┘
                                │ HTTPS / WSS (TLS 1.3)
                                ▼
                   ┌─────────────────────────────┐
                   │ Cloudflare CDN / WAF / DDoS │
                   └──────────────┬──────────────┘
                                  │
                   ┌──────────────▼──────────────┐
                   │ NGINX / Envoy Reverse Proxy │
                   │  (SSL Termination & Rate)   │
                   └──────────────┬──────────────┘
                                  │
    ┌─────────────────────────────┴─────────────────────────────┐
    │          NODE.JS / EXPRESS BACKEND API GATEWAY            │
    │         (Modular Monolith - Domain Controllers)           │
    │                                                           │
    │  [Auth] [Patients] [Clinics] [Doctors] [Queue] [Records]  │
    │  [Prescriptions] [Billing] [Traffic] [HomeCare] [Admin]   │
    └──────────────┬─────────────────────────────┬──────────────┘
                   │                             │
         ┌─────────▼─────────┐         ┌─────────▼─────────┐
         │ PostgreSQL 16 DB  │         │  Redis 7 Cluster  │
         │ (Master / Replica)│         │(Queue/Locks/Cache)│
         └─────────┬─────────┘         └─────────┬─────────┘
                   │                             │
    ┌──────────────┴─────────────────────────────┴──────────────┐
    │                ASYNC WORKER POOL (BullMQ)                 │
    │  • PDF Rx Signing Engine      • Google Maps Transit Sync  │
    │  • WhatsApp / SMS Gateway     • FCM Mobile Push Delivery  │
    │  • OCR Biomarker Extractor    • Subscription Webhook Sync │
    └───────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenancy & Data Isolation Model

In Indian healthcare, accidental cross-clinic data exposure is a catastrophic legal, ethical, and clinical violation.

### 2.1 Shared Database with Row-Level Security (RLS)
Smart Clinic OS utilizes a **Shared Database, Shared Schema with PostgreSQL Row-Level Security (RLS)**:
1. Every clinic entity (appointments, queue tokens, prescriptions, staff, receipts) is tagged with a non-nullable `clinic_id` UUID.
2. Every incoming request via Next.js or API Gateway is decoded into a signed JWT containing `clinic_id`, `user_id`, and `role`.
3. Database connection middleware executes:
   ```sql
   SET LOCAL app.current_clinic_id = 'clinic_uuid_here';
   ```
4. PostgreSQL RLS policies automatically filter rows:
   ```sql
   CREATE POLICY clinic_isolation_policy ON appointments
     FOR ALL
     TO api_user
     USING (clinic_id = NULLIF(current_setting('app.current_clinic_id', true), '')::uuid);
   ```
5. Multi-Branch clinic chains possess a `parent_clinic_id` linking branches, granting authorized chain managers unified roll-up reporting without breaking branch-level operational boundaries.

---

## 3. High-Performance Live Queue Engine

Outpatient OPD queues require sub-second synchronization and zero race conditions under high concurrency (e.g., 50 patients attempting to grab morning walk-in tokens simultaneously).

### 3.1 Redis Concurrency & Atomic Counters
- Tokens are issued via Redis `INCRBY` against a daily key: `queue:{clinic_id}:{doctor_id}:{date}:token_counter`.
- Distributed locks using `Redlock` guarantee that emergency insertions, token cancellations, and slot reservations execute sequentially without deadlocks.

### 3.2 Real-Time WebSocket Architecture (Socket.IO)
- Dedicated WebSocket rooms segmented by `room:queue:{clinic_id}:{doctor_id}`.
- Whenever a doctor clicks "Call Next" or receptionist records a walk-in, an event `queue:updated` is broadcast to all subscribed sockets within $< 100\text{ ms}$.
- Event payload includes:
  ```json
  {
    "active_token": "TKN-009",
    "status": "IN_CONSULTATION",
    "patients_waiting": 14,
    "current_wait_time_mins": 38,
    "last_updated": "2026-11-08T18:05:00Z"
  }
  ```

---

## 4. Smart Traffic & Departure Computation Architecture

The system connects real-time queue velocity with dynamic road transit conditions via Google Maps Routes API.

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ Redis Live Queue Speed │      │ Google Maps Routes API  │      │ Patient GPS Coordinates │
│ (Avg 6.2 mins/patient) │      │ (Live Bengaluru Traffic)│      │    (Android Location)   │
└───────────┬────────────┘      └────────────┬────────────┘      └────────────┬────────────┘
            │                                │                                │
            └───────────────────────┬────────┴────────────────────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │ Departure Intelligence Service       │
                 │                                      │
                 │ Target Time = Turn Estimated Slot    │
                 │ Leave Time  = Target - (Transit+15m) │
                 └──────────────────┬───────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │                                               │
    Wait Time Stable                                 Sudden Clinic Delay
    "Leave in 20 min" Alert                         "Doctor delayed by 25m.
                                                     Delay departure."
```

### 4.1 Caching & Cost Optimization
- Google Routes API queries are cached per geo-hash cell (geohash level 6, $\approx 1.2\text{ km}$) with a 10-minute TTL to prevent cost inflation while maintaining operational traffic accuracy.

---

## 5. Security, Cryptography & Compliance Architecture

### 5.1 Data Protection Invariants
- **Data in Transit:** TLS 1.3 mandated across all ingress controllers; legacy SSL/TLS 1.0/1.1 rejected.
- **Data at Rest:** Transparent Data Encryption (TDE) on PostgreSQL storage volumes via AWS KMS / Cloud KMS with AES-256.
- **Medical File Storage:** Prescriptions and lab reports stored in private S3 buckets accessed solely via time-limited (15-minute) pre-signed URLs.

### 5.2 Tamper-Evident Digital Prescriptions
Every generated prescription PDF embeds:
1. Cryptographic SHA-256 hash of the clinical record.
2. Doctor's registered digital signature key.
3. 2D DataMatrix barcode encoding verification URL: `https://verify.smartclinicos.in/rx/{uuid}` for instant pharmacy verification.

---

## 6. Deployment & Infrastructure Architecture

```
                                  KUBERNETES CLUSTER (EKS / VPS)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Ingress NGINX Controller (Cert-Manager Auto SSL / Let's Encrypt)                       │
│                                                                                        │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐   │
│  │ Web Pod: Clinic App    │  │ Web Pod: Super Admin   │  │ Web Pod: Provider Web  │   │
│  │ (Next.js Node SSR - 3x)│  │ (Next.js Node SSR - 2x)│  │ (Next.js Node SSR - 2x)│   │
│  └────────────────────────┘  └────────────────────────┘  └────────────────────────┘   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ API Gateway / Backend Service (Node.js/Express Pods - 6x Horizontal Auto-scale) │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ BullMQ Background Workers (PDF Generation, FCM, WhatsApp, Transit Sync - 4x)    │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
          │                                                               │
┌─────────▼──────────────────────────────────┐         ┌──────────────────▼──────────────┐
│ Managed PostgreSQL 16 (Multi-AZ Master +   │         │ Managed Redis 7 Cluster         │
│ Read Replica + PgBouncer Pooler)           │         │ (In-Memory Queue & Locks)       │
└────────────────────────────────────────────┘         └─────────────────────────────────┘
```
