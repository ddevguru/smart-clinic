import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../providers/discovery_provider.dart';

class ClinicDetailScreen extends ConsumerWidget {
  final String clinicId;

  const ClinicDetailScreen({super.key, required this.clinicId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clinicAsync = ref.watch(clinicDetailsProvider(clinicId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Clinic Details'),
      ),
      body: clinicAsync.when(
        data: (clinic) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Clinic Info Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: AppColors.softMint,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Icon(
                              Icons.local_hospital_rounded,
                              size: 32,
                              color: AppColors.deepTeal,
                            ),
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
                                        clinic.name,
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
                                  clinic.clinicType ?? 'General Practice Clinic',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.deepTeal,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (clinic.address != null) ...[
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textSecondary),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                clinic.address!,
                                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                      ],
                      if (clinic.phone != null) ...[
                        Row(
                          children: [
                            const Icon(Icons.phone_outlined, size: 16, color: AppColors.textSecondary),
                            const SizedBox(width: 8),
                            Text(
                              clinic.phone!,
                              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Branches Section
                if (clinic.branches.isNotEmpty) ...[
                  const Text(
                    'Clinic Branches',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...clinic.branches.map((b) => Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.business_outlined, color: AppColors.deepTeal),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    b.name,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  if (b.address != null)
                                    Text(
                                      b.address!,
                                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                    ),
                                ],
                              ),
                            ),
                            if (b.isMainBranch)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.softMint,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  'Main',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.deepTeal,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      )),
                  const SizedBox(height: 20),
                ],

                // Doctors at this clinic
                const Text(
                  'Doctors at this Clinic',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                if (clinic.activeDoctorsCount == 0)
                  const Text('No doctors currently listed.')
                else
                  Consumer(
                    builder: (context, ref, _) {
                      final doctorsAsync = ref.watch(doctorsListProvider);
                      return doctorsAsync.when(
                        data: (allDoctors) {
                          final clinicDocs = allDoctors.where((d) => d.clinicId == clinic.id).toList();
                          if (clinicDocs.isEmpty) {
                            return const Text('Schedule loading...');
                          }
                          return Column(
                            children: clinicDocs.map((doc) => _buildDoctorRow(context, clinic, doc)).toList(),
                          );
                        },
                        loading: () => const LoadingIndicator(),
                        error: (err, stack) => const SizedBox(),
                      );
                    },
                  ),
              ],
            ),
          );
        },
        loading: () => const LoadingIndicator(message: 'Loading clinic information...'),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.refresh(clinicDetailsProvider(clinicId)),
        ),
      ),
    );
  }

  Widget _buildDoctorRow(BuildContext context, dynamic clinic, dynamic doctor) {
    final branchId = clinic.branches.isNotEmpty ? clinic.branches.first.id : (doctor.primaryBranchId ?? '');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.softMint,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.person, color: AppColors.deepTeal),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor.doctorName,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      '${doctor.specialty} • ${doctor.qualification}',
                      style: const TextStyle(fontSize: 12, color: AppColors.deepTeal, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      '₹${doctor.consultationFee.toInt()} Consultation Fee',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    context.push('/slot-booking', extra: {
                      'clinicId': clinic.id,
                      'branchId': branchId,
                      'doctorId': doctor.id,
                      'doctorName': doctor.doctorName,
                      'specialty': doctor.specialty,
                      'clinicName': clinic.name,
                      'fee': doctor.consultationFee,
                    });
                  },
                  child: const Text('Book Slot'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    context.push('/doctor/${doctor.id}');
                  },
                  child: const Text('View Doctor'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
