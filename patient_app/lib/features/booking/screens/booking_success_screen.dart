import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/custom_button.dart';

class BookingSuccessScreen extends StatelessWidget {
  final Map<String, dynamic>? bookingDetails;
  final Map<String, dynamic>? extra;

  const BookingSuccessScreen({
    super.key,
    this.bookingDetails,
    this.extra,
  });

  @override
  Widget build(BuildContext context) {
    final details = bookingDetails ?? extra;
    final doctorName = details?['doctorName'] ?? 'Attending Doctor';
    final clinicName = details?['clinicName'] ?? 'Clinic';
    final time = details?['time'] ?? '10:00 AM';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.successBg,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_outline,
                  color: AppColors.success,
                  size: 64,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Appointment Confirmed!',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Your consultation with $doctorName at $clinicName has been confirmed for $time.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 40),
              CustomButton(
                text: 'View My Appointments',
                onPressed: () {
                  context.go('/appointments');
                },
              ),
              const SizedBox(height: 12),
              CustomButton(
                text: 'Go to Home',
                isOutlined: true,
                onPressed: () {
                  context.go('/home');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
