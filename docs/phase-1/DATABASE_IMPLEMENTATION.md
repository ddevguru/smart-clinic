# Smart Clinic OS — Database Implementation & Migration Guide

**Document ID:** SCO-P1-DB-001  
**Version:** 1.0.0 (Phase 1 Baseline)  
**Engine:** PostgreSQL 16+ (PostgreSQL 18.3 local instance verified)  
**ORM:** SQLAlchemy 2.0.57 + Flask-SQLAlchemy 3.1.1  
**Migration Tool:** Alembic 1.14.1 / Flask-Migrate 4.0.7  
**Active Migration Head:** `c10af94057b2_initial_phase_1_core_backend_models.py`  

---

## 1. Declarative Entities & Schema Specifications

All models inherit from `DeclarativeBase` via `backend/app/extensions/database.py` and mix in `UUIDPrimaryKeyMixin` and `TimestampMixin`.

### 1.1 Table: `users`
Central identity store for all system personas.
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_users_phone_number ON users (phone_number);
CREATE INDEX ix_users_email ON users (email);
```

### 1.2 Table: `clinics`
Tenant clinical organizations.
```sql
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    clinic_type VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
    registration_number VARCHAR(64),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(64),
    state VARCHAR(64),
    postal_code VARCHAR(16),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    verification_status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_clinics_slug ON clinics (slug);
CREATE INDEX ix_clinics_city ON clinics (city);
CREATE INDEX ix_clinics_postal_code ON clinics (postal_code);
```

### 1.3 Table: `clinic_memberships`
Role-based tenant association table.
```sql
CREATE TABLE clinic_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_clinic_user_role UNIQUE (clinic_id, user_id, role_id)
);
CREATE INDEX ix_clinic_memberships_clinic_id ON clinic_memberships (clinic_id);
CREATE INDEX ix_clinic_memberships_user_id ON clinic_memberships (user_id);
CREATE INDEX ix_clinic_memberships_role_id ON clinic_memberships (role_id);
```

### 1.4 Tables: `roles`, `permissions`, `role_permissions`
Granular RBAC catalogs.
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(32) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_roles_name ON roles (name);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_permissions_code ON permissions (code);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);
CREATE INDEX ix_role_permissions_role_id ON role_permissions (role_id);
CREATE INDEX ix_role_permissions_permission_id ON role_permissions (permission_id);
```

### 1.5 Table: `otp_verifications`
Cryptographic challenge tracker.
```sql
CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(128) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    resend_available_at TIMESTAMPTZ NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_otp_verifications_phone_number ON otp_verifications (phone_number);
CREATE INDEX ix_otp_verifications_expires_at ON otp_verifications (expires_at);
```

### 1.6 Table: `audit_logs`
Immutable regulatory compliance event journal.
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    request_id VARCHAR(64),
    ip_address VARCHAR(45),
    details JSON,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_audit_logs_actor_user_id ON audit_logs (actor_user_id);
CREATE INDEX ix_audit_logs_clinic_id ON audit_logs (clinic_id);
CREATE INDEX ix_audit_logs_action ON audit_logs (action);
CREATE INDEX ix_audit_logs_resource_type ON audit_logs (resource_type);
CREATE INDEX ix_audit_logs_created_at ON audit_logs (created_at);
```

---

## 2. Migration Execution & CLI Reference

```bash
# Initialize Alembic migrations environment
flask --app wsgi:app db init

# Generate migration revision based on model changes
flask --app wsgi:app db migrate -m "Migration description"

# Apply pending migrations to PostgreSQL database
flask --app wsgi:app db upgrade

# Revert previous migration step
flask --app wsgi:app db downgrade

# Seed standard roles and default permission mappings
flask --app wsgi:app seed-roles
```

