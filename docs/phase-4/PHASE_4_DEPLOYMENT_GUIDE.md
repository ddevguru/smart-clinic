# Smart Clinic OS — Phase 4 Deployment Guide

### Prerequisites
- Python 3.12+ with virtual environment in `backend/venv`
- Node.js 18+ & npm
- PostgreSQL 16+ running on `127.0.0.1:5432` with database `smart_clinic_os`
- Redis 7+ running on `127.0.0.1:6379`

---

### Step 1: Database Migration
Apply all Alembic database schema migrations:
```powershell
cd c:\clinicos\backend
.\venv\Scripts\flask.exe db upgrade
```
*Current Revision*: `0c2e95dfc72a_phase_4_hybrid_booking_and_live_queue.py`

---

### Step 2: Running the Flask Backend with Socket.IO
Start the Flask development / production WSGI server:
```powershell
cd c:\clinicos\backend
.\venv\Scripts\python.exe -m flask --app run:app run --port 5000 --host 0.0.0.0
```
API Documentation and Swagger UI is accessible at:  
`http://localhost:5000/api/v1/docs`

---

### Step 3: Running the Next.js Frontend
Start the Next.js web application:
```powershell
cd c:\clinicos
npm run dev
```
Accessible at: `http://localhost:3000`  
- Clinic Web Management: `http://localhost:3000/clinic`
- Clinic Onboarding Wizard: `http://localhost:3000/onboarding`
- Super Admin Platform Portal: `http://localhost:3000/admin`

---

### Step 4: Running Verification Test Suite
Execute the full pytest suite:
```powershell
cd c:\clinicos\backend
.\venv\Scripts\pytest.exe -v
```
Expected output: `57 passed`

