import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/status_badge.dart';
import '../models/departure_recommendation_model.dart';
import '../models/queue_ticket_model.dart';
import '../providers/queue_provider.dart';

class LiveQueueScreen extends ConsumerWidget {
  const LiveQueueScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final queueState = ref.watch(queueProvider);
    final ticket = queueState.activeTicket;
    final departure = queueState.departureRecommendation;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Live Queue & Departure Monitor'),
        actions: [
          // Real-time Connection Indicator
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: queueState.isSocketConnected
                        ? AppColors.success
                        : AppColors.warning,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  queueState.isSocketConnected ? 'LIVE' : 'POLLING',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: queueState.isSocketConnected
                        ? AppColors.success
                        : AppColors.warning,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(queueProvider.notifier).fetchActiveTicket();
        },
        child: ticket == null
            ? (queueState.isLoading
                ? const LoadingIndicator(message: 'Checking active queue tickets...')
                : const EmptyStateView(
                    title: 'No active queue ticket',
                    subtitle: 'You are not currently in any clinic queue. Join a queue or book an appointment to get your live token and departure guidance.',
                    icon: Icons.confirmation_number_outlined,
                  ))
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Doctor Operational Delay Alert Banner
                    if (ticket.doctorDelayed || (departure != null && departure.delayMinutes > 0)) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF5F5),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFFEB2B2)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.warning_amber_rounded, color: Color(0xFFE53E3E), size: 24),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Doctor OPD Delayed (+${departure?.delayMinutes ?? 15} mins)',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF9B2C2C),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    departure?.delayReason ?? 'Clinical backlog reported. Departure recommendations have been automatically pushed back so you don\'t wait at the clinic.',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF742A2A)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Paused Banner
                    if (ticket.isPaused) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.warningBg,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.warning),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.pause_circle_filled, color: AppColors.warning, size: 24),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Doctor On Short Break',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.warning,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    ticket.pauseReason != null && ticket.pauseReason!.isNotEmpty
                                        ? ticket.pauseReason!
                                        : 'Consultations are temporarily paused and will resume shortly.',
                                    style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Main Hero Live Token Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.primaryMint, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primaryTeal.withValues(alpha: 0.1),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              StatusBadge(status: ticket.queueStatus, isLarge: true),
                              // Queue Intelligence Confidence Badge
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.softMint,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.primaryMint),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.insights, size: 13, color: AppColors.deepTeal),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${ticket.confidence ?? "HIGH"} CONFIDENCE',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.deepTeal,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'YOUR QUEUE TOKEN',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textSecondary,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            ticket.tokenNumber,
                            style: AppTextStyles.tokenNumber.copyWith(fontSize: 54),
                          ),
                          const SizedBox(height: 16),
                          const Divider(height: 32),

                          // Wait Metrics
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildMetricItem(
                                '${ticket.patientsAhead}',
                                'Patients Ahead',
                                ticket.patientsAhead == 0 ? AppColors.success : AppColors.deepTeal,
                              ),
                              Container(width: 1, height: 40, color: AppColors.border),
                              _buildMetricItem(
                                ticket.estimatedWaitMinutes == 0 ? 'Ready' : '~${ticket.estimatedWaitMinutes}m',
                                'Est. Wait Time',
                                AppColors.deepTeal,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Phase 7: Google Maps Traffic-Aware Departure Recommendation Card
                    if (departure != null) ...[
                      _buildDepartureCard(context, ref, departure, ticket),
                      const SizedBox(height: 20),
                    ],

                    // Live Progression State Machine Tracker
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Queue Progression',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 18),
                          _buildTimelineStep(
                            stepNumber: 1,
                            title: 'Joined Queue',
                            subtitle: 'Remote ticket secured',
                            isDone: true,
                            isActive: ticket.queueStatus == 'WAITING' && ticket.patientsAhead > 1,
                          ),
                          _buildTimelineStep(
                            stepNumber: 2,
                            title: 'Approaching Turn',
                            subtitle: ticket.patientsAhead <= 1 ? 'Please be in clinic waiting room' : 'Waiting in line',
                            isDone: ticket.queueStatus == 'CALLED' || ticket.queueStatus == 'IN_CONSULTATION',
                            isActive: ticket.queueStatus == 'WAITING' && ticket.patientsAhead <= 1,
                          ),
                          _buildTimelineStep(
                            stepNumber: 3,
                            title: 'Called by Doctor',
                            subtitle: 'Proceed to consultation room',
                            isDone: ticket.queueStatus == 'IN_CONSULTATION',
                            isActive: ticket.queueStatus == 'CALLED',
                          ),
                          _buildTimelineStep(
                            stepNumber: 4,
                            title: 'In Consultation',
                            subtitle: 'Meeting with doctor',
                            isDone: ticket.queueStatus == 'COMPLETED',
                            isActive: ticket.queueStatus == 'IN_CONSULTATION',
                            isLast: true,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Doctor & Facility Dossier
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.softMint,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.medical_services_outlined, color: AppColors.deepTeal),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      ticket.doctorName,
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    Text(
                                      '${ticket.specialty ?? "General"} • ${ticket.clinicName}',
                                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (ticket.clinicAddress != null) ...[
                            const Divider(height: 20),
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textSecondary),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    ticket.clinicAddress!,
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    CustomButton(
                      text: 'Refresh Ticket & Traffic Guidance',
                      icon: Icons.refresh,
                      isLoading: queueState.isLoading || queueState.isTrafficLoading,
                      onPressed: () {
                        ref.read(queueProvider.notifier).fetchActiveTicket();
                      },
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
      ),
    );
  }

  // Phase 7: Traffic-Aware Departure Card Widget
  Widget _buildDepartureCard(
    BuildContext context,
    WidgetRef ref,
    DepartureRecommendationModel departure,
    QueueTicketModel ticket,
  ) {
    final timeFormat = DateFormat('hh:mm a');
    final formattedDepTime = timeFormat.format(departure.recommendedDepartureAt.toLocal());
    final isUrgent = departure.minutesUntilDeparture <= 10;
    final isLate = departure.minutesUntilDeparture < 0;

    Color trafficBadgeColor;
    Color trafficTextColor;
    if (departure.trafficCondition == 'HEAVY') {
      trafficBadgeColor = const Color(0xFFFED7D7);
      trafficTextColor = const Color(0xFF9B2C2C);
    } else if (departure.trafficCondition == 'MODERATE') {
      trafficBadgeColor = const Color(0xFFFEFCBF);
      trafficTextColor = const Color(0xFFB7791F);
    } else {
      trafficBadgeColor = const Color(0xFFC6F6D5);
      trafficTextColor = const Color(0xFF22543D);
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primaryMint, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryTeal.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: AppColors.softMint,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.navigation, size: 16, color: AppColors.primaryTeal),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Traffic-Aware Departure',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppColors.deepTeal,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isLate
                      ? const Color(0xFFFED7D7)
                      : (isUrgent ? const Color(0xFFFEFCBF) : AppColors.softMint),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isLate
                      ? 'LATE'
                      : (isUrgent ? 'LEAVE NOW' : 'IN ${departure.minutesUntilDeparture}m'),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: isLate
                        ? const Color(0xFF9B2C2C)
                        : (isUrgent ? const Color(0xFFB7791F) : AppColors.deepTeal),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Big Departure Leave By Callout
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'RECOMMENDED LEAVE-BY TIME',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textSecondary,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        formattedDepTime,
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: AppColors.deepTeal,
                        ),
                      ),
                      Text(
                        'Arrives ${departure.arrivalBufferMinutes}m before expected turn',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: trafficBadgeColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    children: [
                      Text(
                        departure.trafficCondition,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: trafficTextColor,
                        ),
                      ),
                      const Text(
                        'Traffic',
                        style: TextStyle(fontSize: 9, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Route Details Strip
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildRouteMetric(Icons.timer_outlined, '~${departure.travelDurationMinutes}m travel'),
              _buildRouteMetric(Icons.route_outlined, '${departure.travelDistanceKm.toStringAsFixed(1)} km'),
              _buildRouteMetric(Icons.security, '${departure.arrivalBufferMinutes}m buffer'),
            ],
          ),

          const SizedBox(height: 16),

          // Action buttons: Update Origin & View Route in Maps
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    _showOriginSelectionSheet(context, ref, departure, ticket);
                  },
                  icon: const Icon(Icons.edit_location_alt, size: 15),
                  label: const Text('Change Origin', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.deepTeal,
                    side: const BorderSide(color: AppColors.primaryMint),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: departure.mapsNavigationUrl));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Google Maps Route copied: ${departure.destination["name"] ?? "Clinic"}'),
                        backgroundColor: AppColors.deepTeal,
                        duration: const Duration(seconds: 3),
                      ),
                    );
                  },
                  icon: const Icon(Icons.map, size: 15),
                  label: const Text('Route in Maps', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryTeal,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRouteMetric(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
        ),
      ],
    );
  }

  // Bottom Sheet for Updating Travel Origin
  void _showOriginSelectionSheet(
    BuildContext context,
    WidgetRef ref,
    DepartureRecommendationModel departure,
    QueueTicketModel ticket,
  ) {
    final apptId = departure.appointmentId.isNotEmpty ? departure.appointmentId : ticket.appointmentId;
    if (apptId == null || apptId.isEmpty) return;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Select Departure Origin',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.deepTeal),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Choose your starting point to recalibrate travel duration and leave-by time with Google Maps Routes.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),

              _buildOriginOption(
                ctx,
                ref,
                title: 'Home (Indiranagar / CMH Road)',
                subtitle: 'Approx 3.5 km from clinic',
                lat: 12.9784,
                lng: 77.6408,
                apptId: apptId,
              ),
              _buildOriginOption(
                ctx,
                ref,
                title: 'Office (Koramangala 4th Block)',
                subtitle: 'Approx 6.8 km via Inner Ring Road',
                lat: 12.9352,
                lng: 77.6245,
                apptId: apptId,
              ),
              _buildOriginOption(
                ctx,
                ref,
                title: 'Tech Park (Whitefield / ITPL)',
                subtitle: 'Approx 14.2 km via Old Airport Rd',
                lat: 12.9698,
                lng: 77.7499,
                apptId: apptId,
              ),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  Widget _buildOriginOption(
    BuildContext sheetContext,
    WidgetRef ref, {
    required String title,
    required String subtitle,
    required double lat,
    required double lng,
    required String apptId,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.softMint,
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.place, color: AppColors.primaryTeal, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.textSecondary),
        onTap: () async {
          Navigator.pop(sheetContext);
          await ref.read(queueProvider.notifier).updateOriginAndRecalculate(
                appointmentId: apptId,
                latitude: lat,
                longitude: lng,
                address: title,
              );
        },
      ),
    );
  }

  Widget _buildMetricItem(String value, String label, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildTimelineStep({
    required int stepNumber,
    required String title,
    required String subtitle,
    required bool isDone,
    required bool isActive,
    bool isLast = false,
  }) {
    Color dotColor = AppColors.border;
    Color iconColor = AppColors.textSecondary;

    if (isDone) {
      dotColor = AppColors.primaryTeal;
      iconColor = Colors.white;
    } else if (isActive) {
      dotColor = AppColors.warning;
      iconColor = Colors.white;
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: dotColor,
              ),
              child: Center(
                child: isDone
                    ? const Icon(Icons.check, size: 16, color: Colors.white)
                    : Text(
                        '$stepNumber',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: iconColor,
                        ),
                      ),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 32,
                color: isDone ? AppColors.primaryTeal : AppColors.border,
              ),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isActive || isDone ? FontWeight.w700 : FontWeight.w500,
                  color: isActive ? AppColors.deepTeal : AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 14),
            ],
          ),
        ),
      ],
    );
  }
}
