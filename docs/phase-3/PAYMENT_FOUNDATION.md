# Smart Clinic OS — Payment Foundation, Ledger & Digital Receipts
**Phase 3 Deliverable • Indian Healthcare SaaS Platform**

---

## 1. Executive Summary & Financial Architecture

In Indian clinics, the majority of outpatient consultations are settled immediately at the reception desk via UPI (Google Pay, PhonePe, Paytm, BHIM), Cash, or Point-of-Sale (POS) Cards. 

Smart Clinic OS implements an **Append-Only Payment Ledger** that guarantees financial integrity, regulatory compliance under Indian GST and Income Tax regulations, and seamless support for printable receipts.

---

## 2. Core Billing Database Models

### 2.1 `PaymentRecord` (`payment_records` table)
- `id`: UUID Primary Key.
- `clinic_id`: Tenant identifier (FK `clinics.id`).
- `patient_id`: Patient identifier (FK `patients.id`).
- `appointment_id`: Consultation visit identifier (FK `appointments.id`, nullable).
- `receipt_number`: Unique sequential human-readable identifier (e.g. `RCP-202611-0001`).
- `amount`: Consultation fee (`NUMERIC(10, 2)`).
- `payment_method`: `UPI`, `CASH`, `CARD`, `OTHER`.
- `payment_status`: `COMPLETED`, `REFUNDED`, `ADJUSTED`.
- `payment_reference`: UPI UTR number or Card Authorization code.
- `notes`: Receptionist memo / description.
- `recorded_by_user_id`: FK `users.id` (Staff member collecting fee).
- `created_at`: UTC timestamp of payment.

### 2.2 `PaymentAdjustment` (`payment_adjustments` table)
To uphold audit compliance, completed payment records are never directly mutated or deleted when refunds or discounts occur. Instead, an auditable adjustment record is created:
- `payment_record_id`: FK `payment_records.id`.
- `adjustment_type`: `REFUND`, `DISCOUNT_CORRECTION`, `WRITE_OFF`.
- `adjustment_amount`: Exact monetary adjustment amount.
- `reason`: Mandatory text description explaining the financial correction.
- `authorized_by_user_id`: FK `users.id` (Admin/Owner authorizing adjustment).

---

## 3. Receipt Generation & Numbering Standard

Smart Clinic OS generates sequential receipt numbers following the standard:
$$\text{Receipt Number} = \text{RCP-YYYYMM-XXXX}$$
- `RCP`: Receipt prefix.
- `YYYYMM`: Current calendar year and month (e.g., `202611` for November 2026).
- `XXXX`: Sequential 4-digit counter per month with collision fallback to unique hex tokens.

### Receipt Payload Format (`GET /api/v1/clinic/payments/<id>/receipt`):
```json
{
  "receipt_number": "RCP-202611-0001",
  "amount": 600.00,
  "payment_method": "UPI",
  "payment_status": "COMPLETED",
  "payment_reference": "UPI-UTR-9876543210",
  "payment_date": "2026-11-11T10:45:00Z",
  "clinic": {
    "name": "Apollo Care Clinic",
    "phone": "+918041234567",
    "email": "contact@apolloclinic.com",
    "address": "Indiranagar, Bengaluru"
  },
  "patient": {
    "name": "Arjun Singhania",
    "phone": "+919845112233",
    "gender": "MALE",
    "blood_group": "O+"
  },
  "appointment": {
    "date": "2026-11-11",
    "time": "10:30",
    "doctor_name": "Dr. Sunita Deshmukh",
    "doctor_specialty": "Pediatrics",
    "branch_name": "Indiranagar Main Clinic"
  },
  "recorded_by": "Kavita Nair (Receptionist)"
}
```

---

## 4. Frontend Receipt Modal & Browser Printing
- Clickable receipt preview from any checked-in, waiting, or completed appointment.
- Clean typography formatted with clinic header, tax details, patient info, and consultation charges.
- One-click `Print Receipt` triggering browser native printing (`window.print()`).

