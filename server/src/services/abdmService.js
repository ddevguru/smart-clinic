const { query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class AbdmService {
  /**
   * Verify and look up an ABHA (Ayushman Bharat Health Account) ID / Address
   */
  async verifyAbhaAddress(abhaAddress) {
    if (!abhaAddress || !abhaAddress.trim()) {
      throw new Error('ABHA address is required');
    }

    const cleanAddress = abhaAddress.trim().toLowerCase();

    // Verify format (either 14-digit ABHA number or handle@abdm / handle@sbx)
    const isAbhaNumber = /^\d{2}-\d{4}-\d{4}-\d{4}$/.test(cleanAddress) || /^\d{14}$/.test(cleanAddress);
    const isAbhaHandle = /^[\w.]+@(abdm|sbx|ndhm)$/.test(cleanAddress);

    if (!isAbhaNumber && !isAbhaHandle && !cleanAddress.includes('@')) {
      throw new Error('Invalid ABHA identifier format. Expected format: name@abdm or 14-digit ABHA number');
    }

    // Standard simulated response from ABDM Gateway Sandbox
    return {
      status: 'VERIFIED',
      abha_address: cleanAddress.includes('@') ? cleanAddress : `${cleanAddress}@abdm`,
      abha_number: '91-8726-1049-5512',
      full_name: 'Verified Citizen Patient',
      gender: 'M',
      day_of_birth: '15',
      month_of_birth: '08',
      year_of_birth: '1988',
      mobile_masked: 'XXXXXX9999',
      address: {
        line: 'Flat 402, Green Valley Apartments',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pincode: '560038'
      },
      kyc_verified: true,
      auth_methods: ['AADHAAR_OTP', 'MOBILE_OTP'],
      abdm_hip_status: 'LINKED'
    };
  }

  /**
   * Generate an ABDM compliant FHIR R4 JSON Bundle for health record sharing
   */
  async generateFhirBundle({ patientId, appointmentId, clinicId }) {
    // Fetch patient info
    const patientRes = await query(`SELECT * FROM patients WHERE id = $1`, [patientId]);
    if (patientRes.rows.length === 0) {
      throw new Error('Patient not found');
    }
    const patient = patientRes.rows[0];

    // Fetch clinic info
    const clinicRes = await query(`SELECT * FROM clinics WHERE id = $1`, [clinicId]);
    const clinic = clinicRes.rows[0] || { name: 'Smart Clinic', id: clinicId };

    // Fetch ABDM HIP ID
    const abdmRes = await query(`SELECT * FROM abdm_integrations WHERE clinic_id = $1`, [clinicId]);
    const hipId = abdmRes.rows.length > 0 ? abdmRes.rows[0].hip_id : 'IN_KA_BLR_001';

    // Fetch appointment or prescription
    const apptRes = await query(`
      SELECT a.*, dp.specialty, u.full_name as doctor_name, dp.medical_registration_number
      FROM appointments a
      LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      WHERE a.id = $1
    `, [appointmentId]);
    const appt = apptRes.rows[0] || {};

    const bundleId = uuidv4();
    const timestamp = new Date().toISOString();

    const fhirBundle = {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        versionId: '1',
        lastUpdated: timestamp,
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle']
      },
      identifier: {
        system: 'https://ndhm.gov.in/bundle-identifier',
        value: `BUNDLE-${bundleId}`
      },
      type: 'document',
      timestamp: timestamp,
      entry: [
        // 1. Composition
        {
          fullUrl: `urn:uuid:${uuidv4()}`,
          resource: {
            resourceType: 'Composition',
            id: uuidv4(),
            status: 'final',
            type: {
              coding: [
                {
                  system: 'https://projecteka.in/snomed',
                  code: '371530004',
                  display: 'Clinical consultation report'
                }
              ],
              text: 'OP Consultation Record'
            },
            subject: {
              reference: `urn:uuid:patient-${patient.id}`,
              display: patient.full_name
            },
            date: timestamp,
            author: [
              {
                reference: `urn:uuid:practitioner-${appt.doctor_id || 'doc-1'}`,
                display: appt.doctor_name || 'Dr. Attending Physician'
              }
            ],
            title: 'Consultation & Prescription Record',
            custodian: {
              reference: `urn:uuid:org-${clinic.id}`,
              display: clinic.name
            },
            section: [
              {
                title: 'Chief Complaints & Diagnosis',
                code: {
                  coding: [{ system: 'http://snomed.info/sct', code: '422843007', display: 'Chief complaint' }]
                },
                text: {
                  status: 'generated',
                  div: `<div>${appt.appointment_notes || 'Patient attended clinical outpatient encounter.'}</div>`
                }
              }
            ]
          }
        },
        // 2. Patient
        {
          fullUrl: `urn:uuid:patient-${patient.id}`,
          resource: {
            resourceType: 'Patient',
            id: patient.id,
            identifier: [
              {
                type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR' }] },
                system: 'https://smartclinicos.in/patient-id',
                value: patient.id
              }
            ],
            name: [{ text: patient.full_name }],
            telecom: [{ system: 'phone', value: patient.phone_number, use: 'mobile' }],
            gender: patient.gender ? patient.gender.toLowerCase() : 'unknown'
          }
        },
        // 3. Practitioner
        {
          fullUrl: `urn:uuid:practitioner-${appt.doctor_id || 'doc-1'}`,
          resource: {
            resourceType: 'Practitioner',
            id: appt.doctor_id || 'doc-1',
            identifier: [
              {
                system: 'https://mciindia.org/registration',
                value: appt.medical_registration_number || 'KMC-88291'
              }
            ],
            name: [{ text: appt.doctor_name || 'Dr. Attending Physician' }]
          }
        },
        // 4. Organization (Clinic)
        {
          fullUrl: `urn:uuid:org-${clinic.id}`,
          resource: {
            resourceType: 'Organization',
            id: clinic.id,
            identifier: [
              {
                system: 'https://ndhm.gov.in/hip-id',
                value: hipId
              }
            ],
            name: clinic.name
          }
        }
      ]
    };

    return {
      bundle_id: bundleId,
      fhir_version: '4.0.1',
      hip_id: hipId,
      resource_count: fhirBundle.entry.length,
      bundle: fhirBundle
    };
  }

  /**
   * Create an ABDM Consent Artefact
   */
  async createConsent({ patientId, clinicId, abhaAddress, purpose = 'CAREMGT', hiTypes, dateFrom, dateTo }) {
    const consentArtefactId = 'CONS-' + uuidv4().slice(0, 8).toUpperCase() + '-' + Date.now();
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days expiry

    const res = await query(`
      INSERT INTO abdm_consents (
        patient_id, clinic_id, consent_artefact_id, purpose,
        abha_address, hi_types, date_from, date_to, expiry_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'GRANTED')
      RETURNING *
    `, [
      patientId,
      clinicId,
      consentArtefactId,
      purpose,
      abhaAddress,
      JSON.stringify(hiTypes || ['Prescription', 'DiagnosticReport', 'OPConsultation']),
      dateFrom || new Date(),
      dateTo || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      expiryDate
    ]);

    return res.rows[0];
  }

  /**
   * Revoke an active ABDM Consent
   */
  async revokeConsent(consentArtefactId, patientId) {
    const res = await query(`
      UPDATE abdm_consents
      SET status = 'REVOKED',
          revoked_at = NOW(),
          updated_at = NOW()
      WHERE consent_artefact_id = $1 AND patient_id = $2
      RETURNING *
    `, [consentArtefactId, patientId]);

    if (res.rows.length === 0) {
      throw new Error('ABDM Consent Artefact not found or unauthorized');
    }

    return res.rows[0];
  }
}

module.exports = new AbdmService();

