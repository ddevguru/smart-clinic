import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/healthcare_service_model.dart';
import '../models/home_visit_model.dart';

class HomeHealthcareService {
  final ApiClient _client;

  HomeHealthcareService({ApiClient? client}) : _client = client ?? ApiClient();

  /// 1. Fetch active service categories
  Future<List<HealthcareServiceCategory>> getCategories() async {
    try {
      final response = await _client.get(ApiEndpoints.marketplaceCategories);
      final List data = response.data['data']['categories'] ?? [];
      return data.map((c) => HealthcareServiceCategory.fromJson(c)).toList();
    } catch (e) {
      return [];
    }
  }

  /// 2. Fetch catalog of services (optional category filter)
  Future<List<HealthcareService>> getServices({String? categoryCode}) async {
    try {
      final path = categoryCode != null
          ? '${ApiEndpoints.marketplaceServices}?category_code=$categoryCode'
          : ApiEndpoints.marketplaceServices;
      final response = await _client.get(path);
      final List data = response.data['data']['services'] ?? [];
      return data.map((s) => HealthcareService.fromJson(s)).toList();
    } catch (e) {
      return [];
    }
  }

  /// 3. Search and discover approved healthcare providers
  Future<List<HealthcareProvider>> getProviders({
    String? postalCode,
    String? categoryCode,
    String? serviceId,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (postalCode != null) queryParams['postal_code'] = postalCode;
      if (categoryCode != null) queryParams['category_code'] = categoryCode;
      if (serviceId != null) queryParams['service_id'] = serviceId;

      final response = await _client.get(
        ApiEndpoints.marketplaceProviders,
        queryParameters: queryParams,
      );
      final List data = response.data['data']['providers'] ?? [];
      return data.map((p) => HealthcareProvider.fromJson(p)).toList();
    } catch (e) {
      return [];
    }
  }

  /// 4. Check Provider Availability for requested time slot
  Future<Map<String, dynamic>> checkAvailability({
    required String providerId,
    required String date,
    required String time,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.marketplaceAvailability,
        queryParameters: {
          'provider_id': providerId,
          'date': date,
          'time': time,
        },
      );
      return response.data['data'] ?? {'available': false};
    } catch (e) {
      return {'available': false, 'reason': 'Error checking provider availability.'};
    }
  }

  /// 5. Book a new Home Visit
  Future<HomeVisitBooking?> bookHomeVisit({
    required String serviceId,
    String? providerId,
    required String scheduledDate,
    required String scheduledStartTime,
    required String serviceAddress,
    String city = 'Bengaluru',
    required String postalCode,
    required String contactPhone,
    String? patientNotes,
  }) async {
    try {
      final payload = {
        'service_id': serviceId,
        'provider_id': providerId,
        'scheduled_date': scheduledDate,
        'scheduled_start_time': scheduledStartTime,
        'service_address': serviceAddress,
        'city': city,
        'postal_code': postalCode,
        'contact_phone': contactPhone,
        'patient_notes': patientNotes,
        'payment_method': 'ONLINE',
      };

      final response = await _client.post(
        ApiEndpoints.marketplaceBookings,
        data: payload,
      );
      if (response.data['success'] == true) {
        return HomeVisitBooking.fromJson(response.data['data']['booking']);
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  /// 6. Get patient's home visit bookings
  Future<List<HomeVisitBooking>> getMyHomeVisits() async {
    try {
      final response = await _client.get(ApiEndpoints.marketplaceMyBookings);
      final List data = response.data['data']['bookings'] ?? [];
      return data.map((b) => HomeVisitBooking.fromJson(b)).toList();
    } catch (e) {
      return [];
    }
  }

  /// 7. Get single booking tracking details
  Future<Map<String, dynamic>> getBookingDetails(String bookingId) async {
    try {
      final response = await _client.get(ApiEndpoints.marketplaceBookingDetail(bookingId));
      return response.data['data'] ?? {};
    } catch (e) {
      return {};
    }
  }

  /// 8. Submit patient review for completed visit
  Future<bool> submitReview({
    required String bookingId,
    required int rating,
    int? punctualityRating,
    required String reviewComment,
  }) async {
    try {
      final response = await _client.post(
        ApiEndpoints.marketplaceReview,
        data: {
          'booking_id': bookingId,
          'rating': rating,
          'punctuality_rating': punctualityRating ?? rating,
          'review_comment': reviewComment,
        },
      );
      return response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }
}
