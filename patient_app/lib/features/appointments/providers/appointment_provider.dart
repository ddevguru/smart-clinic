import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/appointment_model.dart';

final appointmentFilterProvider = StateProvider<String>((ref) => 'UPCOMING');

final appointmentsListProvider = FutureProvider<List<AppointmentModel>>((ref) async {
  final apiClient = ApiClient();
  final filter = ref.watch(appointmentFilterProvider);
  final response = await apiClient.get(
    ApiEndpoints.patientAppointments,
    queryParameters: {'status': filter},
  );
  final data = response['data'] as Map<String, dynamic>;
  final list = (data['appointments'] as List<dynamic>?) ?? [];
  return list.map((item) => AppointmentModel.fromJson(item as Map<String, dynamic>)).toList();
});

class AppointmentCancellationHandler {
  final ApiClient _apiClient;
  final Ref _ref;

  AppointmentCancellationHandler(this._apiClient, this._ref);

  Future<bool> cancel(String appointmentId, String reason) async {
    try {
      await _apiClient.post(
        ApiEndpoints.cancelAppointment(appointmentId),
        data: {'reason': reason},
      );
      _ref.invalidate(appointmentsListProvider);
      return true;
    } catch (_) {
      return false;
    }
  }
}

final cancelAppointmentActionProvider = Provider<AppointmentCancellationHandler>((ref) {
  return AppointmentCancellationHandler(ApiClient(), ref);
});
