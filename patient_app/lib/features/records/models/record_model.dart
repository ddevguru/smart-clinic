class PrescriptionMedicationItem {
  final String medicineName;
  final String? genericName;
  final String dosage;
  final String route;
  final String frequency;
  final String duration;
  final String foodInstructions;
  final String? additionalInstructions;

  PrescriptionMedicationItem({
    required this.medicineName,
    this.genericName,
    required this.dosage,
    required this.route,
    required this.frequency,
    required this.duration,
    required this.foodInstructions,
    this.additionalInstructions,
  });

  factory PrescriptionMedicationItem.fromJson(Map<String, dynamic> json) {
    return PrescriptionMedicationItem(
      medicineName: json['medicine_name']?.toString() ?? '',
      genericName: json['generic_name']?.toString(),
      dosage: json['dosage']?.toString() ?? '1 unit',
      route: json['route']?.toString() ?? 'ORAL',
      frequency: json['frequency']?.toString() ?? '1-0-1',
      duration: json['duration']?.toString() ?? '3 days',
      foodInstructions: json['food_instructions']?.toString() ?? 'AFTER_FOOD',
      additionalInstructions: json['additional_instructions']?.toString(),
    );
  }
}

class PrescriptionItemModel {
  final String id;
  final String prescriptionNumber;
  final String status;
  final int currentVersionNumber;
  final String clinicName;
  final String doctorName;
  final String? qualification;
  final String? specialty;
  final String? medicalRegistrationNumber;
  final String? diagnosis;
  final String? diagnosisType;
  final String? chiefComplaints;
  final String? examinationFindings;
  final String? treatmentPlan;
  final String? adviceAndPrecautions;
  final String? followUpDate;
  final String? followUpInstructions;
  final bool hasPdf;
  final String? documentChecksum;
  final String? verificationToken;
  final String createdAt;
  final List<PrescriptionMedicationItem> medications;

  PrescriptionItemModel({
    required this.id,
    required this.prescriptionNumber,
    required this.status,
    required this.currentVersionNumber,
    required this.clinicName,
    required this.doctorName,
    this.qualification,
    this.specialty,
    this.medicalRegistrationNumber,
    this.diagnosis,
    this.diagnosisType,
    this.chiefComplaints,
    this.examinationFindings,
    this.treatmentPlan,
    this.adviceAndPrecautions,
    this.followUpDate,
    this.followUpInstructions,
    this.hasPdf = false,
    this.documentChecksum,
    this.verificationToken,
    required this.createdAt,
    required this.medications,
  });

  factory PrescriptionItemModel.fromJson(Map<String, dynamic> json) {
    final latestVer = json['latest_version'] as Map<String, dynamic>? ?? {};
    final medsList = (latestVer['medications'] as List<dynamic>?) ?? [];

    return PrescriptionItemModel(
      id: json['id']?.toString() ?? '',
      prescriptionNumber: json['prescription_number']?.toString() ?? 'RX',
      status: json['status']?.toString() ?? 'PUBLISHED',
      currentVersionNumber: json['current_version_number'] as int? ?? 1,
      clinicName: json['clinic_name']?.toString() ?? 'Smart Clinic',
      doctorName: json['doctor_name']?.toString() ?? 'Attending Doctor',
      qualification: json['doctor_qualification']?.toString(),
      specialty: json['doctor_specialty']?.toString(),
      medicalRegistrationNumber: json['doctor_registration_number']?.toString(),
      diagnosis: latestVer['diagnosis']?.toString(),
      diagnosisType: latestVer['diagnosis_type']?.toString(),
      chiefComplaints: latestVer['chief_complaints']?.toString(),
      examinationFindings: latestVer['examination_findings']?.toString(),
      treatmentPlan: latestVer['treatment_plan']?.toString(),
      adviceAndPrecautions: latestVer['advice_and_precautions']?.toString(),
      followUpDate: latestVer['follow_up_date']?.toString(),
      followUpInstructions: latestVer['follow_up_instructions']?.toString(),
      hasPdf: latestVer['has_pdf'] as bool? ?? false,
      documentChecksum: latestVer['document_checksum']?.toString(),
      verificationToken: latestVer['verification_token']?.toString(),
      createdAt: json['created_at']?.toString() ?? '',
      medications: medsList
          .map((m) => PrescriptionMedicationItem.fromJson(m as Map<String, dynamic>))
          .toList(),
    );
  }
}

class DocumentItemModel {
  final String id;
  final String title;
  final String documentType;
  final String? documentDate;
  final String? issuingFacility;
  final String? notes;
  final int? fileSizeBytes;
  final String? fileUrl;
  final String? mimeType;
  final String createdAt;

  DocumentItemModel({
    required this.id,
    required this.title,
    required this.documentType,
    this.documentDate,
    this.issuingFacility,
    this.notes,
    this.fileSizeBytes,
    this.fileUrl,
    this.mimeType,
    required this.createdAt,
  });

  factory DocumentItemModel.fromJson(Map<String, dynamic> json) {
    return DocumentItemModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Medical Document',
      documentType: json['document_type']?.toString() ?? 'LAB_REPORT',
      documentDate: json['document_date']?.toString(),
      issuingFacility: json['issuing_facility']?.toString(),
      notes: json['notes']?.toString(),
      fileSizeBytes: json['file_size_bytes'] as int?,
      fileUrl: json['file_url']?.toString(),
      mimeType: json['mime_type']?.toString(),
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}

class TimelineItemModel {
  final String eventType;
  final String title;
  final String? description;
  final String timestamp;
  final String? referenceId;

  TimelineItemModel({
    required this.eventType,
    required this.title,
    this.description,
    required this.timestamp,
    this.referenceId,
  });

  factory TimelineItemModel.fromJson(Map<String, dynamic> json) {
    return TimelineItemModel(
      eventType: json['event_type']?.toString() ?? 'EVENT',
      title: json['title']?.toString() ?? 'Health Event',
      description: json['description']?.toString(),
      timestamp: json['timestamp']?.toString() ?? '',
      referenceId: json['reference_id']?.toString(),
    );
  }
}

class MedicalRecordModel {
  final String id;
  final String appointmentId;
  final String date;
  final String doctorName;
  final String? specialty;
  final String? clinicName;
  final String? diagnosisSummary;
  final String? symptoms;
  final String? clinicalNotes;
  final String? followUpDate;

  MedicalRecordModel({
    required this.id,
    required this.appointmentId,
    required this.date,
    required this.doctorName,
    this.specialty,
    this.clinicName,
    this.diagnosisSummary,
    this.symptoms,
    this.clinicalNotes,
    this.followUpDate,
  });

  factory MedicalRecordModel.fromJson(Map<String, dynamic> json) {
    return MedicalRecordModel(
      id: json['id']?.toString() ?? '',
      appointmentId: json['appointment_id']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      doctorName: json['doctor_name']?.toString() ?? 'Doctor',
      specialty: json['specialty']?.toString(),
      clinicName: json['clinic_name']?.toString(),
      diagnosisSummary: json['diagnosis_summary']?.toString(),
      symptoms: json['symptoms']?.toString(),
      clinicalNotes: json['clinical_notes']?.toString(),
      followUpDate: json['follow_up_date']?.toString(),
    );
  }
}
