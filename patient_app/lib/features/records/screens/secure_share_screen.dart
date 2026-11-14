import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

class SecureShareScreen extends StatefulWidget {
  const SecureShareScreen({Key? key}) : super(key: key);

  @override
  State<SecureShareScreen> createState() => _SecureShareScreenState();
}

class _SecureShareScreenState extends State<SecureShareScreen> {
  final TextEditingController _recipientController = TextEditingController();
  int _selectedHours = 24;
  bool _shareRx = true;
  bool _shareLabs = true;
  bool _shareNotes = true;
  bool _isLoading = false;
  List<dynamic> _shares = [];

  @override
  void initState() {
    super.initState();
    _fetchShares();
  }

  Future<void> _fetchShares() async {
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.recordSharesMy);
      if (res is Map && res['success'] == true) {
        setState(() {
          _shares = res['data']?['shares'] as List<dynamic>? ?? [];
        });
      }
    } catch (e) {
      // Ignore initial error
    }
  }

  Future<void> _createShare() async {
    if (_recipientController.text.trim().isEmpty) return;
    setState(() => _isLoading = true);

    final categories = <String>[];
    if (_shareRx) categories.add('PRESCRIPTION');
    if (_shareLabs) categories.add('LAB_REPORT');
    if (_shareNotes) categories.add('CLINICAL_NOTE');

    try {
      final res = await ApiClient.instance.post(
        ApiEndpoints.recordShare,
        data: {
          'recipient_name': _recipientController.text.trim(),
          'shared_records': categories,
          'duration_hours': _selectedHours,
        },
      );
      if (res is Map && res['success'] == true) {
        _recipientController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Secure medical record share link created!')),
        );
        await _fetchShares();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create share: ${e.toString()}')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _revokeShare(String shareId) async {
    try {
      await ApiClient.instance.delete(ApiEndpoints.recordShareRevoke(shareId));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Medical record share link revoked immediately.')),
      );
      await _fetchShares();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Revoke error: ${e.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Secure Record Sharing', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Generator Card
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: AppColors.border)),
              elevation: 0,
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Create Time-Limited Share Link', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 4),
                    const Text('Generates cryptographic signed URL for external doctor or second opinion.', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _recipientController,
                      decoration: InputDecoration(
                        labelText: 'Recipient Doctor / Hospital Name',
                        hintText: 'e.g., Dr. Mehra (Fortis)',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text('Permitted Record Categories:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    CheckboxListTile(
                      dense: true,
                      title: const Text('Digital Prescriptions', style: TextStyle(fontSize: 13)),
                      value: _shareRx,
                      activeColor: AppColors.primary,
                      onChanged: (v) => setState(() => _shareRx = v ?? true),
                    ),
                    CheckboxListTile(
                      dense: true,
                      title: const Text('Laboratory OCR Reports', style: TextStyle(fontSize: 13)),
                      value: _shareLabs,
                      activeColor: AppColors.primary,
                      onChanged: (v) => setState(() => _shareLabs = v ?? true),
                    ),
                    CheckboxListTile(
                      dense: true,
                      title: const Text('Doctor Clinical SOAP Notes', style: TextStyle(fontSize: 13)),
                      value: _shareNotes,
                      activeColor: AppColors.primary,
                      onChanged: (v) => setState(() => _shareNotes = v ?? true),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Text('Duration:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        const SizedBox(width: 12),
                        DropdownButton<int>(
                          value: _selectedHours,
                          items: const [
                            DropdownMenuItem(value: 6, child: Text('6 Hours')),
                            DropdownMenuItem(value: 24, child: Text('24 Hours (1 Day)')),
                            DropdownMenuItem(value: 48, child: Text('48 Hours (2 Days)')),
                            DropdownMenuItem(value: 168, child: Text('7 Days')),
                          ],
                          onChanged: (v) => setState(() => _selectedHours = v ?? 24),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isLoading ? null : _createShare,
                        icon: const Icon(Icons.share, size: 16),
                        label: Text(_isLoading ? 'Generating Link...' : 'Create Secure Share Link'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
            const Text('Active Share Links & Audit Log', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 10),

            if (_shares.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Text('No active medical record shares. Create one above to share records securely.', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
              )
            else
              ..._shares.map((s) {
                final isRevoked = s['status'] == 'REVOKED';
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppColors.border)),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(s['recipient_name'] ?? 'Consulting Physician', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isRevoked ? const Color(0xFFFED7D7) : const Color(0xFFC6F6D5),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                s['status'] ?? 'ACTIVE',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isRevoked ? const Color(0xFF9B2C2C) : const Color(0xFF22543D)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text('Expires: ${s['expires_at']?.toString().slice(0, 16) ?? '24h'}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        Text('Views logged: ${s['access_count'] ?? 0} views', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        if (!isRevoked) ...[
                          const SizedBox(height: 10),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton.icon(
                              onPressed: () => _revokeShare(s['id']),
                              icon: const Icon(Icons.block, size: 14, color: Colors.redAccent),
                              label: const Text('Revoke Access', style: TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ]
                      ],
                    ),
                  ),
                );
              }).toList(),
          ],
        ),
      ),
    );
  }
}

extension StringSlice on String {
  String slice(int start, int end) {
    if (length < end) return this;
    return substring(start, end);
  }
}
