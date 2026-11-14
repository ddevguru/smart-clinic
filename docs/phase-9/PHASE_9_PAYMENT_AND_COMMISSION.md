# PHASE 9 — PAYMENT SPLIT & PLATFORM COMMISSION LEDGER

## 1. Commercial & Economic Model

The Home Healthcare Marketplace operates on a monetized revenue-share model:
- **Platform Commission:** **15%** of the gross clinical service fee.
- **Provider / Clinic Payout:** **85%** of the clinical service fee.
- **Travel Fee:** 100% passed through to the provider to offset fuel and transportation costs.

---

## 2. Mathematical Split Formula

For a booking with Base Price $P_{\text{service}}$ and Travel Charge $T$:

$$\text{Subtotal} = P_{\text{service}} + T$$
$$\text{Tax (18% GST)} = \text{Subtotal} \times 0.18$$
$$\text{Total Patient Paid} = \text{Subtotal} + \text{Tax}$$
$$\text{Platform Commission} = P_{\text{service}} \times 0.15$$
$$\text{Provider Net Receivable} = (P_{\text{service}} \times 0.85) + T$$

### Numerical Example (Nurse Wound Dressing):
- Base Service Price: ₹650.00
- Travel Charge (5 km): ₹50.00
- Subtotal: ₹700.00
- GST (18%): ₹126.00
- **Total Patient Payment:** ₹826.00
- **Platform Commission (15% of ₹650):** ₹97.50
- **Provider Receivable (85% of ₹650 + ₹50 travel):** ₹552.50 + ₹50.00 = ₹602.50

---

## 3. Payout Settlement Lifecycle

1. **Escrow Hold:** Upon patient payment, funds are held in the platform escrow account.
2. **Clinical Finalization:** Payout is unlocked only when the booking status reaches `COMPLETED` and clinical observations are signed.
3. **Disbursement:** Disbursed via Razorpay Route API on a T+1 business day settlement cycle directly to the provider's verified bank account.
4. **GST Invoicing:** Formal GST Tax Invoice generated with SAC Code `999312`.

