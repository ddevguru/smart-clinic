import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({Key? key}) : super(key: key);

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final TextEditingController _queryController = TextEditingController();
  final List<Map<String, dynamic>> _messages = [
    {
      'isUser': false,
      'text': 'Namaste! I am your Smart Clinic Health Assistant. You can ask me questions about laboratory terms, fasting preparation guidelines, or clinic appointment navigation.\n\nPlease note: I provide educational information only and do not provide medical diagnosis or prescriptions.',
      'isEmergency': false,
    }
  ];
  bool _isLoading = false;

  Future<void> _sendQuery(String queryText) async {
    if (queryText.trim().isEmpty) return;

    final userMsg = queryText.trim();
    _queryController.clear();
    setState(() {
      _messages.add({
        'isUser': true,
        'text': userMsg,
        'isEmergency': false,
      });
      _isLoading = true;
    });

    try {
      final res = await ApiClient.instance.post(
        ApiEndpoints.aiAssistantQuery,
        data: {'query': userMsg},
      );

      final data = (res is Map && res['data'] != null) ? res['data'] as Map<String, dynamic> : <String, dynamic>{};
      final isEmergency = data['is_emergency'] == true;

      setState(() {
        _messages.add({
          'isUser': false,
          'text': isEmergency ? data['message'] : data['answer'],
          'isEmergency': isEmergency,
          'protocols': data['protocols'] as List<dynamic>?,
          'disclaimer': data['disclaimer'],
        });
      });
    } catch (e) {
      setState(() {
        _messages.add({
          'isUser': false,
          'text': 'Sorry, could not process query right now: ${e.toString()}',
          'isEmergency': false,
        });
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'AI Health & Clinic Assistant',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Non-diagnostic Protocol Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: AppColors.softMint,
            child: Row(
              children: [
                const Icon(Icons.info_outline, size: 18, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Informational guidance only. Not for medical emergencies or direct diagnosis.',
                    style: TextStyle(fontSize: 11, color: AppColors.textPrimary, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),

          // Messages List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg['isUser'] as bool;
                final isEmergency = msg['isEmergency'] as bool;

                if (isEmergency) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF5F5),
                      border: Border.all(color: const Color(0xFFFEB2B2)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.warning_amber_rounded, color: Color(0xFFC53030), size: 24),
                            SizedBox(width: 8),
                            Text(
                              'CRITICAL EMERGENCY ALERT',
                              style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFC53030), fontSize: 14),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          msg['text'] as String,
                          style: const TextStyle(fontSize: 13, color: Color(0xFF9B2C2C), height: 1.4),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            ElevatedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.phone, size: 16),
                              label: const Text('Call 112 (National Emergency)'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFC53030),
                                foregroundColor: Colors.white,
                                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.emergency, size: 16),
                              label: const Text('Call 108 (Ambulance)'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFDD6B20),
                                foregroundColor: Colors.white,
                                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                    decoration: BoxDecoration(
                      color: isUser ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: isUser ? null : Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        )
                      ],
                    ),
                    child: Text(
                      msg['text'] as String,
                      style: TextStyle(
                        fontSize: 13,
                        color: isUser ? Colors.white : AppColors.textPrimary,
                        height: 1.4,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
              ),
            ),

          // Suggestion Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: [
                _buildQuickChip('What is HbA1c test?'),
                _buildQuickChip('Fasting rules for lipid panel'),
                _buildQuickChip('How to join teleconsultation?'),
              ],
            ),
          ),

          // Input field
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _queryController,
                    decoration: InputDecoration(
                      hintText: 'Ask health query or lab explanation...',
                      hintStyle: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                    ),
                    onSubmitted: _sendQuery,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: () => _sendQuery(_queryController.text),
                  icon: const Icon(Icons.send_rounded, color: AppColors.primary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickChip(String label) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ActionChip(
        label: Text(label, style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.softMint,
        side: const BorderSide(color: AppColors.primaryMint),
        onPressed: () => _sendQuery(label),
      ),
    );
  }
}
