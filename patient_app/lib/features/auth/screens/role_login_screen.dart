import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/custom_text_field.dart';
import '../providers/auth_provider.dart';

enum LoginRole { patient, doctor, receptionist }

class RoleLoginScreen extends ConsumerStatefulWidget {
  const RoleLoginScreen({super.key});

  @override
  ConsumerState<RoleLoginScreen> createState() => _RoleLoginScreenState();
}

class _RoleLoginScreenState extends ConsumerState<RoleLoginScreen> {
  LoginRole _selectedRole = LoginRole.patient;

  // Patient OTP controllers
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _nameController = TextEditingController();

  // Staff Password controllers
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  int _cooldownSeconds = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _applyRoleDefaults(_selectedRole);
  }

  void _applyRoleDefaults(LoginRole role) {
    if (role == LoginRole.patient) {
      _phoneController.text = '9876543210';
    } else if (role == LoginRole.doctor) {
      _identifierController.text = 'doctor@careplus.in';
      _passwordController.text = 'Password@123';
    } else if (role == LoginRole.receptionist) {
      _identifierController.text = 'receptionist@careplus.in';
      _passwordController.text = 'Password@123';
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _nameController.dispose();
    _identifierController.dispose();
    _passwordController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startCooldown([int seconds = 30]) {
    setState(() => _cooldownSeconds = seconds);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldownSeconds <= 1) {
        timer.cancel();
        setState(() => _cooldownSeconds = 0);
      } else {
        setState(() => _cooldownSeconds--);
      }
    });
  }

  Future<void> _handlePatientSendOtp() async {
    final raw = _phoneController.text.trim();
    if (raw.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit mobile number')),
      );
      return;
    }

    final formattedPhone = '+91$raw';
    final success = await ref.read(authProvider.notifier).sendOtp(formattedPhone);
    if (success && mounted) {
      _startCooldown(30);
      _otpController.text = '123456';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('OTP sent to $formattedPhone. Default demo code: 123456'),
          backgroundColor: AppColors.deepTeal,
        ),
      );
    }
  }

  Future<void> _handlePatientVerifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the 6-digit OTP code')),
      );
      return;
    }

    final name = _nameController.text.trim();
    final success = await ref.read(authProvider.notifier).verifyOtp(
      otpCode: otp,
      fullName: name.isNotEmpty ? name : null,
    );

    if (success && mounted) {
      context.go('/home');
    }
  }

  Future<void> _handleStaffLogin() async {
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text.trim();

    if (identifier.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter both identifier and password')),
      );
      return;
    }

    final role = await ref.read(authProvider.notifier).loginWithPassword(
      identifier: identifier,
      password: password,
    );

    if (role != null && mounted) {
      if (role == 'DOCTOR') {
        context.go('/doctor-home');
      } else if (role == 'RECEPTIONIST') {
        context.go('/receptionist-home');
      } else {
        context.go('/home');
      }
    }
  }

  void _quickDemoLogin(LoginRole role) {
    setState(() {
      _selectedRole = role;
      _applyRoleDefaults(role);
    });

    if (role == LoginRole.patient) {
      _phoneController.text = '9876543210';
      _handlePatientSendOtp().then((_) {
        if (mounted) _handlePatientVerifyOtp();
      });
    } else {
      _handleStaffLogin();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              // Brand Logo & Title
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: AppColors.deepTeal,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.deepTeal.withValues(alpha: 0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.local_hospital_rounded,
                        color: Colors.white,
                        size: 34,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Smart Clinic OS',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Unified Clinical Healthcare App',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // Role Selector Segmented Control
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    _buildRoleTab(LoginRole.patient, Icons.person, 'Patient'),
                    _buildRoleTab(LoginRole.doctor, Icons.medical_services, 'Doctor'),
                    _buildRoleTab(LoginRole.receptionist, Icons.desk, 'Receptionist'),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Role-specific Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.softMint,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primaryMint.withValues(alpha: 0.5)),
                ),
                child: Row(
                  children: [
                    Icon(
                      _selectedRole == LoginRole.patient
                          ? Icons.person_pin_rounded
                          : _selectedRole == LoginRole.doctor
                              ? Icons.medical_services
                              : Icons.receipt_long_rounded,
                      color: AppColors.deepTeal,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _selectedRole == LoginRole.patient
                                ? 'Patient / User Access'
                                : _selectedRole == LoginRole.doctor
                                    ? 'Doctor OPD Station'
                                    : 'Receptionist Front Desk',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppColors.deepTeal,
                            ),
                          ),
                          Text(
                            _selectedRole == LoginRole.patient
                                ? 'Book appointments, track queue & view records'
                                : _selectedRole == LoginRole.doctor
                                    ? 'Call queue, examine patients & issue prescriptions'
                                    : 'Register walk-ins, issue tokens & record billing',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Form based on role
              if (_selectedRole == LoginRole.patient) ...[
                // PATIENT OTP FORM
                if (!authState.isOtpSent) ...[
                  CustomTextField(
                    controller: _phoneController,
                    label: 'Patient Mobile Number',
                    hint: '98765 43210',
                    keyboardType: TextInputType.phone,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(10),
                    ],
                    prefixIcon: Padding(
                      padding: const EdgeInsets.only(left: 14, right: 8),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Text(
                            '🇮🇳 +91',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          SizedBox(width: 8),
                          SizedBox(
                            height: 20,
                            child: VerticalDivider(color: AppColors.border, thickness: 1.2),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  CustomButton(
                    text: 'Request OTP Code',
                    isLoading: authState.isLoading,
                    onPressed: _handlePatientSendOtp,
                  ),
                ] else ...[
                  CustomTextField(
                    controller: _otpController,
                    label: '6-Digit OTP Code',
                    hint: '123456',
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    prefixIcon: const Icon(Icons.lock_clock_outlined, color: AppColors.deepTeal),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Demo OTP: 123456',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.deepTeal,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      TextButton(
                        onPressed: () => ref.read(authProvider.notifier).resetOtp(),
                        child: const Text('Change Number', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  CustomButton(
                    text: 'Verify & Sign In as Patient',
                    isLoading: authState.isLoading,
                    onPressed: _handlePatientVerifyOtp,
                  ),
                ],
              ] else ...[
                // DOCTOR OR RECEPTIONIST PASSWORD FORM
                CustomTextField(
                  controller: _identifierController,
                  label: _selectedRole == LoginRole.doctor ? 'Doctor Email ID' : 'Receptionist Email ID',
                  hint: _selectedRole == LoginRole.doctor ? 'doctor@careplus.in' : 'receptionist@careplus.in',
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: const Icon(Icons.email_outlined, color: AppColors.deepTeal),
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hint: '••••••••••••',
                  obscureText: _obscurePassword,
                  prefixIcon: const Icon(Icons.lock_outline, color: AppColors.deepTeal),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      color: AppColors.textSecondary,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
                const SizedBox(height: 20),
                CustomButton(
                  text: _selectedRole == LoginRole.doctor ? 'Sign In as Doctor' : 'Sign In as Receptionist',
                  isLoading: authState.isLoading,
                  onPressed: _handleStaffLogin,
                ),
              ],

              if (authState.error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.errorBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, size: 18, color: AppColors.error),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          authState.error!,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.error,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 32),

              // Quick Demo Sign-In Buttons
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '⚡ Quick Demo Sign-In (1-Tap)',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildQuickDemoTile(
                      role: LoginRole.patient,
                      title: 'Patient Demo (Aditi Sharma)',
                      subtitle: '+919876543210 • OTP 123456',
                      icon: Icons.person_outline,
                      color: const Color(0xFF0D9488),
                    ),
                    const SizedBox(height: 8),
                    _buildQuickDemoTile(
                      role: LoginRole.doctor,
                      title: 'Doctor Demo (Dr. Ananya Sharma)',
                      subtitle: 'doctor@careplus.in • CarePlus Clinic',
                      icon: Icons.medical_services,
                      color: AppColors.deepTeal,
                    ),
                    const SizedBox(height: 8),
                    _buildQuickDemoTile(
                      role: LoginRole.receptionist,
                      title: 'Receptionist Demo (Priya Patel)',
                      subtitle: 'receptionist@careplus.in • Front Desk',
                      icon: Icons.desk,
                      color: const Color(0xFF2563EB),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              const Center(
                child: Text(
                  'Super Admin & Location Admin console is hosted on Web Portal (port 3000)',
                  style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleTab(LoginRole role, IconData icon, String label) {
    final isSelected = _selectedRole == role;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedRole = role;
            _applyRoleDefaults(role);
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.deepTeal : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 16,
                color: isSelected ? Colors.white : AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickDemoTile({
    required LoginRole role,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return InkWell(
      onTap: () => _quickDemoLogin(role),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: color,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 12, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}
