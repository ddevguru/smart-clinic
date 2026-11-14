class SlotModel {
  final String startTime;
  final String endTime;
  final int durationMinutes;
  final bool isAvailable;
  final String? reason; // 'BREAK', 'BOOKED', etc.

  SlotModel({
    required this.startTime,
    required this.endTime,
    required this.durationMinutes,
    required this.isAvailable,
    this.reason,
  });

  factory SlotModel.fromJson(Map<String, dynamic> json) {
    return SlotModel(
      startTime: json['start_time']?.toString() ?? '',
      endTime: json['end_time']?.toString() ?? '',
      durationMinutes: json['duration_minutes'] ?? 15,
      isAvailable: json['is_available'] == true,
      reason: json['reason']?.toString(),
    );
  }
}

