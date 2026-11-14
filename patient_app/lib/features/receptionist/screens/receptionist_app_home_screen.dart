import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class ReceptionistAppHomeScreen extends ConsumerStatefulWidget {
  const ReceptionistAppHomeScreen({super.key});

  @override
  ConsumerState<ReceptionistAppHomeScreen> createState() => _ReceptionistAppHomeScreenState();
}

class _ReceptionistAppHomeScreenState extends ConsumerState<ReceptionistAppHomeScreen> with SingleTickerProviderStateMixin {
  final ApiClient _api = ApiClient();
  late TabController _tabController;

  bool _isLoading = true;
  String? _errorMessage;

  List<dynamic> _todayAppointments = [];
  List<dynamic> _liveQueue = [];
  List<dynamic> _doctorsOnDuty = [];
  Map<String, dynamic>? _summary;
  String? _clinicId;
  String? _clinicName;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadReceptionistData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadReceptionistData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final auth = ref.read(authProvider);
      _clinicId = auth.clinicId ?? '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc';
      _clinicName = auth.clinicName ?? 'CarePlus Family Clinic';

      final res = await _api.get(
        '/clinic/dashboard/receptionist',
        headers: {'X-Clinic-ID': _clinicId!},
      );

      final data = res['data'] as Map<String, dynamic>? ?? {};
      setState(() {
        _todayAppointments = data['today_appointments'] ?? [];
        _liveQueue = data['live_queue'] ?? [];
        _doctorsOnDuty = data['doctors_on_duty'] ?? [];
        _summary = data['summary'] ?? {};
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceFirst('ApiException: ', '');
      });
    }
  }

  void _showWalkInDialog() {
    final nameController = TextEditingController();
    final phoneController = TextEditingController(text: '+9196');
    String selectedGender = 'MALE';
    String? selectedDoctorId = _doctorsOnDuty.isNotEmpty ? _doctorsOnDuty.first['id'] : null;
    final feeController = TextEditingController(text: '500');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      '➕ Register Walk-in & Issue Token',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.deepTeal),
                    ),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const Divider(),
                const SizedBox(height: 10),
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Patient Full Name', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Mobile Number (+91...)', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: selectedGender,
                  decoration: const InputDecoration(labelText: 'Gender', border: OutlineInputBorder()),
                  items: const [
                    DropdownMenuItem(value: 'MALE', child: Text('Male')),
                    DropdownMenuItem(value: 'FEMALE', child: Text('Female')),
                    DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                  ],
                  onChanged: (v) => setModalState(() => selectedGender = v ?? 'MALE'),
                ),
                const SizedBox(height: 10),
                if (_doctorsOnDuty.isNotEmpty)
                  DropdownButtonFormField<String>(
                    value: selectedDoctorId,
                    decoration: const InputDecoration(labelText: 'Assign Doctor', border: OutlineInputBorder()),
                    items: _doctorsOnDuty.map<DropdownMenuItem<String>>((d) {
                      return DropdownMenuItem<String>(
                        value: d['id'].toString(),
                        child: Text('${d['full_name']} (${d['specialty'] ?? 'OPD'})'),
                      );
                    }).toList(),
                    onChanged: (v) => setModalState(() => selectedDoctorId = v),
                  ),
                const SizedBox(height: 10),
                TextField(
                  controller: feeController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Consultation Fee (₹)', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.deepTeal,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () async {
                      if (nameController.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter patient name')));
                        return;
                      }
                      Navigator.pop(ctx);
                      try {
                        final res = await _api.post(
                          '/clinic/appointments/walkin',
                          data: {
                            'full_name': nameController.text.trim(),
                            'phone_number': phoneController.text.trim(),
                            'gender': selectedGender,
                            'doctor_id': selectedDoctorId,
                            'consultation_fee': double.tryParse(feeController.text.trim()) ?? 500,
                          },
                          headers: {'X-Clinic-ID': _clinicId!},
                        );

                        final tokenNumber = res['data']?['token_number'] ?? 'W-01';
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Walk-in registered! Assigned Token #$tokenNumber'),
                              backgroundColor: AppColors.deepTeal,
                            ),
                          );
                        }
                        await _loadReceptionistData();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error registering walk-in: $e'), backgroundColor: AppColors.error),
                          );
                        }
                      }
                    },
                    child: const Text('Issue Instant Queue Token', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showRecordPaymentDialog() {
    if (_todayAppointments.isEmpty && _liveQueue.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No active patients available for billing.')));
      return;
    }

    final amountController = TextEditingController(text: '500');
    final refController = TextEditingController(text: 'UPI-TXN-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}');
    String paymentMethod = 'UPI';

    // Pick first patient ID from appointment or queue
    String? patientId;
    String? appointmentId;
    String patientName = 'Patient';

    if (_todayAppointments.isNotEmpty) {
      patientId = _todayAppointments.first['patient_id'];
      appointmentId = _todayAppointments.first['id'];
      patientName = _todayAppointments.first['patient_name'] ?? 'Patient';
    } else if (_liveQueue.isNotEmpty) {
      patientId = _liveQueue.first['patient_id'];
      patientName = _liveQueue.first['patient_name'] ?? 'Patient';
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    '💳 Record Consultation Payment',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.deepTeal),
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const Divider(),
              const SizedBox(height: 10),
              Text('Patient: $patientName', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 12),
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Amount (₹)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: paymentMethod,
                decoration: const InputDecoration(labelText: 'Payment Method', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'UPI', child: Text('UPI (GPay / PhonePe / Paytm)')),
                  DropdownMenuItem(value: 'CASH', child: Text('Cash at Counter')),
                  DropdownMenuItem(value: 'CARD', child: Text('Debit / Credit Card')),
                ],
                onChanged: (v) => setModalState(() => paymentMethod = v ?? 'UPI'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: refController,
                decoration: const InputDecoration(labelText: 'Payment Reference / Txn ID', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.shade700,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () async {
                    Navigator.pop(ctx);
                    try {
                      final payRes = await _api.post(
                        '/clinic/billing/record',
                        data: {
                          'patient_id': patientId,
                          'appointment_id': appointmentId,
                          'amount': double.tryParse(amountController.text.trim()) ?? 500,
                          'payment_method': paymentMethod,
                          'payment_reference': refController.text.trim(),
                          'notes': 'Consultation fee collected at front desk.'
                        },
                        headers: {'X-Clinic-ID': _clinicId!},
                      );

                      final receiptNumber = payRes['data']?['receipt']?['receipt_number'] ??
                          payRes['data']?['payment']?['receipt_number'] ??
                          'RCP-${DateTime.now().millisecondsSinceEpoch}';

                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Payment recorded! Receipt: $receiptNumber'),
                            backgroundColor: Colors.green.shade800,
                          ),
                        );
                      }
                      await _loadReceptionistData();
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Error recording payment: $e'), backgroundColor: AppColors.error),
                        );
                      }
                    }
                  },
                  child: const Text('Record & Generate Receipt', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.deepTeal,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Reception Desk • Live OP Queue',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
            ),
            Text(
              _clinicName ?? 'CarePlus Family Clinic',
              style: const TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadReceptionistData,
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(icon: Icon(Icons.format_list_numbered), text: 'Live Queue'),
            Tab(icon: Icon(Icons.calendar_month), text: 'Appointments'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.deepTeal))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                        const SizedBox(height: 12),
                        Text(_errorMessage!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(onPressed: _loadReceptionistData, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildLiveQueueTab(),
                    _buildAppointmentsTab(),
                  ],
                ),
    );
  }

  Widget _buildLiveQueueTab() {
    final waiting = _summary?['queue_waiting'] ?? 0;
    final checkedIn = _summary?['checked_in'] ?? 0;
    final completed = _summary?['completed'] ?? 0;
    final total = _summary?['total_appointments'] ?? 0;

    return RefreshIndicator(
      onRefresh: _loadReceptionistData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // KPI Summary Row
            Row(
              children: [
                _buildKpiCard('Total Registrations', total.toString(), Icons.people_outline, AppColors.deepTeal),
                const SizedBox(width: 8),
                _buildKpiCard('Waiting', waiting.toString(), Icons.hourglass_empty, Colors.amber.shade800),
                const SizedBox(width: 8),
                _buildKpiCard('Checked In', checkedIn.toString(), Icons.how_to_reg, Colors.blue.shade700),
                const SizedBox(width: 8),
                _buildKpiCard('Completed', completed.toString(), Icons.check_circle_outline, Colors.green.shade700),
              ],
            ),

            const SizedBox(height: 18),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.deepTeal,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Register Walk-in', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    onPressed: _showWalkInDialog,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.green.shade800,
                      side: BorderSide(color: Colors.green.shade700),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.payment, size: 18),
                    label: const Text('Record Payment', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    onPressed: _showRecordPaymentDialog,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 22),

            // Queue Title
            const Text(
              'TODAY’S LIVE OP TOKENS',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textSecondary, letterSpacing: 0.5),
            ),
            const SizedBox(height: 10),

            if (_liveQueue.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Center(
                  child: Text('No patients registered in queue right now. Tap "Register Walk-in" to issue token.'),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _liveQueue.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final q = _liveQueue[index];
                  final status = q['queue_status'] ?? 'WAITING';
                  return Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: status == 'WAITING'
                                ? Colors.amber.shade50
                                : status == 'CALLED'
                                    ? Colors.blue.shade50
                                    : AppColors.softMint,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              '${q['token_number']}',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                color: status == 'WAITING'
                                    ? Colors.amber.shade900
                                    : status == 'CALLED'
                                        ? Colors.blue.shade800
                                        : AppColors.deepTeal,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(q['patient_name'] ?? 'Patient', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                              Text(
                                'Doctor: ${q['doctor_name'] ?? 'General OPD'} • Phone: ${q['phone_number'] ?? 'N/A'}',
                                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: status == 'CALLED' ? Colors.blue.shade50 : Colors.amber.shade50,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            status,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: status == 'CALLED' ? Colors.blue.shade800 : Colors.amber.shade900,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentsTab() {
    return RefreshIndicator(
      onRefresh: _loadReceptionistData,
      child: _todayAppointments.isEmpty
          ? const Center(child: Text('No booked appointments for today.'))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _todayAppointments.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final a = _todayAppointments[index];
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: AppColors.softMint, borderRadius: BorderRadius.circular(8)),
                        child: const Icon(Icons.person, color: AppColors.deepTeal, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(a['patient_name'] ?? 'Patient', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                            Text(
                              'Time: ${a['appointment_time']} • Dr. ${a['doctor_name'] ?? 'OPD'}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                            if (a['receipt_number'] != null)
                              Text(
                                'Receipt: ${a['receipt_number']} (PAID)',
                                style: TextStyle(fontSize: 11, color: Colors.green.shade800, fontWeight: FontWeight.w600),
                              ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: a['status'] == 'COMPLETED' ? Colors.green.shade50 : Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          a['status'] ?? 'SCHEDULED',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: a['status'] == 'COMPLETED' ? Colors.green.shade800 : Colors.blue.shade800,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }

  Widget _buildKpiCard(String title, String count, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(height: 4),
            Text(count, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 2),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 9, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

