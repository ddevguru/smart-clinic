import 'package:flutter_test/flutter_test.dart';
import 'package:patient_app/features/auth/models/user_model.dart';
import 'package:patient_app/features/booking/models/slot_model.dart';
import 'package:patient_app/features/discovery/models/clinic_model.dart';
import 'package:patient_app/features/discovery/models/doctor_model.dart';
import 'package:patient_app/features/queue/models/queue_ticket_model.dart';
import 'package:patient_app/features/appointments/models/appointment_model.dart';

void main() {
  group('Phase 5 Patient App Domain Models', () {
    test('UserModel deserialization and serialization', () {
      final json = {
        'id': 'usr-12345',
        'phone_number': '+919876543210',
        'full_name': 'Aarav Sharma',
        'email': 'aarav@example.com',
        'is_verified': true,
        'created_at': '2026-11-11T03:00:00Z',
      };

      final user = UserModel.fromJson(json);
      expect(user.id, 'usr-12345');
      expect(user.phoneNumber, '+919876543210');
      expect(user.fullName, 'Aarav Sharma');
      expect(user.isVerified, true);

      final outJson = user.toJson();
      expect(outJson['phone_number'], '+919876543210');
    });

    test('ClinicModel deserialization with branches and specialties', () {
      final json = {
        'id': 'cln-100',
        'name': 'Apollo Clinic Koramangala',
        'city': 'Bangalore',
        'branches_count': 2,
        'doctors_count': 5,
        'specialties': ['General Medicine', 'Pediatrics'],
        'rating': 4.8,
        'branches': [
          {'id': 'brn-1', 'name': 'Main Branch', 'is_main_branch': true}
        ]
      };

      final clinic = ClinicModel.fromJson(json);
      expect(clinic.name, 'Apollo Clinic Koramangala');
      expect(clinic.specialties.length, 2);
      expect(clinic.branches.length, 1);
      expect(clinic.branches.first.isMainBranch, true);
    });

    test('DoctorModel deserialization with schedules', () {
      final json = {
        'id': 'doc-200',
        'user_id': 'usr-50',
        'clinic_id': 'cln-100',
        'doctor_name': 'Dr. Rajesh Rao',
        'qualification': 'MBBS, MD',
        'specialty': 'Cardiology',
        'medical_registration_number': 'KMC-998877',
        'registration_council': 'Karnataka Medical Council',
        'experience_years': 12,
        'consultation_fee': 600.0,
        'schedules': [
          {
            'id': 'sch-1',
            'day_of_week': 0, // Monday
            'start_time': '09:00',
            'end_time': '13:00',
            'break_start_time': '11:00',
            'break_end_time': '11:30',
          }
        ]
      };

      final doctor = DoctorModel.fromJson(json);
      expect(doctor.doctorName, 'Dr. Rajesh Rao');
      expect(doctor.consultationFee, 600.0);
      expect(doctor.schedules.first.dayName, 'Monday');
      expect(doctor.schedules.first.breakStartTime, '11:00');
    });

    test('SlotModel handles available and break states', () {
      final slot1 = SlotModel.fromJson({
        'start_time': '10:00',
        'end_time': '10:15',
        'duration_minutes': 15,
        'is_available': true,
      });
      expect(slot1.isAvailable, true);

      final slot2 = SlotModel.fromJson({
        'start_time': '11:00',
        'end_time': '11:15',
        'duration_minutes': 15,
        'is_available': false,
        'reason': 'BREAK',
      });
      expect(slot2.isAvailable, false);
      expect(slot2.reason, 'BREAK');
    });

    test('QueueTicketModel deserialization and active status', () {
      final json = {
        'id': 'tkt-001',
        'token_number': 'A005',
        'token_sequence': 5,
        'queue_status': 'WAITING',
        'booking_source': 'LIVE_QUEUE',
        'patients_ahead': 3,
        'estimated_wait_minutes': 45,
        'doctor': {
          'id': 'doc-200',
          'doctor_name': 'Dr. Rajesh Rao',
          'specialty': 'Cardiology',
        },
        'clinic': {
          'id': 'cln-100',
          'name': 'Apollo Clinic',
        },
        'branch': {
          'id': 'brn-1',
          'name': 'Main Branch',
        }
      };

      final ticket = QueueTicketModel.fromJson(json);
      expect(ticket.tokenNumber, 'A005');
      expect(ticket.patientsAhead, 3);
      expect(ticket.estimatedWaitMinutes, 45);
      expect(ticket.doctorName, 'Dr. Rajesh Rao');
    });

    test('AppointmentModel cancellation eligibility', () {
      final scheduledAppt = AppointmentModel.fromJson({
        'id': 'apt-1',
        'clinic_id': 'cln-1',
        'branch_id': 'brn-1',
        'doctor_id': 'doc-1',
        'appointment_date': '2026-11-12',
        'appointment_time': '10:30',
        'status': 'SCHEDULED',
        'appointment_source': 'ONLINE',
      });
      expect(scheduledAppt.isCancellable, true);

      final completedAppt = AppointmentModel.fromJson({
        'id': 'apt-2',
        'clinic_id': 'cln-1',
        'branch_id': 'brn-1',
        'doctor_id': 'doc-1',
        'appointment_date': '2026-11-10',
        'appointment_time': '10:30',
        'status': 'COMPLETED',
        'appointment_source': 'ONLINE',
      });
      expect(completedAppt.isCancellable, false);
    });
  });
}

