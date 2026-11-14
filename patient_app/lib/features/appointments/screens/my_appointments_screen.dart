import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/status_badge.dart';
import '../models/appointment_model.dart';
import '../providers/appointment_provider.dart';

class MyAppointmentsScreen extends ConsumerWidget {
  const MyAppointmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentFilter = ref.watch(appointmentFilterProvider);
    final appointmentsAsync = ref.watch(appointmentsListProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Appointments'),
      ),
      body: Column(
        children: [
          // Filter Chips Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                _buildFilterChip(context, ref, 'Upcoming', 'UPCOMING', currentFilter),
                const SizedBox(width: 8),
                _buildFilterChip(context, ref, 'Completed', 'COMPLETED', currentFilter),
                const SizedBox(width: 8),
                _buildFilterChip(context, ref, 'Cancelled', 'CANCELLED', currentFilter),
              ],
            ),
          ),

          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(appointmentsListProvider);
              },
              child: appointmentsAsync.when(
                data: (appointments) {
                  if (appointments.isEmpty) {
                    return EmptyStateView(
                      title: 'No $currentFilter appointments',
                      subtitle: 'When you schedule consultation appointments or join clinic queues, they appear here.',
                      icon: Icons.calendar_today_outlined,
                      buttonText: 'Book an Appointment',
                      onButtonPressed: () => context.push('/explore'),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: appointments.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      return _buildAppointmentCard(context, ref, appointments[index]);
                    },
                  );
                },
                loading: () => const LoadingIndicator(message: 'Loading your appointments...'),
                error: (e, _) => ErrorView(
                  message: e.toString(),
                  onRetry: () => ref.refresh(appointmentsListProvider),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(
    BuildContext context,
    WidgetRef ref,
    String label,
    String filterValue,
    String activeFilter,
  ) {
    final isSelected = activeFilter == filterValue;
    return GestureDetector(
      onTap: () {
        ref.read(appointmentFilterProvider.notifier).state = filterValue;
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.softMint : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primaryTeal : AppColors.border,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? AppColors.deepTeal : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildAppointmentCard(BuildContext context, WidgetRef ref, AppointmentModel appt) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.event, size: 16, color: AppColors.deepTeal),
                    const SizedBox(width: 6),
                    Text(
                      '${appt.appointmentDate} • ${appt.appointmentTime}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                StatusBadge(status: appt.status),
              ],
            ),
          ),

          const Divider(height: 1),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.softMint,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.person, color: AppColors.deepTeal),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appt.doctorName ?? 'Consulting Doctor',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        appt.doctorSpecialty != null
                            ? '${appt.doctorSpecialty} • ${appt.clinicName ?? "Clinic"}'
                            : (appt.clinicName ?? 'Clinic'),
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                      if (appt.queueToken != null) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            'Token: ${appt.queueToken}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.deepTeal,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          if (appt.isCancellable) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => _confirmCancel(context, ref, appt.id),
                    style: TextButton.styleFrom(foregroundColor: AppColors.error),
                    child: const Text('Cancel Appointment'),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _confirmCancel(BuildContext context, WidgetRef ref, String appointmentId) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Cancel Appointment'),
        content: const Text('Are you sure you want to cancel this scheduled appointment?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Keep Appointment'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () async {
              Navigator.pop(dialogCtx);
              final ok = await ref.read(cancelAppointmentActionProvider).cancel(
                    appointmentId,
                    'Cancelled by patient via mobile app',
                  );
              if (ok && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Appointment successfully cancelled')),
                );
              }
            },
            child: const Text('Confirm Cancel'),
          ),
        ],
      ),
    );
  }
}
