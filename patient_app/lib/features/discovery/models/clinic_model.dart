class BranchItemModel {
  final String id;
  final String name;
  final bool isMainBranch;
  final String? address;

  BranchItemModel({
    required this.id,
    required this.name,
    this.isMainBranch = false,
    this.address,
  });

  factory BranchItemModel.fromJson(Map<String, dynamic> json) {
    return BranchItemModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      isMainBranch: json['is_main_branch'] as bool? ?? false,
      address: json['address']?.toString(),
    );
  }
}

class ClinicModel {
  final String id;
  final String name;
  final String? city;
  final String? address;
  final String? phone;
  final String? clinicType;
  final int branchesCount;
  final int doctorsCount;
  final List<String> specialties;
  final double rating;
  final List<BranchItemModel> branches;

  ClinicModel({
    required this.id,
    required this.name,
    this.city,
    this.address,
    this.phone,
    this.clinicType,
    this.branchesCount = 1,
    this.doctorsCount = 1,
    this.specialties = const [],
    this.rating = 4.5,
    this.branches = const [],
  });

  int get activeDoctorsCount => doctorsCount;

  factory ClinicModel.fromJson(Map<String, dynamic> json) {
    final specList = (json['specialties'] as List<dynamic>?) ?? [];
    final brnList = (json['branches'] as List<dynamic>?) ?? [];
    return ClinicModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      city: json['city']?.toString(),
      address: json['address']?.toString() ?? json['street_address']?.toString(),
      phone: json['phone']?.toString() ?? json['phone_number']?.toString(),
      clinicType: json['clinic_type']?.toString() ?? 'GENERAL',
      branchesCount: json['branches_count'] as int? ?? (brnList.isNotEmpty ? brnList.length : 1),
      doctorsCount: json['doctors_count'] as int? ?? 1,
      specialties: specList.map((e) => e.toString()).toList(),
      rating: (json['rating'] as num?)?.toDouble() ?? 4.5,
      branches: brnList
          .map((b) => BranchItemModel.fromJson(b as Map<String, dynamic>))
          .toList(),
    );
  }
}
