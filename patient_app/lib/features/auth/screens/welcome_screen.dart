import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/custom_button.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SizedBox(height: 20),
              Column(
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      color: AppColors.softMint,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Icon(
                      Icons.healing_outlined,
                      size: 48,
                      color: AppColors.deepTeal,
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    'Smart Clinic OS',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Book OPD slots, monitor live queue tokens remotely, and access digital prescriptions & lab reports anywhere.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
              Column(
                children: [
                  CustomButton(
                    text: 'Get Started with Mobile OTP',
                    onPressed: () {
                      context.push('/login');
                    },
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Compliant with Indian DPDP Act 2023 & NDHM',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

