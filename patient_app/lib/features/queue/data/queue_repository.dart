import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/queue_ticket_model.dart';
import '../models/departure_recommendation_model.dart';

class QueueRepository {
  final ApiClient _apiClient;

  QueueRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<QueueTicketModel?> getActiveTicket() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.queueTicket);
      final data = response['data'] as Map<String, dynamic>?;
      if (data == null || data.isEmpty) return null;
      return QueueTicketModel.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  Future<DepartureRecommendationModel?> getDepartureRecommendation(
    String appointmentId, {
    double? originLat,
    double? originLng,
    int arrivalBufferMinutes = 10,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'arrival_buffer_minutes': arrivalBufferMinutes,
      };
      if (originLat != null && originLng != null) {
        queryParams['origin_lat'] = originLat;
        queryParams['origin_lng'] = originLng;
      }
      final response = await _apiClient.get(
        ApiEndpoints.departureRecommendation(appointmentId),
        queryParameters: queryParams,
      );
      final data = response['data'] as Map<String, dynamic>?;
      if (data == null) return null;
      return DepartureRecommendationModel.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  Future<bool> updateTravelOrigin({
    required String appointmentId,
    required double latitude,
    required double longitude,
    String? address,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.updateTravelOrigin,
        data: {
          'appointment_id': appointmentId,
          'latitude': latitude,
          'longitude': longitude,
          'address': address,
        },
      );
      return response['success'] == true;
    } catch (_) {
      return false;
    }
  }

  Future<QueueTicketModel> joinLiveQueue({
    required String clinicId,
    required String branchId,
    required String doctorId,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.joinLiveQueue,
      data: {
        'clinic_id': clinicId,
        'branch_id': branchId,
        'doctor_id': doctorId,
      },
    );
    final data = response['data'] as Map<String, dynamic>;
    return QueueTicketModel.fromJson(data);
  }
}

