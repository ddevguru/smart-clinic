# Smart Clinic OS — Local Development & Deployment Guide (Phase 1)

**Document ID:** SCO-P1-SETUP-001  
**Version:** 1.0.0 (Phase 1 Baseline)  

---

## 1. System Prerequisites

- **Python:** 3.12+ (Installed and verified: Python 3.12.10)
- **PostgreSQL:** 16+ (Local instance verified: PostgreSQL 18.3 on port 5432)
- **Redis:** 7+ (Local instance or in-memory fallback)
- **Docker & Docker Compose:** (Optional, for containerized multi-service runtime)

---

## 2. Local Setup (Native Environment)

### Step 1: Navigate to Backend Directory
```bash
cd c:\clinicos\backend
```

### Step 2: Initialize & Activate Python 3.12 Virtual Environment
```powershell
# Windows PowerShell
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy template `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Ensure your PostgreSQL database `smart_clinic_os` and test database `smart_clinic_os_test` exist:
```sql
CREATE DATABASE smart_clinic_os;
CREATE DATABASE smart_clinic_os_test;
```

### Step 5: Execute Database Migrations
```bash
flask --app wsgi:app db upgrade
```

### Step 6: Seed Default Roles & Permissions
```bash
flask --app wsgi:app seed-roles
```

### Step 7: Run Development Server
```bash
python wsgi.py
# Server starts at http://localhost:5000
# Interactive Swagger UI: http://localhost:5000/api/v1/docs
# Health Check: http://localhost:5000/api/v1/health
```

### Step 8: Run Celery Background Worker (Separate Terminal)
```bash
celery -A wsgi.celery worker --loglevel=info
```

---

## 3. Running Automated Tests

Run the full automated test suite with verbose output:
```bash
pytest -vv
```
Run specific test categories:
```bash
# Unit tests
pytest tests/unit/ -v

# Integration tests
pytest tests/integration/ -v

# Security & Tenant Isolation tests
pytest tests/security/ -v
```

---

## 4. Docker Compose Environment (All-in-One Containerized Stack)

To run Flask API, PostgreSQL, Redis, and Celery Worker together:
```bash
cd backend
docker compose up -d --build
```
Check container logs:
```bash
docker compose logs -f api
docker compose logs -f celery_worker
```
Shut down containers:
```bash
docker compose down -v
```

