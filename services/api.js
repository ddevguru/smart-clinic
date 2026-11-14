// Smart Clinic OS — API Client Service
// Integrates Next.js frontend with Python Flask Backend API (Phase 1 & Phase 2)

export const API_BASE_URL = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  : (typeof window !== 'undefined' ? '/api/v1' : 'http://localhost:5000/api/v1');

// Token Management
export const tokenStorage = {
  get: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('smart_clinic_access_token');
  },
  set: (token) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('smart_clinic_access_token', token);
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('smart_clinic_access_token');
    localStorage.removeItem('smart_clinic_user');
  },
  getUser: () => {
    if (typeof window === 'undefined') return null;
    const str = localStorage.getItem('smart_clinic_user');
    return str ? JSON.parse(str) : null;
  },
  setUser: (user) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('smart_clinic_user', JSON.stringify(user));
  }
};

async function request(endpoint, options = {}) {
  const token = tokenStorage.get();
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMsg = (isJson && (data.message || data.error)) || `HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    // If network failure or backend not running yet
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to Smart Clinic OS Backend API at ' + API_BASE_URL + '. Is Flask running on port 5000?');
    }
    throw err;
  }
}

export const api = {
  // Authentication
  auth: {
    loginPassword: (emailOrPhone, password) => {
      const isEmail = emailOrPhone.includes('@');
      const payload = {
        password,
        ...(isEmail ? { email: emailOrPhone } : { phone_number: emailOrPhone })
      };
      return request('/auth/login-password', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    requestOtp: (phoneNumber) => request('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber })
    }),
    verifyOtp: (phoneNumber, otpCode, fullName) => request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, otp_code: otpCode, full_name: fullName })
    }),
    getMe: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },

  // Super Admin Governance
  admin: {
    getOverview: () => request('/admin/dashboard/overview'),
    getTrends: () => request('/admin/dashboard/clinic-trends'),
    getClinics: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/admin/clinics${q ? `?${q}` : ''}`);
    },
    getClinicDossier: (clinicId) => request(`/admin/clinics/${clinicId}`),
    reviewClinic: (clinicId, notes) => request(`/admin/clinics/${clinicId}/review`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    }),
    approveClinic: (clinicId, notes) => request(`/admin/clinics/${clinicId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    }),
    requestCorrection: (clinicId, fieldName, comments) => request(`/admin/clinics/${clinicId}/request-correction`, {
      method: 'POST',
      body: JSON.stringify({ field_name: fieldName, comments })
    }),
    rejectClinic: (clinicId, reason, notes) => request(`/admin/clinics/${clinicId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes })
    }),
    suspendClinic: (clinicId, reason, notes) => request(`/admin/clinics/${clinicId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes })
    }),
    reactivateClinic: (clinicId, reason, notes) => request(`/admin/clinics/${clinicId}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes })
    }),
    getDocumentDownloadUrl: (clinicId, docId) => `${API_BASE_URL}/admin/clinics/${clinicId}/documents/${docId}/download`,
    getDoctors: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/admin/doctors${q ? `?${q}` : ''}`);
    },
    getDoctorDossier: (doctorId) => request(`/admin/doctors/${doctorId}`),
    approveDoctor: (doctorId, notes) => request(`/admin/doctors/${doctorId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    }),
    rejectDoctor: (doctorId, reason, notes) => request(`/admin/doctors/${doctorId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes })
    }),
    getDoctorCredentialDownloadUrl: (doctorId, credId) => `${API_BASE_URL}/admin/doctors/${doctorId}/credentials/${credId}/download`,
    getAuditLogs: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/audit-logs${q ? `?${q}` : ''}`);
    },
    getAllAdmins: () => request('/admin/admins'),
    createAdmin: (data) => request('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getAllDoctors: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/admin/all-doctors${q ? `?${q}` : ''}`);
    },
    createDoctor: (data) => request('/admin/doctors', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getAllReceptionists: () => request('/admin/all-receptionists'),
    createReceptionist: (data) => request('/admin/receptionists', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getAllPatients: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/admin/all-patients${q ? `?${q}` : ''}`);
    },
    createClinic: (data) => request('/admin/clinics', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Clinic Owner Onboarding
  onboarding: {
    registerClinic: (data) => request('/onboarding/clinics', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getMyClinic: () => request('/onboarding/clinics/me'),
    updateMyClinic: (data) => request('/onboarding/clinics/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    uploadDocument: (file, documentType) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      return request('/onboarding/clinics/me/documents', {
        method: 'POST',
        body: formData
      });
    },
    getDocumentDownloadUrl: (docId) => `${API_BASE_URL}/onboarding/clinics/me/documents/${docId}/download`,
    submitClinic: () => request('/onboarding/clinics/me/submit', {
      method: 'POST'
    }),
  },

  // Branch Management
  branches: {
    createBranch: (clinicId, data) => request(`/clinics/${clinicId}/branches`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getBranches: (clinicId) => request(`/clinics/${clinicId}/branches`),
    updateBranch: (clinicId, branchId, data) => request(`/clinics/${clinicId}/branches/${branchId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    setBranchSchedules: (clinicId, branchId, schedules) => request(`/clinics/${clinicId}/branches/${branchId}/schedules`, {
      method: 'PUT',
      body: JSON.stringify({ schedules })
    }),
  },

  // Doctor & Staff Management
  doctors: {
    onboardDoctor: (clinicId, data) => request(`/clinics/${clinicId}/doctors`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getDoctors: (clinicId) => request(`/clinics/${clinicId}/doctors`),
    getDoctor: (clinicId, doctorId) => request(`/clinics/${clinicId}/doctors/${doctorId}`),
    uploadCredential: (clinicId, doctorId, file, credentialType) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('credential_type', credentialType);
      return request(`/clinics/${clinicId}/doctors/${doctorId}/credentials`, {
        method: 'POST',
        body: formData
      });
    },
    setDoctorSchedules: (clinicId, doctorId, schedules) => request(`/clinics/${clinicId}/doctors/${doctorId}/schedules`, {
      method: 'PUT',
      body: JSON.stringify({ schedules })
    }),
  },

  // Staff Memberships
  staff: {
    addStaff: (clinicId, data) => request(`/clinics/${clinicId}/members`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getStaff: (clinicId) => request(`/clinics/${clinicId}/members`),
    updateStaff: (clinicId, membershipId, data) => request(`/clinics/${clinicId}/members/${membershipId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  },

  // Clinic Operations & Dashboards (Phase 3)
  clinic: {
    getOverview: (clinicId) => request('/clinic/dashboard/overview', {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getReceptionistDashboard: (clinicId) => request('/clinic/dashboard/receptionist', {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getDoctorDashboard: (clinicId, doctorId = null) => {
      const q = doctorId ? `?doctor_id=${doctorId}` : '';
      return request(`/clinic/dashboard/doctor${q}`, {
        headers: { 'X-Clinic-ID': clinicId }
      });
    },
    getProfile: (clinicId) => request('/clinic/profile', {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    updateProfile: (clinicId, data) => request('/clinic/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getMyLocation: (clinicId) => request('/clinic/my-location', {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getLocationDoctors: (clinicId) => request('/clinic/doctors', {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    addLocationDoctor: (clinicId, data) => request('/clinic/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getLocationReceptionists: (clinicId) => request('/clinic/receptionists', {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    addLocationReceptionist: (clinicId, data) => request('/clinic/receptionists', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getLocationPatients: (clinicId) => request('/clinic/patients-list', {
      headers: { 'X-Clinic-ID': clinicId }
    }),
  },

  // Patients (Phase 3)
  patients: {
    register: (clinicId, data) => request('/clinic/patients', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    list: (clinicId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/clinic/patients${q ? `?${q}` : ''}`, {
        headers: { 'X-Clinic-ID': clinicId }
      });
    },
    get: (clinicId, patientId) => request(`/clinic/patients/${patientId}`, {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getMedicalSummary: (clinicId, patientId) => request(`/clinic/patients/${patientId}/medical-summary`, {
      headers: { 'X-Clinic-ID': clinicId }
    }),
  },

  // Appointments & Walk-ins (Phase 3)
  appointments: {
    create: (clinicId, data) => request('/clinic/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    list: (clinicId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/clinic/appointments${q ? `?${q}` : ''}`, {
        headers: { 'X-Clinic-ID': clinicId }
      });
    },
    get: (clinicId, appointmentId) => request(`/clinic/appointments/${appointmentId}`, {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    checkIn: (clinicId, appointmentId) => request(`/clinic/appointments/${appointmentId}/check-in`, {
      method: 'POST',
      headers: { 'X-Clinic-ID': clinicId }
    }),
    complete: (clinicId, appointmentId) => request(`/clinic/appointments/${appointmentId}/complete`, {
      method: 'POST',
      headers: { 'X-Clinic-ID': clinicId }
    }),
    cancel: (clinicId, appointmentId, reason) => request(`/clinic/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getNotes: (clinicId, appointmentId) => request(`/clinic/appointments/${appointmentId}/notes`, {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    saveNotes: (clinicId, appointmentId, data) => request(`/clinic/appointments/${appointmentId}/notes`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    createWalkIn: (clinicId, data) => request('/clinic/walk-ins', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
  },

  // Billing & Payments (Phase 3)
  billing: {
    recordPayment: (clinicId, data) => request('/clinic/payments', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    listPayments: (clinicId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/clinic/payments${q ? `?${q}` : ''}`, {
        headers: { 'X-Clinic-ID': clinicId }
      });
    },
    getPayment: (clinicId, paymentId) => request(`/clinic/payments/${paymentId}`, {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getReceipt: (clinicId, paymentId) => request(`/clinic/payments/${paymentId}/receipt`, {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    recordAdjustment: (clinicId, paymentId, data) => request(`/clinic/payments/${paymentId}/adjustments`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
  },

  // Live Queue & Hybrid Booking (Phase 4)
  queue: {
    getSlots: (clinicId, params) => {
      const q = new URLSearchParams(params).toString();
      return request(`/clinic/queue/slots?${q}`, {
        headers: { 'X-Clinic-ID': clinicId }
      });
    },
    bookSlot: (clinicId, data) => request('/clinic/queue/book-slot', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    registerWalkIn: (clinicId, data) => request('/clinic/queue/walk-in', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    joinLiveQueue: (clinicId, data) => request('/clinic/queue/join-live', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getLiveQueue: (clinicId, params) => {
      const q = new URLSearchParams(params).toString();
      return request(`/clinic/queue/live?${q}`, {
        headers: { 'X-Clinic-ID': clinicId }
      });
    },
    callNext: (clinicId, sessionId) => request('/clinic/queue/call-next', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    startConsultation: (clinicId, entryId) => request(`/clinic/queue/entries/${entryId}/start`, {
      method: 'POST',
      headers: { 'X-Clinic-ID': clinicId }
    }),
    completeConsultation: (clinicId, entryId) => request(`/clinic/queue/entries/${entryId}/complete`, {
      method: 'POST',
      headers: { 'X-Clinic-ID': clinicId }
    }),
    skipPatient: (clinicId, entryId, reason) => request(`/clinic/queue/entries/${entryId}/skip`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    recallPatient: (clinicId, entryId) => request(`/clinic/queue/entries/${entryId}/recall`, {
      method: 'POST',
      headers: { 'X-Clinic-ID': clinicId }
    }),
    holdPatient: (clinicId, entryId, reason) => request(`/clinic/queue/entries/${entryId}/hold`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    resumePatient: (clinicId, entryId) => request(`/clinic/queue/entries/${entryId}/resume`, {
      method: 'POST',
      headers: { 'X-Clinic-ID': clinicId }
    }),
    cancelEntry: (clinicId, entryId, reason) => request(`/clinic/queue/entries/${entryId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    setPriority: (clinicId, entryId, priorityFlag, reason) => request(`/clinic/queue/entries/${entryId}/priority`, {
      method: 'POST',
      body: JSON.stringify({ priority_flag: priorityFlag, reason }),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    pauseQueue: (clinicId, sessionId, reason) => request(`/clinic/queue/sessions/${sessionId}/pause`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    resumeQueue: (clinicId, sessionId) => request(`/clinic/queue/sessions/${sessionId}/resume`, {
      method: 'POST',
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getPolicy: (clinicId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/clinic/queue/policies${q ? `?${q}` : ''}`, {
        headers: { 'X-Clinic-ID': clinicId }
      });
    },
    updatePolicy: (clinicId, data) => request('/clinic/queue/policies', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
  },

  // Electronic Health Records & Digital Prescriptions (Phase 6)
  ehr: {
    createPrescription: (clinicId, data) => request('/clinic/ehr/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getPrescriptions: (clinicId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/clinic/ehr/prescriptions${q ? `?${q}` : ''}`, {
        headers: { 'X-Clinic-ID': clinicId }
      });
    },
    getPrescription: (clinicId, prescriptionId) => request(`/clinic/ehr/prescriptions/${prescriptionId}`, {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    updatePrescriptionDraft: (clinicId, prescriptionId, data) => request(`/clinic/ehr/prescriptions/${prescriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    finalizePrescription: (clinicId, prescriptionId, publish = true) => request(`/clinic/ehr/prescriptions/${prescriptionId}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ publish }),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    publishPrescription: (clinicId, prescriptionId) => request(`/clinic/ehr/prescriptions/${prescriptionId}/publish`, {
      method: 'POST',
      headers: { 'X-Clinic-ID': clinicId }
    }),
    createCorrection: (clinicId, prescriptionId, data) => request(`/clinic/ehr/prescriptions/${prescriptionId}/correction`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    voidPrescription: (clinicId, prescriptionId, voidReason) => request(`/clinic/ehr/prescriptions/${prescriptionId}/void`, {
      method: 'POST',
      body: JSON.stringify({ void_reason: voidReason }),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getPrescriptionPdfUrl: (prescriptionId) => `${API_BASE_URL}/clinic/ehr/prescriptions/${prescriptionId}/pdf`,
    saveConsultationNote: (clinicId, appointmentId, data) => request(`/clinic/ehr/consultation-notes/${appointmentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getConsultationNote: (clinicId, appointmentId) => request(`/clinic/ehr/consultation-notes/${appointmentId}`, {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getMedicalProfile: (clinicId, patientId) => request(`/clinic/ehr/medical-profile/${patientId}`, {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    updateMedicalProfile: (clinicId, patientId, data) => request(`/clinic/ehr/medical-profile/${patientId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getTimeline: (clinicId, patientId) => request(`/clinic/ehr/timeline/${patientId}`, {
      headers: { 'X-Clinic-ID': clinicId }
    }),
    uploadDocument: (clinicId, formData) => request('/clinic/ehr/documents', {
      method: 'POST',
      body: formData,
      headers: { 'X-Clinic-ID': clinicId }
    }),
    getDocuments: (clinicId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/clinic/ehr/documents${q ? `?${q}` : ''}`, {
        headers: { 'X-Clinic-ID': clinicId }
      });
    },
    getDocumentDownloadUrl: (documentId) => `${API_BASE_URL}/clinic/ehr/documents/${documentId}/download`,
    getFollowUps: (clinicId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/clinic/ehr/follow-ups${q ? `?${q}` : ''}`, {
        headers: { 'X-Clinic-ID': clinicId }
      });
    },
  }
};

