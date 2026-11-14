# Smart Clinic OS — Open Decisions, Assumptions & Clinical Invariants

**Document ID:** SCO-P0-DOC-011  
**Version:** 1.0.0 (Phase 0 Deliverable)  
**Status:** Under Active Stakeholder Review  
**Rule:** No critical business, clinical, or legal rule shall be silently assumed.  

---

## 1. Decision Log & Review Matrix

| Decision ID | Domain | Dilemma / Topic | Status | Recommended Resolution |
| :--- | :--- | :--- | :---: | :--- |
| **DEC-001** | Clinical / Legal | Digital Signature Standard for Prescriptions | OPEN | Implement Class 3 DSC USB Token integration or Aadhaar e-Sign for legal non-repudiation under IT Act Section 5. Phase 0 uses cryptographic SHA-256 hash stamp. |
| **DEC-002** | Product / Queue | Token Allocation Policy for Walk-ins vs Fixed Slots | OPEN | Interleaved Dynamic Ratio: In a 40-patient OPD session, 24 tokens (60%) reserved for pre-booked fixed slots; 16 tokens (40%) dynamically slotted for walk-in arrivals. |
| **DEC-003** | Business / SaaS | Convenience Fee Model for Live Queue & Departure Alerts | OPEN | Clinic's choice: Clinic absorbs SaaS fee entirely (zero patient friction) OR Patient pays ₹10 convenience fee for real-time traffic tracking. |
| **DEC-004** | Home Healthcare | Clinical Responsibility & Escrow Release Triggers | OPEN | Dual-Party Handshake: Home care fee released only after patient signs digital OTP completion AND provider uploads clinical procedure checklist. |
| **DEC-005** | Legal / DPDP | Minor Dependent Consent (<18 years old) | OPEN | Mandatory declaration of parental/guardian identity during child dependent profile creation, in accordance with DPDP Act Section 9 guidelines. |
| **DEC-006** | Technical | Google Maps Routes Cost Optimization Strategy | OPEN | Cache routes by 1.2km geohash cells with 10-min TTL. Query API only when doctor is within 4 tokens of the patient. Caps API cost by ~78%. |
| **DEC-007** | Clinical | Schedule H/H1 vs Schedule X Drug Prescriptions | OPEN | Hard-lock: Schedule X substances prohibited entirely from teleconsultation/app; Schedule H/H1 drugs flagged with mandatory dosage confirmation modal. |
| **DEC-008** | Regulatory | ABDM (Ayushman Bharat Digital Mission) Integration Timing | OPEN | Build ABHA-ready data schemas in Phase 0–2; undergo official National Health Authority (NHA) Sandbox M1/M2/M3 certification during Phase 7. |

---

## 2. Working Assumptions in Phase 0

1. **Connectivity Assumption:** Clinics possess stable broadband (minimum 10 Mbps) at reception and doctor desks, with local browser caching to survive transient 2–3 minute outages without data loss.
2. **Payment Collection Assumption:** Over 65% of Indian outpatient clinic payments occur via physical cash or static/dynamic UPI QR codes at the reception desk; online pre-payments are optional.
3. **Hardware Assumption:** Clinic front-desks utilize standard Windows 10/11 or macOS desktop computers with thermal POS slip printers (Esc/POS standard USB/Bluetooth) for physical token printouts.
4. **Doctor User Experience Assumption:** Doctors will reject any EMR requiring more than 60 seconds per routine prescription. Clinical UI must prioritize speed, keyboard shortcuts, pre-built drug kits, and auto-complete over exhaustive academic forms.

---

## 3. Explicit Prohibitions & Anti-Goals in Phase 0

- ❌ **No Production Backend Implementation:** Phase 0 strictly avoids premature production backend deployment until requirements, architecture, and prototype usability are approved.
- ❌ **No Tailwind CSS:** Adhering to technical constraint, all prototype styles and UI components must be implemented in clean, semantic, pure CSS or CSS Modules.
- ❌ **No Real Payment Gateways in Prototype:** All payment simulations use realistic mock UPI, Cash, and Card verification loops.
- ❌ **No Fake Health Sensor Claims:** The patient app shall never pretend to measure real-time blood pressure or heart rate through the smartphone screen; all health metrics are explicitly categorized as synced clinical records or manual vitals entries.
