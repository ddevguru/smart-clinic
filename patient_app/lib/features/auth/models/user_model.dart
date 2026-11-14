class UserModel {
  final String id;
  final String phoneNumber;
  final String fullName;
  final String? email;
  final bool isVerified;
  final String? gender;
  final String? dateOfBirth;

  UserModel({
    required this.id,
    required this.phoneNumber,
    required this.fullName,
    this.email,
    this.isVerified = false,
    this.gender,
    this.dateOfBirth,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      phoneNumber: json['phone_number']?.toString() ?? '',
      fullName: json['full_name']?.toString() ?? 'Patient',
      email: json['email']?.toString(),
      isVerified: json['is_verified'] as bool? ?? false,
      gender: json['gender']?.toString(),
      dateOfBirth: json['date_of_birth']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone_number': phoneNumber,
      'full_name': fullName,
      if (email != null) 'email': email,
      'is_verified': isVerified,
      if (gender != null) 'gender': gender,
      if (dateOfBirth != null) 'date_of_birth': dateOfBirth,
    };
  }
}

