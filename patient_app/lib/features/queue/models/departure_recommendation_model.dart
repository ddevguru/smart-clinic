class DepartureRecommendationModel {
  final String appointmentId;
  final String clinicName;
  final String branchName;
  final DateTime expectedTurnAt;
  final DateTime recommendedDepartureAt;
  final int minutesUntilDeparture;
  final int travelDurationMinutes;
  final double travelDistanceKm;
  final String trafficCondition; // 'NORMAL', 'MODERATE', 'HEAVY'
  final int arrivalBufferMinutes;
  final String confidence; // 'HIGH', 'MEDIUM', 'LOW'
  final Map<String, dynamic> originUsed;
  final Map<String, dynamic> destination;
  final String mapsNavigationUrl;
  final int delayMinutes;
  final String? delayReason;

  DepartureRecommendationModel({
    required this.appointmentId,
    required this.clinicName,
    required this.branchName,
    required this.expectedTurnAt,
    required this.recommendedDepartureAt,
    required this.minutesUntilDeparture,
    required this.travelDurationMinutes,
    required this.travelDistanceKm,
    required this.trafficCondition,
    required this.arrivalBufferMinutes,
    required this.confidence,
    required this.originUsed,
    required this.destination,
    required this.mapsNavigationUrl,
    this.delayMinutes = 0,
    this.delayReason,
  });

  factory DepartureRecommendationModel.fromJson(Map<String, dynamic> json) {
    return DepartureRecommendationModel(
      appointmentId: json['appointment_id']?.toString() ?? '',
      clinicName: json['clinic_name']?.toString() ?? '',
      branchName: json['branch_name']?.toString() ?? '',
      expectedTurnAt: DateTime.tryParse(json['expected_turn_at']?.toString() ?? '') ?? DateTime.now(),
      recommendedDepartureAt: DateTime.tryParse(json['recommended_departure_at']?.toString() ?? '') ?? DateTime.now(),
      minutesUntilDeparture: json['minutes_until_departure'] ?? 0,
      travelDurationMinutes: json['travel_duration_minutes'] ?? 0,
      travelDistanceKm: (json['travel_distance_km'] is num) ? (json['travel_distance_km'] as num).toDouble() : 0.0,
      trafficCondition: json['traffic_condition']?.toString() ?? 'NORMAL',
      arrivalBufferMinutes: json['arrival_buffer_minutes'] ?? 10,
      confidence: json['confidence']?.toString() ?? 'HIGH',
      originUsed: json['origin_used'] as Map<String, dynamic>? ?? {},
      destination: json['destination'] as Map<String, dynamic>? ?? {},
      mapsNavigationUrl: json['maps_navigation_url']?.toString() ?? '',
      delayMinutes: json['delay_minutes'] ?? 0,
      delayReason: json['delay_reason']?.toString(),
    );
  }
}

