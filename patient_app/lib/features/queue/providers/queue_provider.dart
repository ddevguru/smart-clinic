import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/queue_repository.dart';
import '../models/queue_ticket_model.dart';
import '../models/departure_recommendation_model.dart';

class QueueState {
  final QueueTicketModel? activeTicket;
  final DepartureRecommendationModel? departureRecommendation;
  final bool isLoading;
  final bool isTrafficLoading;
  final bool isSocketConnected;
  final String? errorMessage;

  QueueState({
    this.activeTicket,
    this.departureRecommendation,
    this.isLoading = false,
    this.isTrafficLoading = false,
    this.isSocketConnected = true,
    this.errorMessage,
  });

  QueueState copyWith({
    QueueTicketModel? activeTicket,
    DepartureRecommendationModel? departureRecommendation,
    bool? isLoading,
    bool? isTrafficLoading,
    bool? isSocketConnected,
    String? errorMessage,
    bool clearTicket = false,
    bool clearDeparture = false,
  }) {
    return QueueState(
      activeTicket: clearTicket ? null : (activeTicket ?? this.activeTicket),
      departureRecommendation: clearDeparture
          ? null
          : (departureRecommendation ?? this.departureRecommendation),
      isLoading: isLoading ?? this.isLoading,
      isTrafficLoading: isTrafficLoading ?? this.isTrafficLoading,
      isSocketConnected: isSocketConnected ?? this.isSocketConnected,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class QueueNotifier extends StateNotifier<QueueState> {
  final QueueRepository _repository;

  QueueNotifier({QueueRepository? repository})
      : _repository = repository ?? QueueRepository(),
        super(QueueState()) {
    fetchActiveTicket();
  }

  Future<void> fetchActiveTicket() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final ticket = await _repository.getActiveTicket();
      state = state.copyWith(
        activeTicket: ticket,
        clearTicket: ticket == null,
        isLoading: false,
      );

      // If active ticket has an associated appointment, fetch traffic departure recommendation
      if (ticket != null && ticket.appointmentId != null && ticket.appointmentId!.isNotEmpty) {
        await fetchDepartureRecommendation(ticket.appointmentId!);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> fetchDepartureRecommendation(
    String appointmentId, {
    double? originLat,
    double? originLng,
    int arrivalBufferMinutes = 10,
  }) async {
    state = state.copyWith(isTrafficLoading: true);
    try {
      final rec = await _repository.getDepartureRecommendation(
        appointmentId,
        originLat: originLat,
        originLng: originLng,
        arrivalBufferMinutes: arrivalBufferMinutes,
      );
      state = state.copyWith(
        departureRecommendation: rec,
        isTrafficLoading: false,
      );
    } catch (_) {
      state = state.copyWith(isTrafficLoading: false);
    }
  }

  Future<bool> updateOriginAndRecalculate({
    required String appointmentId,
    required double latitude,
    required double longitude,
    String? address,
  }) async {
    state = state.copyWith(isTrafficLoading: true);
    try {
      final success = await _repository.updateTravelOrigin(
        appointmentId: appointmentId,
        latitude: latitude,
        longitude: longitude,
        address: address,
      );
      if (success) {
        await fetchDepartureRecommendation(
          appointmentId,
          originLat: latitude,
          originLng: longitude,
        );
      }
      return success;
    } catch (_) {
      return false;
    } finally {
      state = state.copyWith(isTrafficLoading: false);
    }
  }

  Future<bool> joinQueue({
    required String clinicId,
    required String branchId,
    required String doctorId,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final ticket = await _repository.joinLiveQueue(
        clinicId: clinicId,
        branchId: branchId,
        doctorId: doctorId,
      );
      state = state.copyWith(activeTicket: ticket, isLoading: false);
      if (ticket.appointmentId != null) {
        await fetchDepartureRecommendation(ticket.appointmentId!);
      }
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  void updateTicketFromSocket(Map<String, dynamic> data) {
    try {
      final updated = QueueTicketModel.fromJson(data);
      state = state.copyWith(activeTicket: updated);
      if (updated.appointmentId != null) {
        fetchDepartureRecommendation(updated.appointmentId!);
      }
    } catch (_) {}
  }
}

final queueProvider = StateNotifierProvider<QueueNotifier, QueueState>((ref) {
  return QueueNotifier();
});
