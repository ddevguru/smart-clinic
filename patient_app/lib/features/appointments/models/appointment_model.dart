class AppointmentModel {
  final String id;
  final String? clinicId;
  final String? branchId;
  final String? doctorId;
  final String appointmentDate;
  final String appointmentTime;
  final String status;
  final String? appointmentSource;
  final String? doctorName;
  final String? doctorSpecialty;
  final String? clinicName;
  final String? branchName;
  final String? queueToken;
  final double? consultationFee;

  AppointmentModel({
    required this.id,
    this.clinicId,
    this.branchId,
    this.doctorId,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.status,
    this.appointmentSource,
    this.doctorName,
    this.doctorSpecialty,
    this.clinicName,
    this.branchName,
    this.queueToken,
    this.consultationFee,
  });

  bool get isCancellable =>
      status.toUpperCase() == 'SCHEDULED' || status.toUpperCase() == 'CONFIRMED';

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['id']?.toString() ?? '',
      clinicId: json['clinic_id']?.toString(),
      branchId: json['branch_id']?.toString(),
      doctorId: json['doctor_id']?.toString(),
      appointmentDate: json['appointment_date']?.toString() ?? '',
      appointmentTime: json['appointment_time']?.toString() ?? '',
      status: json['status']?.toString() ?? 'SCHEDULED',
      appointmentSource: json['appointment_source']?.toString(),
      doctorName: json['doctor_name']?.toString() ?? json['doctor']?['name']?.toString(),
      doctorSpecialty: json['doctor_specialty']?.toString() ?? json['doctor']?['specialty']?.toString(),
      clinicName: json['clinic_name']?.toString() ?? json['clinic']?['name']?.toString(),
      branchName: json['branch_name']?.toString() ?? json['branch']?['name']?.toString(),
      queueToken: json['queue_token']?.toString() ?? json['token_number']?.toString(),
      consultationFee: (json['consultation_fee'] as num?)?.toDouble(),
    );
  }
}

