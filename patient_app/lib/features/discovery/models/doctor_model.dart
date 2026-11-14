class DoctorScheduleModel {
  final String id;
  final int dayOfWeek; // 0=Monday, 6=Sunday
  final String startTime;
  final String endTime;
  final String? breakStartTime;
  final String? breakEndTime;
  final bool isAvailable;

  DoctorScheduleModel({
    required this.id,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    this.breakStartTime,
    this.breakEndTime,
    this.isAvailable = true,
  });

  factory DoctorScheduleModel.fromJson(Map<String, dynamic> json) {
    return DoctorScheduleModel(
      id: json['id']?.toString() ?? '',
      dayOfWeek: json['day_of_week'] ?? 0,
      startTime: json['start_time']?.toString() ?? '09:00',
      endTime: json['end_time']?.toString() ?? '13:00',
      breakStartTime: json['break_start_time']?.toString(),
      breakEndTime: json['break_end_time']?.toString(),
      isAvailable: json['is_available'] != false,
    );
  }

  String get dayName {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (dayOfWeek >= 0 && dayOfWeek < 7) {
      return days[dayOfWeek];
    }
    return 'Day $dayOfWeek';
  }
}

class DoctorModel {
  final String id;
  final String userId;
  final String clinicId;
  final String? primaryBranchId;
  final String doctorName;
  final String? doctorPhone;
  final String? doctorEmail;
  final String qualification;
  final String specialty;
  final String medicalRegistrationNumber;
  final String registrationCouncil;
  final int experienceYears;
  final double consultationFee;
  final int consultationDurationMinutes;
  final String verificationStatus;
  final String? clinicName;
  final String? clinicCity;
  final String? branchName;
  final double rating;
  final int patientStories;
  final List<DoctorScheduleModel> schedules;

  DoctorModel({
    required this.id,
    required this.userId,
    required this.clinicId,
    this.primaryBranchId,
    required this.doctorName,
    this.doctorPhone,
    this.doctorEmail,
    required this.qualification,
    required this.specialty,
    required this.medicalRegistrationNumber,
    required this.registrationCouncil,
    this.experienceYears = 0,
    this.consultationFee = 0.0,
    this.consultationDurationMinutes = 15,
    this.verificationStatus = 'APPROVED',
    this.clinicName,
    this.clinicCity,
    this.branchName,
    this.rating = 4.9,
    this.patientStories = 86,
    this.schedules = const [],
  });

  factory DoctorModel.fromJson(Map<String, dynamic> json) {
    var rawSchedules = json['schedules'];
    List<DoctorScheduleModel> schedList = [];
    if (rawSchedules is List) {
      schedList = rawSchedules.map((s) => DoctorScheduleModel.fromJson(s)).toList();
    }

    return DoctorModel(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      clinicId: json['clinic_id']?.toString() ?? '',
      primaryBranchId: json['primary_branch_id']?.toString(),
      doctorName: json['doctor_name']?.toString() ?? 'Dr. Specialist',
      doctorPhone: json['doctor_phone']?.toString(),
      doctorEmail: json['doctor_email']?.toString(),
      qualification: json['qualification']?.toString() ?? 'MBBS',
      specialty: json['specialty']?.toString() ?? 'General Medicine',
      medicalRegistrationNumber: json['medical_registration_number']?.toString() ?? 'NMC-00000',
      registrationCouncil: json['registration_council']?.toString() ?? 'Medical Council',
      experienceYears: json['experience_years'] ?? 0,
      consultationFee: (json['consultation_fee'] != null)
          ? (json['consultation_fee'] as num).toDouble()
          : 0.0,
      consultationDurationMinutes: json['consultation_duration_minutes'] ?? 15,
      verificationStatus: json['verification_status']?.toString() ?? 'APPROVED',
      clinicName: json['clinic_name']?.toString(),
      clinicCity: json['clinic_city']?.toString(),
      branchName: json['branch_name']?.toString(),
      rating: (json['rating'] != null) ? (json['rating'] as num).toDouble() : 4.9,
      patientStories: json['patient_stories'] ?? 86,
      schedules: schedList,
    );
  }
}

