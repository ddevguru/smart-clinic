import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../data/discovery_repository.dart';
import '../models/clinic_model.dart';
import '../models/doctor_model.dart';

class DiscoveryFilterState {
  final int activeTab;
  final String searchQuery;
  final String? specialty;

  DiscoveryFilterState({
    this.activeTab = 0,
    this.searchQuery = '',
    this.specialty,
  });

  String? get selectedSpecialty => specialty;

  DiscoveryFilterState copyWith({
    int? activeTab,
    String? searchQuery,
    String? specialty,
    bool clearSpecialty = false,
  }) {
    return DiscoveryFilterState(
      activeTab: activeTab ?? this.activeTab,
      searchQuery: searchQuery ?? this.searchQuery,
      specialty: clearSpecialty ? null : (specialty ?? this.specialty),
    );
  }
}

class DiscoveryFilterNotifier extends StateNotifier<DiscoveryFilterState> {
  DiscoveryFilterNotifier() : super(DiscoveryFilterState());

  void setActiveTab(int tab) => state = state.copyWith(activeTab: tab);
  void setSearchQuery(String query) => state = state.copyWith(searchQuery: query);
  void setSpecialty(String? spec) =>
      state = state.copyWith(specialty: spec, clearSpecialty: spec == null);
}

final discoveryFilterProvider =
    StateNotifierProvider<DiscoveryFilterNotifier, DiscoveryFilterState>(
  (ref) => DiscoveryFilterNotifier(),
);

final discoveryRepositoryProvider = Provider((ref) => DiscoveryRepository());

final clinicsListProvider = FutureProvider<List<ClinicModel>>((ref) async {
  final repo = ref.watch(discoveryRepositoryProvider);
  final filter = ref.watch(discoveryFilterProvider);
  return repo.getClinics(
    query: filter.searchQuery.isNotEmpty ? filter.searchQuery : null,
  );
});

final doctorsListProvider = FutureProvider<List<DoctorModel>>((ref) async {
  final repo = ref.watch(discoveryRepositoryProvider);
  final filter = ref.watch(discoveryFilterProvider);
  return repo.getDoctors(
    query: filter.searchQuery.isNotEmpty ? filter.searchQuery : null,
    specialty: filter.specialty != 'All Specialties' ? filter.specialty : null,
  );
});

final clinicDetailsProvider = FutureProvider.family<ClinicModel, String>((ref, clinicId) async {
  final apiClient = ApiClient();
  final response = await apiClient.get('${ApiEndpoints.clinicDetails}/$clinicId');
  final data = response['data'] as Map<String, dynamic>;
  return ClinicModel.fromJson(data);
});

final doctorDetailsProvider = FutureProvider.family<DoctorModel, String>((ref, doctorId) async {
  final apiClient = ApiClient();
  final response = await apiClient.get('${ApiEndpoints.doctorDetails}/$doctorId');
  final data = response['data'] as Map<String, dynamic>;
  return DoctorModel.fromJson(data);
});
