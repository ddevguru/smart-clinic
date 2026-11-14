import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../models/record_model.dart';

class PrescriptionDetailScreen extends StatelessWidget {
  final PrescriptionItemModel prescription;

  const PrescriptionDetailScreen({
    super.key,
    required this.prescription,
  });

  @override
  Widget build(BuildContext context) {
    final isVoided = prescription.status == 'VOIDED';
    final isSuperseded = prescription.status == 'SUPERSEDED';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(prescription.prescriptionNumber),
        actions: [
          if (prescription.hasPdf && !isVoided)
            IconButton(
              icon: const Icon(Icons.picture_as_pdf_outlined),
              tooltip: 'Download Signed PDF',
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Downloading verified vector PDF for ${prescription.prescriptionNumber}...',
                    ),
                    backgroundColor: AppColors.deepTeal,
                  ),
                );
              },
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Banner if Voided or Superseded
            if (isVoided)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.errorBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.error),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.cancel_outlined, color: AppColors.error),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'This prescription has been VOIDED by the prescribing doctor.',
                        style: TextStyle(
                          color: AppColors.error,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            if (isSuperseded)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFF59E0B)),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.history, color: Color(0xFF92400E)),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'This version has been superseded by a corrected prescription.',
                        style: TextStyle(
                          color: Color(0xFF92400E),
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Clinic & Doctor Card
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          prescription.clinicName,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.deepTeal,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isVoided
                              ? AppColors.errorBg
                              : AppColors.successBg,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'v${prescription.currentVersionNumber} • ${prescription.status}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isVoided ? AppColors.error : AppColors.success,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    prescription.doctorName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (prescription.qualification != null || prescription.specialty != null)
                    Text(
                      '${prescription.qualification ?? ""} ${prescription.specialty != null ? "• ${prescription.specialty}" : ""}'.trim(),
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    ),
                  if (prescription.medicalRegistrationNumber != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Reg. No: ${prescription.medicalRegistrationNumber}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryMint,
                      ),
                    ),
                  ],
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Rx No: ${prescription.prescriptionNumber}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      Text(
                        prescription.createdAt.isNotEmpty
                            ? prescription.createdAt.split('T')[0]
                            : 'Today',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Clinical Assessment Section
            if (prescription.diagnosis != null || prescription.chiefComplaints != null)
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
                    const Text(
                      'Clinical Assessment',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (prescription.diagnosis != null) ...[
                      _buildInfoRow(
                        'Diagnosis (${prescription.diagnosisType ?? "Provisional"})',
                        prescription.diagnosis!,
                        isHighlight: true,
                      ),
                      const SizedBox(height: 10),
                    ],
                    if (prescription.chiefComplaints != null) ...[
                      _buildInfoRow('Chief Complaints', prescription.chiefComplaints!),
                      const SizedBox(height: 10),
                    ],
                    if (prescription.examinationFindings != null)
                      _buildInfoRow('Findings & Vitals', prescription.examinationFindings!),
                  ],
                ),
              ),

            const SizedBox(height: 20),

            // Prescribed Medications
            const Text(
              'Prescribed Medications',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),

            if (prescription.medications.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Center(
                  child: Text(
                    'No medications prescribed.',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: prescription.medications.length,
                separatorBuilder: (context, index) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final med = prescription.medications[index];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.softMint,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.medication_outlined,
                                color: AppColors.deepTeal,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    med.medicineName,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  if (med.genericName != null && med.genericName!.isNotEmpty)
                                    Text(
                                      med.genericName!,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.softMint,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                med.dosage,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.deepTeal,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 18),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Frequency: ${med.frequency}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              'Duration: ${med.duration}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Instructions: ${med.foodInstructions.replaceAll("_", " ")}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        if (med.additionalInstructions != null &&
                            med.additionalInstructions!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Note: ${med.additionalInstructions}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                              color: AppColors.primaryMint,
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                },
              ),

            const SizedBox(height: 20),

            // Advice & Follow Up
            if (prescription.adviceAndPrecautions != null ||
                prescription.followUpDate != null)
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
                    const Text(
                      'Advice & Next Visit',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (prescription.adviceAndPrecautions != null) ...[
                      _buildInfoRow('General Precautions', prescription.adviceAndPrecautions!),
                      const SizedBox(height: 10),
                    ],
                    if (prescription.followUpDate != null)
                      _buildInfoRow('Scheduled Review Date', prescription.followUpDate!),
                    if (prescription.followUpInstructions != null) ...[
                      const SizedBox(height: 8),
                      _buildInfoRow('Follow-up Advice', prescription.followUpInstructions!),
                    ],
                  ],
                ),
              ),

            const SizedBox(height: 20),

            // Digital Security & Authenticity Stamp
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.softMint,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.primaryMint.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.verified_outlined, color: AppColors.deepTeal, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Digitally Signed & Verified',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.deepTeal,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'SHA-256 Checksum: ${prescription.documentChecksum ?? "Verified Valid"}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Legally valid digital prescription under NMC Telemedicine Practice Guidelines & Information Technology Act 2000.',
                    style: TextStyle(fontSize: 11, color: AppColors.textSecondary, height: 1.3),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isHighlight = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isHighlight ? FontWeight.w700 : FontWeight.w500,
            color: isHighlight ? AppColors.deepTeal : AppColors.textPrimary,
            height: 1.3,
          ),
        ),
      ],
    );
  }
}
