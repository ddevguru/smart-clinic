class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final String? errorCode;
  final dynamic details;

  ApiException({
    required this.message,
    this.statusCode,
    this.errorCode,
    this.details,
  });

  @override
  String toString() => 'ApiException: [$statusCode] $message';
}

class NetworkException extends ApiException {
  NetworkException({required super.message}) : super(statusCode: 0);
}

class UnauthorizedException extends ApiException {
  UnauthorizedException({required super.message, super.errorCode})
      : super(statusCode: 401);
}

class ValidationException extends ApiException {
  ValidationException({required super.message, super.details, super.errorCode})
      : super(statusCode: 422);
}

class ConflictException extends ApiException {
  ConflictException({required super.message, super.errorCode})
      : super(statusCode: 409);
}

class NotFoundException extends ApiException {
  NotFoundException({required super.message, super.errorCode})
      : super(statusCode: 404);
}

class ServerException extends ApiException {
  ServerException({required super.message, int? statusCode})
      : super(statusCode: statusCode ?? 500);
}
