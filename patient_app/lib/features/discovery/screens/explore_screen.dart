import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../models/clinic_model.dart';
import '../models/doctor_model.dart';
import '../providers/discovery_provider.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _searchController = TextEditingController();

  final List<String> _specialties = [
    'All Specialties',
    'General Medicine',
    'Pediatrics',
    'Cardiology',
    'Orthopedics',
    'Gynecology',
    'Dermatology',
    'ENT',
    'Dental',
  ];

  @override
  void initState() {
    super.initState();
    final filter = ref.read(discoveryFilterProvider);
    _tabController = TabController(length: 2, vsync: this, initialIndex: filter.activeTab);
    _searchController.text = filter.searchQuery;
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filter = ref.watch(discoveryFilterProvider);
    final clinicsAsync = ref.watch(clinicsListProvider);
    final doctorsAsync = ref.watch(doctorsListProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Find Healthcare'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(104),
          child: Column(
            children: [
              // Search Input
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) {
                    ref.read(discoveryFilterProvider.notifier).setSearchQuery(val);
                  },
                  decoration: InputDecoration(
                    hintText: filter.activeTab == 0
                        ? 'Search clinics or locations...'
                        : 'Search doctors by name or specialty...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.deepTeal),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              ref.read(discoveryFilterProvider.notifier).setSearchQuery('');
                            },
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                  ),
                ),
              ),

              const SizedBox(height: 8),

              // Tab Bar (Clinics / Doctors)
              TabBar(
                controller: _tabController,
                onTap: (index) {
                  ref.read(discoveryFilterProvider.notifier).setActiveTab(index);
                },
                indicatorColor: AppColors.primaryTeal,
                labelColor: AppColors.deepTeal,
                unselectedLabelColor: AppColors.textSecondary,
                labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                tabs: const [
                  Tab(text: 'Clinics'),
                  Tab(text: 'Doctors'),
                ],
              ),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          // Specialty horizontal filter bar
          Container(
            height: 48,
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _specialties.length,
              itemBuilder: (context, index) {
                final spec = _specialties[index];
                final isSelected = (index == 0 && filter.selectedSpecialty == null) ||
                    filter.selectedSpecialty == spec;

                return GestureDetector(
                  onTap: () {
                    ref
                        .read(discoveryFilterProvider.notifier)
                        .setSpecialty(index == 0 ? null : spec);
                  },
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.softMint : Colors.transparent,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? AppColors.primaryTeal : AppColors.border,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      spec,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? AppColors.deepTeal : AppColors.textSecondary,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Tab View content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Clinics List
                clinicsAsync.when(
                  data: (clinics) {
                    if (clinics.isEmpty) {
                      return const EmptyStateView(
                        title: 'No clinics found',
                        subtitle: 'Try adjusting your search query or specialty filter.',
                        icon: Icons.local_hospital_outlined,
                      );
                    }
                    return ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: clinics.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        return _buildClinicItem(context, clinics[index]);
                      },
                    );
                  },
                  loading: () => const LoadingIndicator(message: 'Searching clinics...'),
                  error: (e, _) => ErrorView(
                    message: e.toString(),
                    onRetry: () => ref.refresh(clinicsListProvider),
                  ),
                ),

                // Doctors List
                doctorsAsync.when(
                  data: (doctors) {
                    if (doctors.isEmpty) {
                      return const EmptyStateView(
                        title: 'No doctors found',
                        subtitle: 'Try adjusting your search criteria.',
                        icon: Icons.person_search_outlined,
                      );
                    }
                    return ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: doctors.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        return _buildDoctorItem(context, doctors[index]);
                      },
                    );
                  },
                  loading: () => const LoadingIndicator(message: 'Searching doctors...'),
                  error: (e, _) => ErrorView(
                    message: e.toString(),
                    onRetry: () => ref.refresh(doctorsListProvider),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClinicItem(BuildContext context, ClinicModel clinic) {
    return GestureDetector(
      onTap: () => context.push('/clinic/${clinic.id}'),
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
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: AppColors.softMint,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.local_hospital_outlined, color: AppColors.deepTeal),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        clinic.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        clinic.city != null
                            ? '${clinic.city} • ${clinic.clinicType ?? "General Clinic"}'
                            : (clinic.clinicType ?? "General Clinic"),
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.successBg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.star, size: 13, color: AppColors.success),
                      const SizedBox(width: 3),
                      Text(
                        clinic.rating.toString(),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.success,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (clinic.address != null) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.pin_drop_outlined, size: 14, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      clinic.address!,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${clinic.activeDoctorsCount} Verified Doctors',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.deepTeal,
                  ),
                ),
                const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.textSecondary),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDoctorItem(BuildContext context, DoctorModel doctor) {
    return GestureDetector(
      onTap: () => context.push('/doctor/${doctor.id}'),
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppColors.lightTeal,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.person, color: AppColors.deepTeal, size: 30),
                ),
                const SizedBox(width: 14),
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
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          const Icon(Icons.verified, size: 16, color: AppColors.primaryTeal),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${doctor.specialty} • ${doctor.qualification}',
                        style: const TextStyle(fontSize: 13, color: AppColors.deepTeal, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${doctor.experienceYears} yrs exp • ${doctor.registrationCouncil}',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.local_hospital_outlined, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      doctor.clinicName ?? 'Clinic Partner',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    '₹${doctor.consultationFee.toInt()}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppColors.deepTeal,
                    ),
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
