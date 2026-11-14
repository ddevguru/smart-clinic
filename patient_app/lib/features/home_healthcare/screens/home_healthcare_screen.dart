import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../models/healthcare_service_model.dart';
import '../models/home_visit_model.dart';
import '../services/home_healthcare_service.dart';

class HomeHealthcareScreen extends StatefulWidget {
  const HomeHealthcareScreen({super.key});

  @override
  State<HomeHealthcareScreen> createState() => _HomeHealthcareScreenState();
}

class _HomeHealthcareScreenState extends State<HomeHealthcareScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final HomeHealthcareService _service = HomeHealthcareService();

  bool _loading = true;
  List<HealthcareServiceCategory> _categories = [];
  List<HealthcareService> _services = [];
  List<HomeVisitBooking> _myVisits = [];
  String? _selectedCategoryCode;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final categories = await _service.getCategories();
    final services = await _service.getServices(categoryCode: _selectedCategoryCode);
    final visits = await _service.getMyHomeVisits();

    setState(() {
      _categories = categories;
      _services = services;
      _myVisits = visits;
      _loading = false;
    });
  }

  Future<void> _filterByCategory(String? code) async {
    setState(() {
      _selectedCategoryCode = code;
      _loading = true;
    });
    final services = await _service.getServices(categoryCode: code);
    setState(() {
      _services = services;
      _loading = false;
    });
  }

  void _showBookingSheet(HealthcareService service) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _BookingBottomSheet(
        service: service,
        onBookSuccess: () {
          Navigator.pop(ctx);
          _loadData();
          _tabController.animateTo(1);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Home healthcare visit booked successfully!'),
              backgroundColor: AppColors.primary,
            ),
          );
        },
      ),
    );
  }

  void _showReviewDialog(HomeVisitBooking booking) {
    int rating = 5;
    final commentCtrl = TextEditingController(text: 'Professional, punctual, and exceptional home clinical care.');

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Leave Verified Patient Review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('How was your ${booking.serviceName} experience?', style: const TextStyle(fontSize: 13, color: Colors.grey)),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    icon: Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 32,
                    ),
                    onPressed: () => setDialogState(() => rating = index + 1),
                  );
                }),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: commentCtrl,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Share feedback regarding bedside care and punctuality...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  contentPadding: const EdgeInsets.all(10),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              onPressed: () async {
                final success = await _service.submitReview(
                  bookingId: booking.id,
                  rating: rating,
                  reviewComment: commentCtrl.text,
                );
                if (!mounted) return;
                Navigator.pop(ctx);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Verified review submitted! Thank you.')),
                  );
                  _loadData();
                }
              },
              child: const Text('Submit Review', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5FAF9),
      appBar: AppBar(
        title: const Text('Home Healthcare Services', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'Book Care at Home'),
            Tab(text: 'My Active Visits'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildCatalogTab(),
                _buildVisitsTab(),
              ],
            ),
    );
  }

  Widget _buildCatalogTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Category Filter Chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              FilterChip(
                label: const Text('All Services'),
                selected: _selectedCategoryCode == null,
                onSelected: (_) => _filterByCategory(null),
                selectedColor: AppColors.primary.withValues(alpha: 0.2),
                checkmarkColor: AppColors.primary,
              ),
              const SizedBox(width: 8),
              ..._categories.map((cat) {
                final isSelected = _selectedCategoryCode == cat.code;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(cat.name),
                    selected: isSelected,
                    onSelected: (_) => _filterByCategory(cat.code),
                    selectedColor: AppColors.primary.withValues(alpha: 0.2),
                    checkmarkColor: AppColors.primary,
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Service List
        ..._services.map((service) {
          return Card(
            margin: const EdgeInsets.only(bottom: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            elevation: 1,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          service.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF183B3A)),
                        ),
                      ),
                      Text(
                        '₹${service.basePrice.toStringAsFixed(0)}',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppColors.primary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    service.description ?? 'Professional clinical home care delivered by certified and verified practitioners.',
                    style: const TextStyle(color: Color(0xFF708583), fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.timer_outlined, size: 16, color: AppColors.primary),
                          const SizedBox(width: 4),
                          Text(
                            '${service.defaultDurationMinutes} mins • SAC ${service.sacCode}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF708583)),
                          ),
                        ],
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                        onPressed: () => _showBookingSheet(service),
                        child: const Text('Book Home Visit', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildVisitsTab() {
    if (_myVisits.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.home_outlined, size: 48, color: Colors.grey),
            SizedBox(height: 12),
            Text('No home visits scheduled yet.', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            SizedBox(height: 4),
            Text('Browse the catalog to book at-home medical care.', style: TextStyle(color: Colors.grey, fontSize: 13)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _myVisits.length,
      itemBuilder: (ctx, i) {
        final v = _myVisits[i];
        final isCompleted = v.status == 'COMPLETED';

        return Card(
          margin: const EdgeInsets.only(bottom: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 1,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      v.bookingReference,
                      style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary, fontSize: 14),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isCompleted ? Colors.green.shade50 : Colors.teal.shade50,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        v.status.replaceAll('_', ' '),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isCompleted ? Colors.green.shade800 : AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  v.serviceName,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text('Scheduled: ${v.scheduledDate} at ${v.scheduledStartTime}', style: const TextStyle(fontSize: 13, color: Colors.grey)),
                Text('Address: ${v.serviceAddress}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total: ₹${v.totalAmount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    if (isCompleted)
                      OutlinedButton.icon(
                        icon: const Icon(Icons.star, size: 16, color: Colors.amber),
                        label: const Text('Review Care'),
                        onPressed: () => _showReviewDialog(v),
                      )
                    else
                      Text(
                        'Est. Travel ~${v.estimatedTravelMinutes} mins',
                        style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _BookingBottomSheet extends StatefulWidget {
  final HealthcareService service;
  final VoidCallback onBookSuccess;

  const _BookingBottomSheet({required this.service, required this.onBookSuccess});

  @override
  State<_BookingBottomSheet> createState() => _BookingBottomSheetState();
}

class _BookingBottomSheetState extends State<_BookingBottomSheet> {
  final HomeHealthcareService _service = HomeHealthcareService();
  final addressCtrl = TextEditingController(text: 'Flat 402, Green Acres Apt, Indiranagar');
  final phoneCtrl = TextEditingController(text: '+919876543299');
  final notesCtrl = TextEditingController(text: 'Routine dressing and care.');
  String selectedDate = DateTime.now().add(const Duration(days: 1)).toString().split(' ')[0];
  String selectedTime = '10:00';
  bool bookingInProgress = false;

  @override
  Widget build(BuildContext context) {
    final subtotal = widget.service.basePrice + 50.0; // ₹50 travel
    final total = subtotal * 1.18; // 18% GST

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(widget.service.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const Divider(),
            const SizedBox(height: 8),
            const Text('Service Address (Privacy Protected)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 4),
            TextField(
              controller: addressCtrl,
              decoration: InputDecoration(
                hintText: 'Enter complete flat, building, and street address',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
            const SizedBox(height: 12),
            const Text('Contact Phone', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 4),
            TextField(
              controller: phoneCtrl,
              decoration: InputDecoration(
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Date', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade400), borderRadius: BorderRadius.circular(8)),
                        child: Text(selectedDate),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Preferred Slot', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade400), borderRadius: BorderRadius.circular(8)),
                        child: Text(selectedTime),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFF5FAF9), borderRadius: BorderRadius.circular(10)),
              child: Column(
                children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    const Text('Service Fee'),
                    Text('₹${widget.service.basePrice.toStringAsFixed(0)}'),
                  ]),
                  const SizedBox(height: 4),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: const [
                    Text('Travel Charge'),
                    Text('₹50'),
                  ]),
                  const SizedBox(height: 4),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    const Text('GST (18%)'),
                    Text('₹${(subtotal * 0.18).toStringAsFixed(0)}'),
                  ]),
                  const Divider(),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    const Text('Total Payable', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    Text('₹${total.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.primary)),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                onPressed: bookingInProgress
                    ? null
                    : () async {
                        setState(() => bookingInProgress = true);
                        try {
                          await _service.bookHomeVisit(
                            serviceId: widget.service.id,
                            scheduledDate: selectedDate,
                            scheduledStartTime: selectedTime,
                            serviceAddress: addressCtrl.text,
                            postalCode: '560038',
                            contactPhone: phoneCtrl.text,
                            patientNotes: notesCtrl.text,
                          );
                          widget.onBookSuccess();
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Booking failed: $e')),
                            );
                          }
                        } finally {
                          if (mounted) setState(() => bookingInProgress = false);
                        }
                      },
                child: bookingInProgress
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Confirm & Schedule Visit', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
