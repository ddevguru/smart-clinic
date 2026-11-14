# Phase 7 — Google Maps API Setup & Key Restrictions
## Secure Provisioning for Healthcare SaaS Platforms

### 1. Prerequisites & Required APIs
In the Google Cloud Console (`console.cloud.google.com`):
1. Create a dedicated project: `smart-clinic-os-production`.
2. Enable the **Routes API** (v2) — `routes.googleapis.com`.
3. Enable billing on the project.

### 2. API Key Restrictions
To protect against unauthorized consumption and billing spikes:
1. **Application Restrictions**: Set to **IP Addresses**.
   - Enter your backend server IP addresses (e.g. AWS Elastic IPs, DigitalOcean Droplet IPs, or container NAT gateways).
   - Never set to "None" or allow unrestricted mobile origins.
2. **API Restrictions**: Restrict the key exclusively to:
   - `Routes API` (and optionally `Geocoding API` if geocoding address strings server-side).

### 3. Server Configuration
Set the following environment variable in `server/.env`:
```env
GOOGLE_MAPS_API_KEY=AIzaSy...YourRestrictedServerKey...
GOOGLE_MAPS_TRAFFIC_CACHE_TTL_MINUTES=10
```

### 4. Zero Client Exposure Verification
- Flutter Android Manifest does NOT contain any Google Maps API keys for transit calculation.
- Client applications communicate solely through authenticated endpoints:
  - `GET /api/v1/patient/traffic/departure-recommendation/:appointment_id`
  - `POST /api/v1/patient/traffic/update-origin`
- Maps navigation links provided to users leverage standard universal browser schemes (`https://www.google.com/maps/dir/?api=1&origin=...&destination=...`) which open natively in Google Maps on Android and iOS without requiring a client API key.

