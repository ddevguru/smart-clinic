import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/notifications/notification_service.dart';
import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize background notification channels
  try {
    await NotificationService().initialize();
  } catch (e) {
    debugPrint('NotificationService init error (handled): $e');
  }

  runApp(
    const ProviderScope(
      child: SmartClinicApp(),
    ),
  );
}

class SmartClinicApp extends StatelessWidget {
  const SmartClinicApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Smart Clinic OS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: appRouter,
    );
  }
}
