# Phase 7 — API Documentation
## Endpoints, Request Payloads & Response Schemas

### 1. Patient Portal Traffic & Queue APIs

#### `GET /api/v1/patient/traffic/departure-recommendation/:appointment_id`
Calculates dynamic departure time using Google Maps Routes API traffic and queue intelligence.
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `origin_lat` (optional): Latitude of departure point.
  - `origin_lng` (optional): Longitude of departure point.
  - `origin_address` (optional): Human-readable address.
  - `arrival_buffer_minutes` (optional, default: 10): Reception arrival buffer.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "appointment_id": "8485290a-a5ea-40bf-ab2b-8a192807e155",
    "clinic_name": "CarePlus Family Clinic",
    "branch_name": "Indiranagar",
    "expected_turn_at": "2026-11-13T10:30:00.000Z",
    "recommended_departure_at": "2026-11-13T09:58:00.000Z",
    "minutes_until_departure": 28,
    "travel_duration_minutes": 22,
    "travel_distance_km": 6.8,
    "traffic_condition": "MODERATE",
    "arrival_buffer_minutes": 10,
    "confidence": "HIGH",
    "origin_used": { "latitude": 12.9352, "longitude": 77.6245, "source": "GEOLOCATION" },
    "destination": { "name": "Indiranagar", "latitude": 12.9784, "longitude": 77.6408 },
    "maps_navigation_url": "https://www.google.com/maps/dir/?api=1&origin=12.9352,77.6245&destination=12.9784,77.6408&travelmode=driving",
    "delay_minutes": 0,
    "delay_reason": null
  }
}
```

#### `POST /api/v1/patient/traffic/update-origin`
Updates the departure origin for an appointment.
- **Body**:
```json
{
  "appointment_id": "8485290a-a5ea-40bf-ab2b-8a192807e155",
  "latitude": 12.9352,
  "longitude": 77.6245,
  "address": "Koramangala 4th Block"
}
```

#### `GET /api/v1/patient/queue-ticket`
Returns the active queue ticket, dynamic wait time, and confidence for the authenticated patient.

---

### 2. Clinic Automation & Settings APIs

#### `GET /api/v1/clinic/automation/settings`
Returns current clinic automation parameters.

#### `PUT /api/v1/clinic/automation/settings`
Updates clinic automation parameters (Clinic Owner role required).
- **Body**:
```json
{
  "reminders_enabled": true,
  "reminder_intervals_hours": [24, 2, 0],
  "queue_alerts_enabled": true,
  "turn_approaching_threshold": 2,
  "delay_alerts_enabled": true,
  "delay_threshold_minutes": 15,
  "traffic_departure_enabled": true,
  "default_arrival_buffer_minutes": 10
}
```

#### `POST /api/v1/clinic/queue/delay-alert`
Broadcasts an OPD operational delay for a doctor and recalibrates affected queue departures.
- **Body**:
```json
{
  "doctor_id": "402eb4b8-e2eb-4fe9-b006-b333cba7f0ea",
  "delay_minutes": 20,
  "reason": "Emergency surgery / OPD backlog",
  "branch_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0001"
}
```

#### `GET /api/v1/clinic/automation/logs`
Returns the last 50 background automation jobs and deduplication hashes for the clinic.

