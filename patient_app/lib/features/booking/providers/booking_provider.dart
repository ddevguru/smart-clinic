import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../data/booking_repository.dart';
import '../models/slot_model.dart';

class BookingState {
  final bool isLoading;
  final String? error;
  final List<SlotModel> slots;
  final String? selectedSlotTime;
  final DateTime selectedDate;

  BookingState({
    this.isLoading = false,
    this.error,
    this.slots = const [],
    this.selectedSlotTime,
    required this.selectedDate,
  });

  DateTime get date => selectedDate;

  BookingState copyWith({
    bool? isLoading,
    String? error,
    List<SlotModel>? slots,
    String? selectedSlotTime,
    DateTime? selectedDate,
    bool clearSelectedSlot = false,
  }) {
    return BookingState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      slots: slots ?? this.slots,
      selectedSlotTime: clearSelectedSlot ? null : (selectedSlotTime ?? this.selectedSlotTime),
      selectedDate: selectedDate ?? this.selectedDate,
    );
  }
}

class BookingNotifier extends StateNotifier<BookingState> {
  final BookingRepository _repository;
  final Map<String, String> _params;

  BookingNotifier({
    required BookingRepository repository,
    required Map<String, String> params,
  })  : _repository = repository,
        _params = params,
        super(BookingState(selectedDate: DateTime.now())) {
    loadSlots();
  }

  void selectDate(DateTime date) {
    state = state.copyWith(selectedDate: date, clearSelectedSlot: true);
    loadSlots();
  }

  void changeDate(DateTime date) => selectDate(date);

  void selectSlot(String time) {
    state = state.copyWith(selectedSlotTime: time);
  }

  Future<void> loadSlots() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(state.selectedDate);
      final slots = await _repository.getAvailableSlots(
        clinicId: _params['clinicId']!,
        branchId: _params['branchId']!,
        doctorId: _params['doctorId']!,
        date: dateStr,
      );
      state = state.copyWith(slots: slots, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<Map<String, dynamic>?> confirmBooking({String? notes}) async {
    if (state.selectedSlotTime == null) return null;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(state.selectedDate);
      final res = await _repository.bookSlot(
        clinicId: _params['clinicId']!,
        branchId: _params['branchId']!,
        doctorId: _params['doctorId']!,
        date: dateStr,
        time: state.selectedSlotTime!,
        notes: notes,
      );
      state = state.copyWith(isLoading: false);
      return res;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
    }
  }
}

final bookingRepositoryProvider = Provider((ref) => BookingRepository());

final bookingNotifierFamily = StateNotifierProvider.family<BookingNotifier, BookingState, Map<String, String>>(
  (ref, params) {
    final repo = ref.watch(bookingRepositoryProvider);
    return BookingNotifier(repository: repo, params: params);
  },
);
