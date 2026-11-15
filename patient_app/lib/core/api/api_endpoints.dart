import 'dart:io';

class ApiEndpoints {
  ApiEndpoints._();

  // Production Live Render Backend URL
  static const String liveBackendUrl = 'https://smart-clinic-backend-4ztd.onrender.com';
  
  // Set to true to target the live Render backend, or false for local development
  static const bool useLiveBackend = true;

  // Android emulator connects to host machine via 10.0.2.2, physical/desktop via localhost or custom IP
  static String get baseUrl {
    if (useLiveBackend) {
      return '$liveBackendUrl/api/v1';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api/v1';
    }
    return 'http://localhost:5000/api/v1';
  }

  static String get socketUrl {
    if (useLiveBackend) {
      return liveBackendUrl;
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000';
    }
    return 'http://localhost:5000';
  }

  // Auth
  static const String requestOtp = '/auth/request-otp';
  static const String verifyOtp = '/auth/verify-otp';
  static const String refreshToken = '/auth/refresh-token';

  // Patient Profile
  static const String patientMe = '/patient/me';

  // Discovery
  static const String discoverClinics = '/discovery/clinics';
  static const String clinicDetails = '/discovery/clinics'; // + /{id}
  static const String discoverDoctors = '/discovery/doctors';
  static const String doctorDetails = '/discovery/doctors'; // + /{id}
  static const String discoverySlots = '/discovery/slots';

  // Booking & Live Queue
  static const String bookSlot = '/patient/book-slot';
  static const String joinLiveQueue = '/patient/join-live';
  static const String queueTicket = '/patient/queue-ticket';

  // Appointments
  static const String patientAppointments = '/patient/appointments';
  static String cancelAppointment(String id) => '/patient/appointments/$id/cancel';

  // Health Records & Digital Prescriptions (Phase 6)
  static const String patientRecords = '/patient/records';
  static const String patientPrescriptions = '/patient/prescriptions';
  static String patientPrescriptionDetail(String id) => '/patient/prescriptions/$id';
  static String patientPrescriptionPdf(String id) => '/patient/prescriptions/$id/pdf';
  static const String patientTimeline = '/patient/timeline';
  static const String patientDocuments = '/patient/documents';
  static String patientDocumentDownload(String id) => '/patient/documents/$id/download';
  static const String patientConsent = '/patient/consent';
  static String patientConsentRevoke(String id) => '/patient/consent/$id/revoke';

  // Smart Automation & Traffic Departure Intelligence (Phase 7)
  static String departureRecommendation(String apptId) => '/patient/traffic/departure-recommendation/$apptId';
  static const String updateTravelOrigin = '/patient/traffic/update-origin';
  static const String notificationPreferences = '/patient/notifications/preferences';

  // Home Healthcare Marketplace (Phase 9)
  static const String marketplaceCategories = '/marketplace/categories';
  static const String marketplaceServices = '/marketplace/services';
  static const String marketplaceProviders = '/marketplace/providers';
  static String marketplaceProviderDetail(String id) => '/marketplace/providers/$id';
  static const String marketplaceAvailability = '/marketplace/availability';
  static const String marketplaceBookings = '/marketplace/bookings';
  static const String marketplaceMyBookings = '/marketplace/my-bookings';
  static String marketplaceBookingDetail(String id) => '/marketplace/bookings/$id';
  static const String marketplaceReview = '/marketplace/review';

  // Phase 10: Advanced Healthcare Ecosystem, AI Assistant & Teleconsultation
  static const String aiAssistantQuery = '/ai/assistant/query';
  static const String teleconsultationRooms = '/teleconsultation/rooms';
  static String teleconsultationJoin(String roomCode) => '/teleconsultation/rooms/$roomCode/join';
  static String teleconsultationEnd(String roomCode) => '/teleconsultation/rooms/$roomCode/end';
  static const String recordShare = '/records/share';
  static const String recordSharesMy = '/records/shares/my';
  static String recordShareRevoke(String shareId) => '/records/share/$shareId';
}

