# PHASE 9 — SECURITY, RBAC & PATIENT PRIVACY

## 1. Patient Residential Address Privacy Protection

A major safety hazard in on-demand healthcare marketplaces is exposing patient addresses prematurely to unassigned or browsing clinicians.

### Address Privacy Rule
Precise street address, flat number, and GPS coordinates are **masked** as:
$$\text{"[Address Protected] Bengaluru - 560038"}$$

### Unmasking Authorization Matrix:
| Requester Identity | Booking Status | Address Visibility |
| :--- | :--- | :--- |
| **Patient Who Booked** | Any Status | **Unmasked** (Full Flat & Street) |
| **Super Admin Compliance** | Any Status | **Unmasked** (Audit Authority) |
| **Assigned Provider** | `REQUESTED`, `PENDING` | **Masked** (Locality Only) |
| **Assigned Provider** | `ACCEPTED`, `EN_ROUTE`, `ARRIVED`, `IN_PROGRESS`, `COMPLETED` | **Unmasked** (Active Route Access) |
| **Unassigned Provider** | Any Status | **Masked** (Locality Only) |
| **Public Discovery / Anonymous** | Any Status | **Masked** |

---

## 2. Role-Based Access Control (RBAC)

1. **Patient Role:**
   - Permitted: Create booking, cancel before arrival, view personal bookings, review completed visits.
   - Denied: Modify provider verification status, view another patient's records, complete booking.
2. **Healthcare Provider Role:**
   - Permitted: Accept/decline visit, update lifecycle status, document clinical vitals, view own payouts.
   - Denied: View or edit other providers' appointments, bypass verification checks.
3. **Clinic Owner Role:**
   - Permitted: View affiliated home visits, dispatch affiliated staff, track clinic home revenue.
   - Denied: Access competitor clinic dispatches or patient records outside clinic scope.
4. **Super Admin Role:**
   - Permitted: Global credential verification, provider suspension, platform fee reconciliation, system audit.

---

## 3. Review Integrity & Anti-Fraud Guard

- Reviews are accepted **strictly** for bookings in status `COMPLETED`.
- Any review attempt on `REQUESTED`, `ACCEPTED`, or `CANCELLED` bookings is rejected with HTTP 400 (`CANNOT_REVIEW_UNCOMPLETED_VISIT`).
- Duplicate reviews for the same booking reference are rejected.
- All reviews update provider average rating atomically in a database transaction.

