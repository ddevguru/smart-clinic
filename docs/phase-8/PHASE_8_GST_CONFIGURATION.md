# SMART CLINIC OS — PHASE 8 GST CONFIGURATION
## Goods and Services Tax (GST) Architecture for Healthcare SaaS in India

---

## 1. Statutory Compliance Framework

Smart Clinic OS Technologies Pvt Ltd is headquartered in Bengaluru, Karnataka, India (State Code: `29`).
- **Platform GSTIN:** `29AABCS1429B1Z8`
- **Applicable Tax Rate:** 18.00%
- **HSN / SAC Code:** `998313` (Information technology (IT) software and application services)

---

## 2. Tax Determination Engine: Place of Supply

The tax breakdown is automatically determined based on the clinic's **Place of Supply**:

### Scenario A: Intrastate Supply (Clinic located in Karnataka)
- Applicable Tax: **CGST (9.00%) + SGST (9.00%)**
- Total Tax: 18.00%
- Example (PRO Monthly Plan @ ₹4,999.00):
  - Base Subtotal: ₹4,999.00
  - CGST @ 9%: ₹449.91
  - SGST @ 9%: ₹449.91
  - Total Tax: ₹899.82
  - **Invoice Total:** ₹5,898.82

### Scenario B: Interstate Supply (Clinic located outside Karnataka, e.g., Maharashtra, Delhi, Tamil Nadu)
- Applicable Tax: **IGST (18.00%)**
- Total Tax: 18.00%
- Example (PRO Monthly Plan @ ₹4,999.00):
  - Base Subtotal: ₹4,999.00
  - IGST @ 18%: ₹899.82
  - **Invoice Total:** ₹5,898.82

---

## 3. Clinic Legal Entity & Tax Dossier

Table `billing_profiles` stores customer tax identity:
- `legal_business_name`: Registered clinic business or partnership name.
- `gstin`: 15-character GST Identification Number (validated for input tax credit eligibility).
- `pan`: 10-character Permanent Account Number.
- `place_of_supply`: e.g., `Karnataka (29)` or `Maharashtra (27)`.
- `billing_address`: Statutory address printed on all tax invoices.

