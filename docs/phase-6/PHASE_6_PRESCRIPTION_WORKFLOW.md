# Smart Clinic OS — Prescription Workflow & Lifecycle State Machine
## Phase 6 Clinical Governance

---

## 1. Prescription State Machine

```
      +-----------------+
      |      DRAFT      |<-------+ (Draft updates allowed)
      +--------+--------+        |
               |                 |
       [Doctor Finalizes]        |
               |                 |
      +--------v--------+        |
      |    FINALIZED    |        |
      +--------+--------+        |
               |                 |
       [Doctor Publishes]        |
               |                 |
      +--------v--------+        |
      |    PUBLISHED    |        |
      +----+-------+----+        |
           |       |             |
           |   [Doctor Corrects] | (Generates v2 with correction_reason)
           |       +-------------+
   [Doctor Voids]  
           |
      +----v----+
      |  VOIDED |
      +---------+
```

---

## 2. State Rules and Invariants

| State | Allowed Actions | Immutable? | Patient App Visible? | Public QR Status |
|---|---|---|---|---|
| `DRAFT` | Add/Edit meds, update diagnosis, delete | No | No (Hidden from patient) | Inactive |
| `FINALIZED` | Finalized vector PDF generated & hashed; ready to publish | Yes | Doctor/Clinic Only | Active Valid |
| `PUBLISHED` | View, Download PDF, Correct (v+1), Void | Yes | Yes (Full access to patient) | Active Valid |
| `VOIDED` | View audit trail; cannot be reactivated | Yes | Displayed with VOIDED stamp | Inactive/Voided |

---

## 3. Versioning Protocol (v1 -> v2)

When a doctor needs to modify a finalized prescription (e.g., patient complains of an allergic reaction or dosage adjustment is necessary):
1. The original version record (`version_number: 1`) is preserved intact in PostgreSQL.
2. A new version record (`version_number: 2`) is inserted with the updated medications and mandatory `correction_reason`.
3. The previous version's `is_latest` flag is set to `FALSE`.
4. A new PDF is generated containing a distinct header banner: `CORRECTED PRESCRIPTION (v2) — Supersedes v1`.
5. An audit log entry is recorded with action `PRESCRIPTION_CORRECTED`, linking both versions.

