import 'package:flutter_test/flutter_test.dart';
import 'package:patient_app/features/records/models/record_model.dart';

void main() {
  group('Phase 6 EHR & Digital Prescription Domain Models', () {
    test('PrescriptionItemModel deserialization with medications', () {
      final json = {
        'id': 'rx-101',
        'prescription_number': 'RX-202611-0001',
        'status': 'PUBLISHED',
        'current_version_number': 1,
        'clinic_name': 'Manipal Care Clinic',
        'doctor_name': 'Dr. Vikram Sen',
        'doctor_qualification': 'MBBS, MD',
        'doctor_specialty': 'Internal Medicine',
        'doctor_registration_number': 'KMC-887766',
        'created_at': '2026-11-11T10:00:00Z',
        'latest_version': {
          'version_number': 1,
          'diagnosis': 'Acute Upper Respiratory Tract Infection',
          'diagnosis_type': 'PROVISIONAL',
          'chief_complaints': 'Fever and dry cough',
          'examination_findings': 'Throat congested, Temp 100.2F',
          'treatment_plan': 'Rest and hydration',
          'advice_and_precautions': 'Warm water gargles',
          'follow_up_date': '2026-11-16',
          'follow_up_instructions': 'Review if fever continues',
          'has_pdf': true,
          'document_checksum': 'a1b2c3d4e5f6',
          'verification_token': 'vt-safe-token-123',
          'medications': [
            {
              'medicine_name': 'Paracetamol 650mg',
              'generic_name': 'Paracetamol',
              'dosage': '1 tablet',
              'route': 'ORAL',
              'frequency': '1-0-1',
              'duration': '3 days',
              'food_instructions': 'AFTER_FOOD',
              'additional_instructions': 'SOS for fever > 100F',
            },
            {
              'medicine_name': 'Azithromycin 500mg',
              'generic_name': 'Azithromycin',
              'dosage': '1 tablet',
              'route': 'ORAL',
              'frequency': 'Once daily (OD)',
              'duration': '3 days',
              'food_instructions': 'AFTER_FOOD',
            }
          ]
        }
      };

      final rx = PrescriptionItemModel.fromJson(json);
      expect(rx.id, 'rx-101');
      expect(rx.prescriptionNumber, 'RX-202611-0001');
      expect(rx.status, 'PUBLISHED');
      expect(rx.doctorName, 'Dr. Vikram Sen');
      expect(rx.medicalRegistrationNumber, 'KMC-887766');
      expect(rx.diagnosis, 'Acute Upper Respiratory Tract Infection');
      expect(rx.hasPdf, true);
      expect(rx.medications.length, 2);
      expect(rx.medications[0].medicineName, 'Paracetamol 650mg');
      expect(rx.medications[0].foodInstructions, 'AFTER_FOOD');
      expect(rx.medications[1].frequency, 'Once daily (OD)');
    });

    test('DocumentItemModel deserialization for lab report', () {
      final json = {
        'id': 'doc-301',
        'title': 'Complete Blood Count (CBC)',
        'document_type': 'LAB_REPORT',
        'document_date': '2026-11-11',
        'issuing_facility': 'Dr. Lal PathLabs',
        'notes': 'Normal ranges',
        'file_size_bytes': 204800,
        'created_at': '2026-11-11T10:30:00Z',
      };

      final doc = DocumentItemModel.fromJson(json);
      expect(doc.id, 'doc-301');
      expect(doc.title, 'Complete Blood Count (CBC)');
      expect(doc.documentType, 'LAB_REPORT');
      expect(doc.fileSizeBytes, 204800);
    });

    test('TimelineItemModel deserialization', () {
      final json = {
        'event_type': 'PRESCRIPTION_ISSUED',
        'title': 'Prescription RX-202611-0001',
        'description': 'Issued by Dr. Vikram Sen for URTI',
        'timestamp': '2026-11-11T10:00:00Z',
      };

      final timeline = TimelineItemModel.fromJson(json);
      expect(timeline.eventType, 'PRESCRIPTION_ISSUED');
      expect(timeline.title, 'Prescription RX-202611-0001');
      expect(timeline.description, 'Issued by Dr. Vikram Sen for URTI');
    });
  });
}

