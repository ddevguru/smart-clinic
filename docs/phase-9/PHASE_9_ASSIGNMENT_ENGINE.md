# PHASE 9 — PROVIDER ASSIGNMENT ENGINE

## 1. Assignment Strategies

Smart Clinic OS supports two primary assignment mechanisms for home healthcare services:

### 1.1 Patient-Selected Assignment (`PATIENT_SELECTED`)
- The patient browses verified profiles (evaluating qualifications, ratings, experience, and fee).
- The patient directly selects their preferred professional (e.g. Sister Mary Varghese).
- Initial booking state: `REQUESTED`.
- The chosen provider receives a real-time notification with the option to Accept or Decline within a configured acceptance window.

### 1.2 Platform & Clinic-Assisted Dispatch (`PLATFORM_ASSISTED`)
- Used when a patient needs a service (e.g. Immediate Wound Dressing) without specifying a particular individual.
- The assignment engine executes an automated scoring algorithm:
  1. **Geographic Coverage:** Filters providers whose active service radius includes the patient's postal code.
  2. **Specialty Match:** Verifies provider capability for the requested clinical service.
  3. **Capacity Check:** Ensures provider has not exceeded their 6 visits/day limit.
  4. **Proximity & Rating Score:**
     $$\text{Score} = (0.6 \times \text{Rating}) + (0.4 \times (1 / \text{Distance}_{\text{km}}))$$
- Initial booking state: `PENDING_ASSIGNMENT` $\to$ `ASSIGNED`.

---

## 2. Rejection & Fallback Handling

If an assigned provider declines or fails to accept within the timeout:
1. Status transitions: `REQUESTED` $\to$ `PENDING_ASSIGNMENT`.
2. The assignment engine re-evaluates the queue and offers the visit to the next highest-scoring candidate.
3. If no candidate is available, the affiliated clinic front desk is alerted to dispatch a staff clinician.

