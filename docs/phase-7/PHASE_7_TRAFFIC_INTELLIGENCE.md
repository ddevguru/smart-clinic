# Phase 7 — Traffic Intelligence Service
## Google Maps Routes API Integration & Fallback Modeling

### 1. Architectural Strategy
Smart Clinic OS calculates dynamic driving transit times using Google Maps Routes API, governed by the following core principles:
1. **Backend-Only Execution**: The Google Maps API key is stored exclusively in backend environment variables (`GOOGLE_MAPS_API_KEY`). Mobile applications and web browsers never receive or expose this key.
2. **On-Demand Calculation**: Calculations occur only when an active patient accesses their ticket or requests an origin update. There is zero background GPS tracking or battery drain on patient devices.
3. **Route Snapshot Caching**: Prevents redundant API calls by caching route estimates in `traffic_route_snapshots` with a 10-minute TTL.

### 2. Snapshot Caching Specification
- **Key Formation**: Origin and destination coordinates are rounded to 3 decimal places (~110-meter precision), formatted as `orig_lat:orig_lng->dest_lat:dest_lng`, and hashed using SHA-256.
- **Cache Hit**: If a snapshot exists in PostgreSQL created within the past 10 minutes, the stored `duration_seconds`, `distance_meters`, and `traffic_condition` are returned immediately, bypassing the Google Maps API.
- **Cache Miss**: Google Maps Routes API is called with `trafficModel: BEST_GUESS` and `routingPreference: TRAFFIC_AWARE`. The result is inserted into `traffic_route_snapshots`.

### 3. Resilient Fallback Engine
If the Google Maps API key is absent, network fails, or the Google Cloud quota is exhausted:
- Computes Haversine distance:
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1\cos\phi_2\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- Road Tortuosity Factor: $1.35 \times d$ (accounts for urban road detours in Indian cities).
- City Traffic Time-of-Day Multiplier:
  - Peak Morning (08:30–11:30) & Evening (17:00–20:30): Speed $\sim 14\text{ km/h}$, traffic status `HEAVY`.
  - Afternoon (12:00–16:30): Speed $\sim 22\text{ km/h}$, traffic status `MODERATE`.
  - Early Morning / Night (21:00–08:00): Speed $\sim 34\text{ km/h}$, traffic status `NORMAL`.

