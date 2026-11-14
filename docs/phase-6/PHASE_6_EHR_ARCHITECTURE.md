# Smart Clinic OS — Phase 6 EHR Architecture

---

## 1. Architectural Philosophy

Smart Clinic OS adheres to a **clinical-first, auditable, and immutable** Electronic Health Record architecture tailored for the Indian healthcare ecosystem.

Key architectural tenets:
1. **Separation of Encounters and Records:** Consultations generate encounter records, which in turn spawn immutable clinical artifacts (Prescription PDF, Lab Results).
2. **Deterministic PDF Rendering:** ReportLab templates guarantee identical vector PDF rendering regardless of client operating system or browser font engines.
3. **Multi-Tenant Scoping:** All EHR data partitions cleanly by `clinic_id`. Patient cross-clinic access requires explicit `record_sharing_consents` verified via tenant context middleware.
4. **Pure Clinical Decision-Making:** Clinical software must assist doctors, never replace them. We enforce zero AI dose calculation or unverified automated modifications.

---

## 2. Component Diagram

```
[ Next.js Clinic Web ]          [ Flutter Patient App ]
         |                                 |
         +----------------+----------------+
                          |
             [ HTTPS REST API / JWT ]
                          |
             [ Tenant Context Guard ]
                          |
            [ EHR Business Service ]
         /           |            \
[ ReportLab PDF ] [ Local/S3 Storage ] [ PostgreSQL 16 ]
```

---

## 3. Data Flow for Prescription Finalization

1. Doctor clicks **Finalize & Publish Rx** in Next.js Consultation Workspace.
2. Web client dispatches `POST /api/v1/clinic/ehr/prescriptions/{id}/finalize` with `X-Clinic-ID`.
3. Backend checks `consultation.create` permission of the doctor.
4. Database session locks prescription row, verifies state is `DRAFT`.
5. `pdf_generator.py` compiles metadata, QR verification code, and vector layouts into an in-memory PDF buffer.
6. SHA-256 checksum is computed over the binary stream.
7. PDF is saved to configured secure storage (`storage/tenants/{clinic_id}/prescriptions/`).
8. State transitions to `PUBLISHED`, database transaction commits, and an audit trail entry is persisted.
9. Patient mobile app receives notification of new published prescription via WebSocket/FCM.

