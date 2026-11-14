import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../queue/providers/queue_provider.dart';
import '../models/doctor_model.dart';
import '../providers/discovery_provider.dart';

class DoctorDetailScreen extends ConsumerWidget {
  final String doctorId;

  const DoctorDetailScreen({super.key, required this.doctorId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final doctorAsync = ref.watch(doctorDetailsProvider(doctorId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Doctor Profile'),
      ),
      bottomNavigationBar: doctorAsync.when(
        data: (doctor) => _buildBottomBar(context, ref, doctor),
        loading: () => const SizedBox.shrink(),
        error: (err, stack) => const SizedBox.shrink(),
      ),
      body: doctorAsync.when(
        data: (doctor) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Doctor Main Header
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: AppColors.lightTeal,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: const Icon(Icons.person, size: 38, color: AppColors.deepTeal),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        doctor.doctorName,
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ),
                                    const Icon(Icons.verified, size: 18, color: AppColors.primaryTeal),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  doctor.specialty,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.deepTeal,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  doctor.qualification,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      // Stats Row
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem('${doctor.experienceYears}+ Yrs', 'Experience'),
                            _buildVerticalDivider(),
                            _buildStatItem('₹${doctor.consultationFee.toInt()}', 'Consultation Fee'),
                            _buildVerticalDivider(),
                            _buildStatItem(doctor.rating.toString(), 'Rating ★'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Verified Registration Credentials (DPDP & NMC Compliance)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.verified_user_outlined, size: 18, color: AppColors.deepTeal),
                          SizedBox(width: 8),
                          Text(
                            'Medical Verification Details',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _buildDetailRow('Registration No.', doctor.medicalRegistrationNumber),
                      _buildDetailRow('State/National Council', doctor.registrationCouncil),
                      _buildDetailRow('Verification Status', doctor.verificationStatus),
                      _buildDetailRow('Associated Clinic', doctor.clinicName ?? 'Smart Clinic Partner'),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Weekly OPD Timetable
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.schedule, size: 18, color: AppColors.deepTeal),
                          SizedBox(width: 8),
                          Text(
                            'Weekly OPD Consultation Schedule',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (doctor.schedules.isEmpty)
                        const Text(
                          'Monday to Saturday: 09:00 AM – 01:00 PM (Regular OPD)',
                          style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                        )
                      else
                        ...doctor.schedules.map((s) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    s.dayName,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  Text(
                                    '${s.startTime} – ${s.endTime}${s.breakStartTime != null ? " (Break: ${s.breakStartTime}-${s.breakEndTime})" : ""}',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: AppColors.deepTeal,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            )),
                    ],
                  ),
                ),

                const SizedBox(height: 32),
              ],
            ),
          );
        },
        loading: () => const LoadingIndicator(message: 'Loading doctor details...'),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.refresh(doctorDetailsProvider(doctorId)),
        ),
      ),
    );
  }

  Widget _buildStatItem(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: AppColors.deepTeal,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildVerticalDivider() {
    return Container(
      width: 1,
      height: 24,
      color: AppColors.border,
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context, WidgetRef ref, DoctorModel doctor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(top: BorderSide(color: AppColors.border)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Join Live Queue
            Expanded(
              child: CustomButton(
                text: 'Join Live Queue',
                isOutlined: true,
                icon: Icons.confirmation_number_outlined,
                onPressed: () async {
                  final branchId = doctor.primaryBranchId ?? doctor.clinicId;
                  final success = await ref.read(queueProvider.notifier).joinQueue(
                        clinicId: doctor.clinicId,
                        branchId: branchId,
                        doctorId: doctor.id,
                      );

                  if (success && context.mounted) {
                    context.push('/live-queue');
                  }
                },
              ),
            ),
            const SizedBox(width: 12),
            // Book Fixed Slot
            Expanded(
              child: CustomButton(
                text: 'Book Slot',
                icon: Icons.calendar_today,
                onPressed: () {
                  final branchId = doctor.primaryBranchId ?? doctor.clinicId;
                  context.push('/slot-booking', extra: {
                    'clinicId': doctor.clinicId,
                    'branchId': branchId,
                    'doctorId': doctor.id,
                    'doctorName': doctor.doctorName,
                    'specialty': doctor.specialty,
                    'clinicName': doctor.clinicName,
                    'fee': doctor.consultationFee,
                  });
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
