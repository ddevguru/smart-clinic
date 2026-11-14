# Phase 7 — Production Deployment Guide
## Environment Variables, Migrations & Daemon Configuration

### 1. Database Migrations
Run the Phase 7 database migration against your production PostgreSQL instance:
```bash
node server/src/migrations/migration_phase7.js
```
This creates the 6 required tables (`departure_recommendations`, `traffic_route_snapshots`, `automation_settings`, `automation_job_logs`, `notification_preferences`, `delay_event_logs`) and seeds initial clinic settings.

### 2. Environment Variables Configuration
Ensure the following variables are defined in your production `.env` file:
```env
# Application Core
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@db-host:5432/smart_clinic_os

# Google Maps Platform (Protected Backend Key)
GOOGLE_MAPS_API_KEY=AIzaSy...YourKey...
GOOGLE_MAPS_TRAFFIC_CACHE_TTL_MINUTES=10

# Multi-Channel Messaging Providers
WHATSAPP_API_URL=https://graph.facebook.com/v19.0/...
WHATSAPP_ACCESS_TOKEN=EAAG...
SMS_GATEWAY_URL=https://api.sms-provider.in/v1/send
SMS_GATEWAY_API_KEY=sms_sec_...
```

### 3. Background Automation Runner
Configure a cron job or systemd timer to invoke the automated reminder scan periodically (e.g. every 15 minutes):
```bash
# Crontab entry to trigger reminder sweep
*/15 * * * * curl -X POST -H "Authorization: Bearer $SYSTEM_CRON_TOKEN" -H "X-Clinic-ID: $CLINIC_ID" http://localhost:5000/api/v1/clinic/automation/trigger-reminders > /dev/null 2>&1
```

### 4. Build & Run
- **Node.js Express Server**:
  ```bash
  cd server
  npm install
  npm start
  ```
- **Next.js Web Portal**:
  ```bash
  npm run build
  npm start
  ```
- **Flutter Patient App**:
  ```bash
  cd patient_app
  flutter build apk --release
  ```

