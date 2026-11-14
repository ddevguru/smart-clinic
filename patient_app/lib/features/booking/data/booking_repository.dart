import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/slot_model.dart';

class BookingRepository {
  final ApiClient _apiClient;

  BookingRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<SlotModel>> getAvailableSlots({
    required String clinicId,
    required String branchId,
    required String doctorId,
    required String date,
  }) async {
    final response = await _apiClient.get(
      ApiEndpoints.discoverySlots,
      queryParameters: {
        'clinic_id': clinicId,
        'branch_id': branchId,
        'doctor_id': doctorId,
        'date': date,
      },
    );
    final data = response['data'] as Map<String, dynamic>;
    final list = (data['slots'] as List<dynamic>?) ?? [];
    return list.map((item) => SlotModel.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<Map<String, dynamic>> bookSlot({
    required String clinicId,
    required String branchId,
    required String doctorId,
    required String date,
    required String time,
    String? notes,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.bookSlot,
      data: {
        'clinic_id': clinicId,
        'branch_id': branchId,
        'doctor_id': doctorId,
        'date': date,
        'time': time,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      },
    );
    return response['data'] as Map<String, dynamic>;
  }
}

