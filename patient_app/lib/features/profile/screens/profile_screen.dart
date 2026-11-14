import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    final displayName = user?.fullName ?? 'Patient';
    final phone = user?.phoneNumber ?? '+919876543210';
    final email = user?.email ?? 'No email added';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Patient Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // User Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: AppColors.softMint,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        displayName.isNotEmpty ? displayName[0].toUpperCase() : 'P',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: AppColors.deepTeal,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayName,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          phone,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          email,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit_outlined, color: AppColors.deepTeal),
                    onPressed: () => context.push('/profile-setup'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Settings & Preferences Group
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _buildSettingTile(
                    icon: Icons.navigation_outlined,
                    title: 'Traffic & Departure Intelligence',
                    subtitle: 'Real-time Google Maps route departure recommendations',
                    onTap: () {
                      _showTrafficPreferencesSheet(context);
                    },
                  ),
                  const Divider(height: 1),
                  _buildSettingTile(
                    icon: Icons.notifications_active_outlined,
                    title: 'Multi-Channel Reminders',
                    subtitle: '24h, 2h & 30m alerts via WhatsApp, SMS & In-App',
                    onTap: () {
                      _showTrafficPreferencesSheet(context);
                    },
                  ),
                  const Divider(height: 1),
                  _buildSettingTile(
                    icon: Icons.shield_outlined,
                    title: 'DPDP Data Privacy Consent',
                    subtitle: 'Consent management for clinical health summaries',
                    onTap: () {
                      _showPrivacyConsentDialog(context);
                    },
                  ),
                  const Divider(height: 1),
                  _buildSettingTile(
                    icon: Icons.help_outline,
                    title: 'Help & Support',
                    subtitle: 'FAQs and support contact for patient app',
                    onTap: () {},
                  ),
                  const Divider(height: 1),
                  _buildSettingTile(
                    icon: Icons.info_outline,
                    title: 'App Version',
                    subtitle: 'Smart Clinic OS Patient v1.2.0 (Phase 7 Traffic AI)',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Logout Button
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: ListTile(
                leading: const Icon(Icons.logout, color: AppColors.error),
                title: const Text(
                  'Log Out',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.error,
                  ),
                ),
                onTap: () => _confirmLogout(context, ref),
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: AppColors.softMint,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 20, color: AppColors.deepTeal),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
      ),
      trailing: trailing ?? (onTap != null ? const Icon(Icons.chevron_right, color: AppColors.textSecondary) : null),
      onTap: onTap,
    );
  }

  void _showPrivacyConsentDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('DPDP Act 2023 Compliance'),
        content: const Text(
          'Smart Clinic OS stores your personal and health information under strict Indian Digital Personal Data Protection (DPDP) Act 2023 regulations. Your clinical data is never sold to third parties and is only accessible by verified doctors and staff at clinics where you consult.',
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  void _showTrafficPreferencesSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
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
                      'Departure & Reminder Alerts',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.deepTeal),
                    ),
                    IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Manage automated notifications and Google Maps traffic-aware departure calculations.',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 20),
                SwitchListTile(
                  value: true,
                  activeThumbColor: AppColors.primaryTeal,
                  title: const Text('Traffic Departure Guidance', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  subtitle: const Text('Calculate exact leave times based on real-time city traffic', style: TextStyle(fontSize: 11)),
                  onChanged: (val) {},
                ),
                SwitchListTile(
                  value: true,
                  activeThumbColor: AppColors.primaryTeal,
                  title: const Text('WhatsApp Appointment Alerts', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  subtitle: const Text('Receive 24h & 2h appointment reminders via WhatsApp', style: TextStyle(fontSize: 11)),
                  onChanged: (val) {},
                ),
                SwitchListTile(
                  value: true,
                  activeThumbColor: AppColors.primaryTeal,
                  title: const Text('Doctor Delay Notifications', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  subtitle: const Text('Instant alert if doctor OPD runs behind schedule', style: TextStyle(fontSize: 11)),
                  onChanged: (val) {},
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Preferences saved successfully!'),
                          backgroundColor: AppColors.deepTeal,
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryTeal,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Save Preferences', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to sign out from your patient account?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () async {
              Navigator.pop(dialogCtx);
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/welcome');
              }
            },
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }
}
