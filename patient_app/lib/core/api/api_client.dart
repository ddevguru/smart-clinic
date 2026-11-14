import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';
import 'api_endpoints.dart';
import 'api_exceptions.dart';

class ApiClient {
  static final ApiClient instance = ApiClient();
  late final Dio _dio;
  final SecureStorageService _storage;

  ApiClient({SecureStorageService? storage, Dio? dio})
      : _storage = storage ?? SecureStorageService() {
    _dio = dio ??
        Dio(
          BaseOptions(
            baseUrl: ApiEndpoints.baseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          final clinicId = await _storage.read('clinic_id');
          if (clinicId != null && clinicId.isNotEmpty && !options.headers.containsKey('X-Clinic-ID')) {
            options.headers['X-Clinic-ID'] = clinicId;
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          final mappedError = _mapDioError(error);
          return handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              error: mappedError,
              response: error.response,
              type: error.type,
              message: mappedError.message,
            ),
          );
        },
      ),
    );
  }

  Dio get dio => _dio;

  ApiException _mapDioError(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.connectionError) {
      return NetworkException(
        message: 'Unable to connect to Smart Clinic OS server. Please check your network connection.',
      );
    }

    final response = error.response;
    if (response != null) {
      final data = response.data;
      String message = 'An unexpected error occurred.';
      String? errorCode;
      dynamic details;

      if (data is Map<String, dynamic>) {
        message = data['message'] ?? data['error'] ?? message;
        errorCode = data['error_code'];
        details = data['errors'] ?? data['data'];
      }

      switch (response.statusCode) {
        case 401:
          return UnauthorizedException(message: message, errorCode: errorCode);
        case 404:
          return NotFoundException(message: message, errorCode: errorCode);
        case 409:
          return ConflictException(message: message, errorCode: errorCode);
        case 422:
        case 400:
          return ValidationException(message: message, details: details, errorCode: errorCode);
        case 500:
        default:
          return ServerException(message: message, statusCode: response.statusCode);
      }
    }

    return ApiException(message: error.message ?? 'Unknown connection failure');
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? queryParameters, Map<String, dynamic>? headers}) async {
    try {
      final res = await _dio.get(
        path,
        queryParameters: queryParameters,
        options: headers != null ? Options(headers: headers) : null,
      );
      return res.data;
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error as ApiException;
      }
      throw ApiException(message: e.message ?? 'Failed GET request');
    }
  }

  Future<dynamic> post(String path, {dynamic data, Map<String, dynamic>? queryParameters, Map<String, dynamic>? headers}) async {
    try {
      final res = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: headers != null ? Options(headers: headers) : null,
      );
      return res.data;
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error as ApiException;
      }
      throw ApiException(message: e.message ?? 'Failed POST request');
    }
  }

  Future<dynamic> patch(String path, {dynamic data, Map<String, dynamic>? headers}) async {
    try {
      final res = await _dio.patch(
        path,
        data: data,
        options: headers != null ? Options(headers: headers) : null,
      );
      return res.data;
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error as ApiException;
      }
      throw ApiException(message: e.message ?? 'Failed PATCH request');
    }
  }

  Future<dynamic> delete(String path, {dynamic data, Map<String, dynamic>? queryParameters, Map<String, dynamic>? headers}) async {
    try {
      final res = await _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        options: headers != null ? Options(headers: headers) : null,
      );
      return res.data;
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error as ApiException;
      }
      throw ApiException(message: e.message ?? 'Failed DELETE request');
    }
  }
}

