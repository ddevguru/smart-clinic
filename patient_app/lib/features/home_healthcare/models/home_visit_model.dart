class HomeVisitBooking {
  final String id;
  final String bookingReference;
  final String serviceName;
  final String? categoryName;
  final String? providerName;
  final String? providerType;
  final String status;
  final String scheduledDate;
  final String scheduledStartTime;
  final String scheduledEndTime;
  final String serviceAddress;
  final String city;
  final String postalCode;
  final double totalAmount;
  final double servicePrice;
  final double travelCharge;
  final double taxAmount;
  final String paymentStatus;
  final int estimatedTravelMinutes;
  final double estimatedTravelDistanceKm;
  final String? estimatedArrivalTime;
  final String? actualArrivalTime;
  final String? patientNotes;
  final String? createdAt;

  HomeVisitBooking({
    required this.id,
    required this.bookingReference,
    required this.serviceName,
    this.categoryName,
    this.providerName,
    this.providerType,
    required this.status,
    required this.scheduledDate,
    required this.scheduledStartTime,
    required this.scheduledEndTime,
    required this.serviceAddress,
    required this.city,
    required this.postalCode,
    required this.totalAmount,
    required this.servicePrice,
    this.travelCharge = 0.0,
    this.taxAmount = 0.0,
    required this.paymentStatus,
    this.estimatedTravelMinutes = 20,
    this.estimatedTravelDistanceKm = 5.0,
    this.estimatedArrivalTime,
    this.actualArrivalTime,
    this.patientNotes,
    this.createdAt,
  });

  factory HomeVisitBooking.fromJson(Map<String, dynamic> json) {
    return HomeVisitBooking(
      id: json['id'] ?? '',
      bookingReference: json['booking_reference'] ?? '',
      serviceName: json['service_name'] ?? 'Home Healthcare Service',
      categoryName: json['category_name'],
      providerName: json['provider_name'],
      providerType: json['provider_type'],
      status: json['status'] ?? 'REQUESTED',
      scheduledDate: json['scheduled_date']?.toString().split('T')[0] ?? '',
      scheduledStartTime: json['scheduled_start_time'] ?? '',
      scheduledEndTime: json['scheduled_end_time'] ?? '',
      serviceAddress: json['service_address'] ?? '',
      city: json['city'] ?? 'Bengaluru',
      postalCode: json['postal_code'] ?? '',
      totalAmount: double.tryParse(json['total_amount']?.toString() ?? '0.0') ?? 0.0,
      servicePrice: double.tryParse(json['service_price']?.toString() ?? '0.0') ?? 0.0,
      travelCharge: double.tryParse(json['travel_charge']?.toString() ?? '0.0') ?? 0.0,
      taxAmount: double.tryParse(json['tax_amount']?.toString() ?? '0.0') ?? 0.0,
      paymentStatus: json['payment_status'] ?? 'PENDING',
      estimatedTravelMinutes: json['estimated_travel_minutes'] ?? 20,
      estimatedTravelDistanceKm: double.tryParse(json['estimated_travel_distance_km']?.toString() ?? '5.0') ?? 5.0,
      estimatedArrivalTime: json['estimated_arrival_time'],
      actualArrivalTime: json['actual_arrival_time'],
      patientNotes: json['patient_notes'],
      createdAt: json['created_at'],
    );
  }
}

