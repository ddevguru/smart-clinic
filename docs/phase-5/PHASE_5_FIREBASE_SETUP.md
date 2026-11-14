# Smart Clinic OS — Phase 5 Push Notifications & Firebase Setup Guide

## 1. Architecture
Smart Clinic OS utilizes a tiered push alert system:
1. **In-App Realtime**: Socket.IO triggers immediate UI state changes and local heads-up banners when the app is active or in background.
2. **Local Notifications**: `flutter_local_notifications` displays high-priority system alerts with vibration when token status transitions to `CALLED`.
3. **Remote Push Notifications (FCM)**: Firebase Cloud Messaging sends remote wakeups when the app process is terminated.

---

## 2. Notification Channels (Android O+)

The application defines dedicated high-importance notification channels in `NotificationService`:

| Channel ID | Name | Importance | Purpose |
|---|---|---|---|
| `queue_alerts` | Queue Alerts | `MAX` / Heads-up | Urgent token call, doctor arrival, emergency pause |
| `appointment_reminders` | Appointment Reminders | `DEFAULT` | 24-hour and 2-hour consultation appointment reminders |

---

## 3. Production Firebase Cloud Messaging Setup

To attach production Firebase credentials:
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com).
2. Register the Android package name: `com.smartclinicos.patient_app`.
3. Download `google-services.json` and place it in `patient_app/android/app/google-services.json`.
4. In `patient_app/android/build.gradle.kts`, apply `com.google.gms.google-services` plugin.
5. In `patient_app/pubspec.yaml`, uncomment `firebase_core` and `firebase_messaging`.
6. Upload the FCM Server Key or Service Account credentials to backend environment variable `FCM_SERVER_KEY` or `GOOGLE_APPLICATION_CREDENTIALS`.

