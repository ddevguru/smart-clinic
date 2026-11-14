# 🚀 Smart Clinic OS — Render & GitHub 1-Click Deployment Guide

This guide describes how to push Smart Clinic OS to GitHub and deploy the complete production stack to **Render** using the included Infrastructure-as-Code Blueprint (`render.yaml`).

---

## 🏗️ Architecture Overview on Render

When you connect this repository to Render as a **Blueprint**, Render automatically provisions:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Render Cloud Platform                           │
│                                                                        │
│   ┌────────────────────────┐         ┌──────────────────────────────┐  │
│   │    smart-clinic-db     │         │     smart-clinic-backend     │  │
│   │ Managed PostgreSQL 16  │ ◄───────┤ Node.js Express REST API     │  │
│   │ (Free Tier Instance)   │SSL Encry│ (Port 5000 / Auto-Init DB)   │  │
│   └────────────────────────┘         └──────────────▲───────────────┘  │
│                                                     │                  │
│                                           Internal  │ Rewrites &       │
│                                           Network   │ Private DNS      │
│                                                     │                  │
│                                      ┌──────────────┴───────────────┐  │
│                                      │       smart-clinic-web       │  │
│                                      │ Next.js 14 Governance Web    │  │
│                                      │ (/admin & /owner consoles)   │  │
│                                      └──────────────▲───────────────┘  │
└─────────────────────────────────────────────────────┼──────────────────┘
                                                      │
                                                      │ Public HTTPS
                                                      │
                                       ┌──────────────┴───────────────┐
                                       │    End Users & Mobile App    │
                                       │  • Super Admin & Clinic Admin│
                                       │  • Flutter Android/iOS App   │
                                       └──────────────────────────────┘
```

---

## 📋 Step 1: Push Code to GitHub

Open terminal in the project root (`c:\clinicos`) and run:

```bash
# 1. Initialize git repository (if not already initialized)
git init

# 2. Add all files (respects .gitignore)
git add .

# 3. Commit files
git commit -m "feat: complete Smart Clinic OS with Render Blueprint (Postgres + Express + Next.js)"

# 4. Set branch to main
git branch -M main

# 5. Connect to your GitHub repository
# Replace <YOUR-USERNAME> and <YOUR-REPO> with your GitHub details
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO>.git

# 6. Push code to GitHub
git push -u origin main
```

---

## ⚡ Step 2: Deploy to Render via Blueprint (1-Click)

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. In the top right corner, click the **New +** button and select **Blueprint**.
3. Under **Connect a repository**, select your GitHub repository (`<YOUR-REPO>`).
4. Give your Blueprint instance a name (e.g. `smart-clinic-os`).
5. Render will automatically detect and parse [`render.yaml`](./render.yaml).
6. Render displays the 3 resources that will be provisioned:
   - 🗄️ **smart-clinic-db** (PostgreSQL Database)
   - ⚙️ **smart-clinic-backend** (Web Service: Node.js Express API)
   - 💻 **smart-clinic-web** (Web Service: Next.js Admin & Governance Portal)
7. Click **Apply**.

---

## 🔄 Automatic Database Initialization on Boot

You **do not** need to manually run any SQL scripts or SSH commands:
- The backend contains an automatic bootstrap check (`server/src/config/initDb.js`).
- When the backend connects to the fresh Render PostgreSQL instance on first boot, it detects that tables are empty.
- It automatically executes [`server/schema.sql`](./server/schema.sql) and [`server/seeds.sql`](./server/seeds.sql).
- All tables, indices, roles, clinics, and staff accounts are seeded instantly!

---

## 🔐 Live Production Accounts & Credentials

Once deployment completes, the following accounts are pre-configured:

| Persona | Role | Email / Mobile | Password / OTP | Portal URL |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `SUPER_ADMIN` | `admin@smartclinicos.in` | `Password@123` | `https://smart-clinic-web.onrender.com/admin` |
| **Clinic Admin (CarePlus)** | `CLINIC_OWNER` | `owner@careplus.in` | `Password@123` | `https://smart-clinic-web.onrender.com/owner` |
| **Clinic Admin (Apex)** | `CLINIC_OWNER` | `owner@apex.in` | `Password@123` | `https://smart-clinic-web.onrender.com/owner` |
| **Doctor** | `DOCTOR` | `doctor@careplus.in` | `Password@123` | Mobile App (`/doctor-home`) |
| **Receptionist** | `RECEPTIONIST` | `receptionist@careplus.in` | `Password@123` | Mobile App (`/receptionist-home`) |
| **Patient / User** | `PATIENT` | `9876543210` | OTP: `123456` | Mobile App (`/home`) |

---

## 📱 Connecting the Flutter Mobile App to Live Render Backend

To point the Flutter mobile application (`patient_app`) to your live Render backend:

1. Open `patient_app/lib/core/config/app_config.dart` (or `api_client.dart`).
2. Update the base URL to your Render backend URL:
   ```dart
   static const String baseUrl = 'https://smart-clinic-backend.onrender.com/api/v1';
   ```
3. Run or build the app:
   ```bash
   cd patient_app
   flutter run
   ```

