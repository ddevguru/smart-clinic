# Smart Clinic OS — Multi-Tenancy Architecture & Data Isolation

**Document ID:** SCO-P1-TENANT-001  
**Version:** 1.0.0 (Phase 1 Baseline)  
**Model:** Shared Database, Shared Schema with Logical Partitioning & Row-Level Security (RLS)  

---

## 1. Tenancy Model Overview

Smart Clinic OS supports hundreds of autonomous clinics, polyclinics, and multi-branch healthcare chains on a unified infrastructure while guaranteeing complete logical separation.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHYSICAL POSTGRESQL DATABASE                    │
├────────────────────────────────────────────────────────────────────────┤
│ TABLE: clinics (Tenant master entity)                                  │
│ TABLE: clinic_memberships (Maps users to clinics under specific roles) │
├────────────────────────────────────────────────────────────────────────┤
│ TENANT-BOUND BUSINESS ENTITIES:                                        │
│ • appointments (clinic_id FK)                                          │
│ • queue_tokens (clinic_id FK)                                          │
│ • consultations (clinic_id FK)                                         │
│ • prescriptions (clinic_id FK)                                         │
│ • payments (clinic_id FK)                                              │
├────────────────────────────────────────────────────────────────────────┤
│ ISOLATION ENFORCEMENT:                                                 │
│ Layer 1: Application-level @require_tenant_membership decorator        │
│ Layer 2: Service-layer query binding (filter_by(clinic_id=...))        │
│ Layer 3: Database PostgreSQL Row-Level Security (RLS) Policies         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Invariants & Tenant Security Rules

1. **Client Trust Invariant:** Never trust a `clinic_id` supplied in HTTP headers, URL parameters, or request JSON bodies without cryptographic JWT authentication AND database membership validation.
2. **Context Resolution:** The `@require_tenant_membership(permission_code)` decorator:
   - Queries `clinic_memberships` for `user_id == current_user.id` and `clinic_id == target_clinic_id` where `status == 'ACTIVE'`.
   - If not found, immediately terminates execution with `403 TENANT_ACCESS_DENIED`.
   - Binds verified `g.tenant_clinic_id` and `g.tenant_membership`.
3. **Query Scoping:** Every service repository method operating on clinic data is passed the verified `clinic_id` and must apply it as an explicit predicate filter.
4. **Super Admin Exception:** Platform Super Admins can access cross-clinic data exclusively through explicitly verified routes with full audit trail logging.

---

## 3. PostgreSQL Row-Level Security (RLS) Roadmap

To provide defense-in-depth against application-layer bugs or SQL injection vulnerabilities, PostgreSQL Row-Level Security will be activated across tenant-scoped tables:

```sql
-- 1. Enable RLS on target tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- 2. Define tenant isolation policy bound to session setting
CREATE POLICY tenant_isolation_policy ON appointments
    FOR ALL
    TO smart_clinic_app_user
    USING (clinic_id = current_setting('app.current_clinic_id', true)::uuid);

-- 3. In SQLAlchemy connection event listener:
-- Every request sets the session variable before queries execute:
-- SET LOCAL app.current_clinic_id = 'clinic-uuid-here';
```

---

## 4. Multi-Branch Clinic Chains

For chains with 2 to 50 clinics:
- Each branch has its own unique `clinic_id`.
- Chain owners possess a `CLINIC_OWNER` membership in each branch.
- Unified roll-up reporting queries branches owned by the same managing user without breaking branch-level front-desk operational isolation.

