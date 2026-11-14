import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import 'status_badge.dart';

class TokenCard extends StatelessWidget {
  final String tokenNumber;
  final String status;
  final int patientsAhead;
  final int estimatedWaitMinutes;
  final String doctorName;
  final String? specialty;
  final String clinicName;
  final bool isPaused;
  final String? pauseReason;
  final VoidCallback? onTap;

  const TokenCard({
    super.key,
    required this.tokenNumber,
    required this.status,
    required this.patientsAhead,
    required this.estimatedWaitMinutes,
    required this.doctorName,
    this.specialty,
    required this.clinicName,
    this.isPaused = false,
    this.pauseReason,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.primaryMint, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: AppColors.primaryTeal.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            // Top Status Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: AppColors.softMint,
              child: Row(
                children: [
                  const Icon(Icons.bolt, size: 18, color: AppColors.deepTeal),
                  const SizedBox(width: 6),
                  const Text(
                    'LIVE QUEUE TOKEN',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.deepTeal,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const Spacer(),
                  StatusBadge(status: status),
                ],
              ),
            ),

            if (isPaused)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                color: AppColors.warningBg,
                child: Row(
                  children: [
                    const Icon(Icons.pause_circle_outline, size: 16, color: AppColors.warning),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        pauseReason != null && pauseReason!.isNotEmpty
                            ? 'Queue Paused: $pauseReason'
                            : 'Queue is currently paused by doctor',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.warning,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Token & Doctor Details
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Large Token Display Pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            const Text(
                              'YOUR TOKEN',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textSecondary,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tokenNumber,
                              style: AppTextStyles.tokenNumber,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(width: 18),

                      // Wait time and Ahead stats
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.people_alt_outlined, size: 16, color: AppColors.textSecondary),
                                const SizedBox(width: 6),
                                Text(
                                  patientsAhead == 0
                                      ? 'You are next in line!'
                                      : '$patientsAhead ahead of you',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: patientsAhead == 0 ? AppColors.success : AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.schedule, size: 16, color: AppColors.textSecondary),
                                const SizedBox(width: 6),
                                Text(
                                  estimatedWaitMinutes == 0
                                      ? 'Ready for call'
                                      : '~$estimatedWaitMinutes mins wait',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const Divider(height: 28),

                  // Doctor and Clinic Information
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.softMint,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.medical_services_outlined, size: 18, color: AppColors.deepTeal),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              doctorName,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              specialty != null ? '$specialty • $clinicName' : clinicName,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: AppColors.textSecondary),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

