# SMART CLINIC OS — PHASE 8 REVENUE ANALYTICS
## Super Admin Platform SaaS Financial Metrics & Executive Reporting

---

## 1. Executive Metrics Overview

The Super Admin Revenue Engine computes real-time SaaS platform health:

1. **Monthly Recurring Revenue (MRR):**
   $$\text{MRR} = \sum_{\text{Active Monthly Subs}} \text{Monthly Price} + \sum_{\text{Active Annual Subs}} \frac{\text{Yearly Price}}{12}$$
2. **Annual Recurring Revenue (ARR):**
   $$\text{ARR} = \text{MRR} \times 12$$
3. **Active Paying Clinics:** Count of verified, active subscriptions on non-TRIAL tiers.
4. **SaaS Churn Rate:**
   $$\text{Churn Rate} = \frac{\text{Cancelled Subscriptions}}{\text{Total Subscriptions}} \times 100$$
5. **Trial-to-Paid Conversion Rate:**
   $$\text{Conversion Rate} = \frac{\text{Active Paid Subscriptions with Previous Trial}}{\text{Total Trial Subscriptions}} \times 100$$

---

## 2. API Endpoints

- `GET /api/v1/admin/revenue/analytics`:
  Returns consolidated financial KPIs, status distribution, and plan breakdown.
- `GET /api/v1/admin/revenue/export`:
  Exports full payment history as downloadable CSV file (`text/csv`).
- `GET /api/v1/admin/subscriptions`:
  Lists all clinic accounts, active plan, current cycle start/end, and billing status.
- `POST /api/v1/admin/subscriptions/:id/manual-adjustment`:
  Authoritative administrator override with mandatory justification logged in `subscription_audit_logs`.

---

## 3. CSV Export Format

The CSV export endpoint streams structured financial data:
```csv
Payment ID,Order ID,Gateway Payment ID,Clinic,City,Plan,Subtotal,Tax (18% GST),Total Amount,Currency,Status,Paid At
"sp-1","order_xxx","pay_xxx","CarePlus Family Clinic","Bengaluru","Professional Clinic Suite",4999.00,899.82,5898.82,"INR","SUCCESS","2026-11-12T20:00:00.000Z"
```

