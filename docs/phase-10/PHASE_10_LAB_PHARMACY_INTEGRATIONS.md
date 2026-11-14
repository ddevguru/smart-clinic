# SMART CLINIC OS — PHASE 10 EXTERNAL LAB & PHARMACY INTEGRATIONS
## Diagnostic Gateway, Sample Barcoding & Pharmacy Fulfillment

### 1. Diagnostic Laboratory Integration

Smart Clinic OS integrates with national diagnostic providers (e.g. Metropolis Healthcare, Dr. Lal PathLabs) for seamless laboratory ordering:

#### Workflow:
1. **Catalog Sync:** Fetches standardized test codes, fasting requirements, turnaround times, and pricing.
2. **Order Placement:** Doctor clicks "Order Diagnostic Panel" from consultation workspace.
3. **Barcode Generation:** Generates code `LAB-BC-YYYYMMDD-XXXX` for sample vial tagging.
4. **Webhook Ingestion:** Lab results are delivered asynchronously via webhook with HMAC-SHA256 signature verification.
5. **Report Delivery:** The webhook updates `diagnostic_lab_orders` to `REPORT_DELIVERED`, attaches `result_pdf_url`, and auto-attaches to the patient's EHR file.

#### HMAC Webhook Verification:
```javascript
const signature = req.headers['x-lab-signature'];
const expectedSignature = crypto
  .createHmac('sha256', lab.webhook_secret)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== expectedSignature) {
  return res.status(401).json({ success: false, error: 'Invalid HMAC signature' });
}
```

---

### 2. External Pharmacy Integration

Connects clinic digital prescriptions to retail delivery chains (Apollo Pharmacy, MedPlus):

#### Workflow:
1. **Stock Query:** Checks medication availability against partner inventory APIs.
2. **Order Dispatch:** Dispatches signed prescription and delivery coordinates to partner API.
3. **Fulfillment Tracking:** Tracks status through lifecycle:
   - `PENDING`
   - `MEDICATIONS_VERIFIED`
   - `DISPATCHED_TO_PATIENT`
   - `DELIVERED`

