import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/appointment_model.dart';

class AppointmentRepository {
  final ApiClient _apiClient;

  AppointmentRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<AppointmentModel>> getAppointments({String filter = 'ALL'}) async {
    final response = await _apiClient.get(
      ApiEndpoints.patientAppointments,
      queryParameters: {'filter': filter},
    );

    final data = response['data'] as Map<String, dynamic>;
    final list = data['appointments'] as List<dynamic>? ?? [];
    return list.map((item) => AppointmentModel.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<void> cancelAppointment(String appointmentId, String reason) async {
    await _apiClient.post(
      ApiEndpoints.cancelAppointment(appointmentId),
      data: {'reason': reason},
    );
  }
}

