# Smart Clinic OS — Production Deployment Guide

**Document ID:** `SCOS-P11-DEP-003`  
**Target Platform:** Single VPS (Ubuntu 22.04 LTS+) or Cloud Cluster with Docker & Docker Compose  
**Prerequisites:** Docker Engine 24.x+, Docker Compose v2.20+, Domain names pointing to host IP.

---

## 1. Architecture Manifest & Containers

The production stack consists of five coordinated containers orchestrated via `docker-compose.yml`:

| Service | Container Name | Base Image | Port Mapping | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Reverse Proxy** | `smartclinic_proxy` | `nginx:alpine` | `80:80`, `443:443` | SSL termination, reverse proxy, gzip, HTTP/2 |
| **Web Frontend** | `smartclinic_web` | `node:22-alpine` | `3000:3000` (internal)| Next.js SSR multi-role clinic management portal |
| **API Backend** | `smartclinic_api` | `node:22-alpine` | `5000:5000` (internal)| Node.js Express REST API, Socket.IO real-time |
| **Relational DB** | `smartclinic_db` | `postgres:16-alpine` | `5432:5432` (internal)| High-performance multi-tenant PostgreSQL |
| **Cache & Queue** | `smartclinic_redis` | `redis:7-alpine` | `6379:6379` (internal)| Real-time queue cache and pub/sub |

---

## 2. Server Provisioning Steps

### Step 1: Clone Repository & Setup Permissions
```bash
git clone https://github.com/your-org/smart-clinic-os.git /opt/smart-clinic-os
cd /opt/smart-clinic-os
chmod +x deploy/backup.sh deploy/restore.sh
```

### Step 2: Configure Environment Variables
Copy `.env.production.example` to `.env`:
```bash
cp .env.production.example .env
nano .env
```
Ensure the following required production variables are securely configured:
- `POSTGRES_PASSWORD`: High-entropy 32+ character random string.
- `JWT_SECRET`: High-entropy 64+ character random string.
- `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com/api/v1`
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Live credentials from Razorpay dashboard.
- `RAZORPAY_WEBHOOK_SECRET`: Configured in Razorpay Webhooks dashboard.

### Step 3: Install SSL/TLS Certificates
Acquire Let's Encrypt certificates using Certbot:
```bash
certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
```
Place fullchain and private key into `/opt/smart-clinic-os/nginx/ssl/`.

### Step 4: Build and Launch Containers
```bash
docker compose build --no-cache
docker compose up -d
```

### Step 5: Initialize Database Schema & Seed Data
```bash
docker compose exec backend node src/scripts/run_migrations.js
docker compose exec backend node src/scripts/seed_production.js
```

---

## 3. Health & Verification Check

1. **Verify Backend Health:**
   ```bash
   curl -I https://api.yourdomain.com/api/v1/health
   # Expected: HTTP/1.1 200 OK
   # Response includes DB latency (<5ms) and memory stats.
   ```
2. **Verify Prometheus Metrics:**
   ```bash
   curl -s https://api.yourdomain.com/metrics | head -n 20
   ```
3. **Verify Web Frontend:**
   ```bash
   curl -I https://yourdomain.com/
   # Expected: HTTP/1.1 200 OK
   ```

---

## 4. Zero-Downtime Rolling Update Procedure

To update the application without interrupting active clinic sessions:
```bash
git pull origin main
docker compose build backend
docker compose up -d --no-deps --build backend
docker compose build frontend
docker compose up -d --no-deps --build frontend
```
Nginx automatically retries requests on socket disconnection, providing a seamless user experience.

