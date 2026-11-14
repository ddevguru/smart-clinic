# Smart Clinic OS — End-to-End User Flows & Interaction Workflows

**Document ID:** SCO-P0-DOC-004  
**Version:** 1.0.0 (Phase 0 Deliverable)  
**Standard:** Mermaid Flowchart & Sequence Diagram Specifications  

---

## 1. Flow Index & Architecture

This document formalizes the ten foundational operational workflows across Smart Clinic OS. Every flow accounts for normal execution ("happy path"), network anomalies, clinical edge cases, and role hand-offs.

1. **Flow 1: Patient Registration & Profile Setup**
2. **Flow 2: Clinic Onboarding & Verification**
3. **Flow 3: Doctor Credentialing & Schedule Setup**
4. **Flow 4: Patient Appointment Booking (Slot vs Live Queue)**
5. **Flow 5: Receptionist Walk-in Registration & Token Generation**
6. **Flow 6: Real-Time Queue Management & Dynamic Waiting Time**
7. **Flow 7: Doctor Consultation Workspace & Clinical Examination**
8. **Flow 8: Digital Prescription Authoring & Publishing**
9. **Flow 9: Home Healthcare Provider Dispatch & Service Delivery**
10. **Flow 10: Clinic SaaS Plan Subscription & Billing Renewal**

---

## 2. Detailed Workflows

### Flow 1: Patient Registration & Profile Setup

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant App as Patient Android App
    participant Auth as Auth Microservice
    participant SMS as SMS / WhatsApp Gateway
    participant DB as PostgreSQL DB

    Patient->>App: Enters 10-Digit Mobile Number
    App->>Auth: POST /api/v1/auth/patient/otp-request
    Auth->>Auth: Generate 6-digit cryptographic OTP (TTL 120s)
    Auth->>SMS: Dispatch OTP via SMS/WhatsApp
    SMS-->>Patient: Delivers OTP SMS
    Patient->>App: Enters OTP + Grants SMS Auto-read
    App->>Auth: POST /api/v1/auth/patient/otp-verify
    alt OTP Valid & Existing User
        Auth->>DB: Query Patient Profile & Linked Family
        DB-->>Auth: Return User + Token
        Auth-->>App: JWT Access Token + Profile payload
        App-->>Patient: Navigate to Home Dashboard
    else OTP Valid & New User
        Auth-->>App: Temporary Session Token (Needs Profile)
        App-->>Patient: Prompt Full Name, Age, Gender, Pincode
        Patient->>App: Submits Demographics + Family Members
        App->>Auth: POST /api/v1/patient/profile-setup
        Auth->>DB: Insert Master Patient + Assign 14-digit SCHID
        DB-->>Auth: Created
        Auth-->>App: JWT Access Token (Full)
        App-->>Patient: Show Onboarding Success & Home Dashboard
    else OTP Invalid / Expired
        Auth-->>App: 400 Bad Request ("Invalid OTP or Expired")
        App-->>Patient: Show Error + Trigger Resend Countdown
    end
```

---

### Flow 2: Clinic Onboarding & Verification

```mermaid
flowchart TD
    A[Clinic Owner Initiates Registration] --> B[Enter Clinic Name, Type & Address]
    B --> C[Upload Clinical Establishment License & GST]
    C --> D[Specify Branch Structure: Single or Multi-Branch]
    D --> E[Super Admin Compliance Review Queue]
    E --> F{Super Admin Verification}
    F -->|Document Valid & Verified| G[Approve Clinic Account]
    F -->|Incomplete / Blurred Info| H[Reject with Clarification Notice]
    H --> B
    G --> I[Assign Clinic UUID & Initialize Branch Tenancy]
    I --> J[Owner Receives Activation Link & Sets Admin Password]
    J --> K[Clinic Dashboard Activated in Sandbox Mode]
```

---

### Flow 3: Doctor Credentialing & Schedule Setup

```mermaid
flowchart TD
    A[Clinic Admin or Doctor enters Doctor Profile] --> B[Enter NMC/State Medical Council Reg No, Degree, Specialty]
    B --> C[Upload Medical Degree & Council Registration Certificate]
    C --> D[Define Branch Affiliations & Consulting Rooms]
    D --> E[Configure OPD Schedule Matrix: Mon-Sat, 9AM-1PM, 5PM-9PM]
    E --> F[Select Queue Operating Model]
    F --> G1[Fixed Slots: 15 min increments]
    F --> G2[Virtual Live Queue: Max 40 tokens/session]
    F --> G3[Hybrid Mode: 60% Slots + 40% Live Queue]
    G1 --> H[Set Consultation Fees: In-Person / Video]
    G2 --> H
    G3 --> H
    H --> I[NMC License Cross-Validation & Clinic Activation]
    I --> J[Doctor Live on Patient Discovery Engine]
```

---

### Flow 4: Patient Appointment Booking (Hybrid: Slot vs Live Queue)

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant App as Patient App
    participant Discovery as Discovery API
    participant Booking as Booking Engine (Redis + DB)
    participant Maps as Google Routes API

    Patient->>App: Search Specialty ("Pediatrician") or Clinic
    App->>Discovery: GET /api/v1/discovery/search?lat=12.97&lng=77.59
    Discovery-->>App: List of Verified Clinics & Available Doctors
    Patient->>App: Selects Dr. Sunita Deshmukh & Views Clinic Details
    App->>Patient: Present Booking Options: [1] Fixed Time Slot | [2] Live Virtual Queue
    alt Option 1: Fixed Time Slot
        Patient->>App: Select Date + Available Slot (e.g. 5:30 PM)
        App->>Booking: POST /api/v1/appointments/reserve-slot
        Booking->>Booking: Acquire Redis Mutex Lock on Slot
        Booking-->>App: Slot Reserved (5-minute lock window)
        Patient->>App: Select Patient/Family Dependent & Confirm
        App->>Booking: POST /api/v1/appointments/confirm
        Booking-->>App: Booking Confirmed (Slot: 5:30 PM, Ref: APT-8921)
    else Option 2: Live Virtual Queue (Same Day)
        Patient->>App: Request Live Queue Token for Today's Evening OPD
        App->>Booking: POST /api/v1/queue/join-token
        Booking->>Booking: Atomic Increment Token Counter (Redis)
        Booking->>Booking: Calculate Estimated Wait Time based on Queue Pace
        Booking-->>App: Issued Token #14 (7 Patients Ahead, Est. Wait: 42 mins)
        App->>Maps: GET /api/v1/transit/departure-estimate?origin=PatientGPS&dest=ClinicGPS
        Maps-->>App: Travel Time: 22 mins via Outer Ring Rd
        App-->>Patient: Dynamic Departure Advisory: "Leave home at 5:45 PM"
    end
```

---

### Flow 5: Receptionist Walk-in Registration & Token Generation

```mermaid
flowchart TD
    A[Patient Arrives at Clinic Reception Desk] --> B{Existing Patient in System?}
    B -->|Yes| C[Receptionist Enters Mobile Number: Instant Auto-Lookup]
    B -->|No| D[Rapid Walk-in Form: Name, Age, Gender, Phone]
    D --> E[Create Lightweight Patient Record & Assign SCHID]
    C --> F[Select Doctor and Consultation Reason]
    E --> F
    F --> G[System Validates Doctor's Active OPD Session]
    G --> H[Click 'Issue Token' - Atomically Interleaved in Queue]
    H --> I[Print Thermal Slip with Token # & QR Code]
    I --> J[SMS/WhatsApp Token Link sent to Patient Mobile]
    J --> K[Queue LED / TV Display Board Updates Automatically]
    K --> L[Receptionist Collects Consultation Fee: Cash or Dynamic UPI QR]
```

---

### Flow 6: Real-Time Queue Management & Dynamic Waiting Time

```mermaid
sequenceDiagram
    autonumber
    actor Doctor
    actor Patient
    participant Rec as Receptionist Dashboard
    participant WS as Socket.IO Queue Server
    participant Redis as Redis Queue State
    participant Maps as Google Routes Engine

    Doctor->>WS: Doctor completes Token #8 & Clicks "Call Next (Token #9)"
    WS->>Redis: Update Status: Token #8 = COMPLETED, Token #9 = IN_CONSULTATION
    WS->>WS: Recalculate Wait Times for Tokens #10 through #25
    WS-->>Rec: Broadcast Updated Live Queue State
    WS-->>Patient: Push Notification to Token #12 (Patient App)
    Note over Patient: "Doctor has started Token #9. You are Token #12 (3 ahead)."
    
    alt Emergency Case Arrives at Reception
        Rec->>WS: POST /api/v1/queue/emergency-insert (Reason: "Severe Asthma Attack")
        WS->>Redis: Insert Token-EMG ahead of current queue
        WS-->>Doctor: High-Priority Visual Banner: "Emergency Patient Waiting"
        WS-->>Patient: Dynamic Adjustment: "Queue delayed by ~15 mins due to emergency case."
        WS->>Maps: Recompute patient departure recommendation
    end
```

---

### Flow 7 & 8: Doctor Consultation Workspace & Prescription Publishing

```mermaid
sequenceDiagram
    autonumber
    actor Doctor
    participant DocUI as Doctor Web Workspace
    participant API as Clinical API
    participant DB as PostgreSQL
    participant PDF as PDF Signature Engine
    participant Push as Notification Gateway

    Doctor->>DocUI: Selects Patient (Token #9)
    DocUI->>API: GET /api/v1/patients/{id}/clinical-summary
    API-->>DocUI: Past Prescriptions, Allergies, Chronic Conditions, Vitals
    Doctor->>DocUI: Records Vitals: BP 120/80, Pulse 76, Temp 98.6°F
    Doctor->>DocUI: Enters Diagnosis (ICD-10 / Text: "Acute Upper Respiratory Infection")
    Doctor->>DocUI: Selects Prescription Kit ("Viral URI Standard Kit")
    DocUI->>DocUI: Auto-populates 3 medications with dosage, frequency & duration
    Doctor->>DocUI: Modifies specific drug dosage + Adds advice: "Steam inhalation twice daily"
    Doctor->>DocUI: Sets Follow-Up Date ("In 4 Days")
    Doctor->>DocUI: Clicks "Sign & Publish Prescription"
    DocUI->>API: POST /api/v1/prescriptions/publish
    API->>API: Validate Doctor NMC Registration & Active Credential
    API->>DB: Save Prescription Record (Immutable Encrypted JSON)
    API->>PDF: Generate Tamper-evident Signed PDF with Clinic Header & Rx Barcode
    PDF-->>API: Generated rx_8921_signed.pdf
    API->>Push: Trigger Push & WhatsApp dispatch to Patient
    Push-->>Doctor: Success Notification + Moves Queue to Next Token
```

---

### Flow 9: Home Healthcare Provider Dispatch & Service Delivery

```mermaid
flowchart TD
    A[Patient Selects Home Healthcare: 'Wound Dressing & Injection'] --> B[Enter Home Address & Select Preferred Time Window]
    B --> C[Payment Held in Secure Escrow / Authorization]
    C --> D[System Broadcasts Dispatch to Verified Nurses within 8km]
    D --> E{Nurse Sister Mary Accepts Dispatch within 90s}
    E -->|No| F[Escalate Broadcast Radius to 12km]
    E -->|Yes| G[Lock Provider Assignment & Share Route with Patient]
    G --> H[Nurse Navigates via Built-in Maps to Patient Residence]
    H --> I[Nurse Arrives: Patient App generates 4-digit Arrival OTP]
    I --> J[Nurse Enters OTP on Provider App: Session Formally Started]
    J --> K[Nurse Performs Clinical Procedure following Digital Checklist]
    K --> L[Upload Clinical Notes / Wound Photo for Record]
    L --> M[Patient Enters Completion Signature on App]
    M --> N[Escrow Funds Released to Nurse Payout Wallet]
```

---

### Flow 10: Clinic SaaS Plan Subscription & Billing Renewal

```mermaid
flowchart TD
    A[Clinic Owner accesses Billing & Plans] --> B[Compare Starter vs Professional vs Enterprise Tiers]
    B --> C[Select Plan: 'Professional Annual' ₹39,990/year]
    C --> D[Apply Clinic GSTIN for Input Tax Credit]
    D --> E[Initiate Razorpay / UPI Recurring Autopay Checkout]
    E --> F{Payment Gateway Transaction}
    F -->|Success| G[Webhook: invoice.paid & subscription.activated]
    F -->|Failed| H[Show Retry Modal with Alternate Payment Methods]
    G --> I[Update Clinic Tenancy Quotas: 5 Doctors, Unlimited Tokens, WhatsApp Pack]
    I --> J[Generate GST Tax Invoice & Email to Clinic Owner]
    J --> K[Log Subscription Event in Super Admin Ledger]
```
