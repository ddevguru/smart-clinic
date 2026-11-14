import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class DoctorAppHomeScreen extends ConsumerStatefulWidget {
  const DoctorAppHomeScreen({super.key});

  @override
  ConsumerState<DoctorAppHomeScreen> createState() => _DoctorAppHomeScreenState();
}

class _DoctorAppHomeScreenState extends ConsumerState<DoctorAppHomeScreen> with SingleTickerProviderStateMixin {
  final ApiClient _api = ApiClient();
  late TabController _tabController;

  bool _isLoading = true;
  String? _errorMessage;

  Map<String, dynamic>? _doctorProfile;
  List<dynamic> _todayAppointments = [];
  List<dynamic> _liveQueue = [];
  Map<String, dynamic>? _currentConsultation;
  Map<String, dynamic>? _summaryMetrics;
  String? _clinicId;
  String? _clinicName;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadDoctorData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadDoctorData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final auth = ref.read(authProvider);
      _clinicId = auth.clinicId ?? '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc';
      _clinicName = auth.clinicName ?? 'CarePlus Family Clinic';

      final res = await _api.get(
        '/clinic/dashboard/doctor',
        headers: {'X-Clinic-ID': _clinicId!},
      );

      final data = res['data'] as Map<String, dynamic>? ?? {};
      setState(() {
        _doctorProfile = data['doctor_profile'];
        _todayAppointments = data['today_appointments'] ?? [];
        _liveQueue = data['live_queue'] ?? [];
        _currentConsultation = data['current_consultation'];
        _summaryMetrics = data['metrics'] ?? {};
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceFirst('ApiException: ', '');
      });
    }
  }

  Future<void> _callNextPatient() async {
    final waiting = _liveQueue.where((q) => q['queue_status'] == 'WAITING').toList();
    if (waiting.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No patients currently waiting in queue.')),
      );
      return;
    }

    final nextEntry = waiting.first;
    final entryId = nextEntry['id'];

    try {
      await _api.post(
        '/clinic/queue/$entryId/call',
        headers: {'X-Clinic-ID': _clinicId!},
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Called Token #${nextEntry['token_number']} to consultation room!'),
          backgroundColor: AppColors.deepTeal,
        ),
      );
      await _loadDoctorData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error calling patient: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _completeConsultation() async {
    if (_currentConsultation == null) return;
    final entryId = _currentConsultation!['id'];

    try {
      await _api.post(
        '/clinic/queue/$entryId/complete',
        headers: {'X-Clinic-ID': _clinicId!},
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Consultation completed successfully!'),
          backgroundColor: AppColors.deepTeal,
        ),
      );
      await _loadDoctorData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error completing consultation: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  void _showWritePrescriptionDialog() {
    if (_currentConsultation == null) return;

    final patientId = _currentConsultation!['patient_id'];
    final appointmentId = _currentConsultation!['appointment_id'];
    final doctorId = _doctorProfile?['id'];

    final diagnosisController = TextEditingController(text: 'Acute Upper Respiratory Tract Infection');
    final complaintsController = TextEditingController(text: 'Mild fever, dry cough for 3 days');
    final medicineNameController = TextEditingController(text: 'Paracetamol 650mg');
    final dosageController = TextEditingController(text: '1 tablet');
    final frequencyController = TextEditingController(text: '1-0-1');
    final durationController = TextEditingController(text: '5 days');
    final adviceController = TextEditingController(text: 'Plenty of hydration and warm saline gargles.');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
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
                    '📝 Digital Prescription',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.deepTeal),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(),
              const SizedBox(height: 8),
              Text(
                'Patient: ${_currentConsultation!['patient_name'] ?? 'In Consultation'} (Token ${_currentConsultation!['token_number']})',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: diagnosisController,
                decoration: const InputDecoration(labelText: 'Clinical Diagnosis', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: complaintsController,
                decoration: const InputDecoration(labelText: 'Chief Complaints', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 14),
              const Text('Medication & Dosage', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextField(
                      controller: medicineNameController,
                      decoration: const InputDecoration(labelText: 'Medicine', border: OutlineInputBorder()),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: dosageController,
                      decoration: const InputDecoration(labelText: 'Dosage', border: OutlineInputBorder()),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: frequencyController,
                      decoration: const InputDecoration(labelText: 'Frequency (e.g. 1-0-1)', border: OutlineInputBorder()),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: durationController,
                      decoration: const InputDecoration(labelText: 'Duration', border: OutlineInputBorder()),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextField(
                controller: adviceController,
                decoration: const InputDecoration(labelText: 'Advice & Precautions', border: OutlineInputBorder()),
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
                    Navigator.pop(ctx);
                    try {
                      final rxPayload = {
                        'appointment_id': appointmentId,
                        'patient_id': patientId,
                        'doctor_id': doctorId,
                        'diagnosis': diagnosisController.text.trim(),
                        'diagnosis_type': 'CONFIRMED',
                        'chief_complaints': complaintsController.text.trim(),
                        'advice_and_precautions': adviceController.text.trim(),
                        'medications': [
                          {
                            'medicine_name': medicineNameController.text.trim(),
                            'dosage': dosageController.text.trim(),
                            'frequency': frequencyController.text.trim(),
                            'duration': durationController.text.trim(),
                            'food_instructions': 'AFTER_FOOD'
                          }
                        ]
                      };

                      final rxRes = await _api.post(
                        '/clinic/ehr/prescriptions',
                        data: rxPayload,
                        headers: {'X-Clinic-ID': _clinicId!},
                      );

                      final rxNum = rxRes['data']?['prescription_number'] ?? 'RX-${DateTime.now().millisecondsSinceEpoch}';
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Prescription $rxNum published with SHA-256 seal!'),
                            backgroundColor: AppColors.deepTeal,
                          ),
                        );
                      }
                      await _loadDoctorData();
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Error publishing prescription: $e'), backgroundColor: AppColors.error),
                        );
                      }
                    }
                  },
                  child: const Text('Sign & Publish Digital Prescription', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
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
            Text(
              _doctorProfile?['qualification'] != null
                  ? 'Dr. Workspace • ${_doctorProfile?['specialty'] ?? 'General Medicine'}'
                  : 'Doctor OPD Desk',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
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
            onPressed: _loadDoctorData,
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
            Tab(icon: Icon(Icons.dashboard_outlined), text: 'OPD Queue'),
            Tab(icon: Icon(Icons.calendar_today_outlined), text: 'Appointments'),
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
                        ElevatedButton(onPressed: _loadDoctorData, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildQueueTab(),
                    _buildAppointmentsTab(),
                  ],
                ),
    );
  }

  Widget _buildQueueTab() {
    final waitingList = _liveQueue.where((q) => q['queue_status'] == 'WAITING').toList();
    final inConsultationList = _liveQueue.where((q) => q['queue_status'] == 'IN_CONSULTATION' || q['queue_status'] == 'CALLED').toList();
    final completedCount = _summaryMetrics?['completed_today'] ?? 0;

    return RefreshIndicator(
      onRefresh: _loadDoctorData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // KPI Summary Row
            Row(
              children: [
                _buildKpiCard('Waiting', waitingList.length.toString(), Icons.hourglass_top, Colors.amber.shade700),
                const SizedBox(width: 10),
                _buildKpiCard('In Consultation', inConsultationList.length.toString(), Icons.medical_services, AppColors.deepTeal),
                const SizedBox(width: 10),
                _buildKpiCard('Done Today', completedCount.toString(), Icons.check_circle, Colors.green),
              ],
            ),

            const SizedBox(height: 20),

            // Call Next Patient Big Action
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.deepTeal, AppColors.deepTeal.withValues(alpha: 0.85)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: AppColors.deepTeal.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.campaign_rounded, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Next Waiting Token',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        Text(
                          waitingList.isNotEmpty ? 'Token #${waitingList.first['token_number']} ready' : 'Queue is clear',
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.deepTeal,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: waitingList.isNotEmpty ? _callNextPatient : null,
                    child: const Text('Call Next', style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Active Consultation Section
            const Text(
              'CURRENT CONSULTATION IN ROOM',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textSecondary, letterSpacing: 0.5),
            ),
            const SizedBox(height: 8),

            if (_currentConsultation != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.primaryMint, width: 1.5),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 3)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.softMint,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'TOKEN #${_currentConsultation!['token_number']}',
                            style: const TextStyle(color: AppColors.deepTeal, fontWeight: FontWeight.w800, fontSize: 13),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _currentConsultation!['queue_status'] ?? 'IN_CONSULTATION',
                            style: TextStyle(color: Colors.green.shade800, fontSize: 11, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _currentConsultation!['patient_name'] ?? 'Patient Name',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Phone: ${_currentConsultation!['phone_number'] ?? 'N/A'} • Gender: ${_currentConsultation!['gender'] ?? 'N/A'}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.deepTeal,
                              side: const BorderSide(color: AppColors.deepTeal),
                            ),
                            icon: const Icon(Icons.edit_note, size: 18),
                            label: const Text('Prescription', style: TextStyle(fontSize: 12)),
                            onPressed: _showWritePrescriptionDialog,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green.shade700,
                              foregroundColor: Colors.white,
                            ),
                            icon: const Icon(Icons.check, size: 18),
                            label: const Text('Complete', style: TextStyle(fontSize: 12)),
                            onPressed: _completeConsultation,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Center(
                  child: Text(
                    'No patient currently in consultation.\nTap "Call Next" to invite the next token.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Live Queue List
            const Text(
              'LIVE PATIENT QUEUE (TODAY)',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textSecondary, letterSpacing: 0.5),
            ),
            const SizedBox(height: 8),

            if (_liveQueue.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: Text('No queue registrations recorded today.')),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _liveQueue.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final entry = _liveQueue[index];
                  final status = entry['queue_status'] ?? 'WAITING';
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: status == 'WAITING' ? Colors.amber.shade50 : AppColors.softMint,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              '${entry['token_number']}',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                color: status == 'WAITING' ? Colors.amber.shade900 : AppColors.deepTeal,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                entry['patient_name'] ?? 'Patient',
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                              ),
                              Text(
                                'Est. wait: ${entry['estimated_wait_minutes'] ?? 5} min • Phone: ${entry['phone_number'] ?? 'N/A'}',
                                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: status == 'COMPLETED'
                                ? Colors.green.shade50
                                : status == 'IN_CONSULTATION'
                                    ? Colors.blue.shade50
                                    : Colors.amber.shade50,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            status,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: status == 'COMPLETED'
                                  ? Colors.green.shade800
                                  : status == 'IN_CONSULTATION'
                                      ? Colors.blue.shade800
                                      : Colors.amber.shade900,
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
      onRefresh: _loadDoctorData,
      child: _todayAppointments.isEmpty
          ? const Center(child: Text('No booked appointments for today.'))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _todayAppointments.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final appt = _todayAppointments[index];
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
                        decoration: BoxDecoration(
                          color: AppColors.softMint,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.schedule, color: AppColors.deepTeal, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              appt['patient_name'] ?? 'Patient',
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                            ),
                            Text(
                              'Time: ${appt['appointment_time']} • Fee: ₹${appt['consultation_fee'] ?? 500}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: appt['status'] == 'COMPLETED' ? Colors.green.shade50 : Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          appt['status'] ?? 'SCHEDULED',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: appt['status'] == 'COMPLETED' ? Colors.green.shade800 : Colors.blue.shade800,
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
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(height: 6),
            Text(
              count,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
