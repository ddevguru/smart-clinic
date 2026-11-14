import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/record_model.dart';

final prescriptionsProvider = FutureProvider<List<PrescriptionItemModel>>((ref) async {
  final apiClient = ApiClient();
  final response = await apiClient.get(ApiEndpoints.patientPrescriptions);
  final data = response['data'] as Map<String, dynamic>;
  final list = data['prescriptions'] as List<dynamic>? ?? [];
  return list.map((item) => PrescriptionItemModel.fromJson(item as Map<String, dynamic>)).toList();
});

final documentsProvider = FutureProvider<List<DocumentItemModel>>((ref) async {
  final apiClient = ApiClient();
  final response = await apiClient.get(ApiEndpoints.patientDocuments);
  final data = response['data'] as Map<String, dynamic>;
  final list = data['documents'] as List<dynamic>? ?? [];
  return list.map((item) => DocumentItemModel.fromJson(item as Map<String, dynamic>)).toList();
});

final timelineProvider = FutureProvider<List<TimelineItemModel>>((ref) async {
  final apiClient = ApiClient();
  final response = await apiClient.get(ApiEndpoints.patientTimeline);
  final data = response['data'] as Map<String, dynamic>;
  final list = data['timeline'] as List<dynamic>? ?? [];
  return list.map((item) => TimelineItemModel.fromJson(item as Map<String, dynamic>)).toList();
});

// Legacy records compatibility
final recordsListProvider = FutureProvider<List<MedicalRecordModel>>((ref) async {
  final apiClient = ApiClient();
  try {
    final response = await apiClient.get(ApiEndpoints.patientRecords);
    final data = response['data'] as Map<String, dynamic>;
    final list = data['records'] as List<dynamic>? ?? [];
    return list.map((item) => MedicalRecordModel.fromJson(item as Map<String, dynamic>)).toList();
  } catch (_) {
    return [];
  }
});
