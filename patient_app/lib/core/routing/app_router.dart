import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/appointments/screens/my_appointments_screen.dart';
import '../../features/auth/screens/profile_setup_screen.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/welcome_screen.dart';
import '../../features/booking/screens/booking_success_screen.dart';
import '../../features/booking/screens/slot_booking_screen.dart';
import '../../features/discovery/screens/clinic_detail_screen.dart';
import '../../features/discovery/screens/doctor_detail_screen.dart';
import '../../features/discovery/screens/explore_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/queue/screens/live_queue_screen.dart';
import '../../features/records/screens/health_records_screen.dart';
import '../../features/home_healthcare/screens/home_healthcare_screen.dart';
import '../../features/assistant/screens/ai_assistant_screen.dart';
import '../../features/teleconsultation/screens/teleconsultation_room_screen.dart';
import '../../features/records/screens/secure_share_screen.dart';
import '../../features/auth/screens/role_login_screen.dart';
import '../../features/doctor/screens/doctor_app_home_screen.dart';
import '../../features/receptionist/screens/receptionist_app_home_screen.dart';
import '../theme/app_colors.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/welcome',
      builder: (context, state) => const WelcomeScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const RoleLoginScreen(),
    ),
    GoRoute(
      path: '/doctor-home',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const DoctorAppHomeScreen(),
    ),
    GoRoute(
      path: '/receptionist-home',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const ReceptionistAppHomeScreen(),
    ),
    GoRoute(
      path: '/profile-setup',
      builder: (context, state) => const ProfileSetupScreen(),
    ),
    GoRoute(
      path: '/clinic/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final clinicId = state.pathParameters['id'] ?? '';
        return ClinicDetailScreen(clinicId: clinicId);
      },
    ),
    GoRoute(
      path: '/doctor/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final doctorId = state.pathParameters['id'] ?? '';
        return DoctorDetailScreen(doctorId: doctorId);
      },
    ),
    GoRoute(
      path: '/slot-booking',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>? ?? {};
        return SlotBookingScreen(doctorParams: extra);
      },
    ),
    GoRoute(
      path: '/booking-success',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>? ?? {};
        return BookingSuccessScreen(bookingDetails: extra);
      },
    ),
    GoRoute(
      path: '/live-queue',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const LiveQueueScreen(),
    ),
    GoRoute(
      path: '/home-healthcare',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const HomeHealthcareScreen(),
    ),
    GoRoute(
      path: '/ai-assistant',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const AiAssistantScreen(),
    ),
    GoRoute(
      path: '/teleconsultation',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>? ?? {};
        return TeleconsultationRoomScreen(
          roomCode: extra['room_code'] ?? 'ROOM-DEMO',
          patientToken: extra['patient_token'] ?? 'token_demo',
          doctorName: extra['doctor_name'] ?? 'Attending Doctor',
        );
      },
    ),
    GoRoute(
      path: '/secure-share',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const SecureShareScreen(),
    ),

    // Bottom Navigation Shell
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return Scaffold(
          body: navigationShell,
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: navigationShell.currentIndex,
            onTap: (index) => navigationShell.goBranch(
              index,
              initialLocation: index == navigationShell.currentIndex,
            ),
            selectedItemColor: AppColors.deepTeal,
            unselectedItemColor: AppColors.textSecondary,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.home_outlined),
                activeIcon: Icon(Icons.home),
                label: 'Home',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.search_outlined),
                activeIcon: Icon(Icons.search),
                label: 'Explore',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.calendar_today_outlined),
                activeIcon: Icon(Icons.calendar_today),
                label: 'Appointments',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.folder_shared_outlined),
                activeIcon: Icon(Icons.folder_shared),
                label: 'Records',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person_outline),
                activeIcon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          ),
        );
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/explore',
              builder: (context, state) => const ExploreScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/appointments',
              builder: (context, state) => const MyAppointmentsScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/records',
              builder: (context, state) => const HealthRecordsScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);

