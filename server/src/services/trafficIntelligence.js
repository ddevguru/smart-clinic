const crypto = require('crypto');
const { query } = require('../config/db');

/**
 * Traffic Intelligence & Google Maps Routes Engine
 * Computes traffic-aware travel durations, arrival buffers, and smart departure recommendations.
 */
class TrafficIntelligenceService {

  /**
   * Calculate distance between two coordinates using Haversine formula (meters)
   */
  static calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Compute hash for caching
   */
  static hashCoordinate(lat, lng) {
    // Round to 3 decimal places (~110 meters) for intelligent caching
    const rounded = `${parseFloat(lat).toFixed(3)},${parseFloat(lng).toFixed(3)}`;
    return crypto.createHash('sha256').update(rounded).digest('hex').slice(0, 16);
  }

  /**
   * Fetch traffic-aware travel duration between origin and destination
   * Checks database cache first to control Google Maps API costs.
   */
  static async getTravelDuration(originLat, originLng, destLat, destLng, travelMode = 'DRIVING') {
    const originHash = this.hashCoordinate(originLat, originLng);
    const destHash = this.hashCoordinate(destLat, destLng);

    // 1. Check cache (valid for 10 minutes)
    const cacheRes = await query(`
      SELECT duration_seconds, traffic_duration_seconds, distance_meters, distance_text, duration_text
      FROM traffic_route_snapshots
      WHERE origin_hash = $1 AND destination_hash = $2 AND travel_mode = $3 AND cached_until > NOW()
      ORDER BY created_at DESC LIMIT 1
    `, [originHash, destHash, travelMode]);

    if (cacheRes.rows.length > 0) {
      const hit = cacheRes.rows[0];
      return {
        duration_seconds: hit.duration_seconds,
        traffic_duration_seconds: hit.traffic_duration_seconds,
        distance_meters: hit.distance_meters,
        distance_text: hit.distance_text,
        duration_text: hit.duration_text,
        traffic_status: this.determineTrafficStatus(hit.traffic_duration_seconds, hit.duration_seconds),
        is_cached: true,
        source: 'CACHE'
      };
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // 2. If API Key provided, query Google Maps Routes API
    if (apiKey && apiKey !== 'mock_key' && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
      try {
        const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        const body = {
          origin: {
            location: { latLng: { latitude: parseFloat(originLat), longitude: parseFloat(originLng) } }
          },
          destination: {
            location: { latLng: { latitude: parseFloat(destLat), longitude: parseFloat(destLng) } }
          },
          travelMode: travelMode === 'WALKING' ? 'WALK' : 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          computeAlternativeRoutes: false,
          languageCode: 'en-US'
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.distanceMeters,routes.polyline.encodedPolyline'
          },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const trafficSec = parseInt(route.duration.replace('s', ''), 10);
            const staticSec = route.staticDuration ? parseInt(route.staticDuration.replace('s', ''), 10) : trafficSec;
            const distanceM = route.distanceMeters || this.calculateHaversineDistance(originLat, originLng, destLat, destLng);
            
            const distanceKm = (distanceM / 1000).toFixed(1);
            const durationMin = Math.round(trafficSec / 60);

            // Cache result for 10 minutes
            const { v4: uuidv4 } = require('uuid');
            await query(`
              INSERT INTO traffic_route_snapshots (
                id, origin_hash, destination_hash, travel_mode, duration_seconds,
                traffic_duration_seconds, distance_meters, distance_text, duration_text,
                raw_response, cached_until, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL '10 minutes', NOW())
            `, [
              uuidv4(), originHash, destHash, travelMode, staticSec, trafficSec, distanceM,
              `${distanceKm} km`, `${durationMin} mins`, JSON.stringify(route)
            ]);

            return {
              duration_seconds: staticSec,
              traffic_duration_seconds: trafficSec,
              distance_meters: distanceM,
              distance_text: `${distanceKm} km`,
              duration_text: `${durationMin} mins`,
              traffic_status: this.determineTrafficStatus(trafficSec, staticSec),
              polyline: route.polyline?.encodedPolyline || null,
              is_cached: false,
              source: 'GOOGLE_MAPS_ROUTES_API'
            };
          }
        }
      } catch (err) {
        console.warn('Google Maps API request failed, falling back to traffic model:', err.message);
      }
    }

    // 3. Realistic Fallback Engine (Indian City Traffic Model)
    // When no API key is set or API fails, uses Haversine distance with peak/off-peak speed adjustment (18 - 25 km/h)
    const straightDistMeters = this.calculateHaversineDistance(originLat, originLng, destLat, destLng);
    // Road route distance factor (~1.3x straight line)
    const roadDistMeters = Math.max(500, Math.round(straightDistMeters * 1.3));
    const distKm = roadDistMeters / 1000;

    // Check peak hours (8am - 11am or 5pm - 8pm in Indian cities)
    const currentHour = new Date().getHours();
    const isPeakHour = (currentHour >= 8 && currentHour <= 11) || (currentHour >= 17 && currentHour <= 20);
    const speedKmh = isPeakHour ? 18.0 : 26.0; // km/h

    const staticSec = Math.round((distKm / 32.0) * 3600); // ideal free-flow duration
    const trafficSec = Math.round((distKm / speedKmh) * 3600); // traffic duration
    const durationMin = Math.max(2, Math.round(trafficSec / 60));

    // Cache the fallback calculation
    const { v4: uuidv4 } = require('uuid');
    await query(`
      INSERT INTO traffic_route_snapshots (
        id, origin_hash, destination_hash, travel_mode, duration_seconds,
        traffic_duration_seconds, distance_meters, distance_text, duration_text,
        cached_until, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '10 minutes', NOW())
    `, [
      uuidv4(), originHash, destHash, travelMode, staticSec, trafficSec, roadDistMeters,
      `${distKm.toFixed(1)} km`, `${durationMin} mins`
    ]);

    return {
      duration_seconds: staticSec,
      traffic_duration_seconds: trafficSec,
      distance_meters: roadDistMeters,
      distance_text: `${distKm.toFixed(1)} km`,
      duration_text: `${durationMin} mins`,
      traffic_status: isPeakHour ? 'MODERATE' : 'NORMAL',
      is_cached: false,
      source: 'LOCAL_TRAFFIC_MODEL'
    };
  }

  /**
   * Determine traffic condition badge
   */
  static determineTrafficStatus(trafficSec, staticSec) {
    if (!staticSec || staticSec <= 0) return 'NORMAL';
    const ratio = trafficSec / staticSec;
    if (ratio >= 1.6) return 'CONGESTED';
    if (ratio >= 1.3) return 'HEAVY';
    if (ratio >= 1.1) return 'MODERATE';
    return 'NORMAL';
  }

  /**
   * Compute full Departure Recommendation for a patient queue entry or appointment
   */
  static async calculateDepartureRecommendation({
    patientId,
    appointmentId = null,
    queueEntryId = null,
    clinicId,
    branchId = null,
    originLat = null,
    originLng = null,
    originAddress = null,
    expectedTurnAt = null,
    arrivalBufferMinutes = 10,
    queueConfidence = 'HIGH'
  }) {
    // 1. Resolve Destination (Clinic Branch Coordinates)
    let destLat = 12.9784; // Default Indiranagar
    let destLng = 77.6408;

    if (branchId) {
      const branchRes = await query('SELECT latitude, longitude, address, city FROM clinic_branches WHERE id = $1', [branchId]);
      if (branchRes.rows.length > 0 && branchRes.rows[0].latitude) {
        destLat = parseFloat(branchRes.rows[0].latitude);
        destLng = parseFloat(branchRes.rows[0].longitude);
      }
    } else {
      const mainBranchRes = await query('SELECT latitude, longitude FROM clinic_branches WHERE clinic_id = $1 AND is_main_branch = true', [clinicId]);
      if (mainBranchRes.rows.length > 0 && mainBranchRes.rows[0].latitude) {
        destLat = parseFloat(mainBranchRes.rows[0].latitude);
        destLng = parseFloat(mainBranchRes.rows[0].longitude);
      }
    }

    // 2. Resolve Patient Origin Coordinates
    // If not provided in request, default to a nearby typical residential location (~5-8 km away e.g. Domlur / Koramangala)
    let pLat = originLat ? parseFloat(originLat) : 12.9600;
    let pLng = originLng ? parseFloat(originLng) : 77.6480;
    let pAddress = originAddress || 'Current Location';

    // 3. Resolve Expected Turn At
    const turnDate = expectedTurnAt ? new Date(expectedTurnAt) : new Date(Date.now() + 45 * 60000);
    const arrivalBufferSeconds = arrivalBufferMinutes * 60;

    // 4. Query Traffic & Travel Duration
    const travelInfo = await this.getTravelDuration(pLat, pLng, destLat, destLng, 'DRIVING');

    // 5. Apply Formula:
    // recommended_departure_at = expected_turn_at - estimated_travel_seconds - arrival_buffer_seconds
    const totalDeductionMs = (travelInfo.traffic_duration_seconds + arrivalBufferSeconds) * 1000;
    const recommendedDepartureAt = new Date(turnDate.getTime() - totalDeductionMs);

    // 6. Overall Recommendation Confidence:
    let recConfidence = queueConfidence;
    if (travelInfo.source === 'LOCAL_TRAFFIC_MODEL') {
      // Local estimation confidence
      if (recConfidence === 'HIGH') recConfidence = 'HIGH';
    }

    const recStatus = 'READY';
    const expiresAt = new Date(Date.now() + 15 * 60000); // snapshot valid for 15 minutes

    // 7. Store / Upsert Snapshot in departure_recommendations
    const { v4: uuidv4 } = require('uuid');
    const recId = uuidv4();

    // Invalidate prior snapshots for this queue entry or appointment
    if (queueEntryId) {
      await query('DELETE FROM departure_recommendations WHERE queue_entry_id = $1', [queueEntryId]);
    } else if (appointmentId) {
      await query('DELETE FROM departure_recommendations WHERE appointment_id = $1', [appointmentId]);
    }

    await query(`
      INSERT INTO departure_recommendations (
        id, patient_id, appointment_id, queue_entry_id, clinic_id, branch_id,
        origin_latitude, origin_longitude, origin_address,
        destination_latitude, destination_longitude,
        expected_turn_at, estimated_travel_seconds, estimated_travel_text,
        traffic_duration_seconds, traffic_status, distance_meters, distance_text,
        arrival_buffer_seconds, recommended_departure_at,
        estimation_confidence, recommendation_status, route_polyline,
        traffic_retrieved_at, queue_estimated_at, calculated_at, expires_at,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW(), NOW(), $24, NOW(), NOW()
      )
    `, [
      recId, patientId, appointmentId, queueEntryId, clinicId, branchId,
      pLat, pLng, pAddress, destLat, destLng,
      turnDate, travelInfo.duration_seconds, travelInfo.duration_text,
      travelInfo.traffic_duration_seconds, travelInfo.traffic_status,
      travelInfo.distance_meters, travelInfo.distance_text,
      arrivalBufferSeconds, recommendedDepartureAt,
      recConfidence, recStatus, travelInfo.polyline || null,
      expiresAt
    ]);

    return {
      recommendation_id: recId,
      expected_turn_at: turnDate.toISOString(),
      recommended_departure_at: recommendedDepartureAt.toISOString(),
      estimated_travel_seconds: travelInfo.traffic_duration_seconds,
      estimated_travel_text: travelInfo.duration_text,
      distance_meters: travelInfo.distance_meters,
      distance_text: travelInfo.distance_text,
      arrival_buffer_minutes: arrivalBufferMinutes,
      traffic_status: travelInfo.traffic_status,
      estimation_confidence: recConfidence,
      recommendation_status: recStatus,
      origin: { latitude: pLat, longitude: pLng, address: pAddress },
      destination: { latitude: destLat, longitude: destLng },
      disclaimer: 'Estimated departure time based on current queue conditions and traffic. Actual waiting and travel times may change.',
      last_updated_at: new Date().toISOString()
    };
  }
}

module.exports = TrafficIntelligenceService;

