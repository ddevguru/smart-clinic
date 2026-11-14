import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../models/user_model.dart';

class AuthRepository {
  final ApiClient _apiClient;
  final SecureStorageService _storage;

  AuthRepository({
    ApiClient? apiClient,
    SecureStorageService? storage,
  })  : _apiClient = apiClient ?? ApiClient(),
        _storage = storage ?? SecureStorageService();

  Future<Map<String, dynamic>> requestOtp(String phoneNumber) async {
    final response = await _apiClient.post(
      ApiEndpoints.requestOtp,
      data: {'phone_number': phoneNumber},
    );
    return response['data'] as Map<String, dynamic>;
  }

  Future<UserModel> verifyOtp({
    required String phoneNumber,
    required String otpCode,
    String? fullName,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.verifyOtp,
      data: {
        'phone_number': phoneNumber,
        'otp_code': otpCode,
        if (fullName != null && fullName.isNotEmpty) 'full_name': fullName,
      },
    );

    final data = response['data'] as Map<String, dynamic>;
    final accessToken = data['access_token'] as String;
    final refreshToken = data['refresh_token'] as String;
    final userData = data['user'] as Map<String, dynamic>;
    final user = UserModel.fromJson(userData);

    await _storage.saveAuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );

    await _storage.saveUserProfile(
      userId: user.id,
      phone: user.phoneNumber,
      name: user.fullName,
    );

    return user;
  }

  Future<UserModel> getProfile() async {
    final response = await _apiClient.get(ApiEndpoints.patientMe);
    final data = response['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  Future<UserModel> updateProfile({String? fullName, String? email}) async {
    final response = await _apiClient.patch(
      ApiEndpoints.patientMe,
      data: {
        if (fullName != null) 'full_name': fullName,
        if (email != null) 'email': email,
      },
    );
    final data = response['data'] as Map<String, dynamic>;
    final user = UserModel.fromJson(data);
    await _storage.saveUserProfile(
      userId: user.id,
      phone: user.phoneNumber,
      name: user.fullName,
    );
    return user;
  }

  Future<Map<String, dynamic>> loginPassword({
    required String identifier,
    required String password,
  }) async {
    final response = await _apiClient.post(
      '/auth/login-password',
      data: {
        'identifier': identifier,
        'password': password,
      },
    );

    final data = response['data'] as Map<String, dynamic>;
    final accessToken = (data['token'] ?? data['access_token']) as String;
    final userData = data['user'] as Map<String, dynamic>? ?? {};
    final role = (data['role'] ?? userData['role'] ?? 'PATIENT') as String;
    final clinicId = data['clinic_id'] as String?;
    final clinicName = data['clinic_name'] as String?;
    final doctorId = data['doctor_id'] as String?;

    await _storage.saveAuthTokens(
      accessToken: accessToken,
      refreshToken: accessToken,
    );

    await _storage.saveUserProfile(
      userId: userData['id']?.toString() ?? '',
      phone: userData['phone_number']?.toString() ?? '',
      name: userData['full_name']?.toString() ?? '',
    );

    await _storage.write('user_role', role);
    if (clinicId != null) await _storage.write('clinic_id', clinicId);
    if (clinicName != null) await _storage.write('clinic_name', clinicName);
    if (doctorId != null) await _storage.write('doctor_id', doctorId);

    return data;
  }

  Future<bool> checkAuthStatus() async {
    return await _storage.hasValidToken();
  }

  Future<void> logout() async {
    await _storage.clearAuth();
  }
}
