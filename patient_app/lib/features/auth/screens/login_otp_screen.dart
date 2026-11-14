import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/custom_text_field.dart';
import '../providers/auth_provider.dart';

class LoginOtpScreen extends ConsumerStatefulWidget {
  const LoginOtpScreen({super.key});

  @override
  ConsumerState<LoginOtpScreen> createState() => _LoginOtpScreenState();
}

class _LoginOtpScreenState extends ConsumerState<LoginOtpScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _nameController = TextEditingController();

  int _cooldownSeconds = 0;
  Timer? _timer;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _nameController.dispose();
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

  Future<void> _handleSendOtp() async {
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('OTP sent to $formattedPhone'),
          backgroundColor: AppColors.deepTeal,
        ),
      );
    }
  }

  Future<void> _handleVerifyOtp() async {
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
      final user = ref.read(authProvider).user;
      if (user?.fullName == null || user!.fullName.startsWith('Patient ')) {
        context.go('/profile-setup');
      } else {
        context.go('/home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Patient Login'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                authState.isOtpSent ? 'Verify OTP Challenge' : 'Enter Your Phone Number',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                authState.isOtpSent
                    ? 'Enter the 6-digit verification code sent to ${authState.phoneNumber}'
                    : 'We will send a 6-digit verification code to verify your patient account.',
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 32),

              if (!authState.isOtpSent) ...[
                // Phone Number Input
                CustomTextField(
                  controller: _phoneController,
                  label: 'Mobile Number',
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
                const SizedBox(height: 24),
                CustomButton(
                  text: 'Request OTP',
                  isLoading: authState.isLoading,
                  onPressed: _handleSendOtp,
                ),
              ] else ...[
                // OTP Input Form
                CustomTextField(
                  controller: _otpController,
                  label: '6-Digit Verification Code',
                  hint: '• • • • • •',
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  prefixIcon: const Icon(Icons.lock_clock_outlined, color: AppColors.deepTeal),
                ),

                if (authState.debugOtp != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.softMint,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.primaryMint),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.info_outline, size: 16, color: AppColors.deepTeal),
                        const SizedBox(width: 6),
                        Text(
                          'Test OTP: ${authState.debugOtp}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.deepTeal,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 24),
                CustomButton(
                  text: 'Verify & Sign In',
                  isLoading: authState.isLoading,
                  onPressed: _handleVerifyOtp,
                ),
                const SizedBox(height: 16),

                // Resend OTP & Change Number
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: () {
                        // Reset to change phone number
                        ref.read(authProvider.notifier).resetOtp();
                      },
                      child: const Text('Change Number'),
                    ),
                    if (_cooldownSeconds > 0)
                      Text(
                        'Resend in ${_cooldownSeconds}s',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      )
                    else
                      TextButton(
                        onPressed: _handleSendOtp,
                        child: const Text('Resend OTP'),
                      ),
                  ],
                ),
              ],

              if (authState.error != null) ...[
                const SizedBox(height: 20),
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
            ],
          ),
        ),
      ),
    );
  }
}
