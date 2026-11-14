import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/clinic_model.dart';
import '../models/doctor_model.dart';

class DiscoveryRepository {
  final ApiClient _apiClient;

  DiscoveryRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<ClinicModel>> getClinics({String? query, String? city}) async {
    final response = await _apiClient.get(
      ApiEndpoints.discoverClinics,
      queryParameters: {
        if (query != null && query.isNotEmpty) 'q': query,
        if (city != null && city.isNotEmpty) 'city': city,
      },
    );
    final data = response['data'] as Map<String, dynamic>;
    final list = (data['clinics'] as List<dynamic>?) ?? [];
    return list.map((item) => ClinicModel.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<List<DoctorModel>> getDoctors({String? query, String? specialty}) async {
    final response = await _apiClient.get(
      ApiEndpoints.discoverDoctors,
      queryParameters: {
        if (query != null && query.isNotEmpty) 'q': query,
        if (specialty != null && specialty.isNotEmpty && specialty != 'All Specialties')
          'specialty': specialty,
      },
    );
    final data = response['data'] as Map<String, dynamic>;
    final list = (data['doctors'] as List<dynamic>?) ?? [];
    return list.map((item) => DoctorModel.fromJson(item as Map<String, dynamic>)).toList();
  }
}

