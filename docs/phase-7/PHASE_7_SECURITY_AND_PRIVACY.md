# Phase 7 — Security & Privacy Architecture
## DPDP Act 2023 Compliance & Zero Continuous GPS Tracking

### 1. Indian DPDP Act 2023 Principles
Smart Clinic OS adheres to the Digital Personal Data Protection (DPDP) Act 2023:
1. **Purpose Limitation**: Location data is used strictly to provide departure recommendations for the scheduled healthcare appointment on that specific day.
2. **Data Minimization**: Coordinates are rounded to 3 decimal places (~110 meters) when caching route snapshots. Exact street house numbers are neither stored in caches nor transmitted to third-party ad networks.
3. **Storage Limitation**: Temporary route snapshots expire after 10 minutes.
4. **Consent Notice**: Patients can view, update, or clear their stored location preference anytime via the mobile app profile.

### 2. Zero Continuous GPS Tracking Architecture
- **No Background Location Tracking**: The Flutter mobile app does NOT request `ACCESS_BACKGROUND_LOCATION` permissions.
- **On-Demand Execution**: Location is captured only when the user opens their active queue ticket or manually selects "Change Travel Origin" from preset hubs or on-screen pin.
- **Battery & Privacy Preservation**: By avoiding continuous location tracking, patient battery life is unaffected, and surveillance vulnerabilities are eliminated.

### 3. API Key & Credential Protection
- Google Maps Routes API keys, WhatsApp API tokens, and SMS Gateway credentials remain exclusively in server environment files (`server/.env`).
- No Google Cloud credentials or server secrets are bundled into the Flutter APK or Next.js client-side JavaScript bundles.
- All outbound calls to Google Maps Routes API originate from restricted static backend IPs.

