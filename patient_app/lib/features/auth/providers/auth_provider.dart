import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';
import '../models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final bool isOtpSent;
  final String? phoneNumber;
  final String? debugOtp;
  final UserModel? user;
  final String? userRole;
  final String? clinicId;
  final String? clinicName;
  final String? error;

  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.isOtpSent = false,
    this.phoneNumber,
    this.debugOtp,
    this.user,
    this.userRole,
    this.clinicId,
    this.clinicName,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    bool? isOtpSent,
    String? phoneNumber,
    String? debugOtp,
    UserModel? user,
    String? userRole,
    String? clinicId,
    String? clinicName,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isOtpSent: isOtpSent ?? this.isOtpSent,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      debugOtp: debugOtp ?? this.debugOtp,
      user: user ?? this.user,
      userRole: userRole ?? this.userRole,
      clinicId: clinicId ?? this.clinicId,
      clinicName: clinicName ?? this.clinicName,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repo;

  AuthNotifier(this._repo) : super(const AuthState());

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final hasToken = await _repo.checkAuthStatus();
      if (hasToken) {
        final user = await _repo.getProfile();
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: user,
        );
      } else {
        state = state.copyWith(isLoading: false, isAuthenticated: false);
      }
    } catch (_) {
      state = state.copyWith(isLoading: false, isAuthenticated: false);
    }
  }

  Future<bool> sendOtp(String phoneNumber) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _repo.requestOtp(phoneNumber);
      state = state.copyWith(
        isLoading: false,
        isOtpSent: true,
        phoneNumber: phoneNumber,
        debugOtp: res['debug_otp']?.toString(),
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('ApiException: ', ''),
      );
      return false;
    }
  }

  Future<bool> verifyOtp({
    required String otpCode,
    String? fullName,
  }) async {
    if (state.phoneNumber == null) return false;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _repo.verifyOtp(
        phoneNumber: state.phoneNumber!,
        otpCode: otpCode,
        fullName: fullName,
      );
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: user,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('ApiException: ', ''),
      );
      return false;
    }
  }

  Future<bool> updateProfile({String? fullName, String? email}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final updated = await _repo.updateProfile(fullName: fullName, email: email);
      state = state.copyWith(
        isLoading: false,
        user: updated,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('ApiException: ', ''),
      );
      return false;
    }
  }

  void resetOtp() {
    state = state.copyWith(isOtpSent: false, debugOtp: null);
  }

  Future<String?> loginWithPassword({
    required String identifier,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _repo.loginPassword(
        identifier: identifier,
        password: password,
      );
      final role = (res['role'] ?? 'PATIENT').toString().toUpperCase();
      final clinicId = res['clinic_id']?.toString();
      final clinicName = res['clinic_name']?.toString();
      final userData = res['user'] as Map<String, dynamic>? ?? {};

      final user = UserModel(
        id: userData['id']?.toString() ?? '',
        phoneNumber: userData['phone_number']?.toString() ?? '',
        fullName: userData['full_name']?.toString() ?? '',
        email: userData['email']?.toString(),
        isVerified: userData['is_verified'] == true,
      );

      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: user,
        userRole: role,
        clinicId: clinicId,
        clinicName: clinicName,
      );
      return role;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('ApiException: ', ''),
      );
      return null;
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return AuthNotifier(repo);
});
