import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/custom_text_field.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../models/slot_model.dart';
import '../providers/booking_provider.dart';

class SlotBookingScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> doctorParams;

  const SlotBookingScreen({super.key, required this.doctorParams});

  @override
  ConsumerState<SlotBookingScreen> createState() => _SlotBookingScreenState();
}

class _SlotBookingScreenState extends ConsumerState<SlotBookingScreen> {
  final _notesController = TextEditingController();
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Map<String, String> get _providerParams => {
        'clinicId': widget.doctorParams['clinicId'].toString(),
        'branchId': widget.doctorParams['branchId'].toString(),
        'doctorId': widget.doctorParams['doctorId'].toString(),
      };

  @override
  Widget build(BuildContext context) {
    final bookingState = ref.watch(bookingNotifierFamily(_providerParams));
    final doctorName = widget.doctorParams['doctorName'] ?? 'Doctor';
    final specialty = widget.doctorParams['specialty'] ?? 'Consultant';
    final clinicName = widget.doctorParams['clinicName'] ?? 'Clinic';
    final fee = widget.doctorParams['fee'] ?? 0.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Book Appointment'),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: AppColors.border)),
        ),
        child: SafeArea(
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Consultation Fee',
                    style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                  Text(
                    '₹${fee.toInt()}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.deepTeal,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 24),
              Expanded(
                child: CustomButton(
                  text: 'Confirm Booking',
                  isLoading: bookingState.isLoading,
                  onPressed: bookingState.selectedSlotTime == null
                      ? null
                      : () async {
                          final result = await ref
                              .read(bookingNotifierFamily(_providerParams).notifier)
                              .confirmBooking(notes: _notesController.text.trim());

                          if (result != null && context.mounted) {
                            context.pushReplacement('/booking-success', extra: {
                              'doctorName': doctorName,
                              'specialty': specialty,
                              'clinicName': clinicName,
                              'date': bookingState.date,
                              'time': bookingState.selectedSlotTime,
                              'fee': fee,
                              'token': result['queue_token'] ?? result['token_number'],
                            });
                          }
                        },
                ),
              ),
            ],
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Doctor Summary Header Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
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
                          doctorName,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          '$specialty • $clinicName',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Date Picker (Next 7 Days)
            const Text(
              'Select Date',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 74,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: 7,
                itemBuilder: (context, index) {
                  final date = DateTime.now().add(Duration(days: index));
                  final isSelected = DateUtils.isSameDay(date, _selectedDate);

                  return GestureDetector(
                    onTap: () {
                      setState(() => _selectedDate = date);
                      ref
                          .read(bookingNotifierFamily(_providerParams).notifier)
                          .changeDate(date);
                    },
                    child: Container(
                      width: 62,
                      margin: const EdgeInsets.only(right: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.deepTeal : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected ? AppColors.deepTeal : AppColors.border,
                          width: 1.5,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            DateFormat('EEE').format(date).toUpperCase(),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isSelected ? AppColors.primaryMint : AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            DateFormat('d').format(date),
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: isSelected ? Colors.white : AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 24),

            // Time Slots Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Available Time Slots',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  '15 mins per slot',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (bookingState.isLoading)
              const Padding(
                padding: EdgeInsets.all(32),
                child: LoadingIndicator(message: 'Loading available slots...'),
              )
            else if (bookingState.error != null)
              ErrorView(
                message: bookingState.error!,
                onRetry: () => ref
                    .read(bookingNotifierFamily(_providerParams).notifier)
                    .loadSlots(),
              )
            else if (bookingState.slots.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Center(
                  child: Text(
                    'No consultation slots available for the selected date.',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              )
            else
              _buildSlotsGrid(bookingState.slots, bookingState.selectedSlotTime),

            const SizedBox(height: 24),

            // Optional Notes
            CustomTextField(
              controller: _notesController,
              label: 'Reason for Consultation (Optional)',
              hint: 'e.g. Mild fever since yesterday, routine health checkup',
              maxLines: 2,
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSlotsGrid(List<SlotModel> slots, String? selectedTime) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: slots.map((slot) {
        final isSelected = selectedTime == slot.startTime;
        final isAvailable = slot.isAvailable;

        Color bg;
        Color border;
        Color text;

        if (isSelected) {
          bg = AppColors.deepTeal;
          border = AppColors.deepTeal;
          text = Colors.white;
        } else if (!isAvailable) {
          if (slot.reason == 'BREAK') {
            bg = AppColors.warningBg;
            border = AppColors.warning.withValues(alpha: 0.3);
            text = AppColors.warning;
          } else {
            bg = AppColors.background;
            border = AppColors.border;
            text = AppColors.textMuted;
          }
        } else {
          bg = Colors.white;
          border = AppColors.primaryMint;
          text = AppColors.deepTeal;
        }

        return GestureDetector(
          onTap: isAvailable
              ? () {
                  ref
                      .read(bookingNotifierFamily(_providerParams).notifier)
                      .selectSlot(slot.startTime);
                }
              : null,
          child: Container(
            width: 82,
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: border, width: isSelected ? 1.8 : 1.0),
            ),
            child: Column(
              children: [
                Text(
                  slot.startTime,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: text,
                  ),
                ),
                if (!isAvailable) ...[
                  const SizedBox(height: 2),
                  Text(
                    slot.reason ?? 'Full',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: text,
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

