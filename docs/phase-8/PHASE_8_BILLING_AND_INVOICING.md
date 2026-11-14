# SMART CLINIC OS — PHASE 8 BILLING & INVOICING
## Sequential GST Invoicing, PDF Generation & Multi-Tenant Audit

---

## 1. Overview & Invoice Lifecycle

Every verified subscription payment generates a sequential, non-repudiable Tax Invoice. Invoices serve as statutory documentation for clinic business accounting and GST tax credits.

```
Payment Verified -> Generate INV-YYYYMM-XXXX -> Determine Place of Supply (CGST+SGST / IGST)
                 -> Save to DB -> Render PDF via pdfkit -> Storage on Disk -> Downloadable
```

---

## 2. Sequential Numbering Specification

- Format: `INV-YYYYMM-XXXX`
  - `INV`: Invoicing prefix.
  - `YYYYMM`: 4-digit year + 2-digit month (e.g. `202611`).
  - `XXXX`: Zero-padded 4-digit sequence per calendar month (e.g. `0001`, `0002`).
- Example: `INV-202611-0001`
- Guarantees sequential order and eliminates gaps or conflicting invoice IDs.

---

## 3. PDF Invoice Generation (`pdfkit`)

Invoices are dynamically rendered to PDF using `pdfkit` in `server/src/services/invoiceService.js`:
- **Header:** Smart Clinic OS logo, platform legal entity name (`Smart Clinic OS Technologies Pvt Ltd`), platform GSTIN (`29AABCS1429B1Z8`), corporate address.
- **Billed To Section:** Clinic legal entity name, clinic GSTIN, PAN, billing address, place of supply.
- **Invoice Metadata:** Invoice Number, Invoice Date, Billing Period (`From` & `To`), Payment Method (`RAZORPAY`), Transaction ID.
- **Line Items Table:** Plan description, SAC Code (`998313` - Information Technology Software Services), Subtotal, 18% GST calculation (CGST+SGST or IGST), Gross Total.
- **Footer:** Authorized signatory, statutory computer-generated document notice.

Files are stored securely on disk under `server/storage/invoices/<invoice_number>.pdf`.

---

## 4. Multi-Tenant Access Controls

Invoices are partitioned strictly by clinic ID. An authenticated clinic owner can download invoices only belonging to their own tenant ID:
```javascript
// Endpoint: GET /api/v1/clinic/subscriptions/invoices/:id/download
const invRes = await query(
  'SELECT * FROM subscription_invoices WHERE id = $1 AND clinic_id = $2',
  [id, req.clinicId]
);
if (invRes.rows.length === 0) {
  return res.status(404).json({ success: false, error: { message: 'Invoice not found or access denied.' } });
}
```
Cross-tenant access attempts by rogue tenants return `HTTP 404` without leaking invoice existence.

