# SMART CLINIC OS — PHASE 8 CLINIC ANALYTICS
## Clinic Operational Analytics, Dual Financial Separation & Net OPD Margin

---

## 1. Dual Financial Separation Architecture

A central requirement of Phase 8 is the strict separation between two independent financial workflows:

```
+------------------------------------------------------------------------------------+
|                               SMART CLINIC OS PLATFORM                             |
+------------------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
[ WORKFLOW A: PATIENT OPD BILLING ]              [ WORKFLOW B: SAAS SUBSCRIPTION ]
- Paid by: Patients to Clinics                   - Paid by: Clinics to Platform
- Stored in: payment_records                     - Stored in: subscription_payments
- Nature: Clinic Top-Line Revenue                - Nature: Clinic Operating Expense
- Receipts: RCP-YYYYMMDD-XXXX                    - Invoices: INV-YYYYMM-XXXX
         |                                                         |
         +----------------------------+----------------------------+
                                      |
                                      v
                  [ NET CLINIC OPERATIONAL MARGIN ]
              = Total OPD Collections - Total SaaS Software Fees
```

---

## 2. Metrics Computed in Clinic Executive Analytics

### A. Patient Volume & Appointment Velocity
- `total_registered_patients`: Total patient profiles tied to this clinic tenant.
- `new_patients_this_month`: Patient registrations in current calendar month.
- `completion_rate_pct`: Completed consultations over total scheduled visits.
- `cancellation_rate_pct`: Percentage of appointments cancelled by patients or clinic.
- `channel_distribution`: Ratio of online appointments vs rapid receptionist walk-in check-ins.

### B. Doctor Performance & OPD Caseload
- Breakdown per doctor: specialty, qualification, total appointments assigned, and completed consultations.

### C. Financial Collections vs SaaS Expense
- `patient_consultation_collections`: Sum of verified `PAID` records from `payment_records`.
- `platform_saas_subscription_expense`: Sum of verified `SUCCESS` payments from `subscription_payments`.
- `net_clinic_operational_margin`: Positive net earnings remaining from OPD collections after accounting for SaaS platform software fees.
- `payment_methods`: Percentage breakdown across UPI, Cash, and Card.

---

## 3. API Response Contract

```json
{
  "success": true,
  "data": {
    "patients": { "total_registered": 482, "new_this_month": 34 },
    "appointments": { "total": 120, "completed": 105, "completion_rate_pct": 87.5 },
    "doctors": [ ... ],
    "financials": {
      "patient_consultation_collections": 85000.00,
      "receipts_issued_count": 105,
      "platform_saas_subscription_expense": 5898.82,
      "net_clinic_operational_margin": 79101.18,
      "currency": "INR"
    }
  }
}
```

