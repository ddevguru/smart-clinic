# SMART CLINIC OS — PHASE 8 DEPLOYMENT GUIDE
## Production Rollout, Migration Procedures & Operational Checklist

---

## 1. Prerequisites & Environment Variables

Ensure the following variables are defined in the production `.env`:

```env
# Application Port
PORT=5000

# PostgreSQL Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smart_clinic_os

# Razorpay Production / Test Credentials
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Storage Directory for Invoices
STORAGE_DIR=c:/clinicos/server/storage
```

---

## 2. Database Migration Steps

Execute Phase 8 schema migrations:
```bash
node server/src/migrations/migration_phase8.js
```
The migration will:
1. Create 7 new tables: `subscription_plans`, `clinic_subscriptions`, `billing_profiles`, `subscription_payments`, `subscription_invoices`, `payment_webhook_events`, `subscription_audit_logs`.
2. Seed standard plans: `TRIAL`, `BASIC`, `PRO`, `ENTERPRISE`.
3. Set initial active subscriptions for registered clinics.

---

## 3. Webhook URL Configuration on Razorpay Dashboard

1. Navigate to **Razorpay Dashboard -> Settings -> Webhooks**.
2. Click **Add New Webhook**.
3. **Webhook URL:** `https://your-domain.com/api/v1/webhooks/razorpay`
4. **Secret:** Match the value in `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events:**
   - `order.paid`
   - `payment.captured`
   - `payment.failed`

---

## 4. Verification & Smoke Test Checklist

- [x] Run health check: `curl http://localhost:5000/api/v1/health` (HTTP 200).
- [x] Run Phase 8 verification test suite: `node server/test/phase8.test.js` (50/50 Pass).
- [x] Verify Super Admin portal at `http://localhost:3000/admin` (SaaS Subscriptions tab loads MRR & ARR).
- [x] Verify Clinic Owner portal at `http://localhost:3000/owner` (Subscription & Billing tab loads current plan, capacity bars, and invoices).
- [x] Verify invoice PDF download generates valid files on disk.

