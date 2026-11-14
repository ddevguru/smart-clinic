import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../models/record_model.dart';
import '../providers/records_provider.dart';
import 'prescription_detail_screen.dart';

class HealthRecordsScreen extends ConsumerStatefulWidget {
  const HealthRecordsScreen({super.key});

  @override
  ConsumerState<HealthRecordsScreen> createState() => _HealthRecordsScreenState();
}

class _HealthRecordsScreenState extends ConsumerState<HealthRecordsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Health Records & EHR'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.deepTeal,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.deepTeal,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          tabs: const [
            Tab(text: 'Prescriptions', icon: Icon(Icons.medication_outlined, size: 20)),
            Tab(text: 'Lab Reports', icon: Icon(Icons.description_outlined, size: 20)),
            Tab(text: 'Timeline', icon: Icon(Icons.timeline_outlined, size: 20)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPrescriptionsTab(),
          _buildDocumentsTab(),
          _buildTimelineTab(),
        ],
      ),
    );
  }

  Widget _buildPrescriptionsTab() {
    final prescriptionsAsync = ref.watch(prescriptionsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(prescriptionsProvider),
      child: prescriptionsAsync.when(
        data: (prescriptions) {
          if (prescriptions.isEmpty) {
            return const EmptyStateView(
              title: 'No Prescriptions Found',
              subtitle: 'Digital prescriptions issued by your doctors will appear here automatically.',
              icon: Icons.medication_outlined,
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: prescriptions.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final rx = prescriptions[index];
              return _buildPrescriptionCard(rx);
            },
          );
        },
        loading: () => const LoadingIndicator(message: 'Loading prescriptions...'),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.refresh(prescriptionsProvider),
        ),
      ),
    );
  }

  Widget _buildPrescriptionCard(PrescriptionItemModel rx) {
    final isVoided = rx.status == 'VOIDED';

    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => PrescriptionDetailScreen(prescription: rx),
          ),
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
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
                Text(
                  rx.prescriptionNumber,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.deepTeal,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isVoided ? AppColors.errorBg : AppColors.successBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'v${rx.currentVersionNumber} • ${rx.status}',
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
              rx.doctorName,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            Text(
              '${rx.specialty ?? "Consultation"} • ${rx.clinicName}',
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            if (rx.diagnosis != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.softMint,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Diagnosis: ${rx.diagnosis}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.deepTeal,
                  ),
                ),
              ),
            ],
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${rx.medications.length} Medications Prescribed',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                Row(
                  children: const [
                    Text(
                      'View Details',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.deepTeal,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(Icons.arrow_forward_ios, size: 12, color: AppColors.deepTeal),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDocumentsTab() {
    final docsAsync = ref.watch(documentsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(documentsProvider),
      child: docsAsync.when(
        data: (docs) {
          if (docs.isEmpty) {
            return const EmptyStateView(
              title: 'No Documents Uploaded',
              subtitle: 'Lab reports, blood tests, and radiology scans uploaded by your clinic will show here.',
              icon: Icons.description_outlined,
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: docs.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final doc = docs[index];
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.softMint,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.picture_as_pdf,
                        color: AppColors.deepTeal,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            doc.title,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${doc.documentType} • ${doc.documentDate ?? (doc.createdAt.isNotEmpty ? doc.createdAt.split("T")[0] : "Recent")}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          if (doc.notes != null && doc.notes!.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              doc.notes!,
                              style: const TextStyle(
                                fontSize: 11,
                                fontStyle: FontStyle.italic,
                                color: AppColors.primaryMint,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.download_outlined, color: AppColors.deepTeal),
                      tooltip: 'Download Report',
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Downloading ${doc.title}...'),
                            backgroundColor: AppColors.deepTeal,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              );
            },
          );
        },
        loading: () => const LoadingIndicator(message: 'Loading documents...'),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.refresh(documentsProvider),
        ),
      ),
    );
  }

  Widget _buildTimelineTab() {
    final timelineAsync = ref.watch(timelineProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(timelineProvider),
      child: timelineAsync.when(
        data: (timeline) {
          if (timeline.isEmpty) {
            return const EmptyStateView(
              title: 'No Timeline Events',
              subtitle: 'Your health journey events, visits, and reports will appear in chronological order.',
              icon: Icons.timeline_outlined,
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: timeline.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final item = timeline[index];
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.deepTeal,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item.eventType,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                item.title,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              Text(
                                item.timestamp.isNotEmpty
                                    ? item.timestamp.split('T')[0]
                                    : '',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                          if (item.description != null && item.description!.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              item.description!,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
        loading: () => const LoadingIndicator(message: 'Loading timeline...'),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.refresh(timelineProvider),
        ),
      ),
    );
  }
}
