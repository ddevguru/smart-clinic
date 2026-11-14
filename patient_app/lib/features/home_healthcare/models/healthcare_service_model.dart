class HealthcareServiceCategory {
  final String id;
  final String name;
  final String code;
  final String? description;
  final String? iconName;
  final int serviceCount;

  HealthcareServiceCategory({
    required this.id,
    required this.name,
    required this.code,
    this.description,
    this.iconName,
    this.serviceCount = 0,
  });

  factory HealthcareServiceCategory.fromJson(Map<String, dynamic> json) {
    return HealthcareServiceCategory(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      description: json['description'],
      iconName: json['icon_name'],
      serviceCount: int.tryParse(json['service_count']?.toString() ?? '0') ?? 0,
    );
  }
}

class HealthcareService {
  final String id;
  final String categoryId;
  final String? categoryName;
  final String? categoryCode;
  final String name;
  final String code;
  final String? description;
  final double basePrice;
  final String sacCode;
  final int defaultDurationMinutes;

  HealthcareService({
    required this.id,
    required this.categoryId,
    this.categoryName,
    this.categoryCode,
    required this.name,
    required this.code,
    this.description,
    required this.basePrice,
    required this.sacCode,
    this.defaultDurationMinutes = 45,
  });

  factory HealthcareService.fromJson(Map<String, dynamic> json) {
    return HealthcareService(
      id: json['id'] ?? '',
      categoryId: json['category_id'] ?? '',
      categoryName: json['category_name'],
      categoryCode: json['category_code'],
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      description: json['description'],
      basePrice: double.tryParse(json['base_price']?.toString() ?? '0.0') ?? 0.0,
      sacCode: json['sac_code'] ?? '999312',
      defaultDurationMinutes: json['default_duration_minutes'] ?? 45,
    );
  }
}

class HealthcareProvider {
  final String id;
  final String fullName;
  final String providerType;
  final String qualification;
  final String specialty;
  final int experienceYears;
  final String? registrationNumber;
  final String? registrationCouncil;
  final double ratingAvg;
  final int ratingCount;
  final double serviceFee;
  final String? clinicName;

  HealthcareProvider({
    required this.id,
    required this.fullName,
    required this.providerType,
    required this.qualification,
    required this.specialty,
    required this.experienceYears,
    this.registrationNumber,
    this.registrationCouncil,
    this.ratingAvg = 5.0,
    this.ratingCount = 0,
    this.serviceFee = 0.0,
    this.clinicName,
  });

  factory HealthcareProvider.fromJson(Map<String, dynamic> json) {
    return HealthcareProvider(
      id: json['id'] ?? '',
      fullName: json['full_name'] ?? 'Healthcare Professional',
      providerType: json['provider_type'] ?? 'CARE_PARTNER',
      qualification: json['qualification'] ?? '',
      specialty: json['specialty'] ?? '',
      experienceYears: json['experience_years'] ?? 0,
      registrationNumber: json['registration_number'],
      registrationCouncil: json['registration_council'],
      ratingAvg: double.tryParse(json['rating_avg']?.toString() ?? '5.0') ?? 5.0,
      ratingCount: json['rating_count'] ?? 0,
      serviceFee: double.tryParse(json['service_fee']?.toString() ?? json['base_price']?.toString() ?? '0.0') ?? 0.0,
      clinicName: json['clinic_name'] ?? json['associated_clinic_name'],
    );
  }
}

