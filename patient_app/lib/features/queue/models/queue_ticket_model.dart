class QueueTicketModel {
  final String id;
  final String tokenNumber;
  final int tokenSequence;
  final String queueStatus;
  final String bookingSource;
  final int patientsAhead;
  final int estimatedWaitMinutes;
  final String? joinedAt;
  final String? calledAt;
  final bool isPaused;
  final String? pauseReason;
  final String doctorId;
  final String doctorName;
  final String? specialty;
  final String? qualification;
  final double consultationFee;
  final String clinicId;
  final String clinicName;
  final String? clinicAddress;
  final String branchId;
  final String branchName;
  final String? appointmentId;
  final String? confidence;
  final bool doctorDelayed;
  final String? expectedTurnAt;

  QueueTicketModel({
    required this.id,
    required this.tokenNumber,
    required this.tokenSequence,
    required this.queueStatus,
    required this.bookingSource,
    required this.patientsAhead,
    required this.estimatedWaitMinutes,
    this.joinedAt,
    this.calledAt,
    this.isPaused = false,
    this.pauseReason,
    required this.doctorId,
    required this.doctorName,
    this.specialty,
    this.qualification,
    this.consultationFee = 0.0,
    required this.clinicId,
    required this.clinicName,
    this.clinicAddress,
    required this.branchId,
    required this.branchName,
    this.appointmentId,
    this.confidence = 'HIGH',
    this.doctorDelayed = false,
    this.expectedTurnAt,
  });

  factory QueueTicketModel.fromJson(Map<String, dynamic> json) {
    final doc = json['doctor'] as Map<String, dynamic>? ?? {};
    final clinic = json['clinic'] as Map<String, dynamic>? ?? {};
    final branch = json['branch'] as Map<String, dynamic>? ?? {};

    return QueueTicketModel(
      id: json['id']?.toString() ?? '',
      tokenNumber: json['token_number']?.toString() ?? 'A000',
      tokenSequence: json['token_sequence'] ?? 0,
      queueStatus: json['queue_status']?.toString() ?? 'WAITING',
      bookingSource: json['booking_source']?.toString() ?? 'LIVE_QUEUE',
      patientsAhead: json['patients_ahead'] ?? 0,
      estimatedWaitMinutes: json['estimated_wait_minutes'] ?? 0,
      joinedAt: json['joined_at']?.toString(),
      calledAt: json['called_at']?.toString(),
      isPaused: json['is_paused'] == true,
      pauseReason: json['pause_reason']?.toString(),
      doctorId: doc['id']?.toString() ?? '',
      doctorName: doc['doctor_name']?.toString() ?? 'Doctor',
      specialty: doc['specialty']?.toString(),
      qualification: doc['qualification']?.toString(),
      consultationFee: (doc['consultation_fee'] != null)
          ? (doc['consultation_fee'] as num).toDouble()
          : 0.0,
      clinicId: clinic['id']?.toString() ?? '',
      clinicName: clinic['name']?.toString() ?? 'Clinic',
      clinicAddress: clinic['address']?.toString(),
      branchId: branch['id']?.toString() ?? '',
      branchName: branch['name']?.toString() ?? 'Main Branch',
      appointmentId: json['appointment_id']?.toString(),
      confidence: json['confidence']?.toString() ?? 'HIGH',
      doctorDelayed: json['doctor_delayed'] == true,
      expectedTurnAt: json['expected_turn_at']?.toString(),
    );
  }
}

