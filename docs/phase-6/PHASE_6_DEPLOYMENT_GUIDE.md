# Smart Clinic OS — Phase 6 Deployment Guide
## Production Deployment Instructions

---

## 1. Prerequisites & Dependencies

### 1.1 Python Virtual Environment
Install required ReportLab and Pillow libraries for vector PDF rendering:
```bash
cd backend
source venv/bin/activate  # Or .\venv\Scripts\Activate.ps1 on Windows
pip install reportlab pillow "qrcode[pil]"
```

### 1.2 Database Migrations
Apply Alembic migration `8f1e3c2a4b5d`:
```bash
cd backend
flask db upgrade
```
Verify the migration applied with:
```bash
flask db current
```

---

## 2. Storage Directory Setup

Ensure the storage directories exist with appropriate write permissions:
```bash
mkdir -p storage/tenants
chmod -R 750 storage
```

---

## 3. Frontend Deployment (Clinic Web)

Build the Next.js production bundle:
```bash
npm run build
npm run start
```

---

## 4. Mobile Application Release (Flutter)

Build the Android APK:
```bash
cd patient_app
flutter build apk --release
```

