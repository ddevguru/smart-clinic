# PHASE 9 — HOME HEALTHCARE BOOKING WORKFLOW

## 1. Booking Sequence & Identifier Generation

Every home visit booking receives a deterministic, human-readable, sequential reference:

$$\text{Reference Format: } \mathbf{HV\text{-}YYYYMMDD\text{-}XXXX}$$

Example:
- `HV-20261112-0001` (First home visit booked on November 12, 2026)
- `HV-20261112-0002` (Second home visit)

---

## 2. Server-Authoritative Financial Calculation

To eliminate client-side tampering, all fees, taxes, and commissions are computed server-side:

1. **Base Service Fee:** Derived from `provider_services.custom_price` or `healthcare_services.base_price`.
2. **Travel Charge:** Computed based on estimated travel distance:
   - $\le 10\text{ km} \implies \text{INR } 50.00$
   - $> 10\text{ km} \implies \text{INR } 150.00$
3. **Subtotal:**
   $$\text{Subtotal} = \text{Service Fee} + \text{Travel Charge}$$
4. **GST (18% Healthcare Supportive Services):**
   $$\text{GST} = \text{Subtotal} \times 0.18$$
5. **Total Payable:**
   $$\text{Total Amount} = \text{Subtotal} + \text{GST}$$
6. **Platform Commission (15%):**
   $$\text{Platform Commission} = \text{Service Fee} \times 0.15$$
7. **Provider Net Payout (85%):**
   $$\text{Provider Payable} = \text{Service Fee} \times 0.85$$

---

## 3. End-to-End Booking Journey

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant App as Mobile Patient App
    participant BE as Express Backend
    participant DB as PostgreSQL DB
    actor Provider

    Patient->>App: Select Service & Date/Time
    App->>BE: GET /marketplace/availability
    BE->>DB: Check shift, capacity & 30-min buffer
    DB-->>BE: Slot Available
    BE-->>App: Available = true
    
    Patient->>App: Enter Address & Confirm Booking
    App->>BE: POST /marketplace/bookings
    BE->>DB: INSERT home_visit_bookings (Status: REQUESTED)
    BE-->>App: 201 Created (HV-YYYYMMDD-XXXX)
    
    Provider->>BE: PATCH /provider/bookings/:id/status (ACCEPTED)
    BE->>DB: Update Status -> ACCEPTED
    Note over Provider,BE: Patient Address Unmasked
    
    Provider->>BE: PATCH /provider/bookings/:id/status (PROVIDER_EN_ROUTE)
    Note over Provider,App: ETA Computed & Notified
    
    Provider->>BE: PATCH /provider/bookings/:id/status (ARRIVED)
    Provider->>BE: PATCH /provider/bookings/:id/status (SERVICE_IN_PROGRESS)
    
    Provider->>BE: POST /provider/bookings/:id/complete (Clinical Notes + Vitals)
    BE->>DB: Record Vitals & Status -> COMPLETED
    BE-->>Patient: Service Complete Notification
    
    Patient->>BE: POST /marketplace/review (5 Stars)
    BE->>DB: Update Provider Avg Rating
```

