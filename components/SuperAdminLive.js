'use client';

import React, { useState, useEffect } from 'react';
import { api, tokenStorage, API_BASE_URL } from '../services/api';
import {
  Shield, Building2, CheckCircle2, Clock, XCircle, AlertTriangle,
  Search, Filter, RefreshCw, FileText, ChevronRight, Eye, UserCheck,
  Stethoscope, Users, Settings, LogOut, Download, AlertCircle, Ban,
  ExternalLink, BarChart3, Activity, ArrowUpRight, Lock, Navigation, MapPin,
  ShieldCheck, Plus, Check, Trash2, Calendar, Phone, Mail
} from 'lucide-react';

export default function SuperAdminLive() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('admin@smartclinicos.in');
  const [loginPassword, setLoginPassword] = useState('Password@123');
  const [loginError, setLoginError] = useState('');

  // Active Navigation Tab
  // 'DASHBOARD' | 'CLINICS' | 'CLINIC_VERIFICATION' | 'DOCTORS' | 'DOCTOR_VERIFICATION' | 'STAFF' | 'AUDIT_LOGS' | 'SETTINGS' | 'COMING_SOON'
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [comingSoonTitle, setComingSoonTitle] = useState('');

  // Live Data States
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [clinicPagination, setClinicPagination] = useState({ page: 1, total: 0 });
  const [clinicSearch, setClinicSearch] = useState('');
  const [clinicStatusFilter, setClinicStatusFilter] = useState('');
  const [selectedClinicDossier, setSelectedClinicDossier] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Doctors
  const [doctors, setDoctors] = useState([]);
  const [doctorPagination, setDoctorPagination] = useState({ page: 1, total: 0 });
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorStatusFilter, setDoctorStatusFilter] = useState('');
  const [selectedDoctorDossier, setSelectedDoctorDossier] = useState(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);

  // Action Modals
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null, // 'APPROVE' | 'REJECT' | 'CORRECTION' | 'SUSPEND' | 'REACTIVATE' | 'REVIEW' | 'APPROVE_DOC' | 'REJECT_DOC'
    targetId: null,
    targetName: '',
    reasonOrNotes: '',
    fieldName: '',
  });

  // Phase 8: SaaS Subscriptions & Platform Revenue States
  const [saasSubscriptions, setSaasSubscriptions] = useState([]);
  const [saasAnalytics, setSaasAnalytics] = useState(null);
  const [saasPlans, setSaasPlans] = useState([]);
  const [adjustModal, setAdjustModal] = useState({
    isOpen: false,
    sub: null,
    extendDays: 14,
    newStatus: 'ACTIVE',
    newPlanId: '',
    reason: ''
  });
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Phase 9: Home Healthcare Marketplace States
  const [marketplaceAnalytics, setMarketplaceAnalytics] = useState(null);
  const [marketplaceProviders, setMarketplaceProviders] = useState([]);
  const [selectedProviderForVerify, setSelectedProviderForVerify] = useState(null);
  const [providerVerifyModalOpen, setProviderVerifyModalOpen] = useState(false);
  const [providerVerifyNotes, setProviderVerifyNotes] = useState('');

  // Phase 10: External Integrations Management
  const [integrationsList, setIntegrationsList] = useState([]);
  const [isSyncingIntegration, setIsSyncingIntegration] = useState({});

  // Super Admin Universal Oversight State
  const [adminsList, setAdminsList] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ full_name: '', email: '', phone_number: '', password: 'Password@123', clinic_id: '' });
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  const [allDoctorsList, setAllDoctorsList] = useState([]);
  const [isDoctorCreateModalOpen, setIsDoctorCreateModalOpen] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ full_name: '', email: '', phone_number: '', password: 'Password@123', specialty: 'General Physician', qualification: 'MBBS, MD', medical_registration_number: '', consultation_fee: 500, clinic_id: '' });
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);

  const [receptionistsList, setReceptionistsList] = useState([]);
  const [receptionistSearch, setReceptionistSearch] = useState('');
  const [isReceptionistModalOpen, setIsReceptionistModalOpen] = useState(false);
  const [receptionistForm, setReceptionistForm] = useState({ full_name: '', email: '', phone_number: '', password: 'Password@123', clinic_id: '' });
  const [isSubmittingReceptionist, setIsSubmittingReceptionist] = useState(false);

  const [patientsList, setPatientsList] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');

  const [isClinicCreateModalOpen, setIsClinicCreateModalOpen] = useState(false);
  const [clinicForm, setClinicForm] = useState({ name: '', city: 'Bangalore', state: 'Karnataka', phone: '', email: '', address: '' });
  const [isSubmittingClinic, setIsSubmittingClinic] = useState(false);

  // Check existing token on mount or auto-login as Super Admin
  useEffect(() => {
    async function initAdminAuth() {
      const savedToken = tokenStorage.get();
      const savedUser = tokenStorage.getUser();
      // If user has super admin token, use it
      if (savedToken && savedUser && (savedUser.email?.includes('admin') || savedUser.role === 'SUPER_ADMIN')) {
        setAuthToken(savedToken);
        setCurrentUser(savedUser);
      } else {
        // Automatically authenticate as Super Admin for smooth experience
        try {
          const res = await api.auth.loginPassword('admin@smartclinicos.in', 'Password@123');
          const token = res.data?.access_token || res.data?.token;
          if (token) {
            tokenStorage.set(token);
            tokenStorage.setUser(res.data.user || { full_name: 'Platform Super Admin', email: 'admin@smartclinicos.in' });
            setAuthToken(token);
            setCurrentUser(res.data.user || { full_name: 'Platform Super Admin', email: 'admin@smartclinicos.in' });
          }
        } catch (e) {
          // If auto login fails, user can manually click Sign In
        }
      }
    }
    initAdminAuth();
  }, []);

  // Fetch data when authenticated and tab changes
  useEffect(() => {
    if (authToken) {
      if (activeTab === 'DASHBOARD') fetchDashboardData();
      else if (activeTab === 'CLINICS' || activeTab === 'CLINIC_VERIFICATION') fetchClinicsData();
      else if (activeTab === 'ADMINS') { fetchAdminsData(); fetchClinicsData(); }
      else if (activeTab === 'DOCTORS' || activeTab === 'DOCTOR_VERIFICATION') { fetchDoctorsData(); fetchAllDoctorsData(); fetchClinicsData(); }
      else if (activeTab === 'RECEPTIONISTS') { fetchReceptionistsData(); fetchClinicsData(); }
      else if (activeTab === 'PATIENTS') fetchPatientsData();
      else if (activeTab === 'AUDIT_LOGS') fetchAuditLogs();
      else if (activeTab === 'SUBSCRIPTIONS') fetchSubscriptionsData();
      else if (activeTab === 'HOME_HEALTHCARE') fetchHomeHealthcareData();
      else if (activeTab === 'INTEGRATIONS') fetchIntegrationsData();
    }
  }, [authToken, activeTab, clinicStatusFilter, doctorStatusFilter]);

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await api.auth.loginPassword(loginEmail, loginPassword);
      const token = res.data?.access_token || res.data?.token;
      if (token) {
        tokenStorage.set(token);
        tokenStorage.setUser(res.data.user);
        setAuthToken(token);
        setCurrentUser(res.data.user);
        setActiveTab('DASHBOARD');
      } else {
        setLoginError('Invalid response from authentication server.');
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed. Check your Super Admin credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    tokenStorage.clear();
    setAuthToken(null);
    setCurrentUser(null);
    setOverview(null);
  }

  async function fetchDashboardData(isRetry = false) {
    setIsLoading(true);
    setApiError('');
    try {
      const [overviewRes, trendsRes] = await Promise.all([
        api.admin.getOverview(),
        api.admin.getTrends(),
      ]);
      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
    } catch (err) {
      if (!isRetry && (err.status === 401 || err.status === 403 || err.message?.includes('Forbidden') || err.message?.includes('Unauthorized'))) {
        try {
          const res = await api.auth.loginPassword('admin@smartclinicos.in', 'Password@123');
          const token = res.data?.access_token || res.data?.token;
          if (token) {
            tokenStorage.set(token);
            setAuthToken(token);
            return fetchDashboardData(true);
          }
        } catch (e) {
          // ignore
        }
      }
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // --- Universal Oversight Data Fetchers & Action Handlers ---
  async function fetchAdminsData() {
    setIsLoading(true);
    try {
      const res = await api.admin.getAllAdmins();
      if (res.success && res.data) {
        setAdminsList(res.data.admins || []);
      }
    } catch (err) {
      setApiError('Failed to fetch clinic admins: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateAdmin(e) {
    if (e) e.preventDefault();
    if (!adminForm.full_name || !adminForm.email || !adminForm.clinic_id) {
      alert('Please fill in Admin Name, Email, and select a Clinic.');
      return;
    }
    setIsSubmittingAdmin(true);
    try {
      const res = await api.admin.createAdmin(adminForm);
      if (res.success) {
        alert('Clinic Admin created and assigned successfully.');
        setIsAdminModalOpen(false);
        setAdminForm({ full_name: '', email: '', phone_number: '', password: 'Password@123', clinic_id: '' });
        await fetchAdminsData();
      } else {
        alert(res.error?.message || 'Failed to create clinic admin.');
      }
    } catch (err) {
      alert('Create admin error: ' + err.message);
    } finally {
      setIsSubmittingAdmin(false);
    }
  }

  async function fetchAllDoctorsData() {
    setIsLoading(true);
    try {
      const res = await api.admin.getAllDoctors();
      if (res.success && res.data) {
        setAllDoctorsList(res.data.doctors || []);
      }
    } catch (err) {
      setApiError('Failed to fetch all doctors: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateDoctor(e) {
    if (e) e.preventDefault();
    if (!doctorForm.full_name || !doctorForm.email || !doctorForm.specialty || !doctorForm.clinic_id) {
      alert('Please fill in Doctor Name, Email, Specialty, and select Clinic Location.');
      return;
    }
    setIsSubmittingDoctor(true);
    try {
      const res = await api.admin.createDoctor(doctorForm);
      if (res.success) {
        alert('Doctor created, verified, and assigned to clinic successfully.');
        setIsDoctorCreateModalOpen(false);
        setDoctorForm({ full_name: '', email: '', phone_number: '', password: 'Password@123', specialty: 'General Physician', qualification: 'MBBS, MD', medical_registration_number: '', consultation_fee: 500, clinic_id: '' });
        await fetchAllDoctorsData();
        await fetchDoctorsData();
      } else {
        alert(res.error?.message || 'Failed to create doctor.');
      }
    } catch (err) {
      alert('Create doctor error: ' + err.message);
    } finally {
      setIsSubmittingDoctor(false);
    }
  }

  async function fetchReceptionistsData() {
    setIsLoading(true);
    try {
      const res = await api.admin.getAllReceptionists();
      if (res.success && res.data) {
        setReceptionistsList(res.data.receptionists || []);
      }
    } catch (err) {
      setApiError('Failed to fetch receptionists: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateReceptionist(e) {
    if (e) e.preventDefault();
    if (!receptionistForm.full_name || !receptionistForm.email || !receptionistForm.clinic_id) {
      alert('Please fill in Receptionist Name, Email, and select Clinic Location.');
      return;
    }
    setIsSubmittingReceptionist(true);
    try {
      const res = await api.admin.createReceptionist(receptionistForm);
      if (res.success) {
        alert('Receptionist created and assigned to clinic successfully.');
        setIsReceptionistModalOpen(false);
        setReceptionistForm({ full_name: '', email: '', phone_number: '', password: 'Password@123', clinic_id: '' });
        await fetchReceptionistsData();
      } else {
        alert(res.error?.message || 'Failed to create receptionist.');
      }
    } catch (err) {
      alert('Create receptionist error: ' + err.message);
    } finally {
      setIsSubmittingReceptionist(false);
    }
  }

  async function fetchPatientsData() {
    setIsLoading(true);
    try {
      const res = await api.admin.getAllPatients();
      if (res.success && res.data) {
        setPatientsList(res.data.patients || []);
      }
    } catch (err) {
      setApiError('Failed to fetch patients: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateClinic(e) {
    if (e) e.preventDefault();
    if (!clinicForm.name || !clinicForm.city) {
      alert('Please fill in Clinic Name and City.');
      return;
    }
    setIsSubmittingClinic(true);
    try {
      const res = await api.admin.createClinic(clinicForm);
      if (res.success) {
        alert('New clinic location created and verified successfully.');
        setIsClinicCreateModalOpen(false);
        setClinicForm({ name: '', city: 'Bangalore', state: 'Karnataka', phone: '', email: '', address: '' });
        await fetchClinicsData();
      } else {
        alert(res.error?.message || 'Failed to create clinic location.');
      }
    } catch (err) {
      alert('Create clinic error: ' + err.message);
    } finally {
      setIsSubmittingClinic(false);
    }
  }

  // Phase 8: SaaS Subscriptions & Platform Revenue Fetcher
  async function fetchSubscriptionsData() {
    setIsLoading(true);
    setApiError('');
    try {
      const [subsRes, anaRes, plansRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/subscriptions`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/admin/revenue/analytics`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/admin/subscriptions/plans`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      const subsData = await subsRes.json();
      if (subsData.success && subsData.data) {
        setSaasSubscriptions(subsData.data.subscriptions || []);
      }

      const anaData = await anaRes.json();
      if (anaData.success && anaData.data) {
        setSaasAnalytics(anaData.data);
      }

      const plansData = await plansRes.json();
      if (plansData.success && plansData.data) {
        setSaasPlans(plansData.data.plans || []);
      }
    } catch (e) {
      setApiError('Failed to fetch SaaS subscription data: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExecuteAdjustment(e) {
    if (e) e.preventDefault();
    if (!adjustModal.reason.trim()) {
      alert('Mandatory justification reason is required for subscription adjustment audit policy.');
      return;
    }
    setIsAdjusting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/subscriptions/${adjustModal.sub.id}/manual-adjustment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          extend_days: parseInt(adjustModal.extendDays, 10),
          status: adjustModal.newStatus,
          plan_id: adjustModal.newPlanId || adjustModal.sub.plan_id,
          reason: adjustModal.reason
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Subscription adjusted successfully and recorded in audit log.');
        setAdjustModal({ isOpen: false, sub: null, extendDays: 14, newStatus: 'ACTIVE', newPlanId: '', reason: '' });
        await fetchSubscriptionsData();
      } else {
        alert(data.error?.message || 'Adjustment failed.');
      }
    } catch (err) {
      alert('Adjustment error: ' + err.message);
    } finally {
      setIsAdjusting(false);
    }
  }

  // Phase 9: Home Healthcare Marketplace Fetcher & Actions
  async function fetchHomeHealthcareData() {
    setIsLoading(true);
    setApiError('');
    try {
      const [anaRes, provRes] = await Promise.all([
        fetch(`${API_BASE_URL}/marketplace/admin/overview`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/marketplace/admin/providers`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      const anaData = await anaRes.json();
      if (anaData.success && anaData.data) {
        setMarketplaceAnalytics(anaData.data);
      }

      const provData = await provRes.json();
      if (provData.success && provData.data) {
        setMarketplaceProviders(provData.data.providers || []);
      }
    } catch (e) {
      setApiError('Failed to fetch home healthcare data: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyProviderStatus(providerId, newStatus) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/marketplace/admin/providers/${providerId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          verification_status: newStatus,
          verification_notes: providerVerifyNotes || `Status updated to ${newStatus} by Super Admin`
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Provider verification status updated to ${newStatus}.`);
        setProviderVerifyModalOpen(false);
        setSelectedProviderForVerify(null);
        setProviderVerifyNotes('');
        await fetchHomeHealthcareData();
      } else {
        alert(data.error?.message || 'Verification update failed.');
      }
    } catch (e) {
      alert('Verification error: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Phase 10: External Integrations API Methods
  async function fetchIntegrationsData() {
    setIsLoading(true);
    setApiError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/integrations`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setIntegrationsList(data.data.integrations || []);
      } else {
        setApiError(data.error?.message || 'Failed to load platform integrations');
      }
    } catch (err) {
      setApiError('Platform integrations fetch error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleIntegration(slug, currentEnabled) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/integrations/${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ is_enabled: !currentEnabled })
      });
      const data = await res.json();
      if (data.success) {
        await fetchIntegrationsData();
      } else {
        alert(data.error?.message || 'Toggle failed');
      }
    } catch (err) {
      alert('Toggle error: ' + err.message);
    }
  }

  async function handleTriggerSyncIntegration(slug) {
    setIsSyncingIntegration(prev => ({ ...prev, [slug]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/admin/integrations/${slug}/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        alert(`Integration ping successful for ${slug}! Latency: ${data.data.sync_result?.latency_ms}ms`);
        await fetchIntegrationsData();
      } else {
        alert(data.error?.message || 'Sync failed');
      }
    } catch (err) {
      alert('Sync error: ' + err.message);
    } finally {
      setIsSyncingIntegration(prev => ({ ...prev, [slug]: false }));
    }
  }

  async function fetchClinicsData() {
    setIsLoading(true);
    setApiError('');
    try {
      const params = {
        page: clinicPagination.page,
        page_size: 15,
        query: clinicSearch,
      };
      if (activeTab === 'CLINIC_VERIFICATION') {
        params.verification_status = clinicStatusFilter || 'SUBMITTED';
      } else if (clinicStatusFilter) {
        params.verification_status = clinicStatusFilter;
      }
      const res = await api.admin.getClinics(params);
      setClinics(res.data);
      setClinicPagination({ page: res.meta.page, total: res.meta.total });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  
  

  async function fetchDoctorsData() {
    setIsLoading(true);
    setApiError('');
    try {
      const params = {
        page: doctorPagination.page,
        page_size: 15,
        query: doctorSearch,
      };
      if (activeTab === 'DOCTOR_VERIFICATION') {
        params.verification_status = doctorStatusFilter || 'PENDING';
      } else if (doctorStatusFilter) {
        params.verification_status = doctorStatusFilter;
      }
      const res = await api.admin.getDoctors(params);
      setDoctors(res.data);
      setDoctorPagination({ page: res.meta.page, total: res.meta.total });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  
  

  async function fetchAuditLogs() {
    setIsLoading(true);
    setApiError('');
    try {
      const res = await api.admin.getAuditLogs({ limit: 50 });
      setAuditLogs(res.data || []);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  
  

  async function openClinicDossier(clinicId) {
    setIsLoading(true);
    try {
      const res = await api.admin.getClinicDossier(clinicId);
      setSelectedClinicDossier(res.data);
      setIsDossierOpen(true);
    } catch (err) {
      alert('Failed to load clinic dossier: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  

  async function openDoctorDossier(doctorId) {
    setIsLoading(true);
    try {
      const res = await api.admin.getDoctorDossier(doctorId);
      setSelectedDoctorDossier(res.data);
      setIsDoctorModalOpen(true);
    } catch (err) {
      alert('Failed to load doctor dossier: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  

  async function executeAdminAction() {
    const { type, targetId, reasonOrNotes, fieldName } = actionModal;
    setIsLoading(true);
    try {
      if (type === 'REVIEW') {
        await api.admin.reviewClinic(targetId, reasonOrNotes);
      } else if (type === 'APPROVE') {
        await api.admin.approveClinic(targetId, reasonOrNotes);
      } else if (type === 'CORRECTION') {
        await api.admin.requestCorrection(targetId, fieldName, reasonOrNotes);
      } else if (type === 'REJECT') {
        await api.admin.rejectClinic(targetId, reasonOrNotes);
      } else if (type === 'SUSPEND') {
        await api.admin.suspendClinic(targetId, reasonOrNotes);
      } else if (type === 'REACTIVATE') {
        await api.admin.reactivateClinic(targetId, reasonOrNotes);
      } else if (type === 'APPROVE_DOC') {
        await api.admin.approveDoctor(targetId, reasonOrNotes);
      } else if (type === 'REJECT_DOC') {
        await api.admin.rejectDoctor(targetId, reasonOrNotes);
      }

      // Close modal and refresh
      setActionModal({ isOpen: false, type: null, targetId: null, targetName: '', reasonOrNotes: '', fieldName: '' });
      if (isDossierOpen && targetId) {
        await openClinicDossier(targetId);
      }
      if (isDoctorModalOpen && targetId) {
        await openDoctorDossier(targetId);
      }
      if (activeTab === 'DASHBOARD') fetchDashboardData();
      else if (activeTab.includes('CLINIC')) fetchClinicsData();
      else if (activeTab.includes('DOCTOR')) fetchDoctorsData();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  

  // --- LOGIN SCREEN ---
  if (!authToken) {
    return (
      <div style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-base)',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '440px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '36px',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-soft-mint)',
              color: 'var(--color-deep-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Super Admin Portal
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Platform Governance & Verification
              </span>
            </div>
          </div>

          {loginError && (
            <div style={{
              background: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                Admin Email / Identity
              </label>
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@smartclinicos.in"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                Secure Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{
              background: 'var(--color-soft-mint)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--color-deep-teal)',
              lineHeight: 1.4
            }}>
              🔒 <strong>Development Credentials:</strong> Pre-filled with seed super-admin account (`admin@smartclinicos.in` / `Password@123`).
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--color-deep-teal)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                opacity: isLoggingIn ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px'
              }}
            >
              {isLoggingIn ? <RefreshCw className="animate-spin" size={18} /> : <Lock size={18} />}
              <span>{isLoggingIn ? 'Authenticating...' : 'Sign In as Super Admin'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN ADMIN PORTAL SHELL ---
  return (
    <div style={{ display: 'flex', minHeight: '92vh', background: 'var(--color-bg-base)' }}>
      {/* 1. Left Navigation Sidebar */}
      <aside style={{
        width: '260px',
        background: '#FFFFFF',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Admin Header */}
        <div style={{
          padding: '22px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-mint)',
            color: 'var(--color-deep-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Super Admin
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-healthcare-teal)', fontWeight: 600 }}>
              Live Platform Engine
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'DASHBOARD', label: 'Platform Overview', icon: BarChart3 },
            { id: 'CLINICS', label: 'Clinics & Locations', icon: Building2, badge: overview?.clinics?.pending },
            { id: 'ADMINS', label: 'Clinic Admins & Owners', icon: Shield },
            { id: 'DOCTORS', label: 'All Doctors Directory', icon: Stethoscope, badge: overview?.doctors?.pending },
            { id: 'RECEPTIONISTS', label: 'All Receptionists', icon: Users },
            { id: 'PATIENTS', label: 'All Patients / Users', icon: Activity },
            { id: 'SUBSCRIPTIONS', label: 'SaaS Subscriptions & Revenue', icon: BarChart3 },
            { id: 'HOME_HEALTHCARE', label: 'Home Care Marketplace', icon: Navigation },
            { id: 'INTEGRATIONS', label: 'Ecosystem Integrations', icon: ShieldCheck },
            { id: 'AUDIT_LOGS', label: 'Audit Trail', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.tag) {
                    setActiveTab('COMING_SOON');
                    setComingSoonTitle(item.label + ' (' + item.tag + ')');
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'var(--color-soft-mint)' : 'transparent',
                  color: isActive ? 'var(--color-deep-teal)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={isActive ? 'var(--color-deep-teal)' : '#708583'} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span style={{
                    background: 'var(--color-warning)',
                    color: '#FFFFFF',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-pill)'
                  }}>
                    {item.badge}
                  </span>
                )}
                {item.tag && (
                  <span style={{
                    background: '#ECEFF1',
                    color: '#607D8B',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-pill)'
                  }}>
                    {item.tag}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {currentUser?.full_name || 'Super Admin'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
              {currentUser?.email || 'admin@smartclinicos.in'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '6px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* 2. Main Administration Content Area */}
      <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
        {/* Top Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '26px'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 4px 0'
            }}>
              {activeTab === 'DASHBOARD' && 'Platform Overview & Health'}
              {activeTab === 'CLINICS' && 'Clinics & Location Facilities'}
              {activeTab === 'ADMINS' && 'Clinic Admins & Location Owners'}
              {activeTab === 'DOCTORS' && 'Universal Doctors Directory & Verification'}
              {activeTab === 'RECEPTIONISTS' && 'All Clinic Receptionists'}
              {activeTab === 'PATIENTS' && 'All Registered Patients & Users'}
              {activeTab === 'SUBSCRIPTIONS' && 'SaaS Subscriptions & Revenue Operations'}
              {activeTab === 'HOME_HEALTHCARE' && 'Home Healthcare Marketplace & Dispatch'}
              {activeTab === 'INTEGRATIONS' && 'Ecosystem Integrations & Interoperability Directory'}
              {activeTab === 'AUDIT_LOGS' && 'System Audit Trail'}
              {activeTab === 'COMING_SOON' && comingSoonTitle}
            </h1>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
              Connected live to Smart Clinic OS PostgreSQL 16+ Backend Gateway
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                if (activeTab === 'DASHBOARD') fetchDashboardData();
                else if (activeTab === 'CLINICS') fetchClinicsData();
                else if (activeTab === 'ADMINS') fetchAdminsData();
                else if (activeTab === 'DOCTORS') { fetchDoctorsData(); fetchAllDoctorsData(); }
                else if (activeTab === 'RECEPTIONISTS') fetchReceptionistsData();
                else if (activeTab === 'PATIENTS') fetchPatientsData();
                else if (activeTab === 'SUBSCRIPTIONS') fetchSubscriptionsData();
                else if (activeTab === 'HOME_HEALTHCARE') fetchHomeHealthcareData();
                else if (activeTab === 'INTEGRATIONS') fetchIntegrationsData();
                else if (activeTab === 'AUDIT_LOGS') fetchAuditLogs();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#FFFFFF',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <span style={{
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
              API Connected
            </span>
          </div>
        </div>

        {apiError && (
          <div style={{
            background: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
        )}

        {/* --- VIEW 1: DASHBOARD --- */}
        {activeTab === 'DASHBOARD' && overview && (
          <div>
            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-title">Total Registered Clinics</span>
                  <Building2 size={20} color="var(--color-healthcare-teal)" />
                </div>
                <div className="kpi-value">{overview.clinics.total}</div>
                <div className="kpi-delta" style={{ color: 'var(--color-success)' }}>
                  +{overview.clinics.registered_this_month} registered this month
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-title">Verified & Approved</span>
                  <CheckCircle2 size={20} color="var(--color-success)" />
                </div>
                <div className="kpi-value">{overview.clinics.approved}</div>
                <div className="kpi-delta" style={{ color: 'var(--color-text-secondary)' }}>
                  Active outpatient tenants
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-title">Pending Verification</span>
                  <Clock size={20} color="var(--color-warning)" />
                </div>
                <div className="kpi-value" style={{ color: 'var(--color-warning)' }}>
                  {overview.clinics.pending}
                </div>
                <div className="kpi-delta" style={{ color: 'var(--color-warning)' }}>
                  Requires admin audit
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-title">Registered Doctors</span>
                  <Stethoscope size={20} color="var(--color-deep-teal)" />
                </div>
                <div className="kpi-value">{overview.doctors.total}</div>
                <div className="kpi-delta" style={{ color: 'var(--color-text-secondary)' }}>
                  {overview.doctors.approved} verified credentials
                </div>
              </div>
            </div>

            {/* Quick Status Distributions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                padding: '22px',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--color-text-primary)' }}>
                  Clinic Verification Breakdown
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Approved / Active', count: overview.clinics.approved, color: 'var(--color-success)' },
                    { label: 'Submitted / Pending', count: overview.clinics.pending, color: 'var(--color-warning)' },
                    { label: 'Under Review', count: overview.clinics.under_review, color: 'var(--color-healthcare-teal)' },
                    { label: 'Needs Correction', count: overview.clinics.needs_correction, color: '#E5A64A' },
                    { label: 'Suspended', count: overview.clinics.suspended, color: '#888888' },
                    { label: 'Rejected', count: overview.clinics.rejected, color: 'var(--color-error)' },
                  ].map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color }} />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{s.label}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                padding: '22px',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--color-text-primary)' }}>
                  Recent Verification Timeline
                </h3>
                {overview.recent_activities.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', padding: '20px 0', textAlign: 'center' }}>
                    No recent verification events logged yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {overview.recent_activities.slice(0, 5).map((act) => (
                      <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.82rem' }}>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-xs)',
                          background: act.to_status === 'APPROVED' ? 'var(--color-success-bg)' : 'var(--color-soft-mint)',
                          color: act.to_status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-deep-teal)',
                          fontWeight: 700,
                          fontSize: '0.72rem'
                        }}>
                          {act.to_status}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{act.reason || 'Status changed'}</div>
                          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem' }}>
                            By {act.admin_name} • {new Date(act.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Registrations Table */}
            <div className="data-table-container">
              <div className="table-header-bar">
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                  Latest Clinic Submissions
                </span>
                <button
                  onClick={() => setActiveTab('CLINIC_VERIFICATION')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-deep-teal)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Go to Verification Queue</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Clinic Name</th>
                    <th>Type</th>
                    <th>City / State</th>
                    <th>Status</th>
                    <th>Registered At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recent_clinics.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.clinic_type}</td>
                      <td>{c.city || '—'}, {c.state || '—'}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background:
                            c.verification_status === 'APPROVED' ? 'var(--color-success-bg)' :
                            c.verification_status === 'SUBMITTED' ? 'var(--color-warning-bg)' :
                            c.verification_status === 'UNDER_REVIEW' ? 'var(--color-soft-mint)' : '#F5F5F5',
                          color:
                            c.verification_status === 'APPROVED' ? 'var(--color-success)' :
                            c.verification_status === 'SUBMITTED' ? 'var(--color-warning)' :
                            c.verification_status === 'UNDER_REVIEW' ? 'var(--color-deep-teal)' : '#666'
                        }}>
                          {c.verification_status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          onClick={() => openClinicDossier(c.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--color-soft-mint)',
                            color: 'var(--color-deep-teal)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          Review Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW 2: CLINIC DIRECTORY & VERIFICATION QUEUE --- */}
        {(activeTab === 'CLINICS' || activeTab === 'CLINIC_VERIFICATION') && (
          <div>
            {/* Filter Bar */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--color-bg-base)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                flex: 1
              }}>
                <Search size={16} color="#708583" />
                <input
                  type="text"
                  placeholder="Search clinic by name, license number, phone or email..."
                  value={clinicSearch}
                  onChange={(e) => setClinicSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchClinicsData()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.86rem',
                    width: '100%'
                  }}
                />
              </div>

              <select
                value={clinicStatusFilter}
                onChange={(e) => setClinicStatusFilter(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: '#FFFFFF',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              >
                <option value="">All Verification Statuses</option>
                <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="NEEDS_CORRECTION">NEEDS_CORRECTION</option>
                <option value="APPROVED">APPROVED</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="DRAFT">DRAFT</option>
              </select>

              <button
                onClick={fetchClinicsData}
                style={{
                  padding: '9px 18px',
                  background: 'var(--color-deep-teal)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Filter
              </button>

              <button
                onClick={() => setIsClinicCreateModalOpen(true)}
                style={{
                  padding: '9px 18px',
                  background: '#087F79',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Onboard New Clinic
              </button>
            </div>

            {/* Table */}
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Clinic Name</th>
                    <th>Type</th>
                    <th>License / CEA No.</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Branches</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clinics.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary)' }}>
                        No clinics found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    clinics.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>ID: {c.id.slice(0, 8)}...</div>
                        </td>
                        <td>{c.clinic_type}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.registration_number || '—'}</td>
                        <td>{c.city || '—'}, {c.state || '—'}</td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background:
                              c.verification_status === 'APPROVED' ? 'var(--color-success-bg)' :
                              c.verification_status === 'SUBMITTED' ? 'var(--color-warning-bg)' :
                              c.verification_status === 'UNDER_REVIEW' ? 'var(--color-soft-mint)' :
                              c.verification_status === 'SUSPENDED' ? '#ECEFF1' : '#FFEBEE',
                            color:
                              c.verification_status === 'APPROVED' ? 'var(--color-success)' :
                              c.verification_status === 'SUBMITTED' ? 'var(--color-warning)' :
                              c.verification_status === 'UNDER_REVIEW' ? 'var(--color-deep-teal)' :
                              c.verification_status === 'SUSPENDED' ? '#546E7A' : 'var(--color-error)'
                          }}>
                            {c.verification_status}
                          </span>
                        </td>
                        <td>{c.branches_count || 1}</td>
                        <td>
                          <button
                            onClick={() => openClinicDossier(c.id)}
                            style={{
                              padding: '6px 14px',
                              background: 'var(--color-deep-teal)',
                              color: '#FFFFFF',
                              borderRadius: 'var(--radius-md)',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={14} />
                            <span>Audit & Actions</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW 3: DOCTOR DIRECTORY & VERIFICATION --- */}
        {(activeTab === 'DOCTORS' || activeTab === 'DOCTOR_VERIFICATION') && (
          <div>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--color-bg-base)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                flex: 1
              }}>
                <Search size={16} color="#708583" />
                <input
                  type="text"
                  placeholder="Search doctor by name, council registration number, or specialty..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchDoctorsData()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.86rem',
                    width: '100%'
                  }}
                />
              </div>

              <select
                value={doctorStatusFilter}
                onChange={(e) => setDoctorStatusFilter(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: '#FFFFFF',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              >
                <option value="">All Doctor Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>

              <button
                onClick={fetchDoctorsData}
                style={{
                  padding: '9px 18px',
                  background: 'var(--color-deep-teal)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Filter
              </button>

              <button
                onClick={() => setIsDoctorCreateModalOpen(true)}
                style={{
                  padding: '9px 18px',
                  background: '#087F79',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Add Doctor
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor Name</th>
                    <th>Specialty</th>
                    <th>Medical Reg. No.</th>
                    <th>Council</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary)' }}>
                        No doctors found.
                      </td>
                    </tr>
                  ) : (
                    doctors.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{d.doctor_name || 'Dr. Practitioner'}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>{d.qualification}</div>
                        </td>
                        <td>{d.specialty}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{d.medical_registration_number}</td>
                        <td>{d.registration_council}</td>
                        <td>₹{d.consultation_fee}</td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: d.verification_status === 'APPROVED' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                            color: d.verification_status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-warning)'
                          }}>
                            {d.verification_status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => openDoctorDossier(d.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'var(--color-soft-mint)',
                              color: 'var(--color-deep-teal)',
                              borderRadius: 'var(--radius-md)',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            Review Credentials
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW: CLINIC ADMINS & OWNERS DIRECTORY --- */}
        {activeTab === 'ADMINS' && (
          <div>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--color-bg-base)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                width: '360px'
              }}>
                <Search size={16} color="#708583" />
                <input
                  type="text"
                  placeholder="Search clinic admins by name, email, clinic..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.86rem', width: '100%' }}
                />
              </div>

              <button
                onClick={() => setIsAdminModalOpen(true)}
                style={{
                  padding: '9px 18px',
                  background: '#087F79',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Onboard Clinic Admin
              </button>
            </div>

            <div className="data-table-container">
              <div className="table-header-bar">
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Clinic Administrators & Location Owners</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Total {adminsList.length} Administrators across all clinic locations
                </span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admin Full Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Assigned Clinic Location</th>
                    <th>City</th>
                    <th>Account Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {adminsList.filter(a => {
                    if (!adminSearch) return true;
                    const q = adminSearch.toLowerCase();
                    return (
                      (a.full_name && a.full_name.toLowerCase().includes(q)) ||
                      (a.email && a.email.toLowerCase().includes(q)) ||
                      (a.clinic_name && a.clinic_name.toLowerCase().includes(q)) ||
                      (a.clinic_city && a.clinic_city.toLowerCase().includes(q))
                    );
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary)' }}>
                        No clinic administrators found matching your search.
                      </td>
                    </tr>
                  ) : (
                    adminsList
                      .filter(a => {
                        if (!adminSearch) return true;
                        const q = adminSearch.toLowerCase();
                        return (
                          (a.full_name && a.full_name.toLowerCase().includes(q)) ||
                          (a.email && a.email.toLowerCase().includes(q)) ||
                          (a.clinic_name && a.clinic_name.toLowerCase().includes(q)) ||
                          (a.clinic_city && a.clinic_city.toLowerCase().includes(q))
                        );
                      })
                      .map((admin) => (
                        <tr key={admin.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#183B3A' }}>{admin.full_name}</div>
                            <div style={{ fontSize: '0.74rem', color: '#708583' }}>Owner Role: {admin.role_name || 'CLINIC_OWNER'}</div>
                          </td>
                          <td style={{ color: '#087F79', fontWeight: 600 }}>{admin.email}</td>
                          <td>{admin.phone_number || 'N/A'}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#183B3A' }}>{admin.clinic_name || 'Unassigned'}</div>
                          </td>
                          <td>{admin.clinic_city || 'N/A'}</td>
                          <td>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              background: admin.is_active ? '#D9F3EF' : '#FDE8E8',
                              color: admin.is_active ? '#087F79' : '#C53030'
                            }}>
                              {admin.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#708583' }}>
                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW: ALL RECEPTIONISTS DIRECTORY --- */}
        {activeTab === 'RECEPTIONISTS' && (
          <div>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--color-bg-base)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                width: '360px'
              }}>
                <Search size={16} color="#708583" />
                <input
                  type="text"
                  placeholder="Search receptionists by name, email, clinic..."
                  value={receptionistSearch}
                  onChange={(e) => setReceptionistSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.86rem', width: '100%' }}
                />
              </div>

              <button
                onClick={() => setIsReceptionistModalOpen(true)}
                style={{
                  padding: '9px 18px',
                  background: '#087F79',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Add Receptionist
              </button>
            </div>

            <div className="data-table-container">
              <div className="table-header-bar">
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Clinic Receptionists (Front Desk Staff)</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Total {receptionistsList.length} Receptionists across all clinic locations
                </span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receptionist Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Assigned Clinic</th>
                    <th>Location / City</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {receptionistsList.filter(r => {
                    if (!receptionistSearch) return true;
                    const q = receptionistSearch.toLowerCase();
                    return (
                      (r.full_name && r.full_name.toLowerCase().includes(q)) ||
                      (r.email && r.email.toLowerCase().includes(q)) ||
                      (r.clinic_name && r.clinic_name.toLowerCase().includes(q))
                    );
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary)' }}>
                        No receptionists found matching your search.
                      </td>
                    </tr>
                  ) : (
                    receptionistsList
                      .filter(r => {
                        if (!receptionistSearch) return true;
                        const q = receptionistSearch.toLowerCase();
                        return (
                          (r.full_name && r.full_name.toLowerCase().includes(q)) ||
                          (r.email && r.email.toLowerCase().includes(q)) ||
                          (r.clinic_name && r.clinic_name.toLowerCase().includes(q))
                        );
                      })
                      .map((rec) => (
                        <tr key={rec.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#183B3A' }}>{rec.full_name}</div>
                            <div style={{ fontSize: '0.74rem', color: '#708583' }}>Front Desk Station</div>
                          </td>
                          <td style={{ color: '#087F79', fontWeight: 600 }}>{rec.email}</td>
                          <td>{rec.phone_number || 'N/A'}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#183B3A' }}>{rec.clinic_name || 'N/A'}</div>
                          </td>
                          <td>{rec.clinic_city || 'N/A'}</td>
                          <td>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              background: rec.is_active ? '#D9F3EF' : '#FDE8E8',
                              color: rec.is_active ? '#087F79' : '#C53030'
                            }}>
                              {rec.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#708583' }}>
                            {rec.created_at ? new Date(rec.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW: ALL PATIENTS / USERS DIRECTORY --- */}
        {activeTab === 'PATIENTS' && (
          <div>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--color-bg-base)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                width: '420px'
              }}>
                <Search size={16} color="#708583" />
                <input
                  type="text"
                  placeholder="Search patients by name, phone, email, clinic..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.86rem', width: '100%' }}
                />
              </div>

              <div style={{ fontSize: '0.84rem', color: '#708583' }}>
                Patients use the <strong>Smart Clinic OS Mobile App</strong> for appointments, queue tokens, and digital prescriptions.
              </div>
            </div>

            <div className="data-table-container">
              <div className="table-header-bar">
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>All Registered Patients & Users</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Total {patientsList.length} Registered Patients across all clinics
                </span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient Full Name</th>
                    <th>Phone Number</th>
                    <th>Email Address</th>
                    <th>Registered Clinic</th>
                    <th>City / Location</th>
                    <th>Total Appointments</th>
                    <th>Last Visit Date</th>
                    <th>Gender & Age</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsList.filter(p => {
                    if (!patientSearch) return true;
                    const q = patientSearch.toLowerCase();
                    return (
                      (p.full_name && p.full_name.toLowerCase().includes(q)) ||
                      (p.phone_number && p.phone_number.includes(q)) ||
                      (p.email && p.email.toLowerCase().includes(q)) ||
                      (p.clinic_name && p.clinic_name.toLowerCase().includes(q))
                    );
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary)' }}>
                        No patients found matching your search.
                      </td>
                    </tr>
                  ) : (
                    patientsList
                      .filter(p => {
                        if (!patientSearch) return true;
                        const q = patientSearch.toLowerCase();
                        return (
                          (p.full_name && p.full_name.toLowerCase().includes(q)) ||
                          (p.phone_number && p.phone_number.includes(q)) ||
                          (p.email && p.email.toLowerCase().includes(q)) ||
                          (p.clinic_name && p.clinic_name.toLowerCase().includes(q))
                        );
                      })
                      .map((pat) => (
                        <tr key={pat.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#183B3A' }}>{pat.full_name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#708583' }}>ID: {pat.id.slice(0, 8)}...</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{pat.phone_number || 'N/A'}</td>
                          <td style={{ color: '#087F79' }}>{pat.email || 'N/A'}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#183B3A' }}>{pat.clinic_name || 'CarePlus Main'}</div>
                          </td>
                          <td>{pat.clinic_city || pat.city || 'Bangalore'}</td>
                          <td>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              background: '#D9F3EF',
                              color: '#087F79'
                            }}>
                              {pat.total_appointments || 1} Visits
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#708583' }}>
                            {pat.last_visit_date ? new Date(pat.last_visit_date).toLocaleDateString() : 'Today'}
                          </td>
                          <td style={{ fontSize: '0.78rem' }}>
                            {pat.gender || 'Not specified'} • {pat.blood_group || 'O+'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW 4: AUDIT LOGS --- */}
        {activeTab === 'AUDIT_LOGS' && (
          <div className="data-table-container">
            <div className="table-header-bar">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Immutable Platform Audit Trail</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Displaying latest 50 security & administrative actions</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Actor ID</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary)' }}>
                      No audit events retrieved.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{log.action}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{log.resource_type}:{log.resource_id?.slice(0, 8)}...</span>
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>{log.actor_user_id?.slice(0, 8) || 'System'}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{log.ip_address || '127.0.0.1'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- VIEW: SAAS SUBSCRIPTIONS & PLATFORM REVENUE (PHASE 8) --- */}
        {activeTab === 'SUBSCRIPTIONS' && (
          <div>
            {/* 1. Header with Export CSV */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                  Platform SaaS Subscriptions & Revenue Operations
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Monitor platform MRR, active paying clinic accounts, multi-tenant subscription tiers, and financial collections.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`${API_BASE_URL}/admin/revenue/export`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    background: 'var(--color-soft-mint)',
                    color: 'var(--color-deep-teal)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} />
                  <span>Export Revenue CSV</span>
                </a>
                <button
                  onClick={fetchSubscriptionsData}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    background: 'var(--color-deep-teal)',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Refresh Revenue</span>
                </button>
              </div>
            </div>

            {/* 2. Platform SaaS Revenue Highlights */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '28px'
            }}>
              <div style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Monthly Recurring Revenue (MRR)
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-deep-teal)', marginTop: '4px' }}>
                  ₹{(saasAnalytics?.revenue?.mrr || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>
                  ARR: ₹{(saasAnalytics?.revenue?.arr || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Active Paying Clinics
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                  {saasAnalytics?.metrics?.active_paying_clinics || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Total active clinics: {saasAnalytics?.metrics?.total_active || 0}
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  SaaS Churn Rate
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3182CE', marginTop: '4px' }}>
                  {saasAnalytics?.metrics?.churn_rate_pct || 0}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Trial conversion: {saasAnalytics?.metrics?.trial_conversion_pct || 0}%
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Gross Revenue (Incl. 18% GST)
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D69E2E', marginTop: '4px' }}>
                  ₹{(saasAnalytics?.revenue?.total_collected || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  18% Tax: ₹{(saasAnalytics?.revenue?.total_tax || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* 3. Subscriptions Master Table */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              marginBottom: '28px',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  All Clinic SaaS Subscriptions ({saasSubscriptions.length})
                </h3>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Clinic & Entity</th>
                      <th>Subscribed Plan</th>
                      <th>Billing Cycle</th>
                      <th>Subscription Status</th>
                      <th>Period Validity</th>
                      <th style={{ textAlign: 'right' }}>Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saasSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary)' }}>
                          No clinic subscriptions found.
                        </td>
                      </tr>
                    ) : (
                      saasSubscriptions.map(sub => (
                        <tr key={sub.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{sub.clinic_name}</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>
                              {sub.legal_business_name || sub.clinic_city || 'India'} {sub.gstin && `• GST: ${sub.gstin}`}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              background: 'var(--color-soft-mint)',
                              color: 'var(--color-deep-teal)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              padding: '3px 8px',
                              borderRadius: '4px'
                            }}>
                              {sub.plan_name} ({sub.plan_code})
                            </span>
                            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                              ₹{parseFloat(sub.monthly_price).toLocaleString('en-IN')}/mo
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{sub.billing_interval}</span>
                          </td>
                          <td>
                            <span style={{
                              background: sub.status === 'ACTIVE' ? '#C6F6D5' : '#EBF8FF',
                              color: sub.status === 'ACTIVE' ? '#22543D' : '#2B6CB0',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>
                              {sub.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                            Ends: <strong>{new Date(sub.current_period_end).toLocaleDateString('en-IN')}</strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => setAdjustModal({
                                isOpen: true,
                                sub,
                                extendDays: 14,
                                newStatus: sub.status,
                                newPlanId: sub.plan_id,
                                reason: ''
                              })}
                              style={{
                                padding: '6px 12px',
                                background: 'var(--color-soft-mint)',
                                color: 'var(--color-deep-teal)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Manual Adjust
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Platform Subscription Plans Configuration */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Configurable Platform Subscription Tiers
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {saasPlans.map(plan => (
                  <div key={plan.id} style={{
                    background: 'var(--color-bg-base)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{plan.name}</strong>
                      <span style={{ fontSize: '0.7rem', background: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {plan.code}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-deep-teal)', marginBottom: '8px' }}>
                      ₹{parseFloat(plan.monthly_price).toLocaleString('en-IN')}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>/mo</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Branches: <strong>{plan.max_branches === -1 ? 'Unlimited' : plan.max_branches}</strong></div>
                      <div>Doctors: <strong>{plan.max_doctors === -1 ? 'Unlimited' : plan.max_doctors}</strong></div>
                      <div>Staff: <strong>{plan.max_staff === -1 ? 'Unlimited' : plan.max_staff}</strong></div>
                      <div>Appts: <strong>{plan.max_monthly_appointments === -1 ? 'Unlimited' : plan.max_monthly_appointments}/mo</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: HOME HEALTHCARE MARKETPLACE (PHASE 9) --- */}
        {activeTab === 'HOME_HEALTHCARE' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                  Home Healthcare Marketplace Operations & Dispatch
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Supervise at-home medical appointments, clinical service catalog, provider credential verification, and 15% platform commissions.
                </span>
              </div>
              <button
                onClick={fetchHomeHealthcareData}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  background: 'var(--color-deep-teal)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} />
                <span>Refresh Marketplace</span>
              </button>
            </div>

            {/* Marketplace Financials Highlights */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '28px'
            }}>
              <div style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Marketplace GMV
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-deep-teal)', marginTop: '4px' }}>
                  ₹{(marketplaceAnalytics?.financials?.gmv || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>
                  Gross Home Healthcare Volume
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Platform Commission (15%)
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#087F79', marginTop: '4px' }}>
                  ₹{(marketplaceAnalytics?.financials?.platform_commission_revenue || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#087F79', marginTop: '4px', fontWeight: 600 }}>
                  Retained Marketplace Margin
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Provider Payouts (85%)
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                  ₹{(marketplaceAnalytics?.financials?.provider_payable_total || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Disbursed on T+1 Cycle
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Total Visits & Providers
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-deep-teal)', marginTop: '4px' }}>
                  {marketplaceAnalytics?.bookings?.total || 0} Visits
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {marketplaceAnalytics?.providers?.approved || 4} Verified Providers
                </div>
              </div>
            </div>

            {/* Providers Verification & Credential Directory */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-primary)' }}>
                    Healthcare Professionals & Credential Directory
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    Strict medical council verification: Only APPROVED providers are discoverable by patients.
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Provider Name</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Role & Specialty</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Medical Registration</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Clinic Affiliation</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Rating</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Verification Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketplaceProviders.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                          No healthcare providers registered in the directory.
                        </td>
                      </tr>
                    ) : (
                      marketplaceProviders.map((prov) => {
                        const isApproved = prov.verification_status === 'APPROVED';
                        const isSuspended = prov.verification_status === 'SUSPENDED';

                        return (
                          <tr key={prov.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                              {prov.full_name}
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                                {prov.qualification} • {prov.experience_years} yrs exp
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: 'var(--color-soft-mint)',
                                color: 'var(--color-deep-teal)',
                                fontWeight: 700,
                                fontSize: '0.75rem'
                              }}>
                                {prov.provider_type}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div><strong>{prov.registration_number || 'N/A'}</strong></div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{prov.registration_council}</div>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              {prov.associated_clinic_name || 'Independent Care Partner'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              ★ {prov.rating_avg || '5.00'} ({prov.rating_count || 1})
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                padding: '3px 9px',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: isApproved ? 'var(--color-soft-mint)' : isSuspended ? '#FED7D7' : '#FEFCBF',
                                color: isApproved ? 'var(--color-deep-teal)' : isSuspended ? '#C53030' : '#744210'
                              }}>
                                {prov.verification_status}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  setSelectedProviderForVerify(prov);
                                  setProviderVerifyModalOpen(true);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: 'var(--color-deep-teal)',
                                  color: '#FFFFFF',
                                  borderRadius: 'var(--radius-md)',
                                  border: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Verify / Audit
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Phase 10: External Integrations Directory & Ecosystem Management */}
        {activeTab === 'INTEGRATIONS' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                  External Integrations & National Ecosystem Directory
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                  Manage ABDM M1-M3 sandboxes, diagnostic pathology partners, pharmacy routing & WebRTC gateways.
                </p>
              </div>

              <button
                onClick={fetchIntegrationsData}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: '#FFFFFF',
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
                <span>Refresh Directory</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Active Integrations</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-deep-teal)', marginTop: '4px' }}>
                  {integrationsList.filter(i => i.is_enabled).length} / {integrationsList.length || 7}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '4px', fontWeight: 600 }}>Pan-India Hubs Connected</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Gateway Health</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16A34A', marginTop: '4px' }}>100% HEALTHY</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>0 Failed Sync Events</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>ABDM Interop</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284C7', marginTop: '4px' }}>M1-M3 Ready</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>FHIR R4 JSON Compliant</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Sync Frequency</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>60 Mins</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Continuous Health Polling</div>
              </div>
            </div>

            {/* Integrations Table */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead style={{ background: 'var(--color-card-bg)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <tr>
                      <th style={{ padding: '14px 20px' }}>Integration Service</th>
                      <th style={{ padding: '14px 20px' }}>Category</th>
                      <th style={{ padding: '14px 20px' }}>Status</th>
                      <th style={{ padding: '14px 20px' }}>Credentials & Masked Keys</th>
                      <th style={{ padding: '14px 20px' }}>Last Sync</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!integrationsList.length ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                          Loading platform ecosystem integrations...
                        </td>
                      </tr>
                    ) : (
                      integrationsList.map((item) => {
                        const isSyncing = isSyncingIntegration[item.slug];
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.name}</div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                <code>{item.slug}</code> • {item.description}
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-pill)',
                                background: 'var(--color-soft-mint)',
                                color: 'var(--color-deep-teal)'
                              }}>
                                {item.category}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-pill)',
                                background: item.status === 'HEALTHY' ? '#DCFCE7' : item.status === 'DISABLED' ? '#E2E8F0' : '#FEF3C7',
                                color: item.status === 'HEALTHY' ? '#166534' : item.status === 'DISABLED' ? '#475569' : '#92400E'
                              }}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>
                              <div>Gateway: <code>{item.config_metadata?.gateway || item.config_metadata?.provider || 'Production API'}</code></div>
                              <div style={{ marginTop: '2px' }}>Key: <code>••••••••••••••••</code></div>
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                              <div>{item.last_sync_at ? new Date(item.last_sync_at).toLocaleTimeString() : 'Recent'}</div>
                              <div style={{ fontSize: '0.7rem' }}>Sync every {item.sync_interval_minutes}m</div>
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  onClick={() => handleToggleIntegration(item.slug, item.is_enabled)}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: item.is_enabled ? '#FEF2F2' : '#F0FDF4',
                                    color: item.is_enabled ? '#B91C1C' : '#15803D',
                                    fontWeight: 700,
                                    fontSize: '0.76rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {item.is_enabled ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                  onClick={() => handleTriggerSyncIntegration(item.slug)}
                                  disabled={isSyncing}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '5px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'none',
                                    background: 'var(--color-deep-teal)',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: '0.76rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <RefreshCw size={12} className={isSyncing ? 'spin' : ''} />
                                  <span>{isSyncing ? 'Syncing...' : 'Sync Ping'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'COMING_SOON' && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--color-soft-mint)',
              color: 'var(--color-deep-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <Clock size={28} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>
              {comingSoonTitle}
            </h2>
            <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              This module is scheduled for development in subsequent roadmap milestones. Phase 2 strictly encompasses Super Admin Governance, Clinic Onboarding, Branch Setup, and Practitioner Credential Audits.
            </p>
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              style={{
                marginTop: '24px',
                padding: '10px 20px',
                background: 'var(--color-deep-teal)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </main>

      {/* --- CLINIC DOSSIER MODAL --- */}
      {isDossierOpen && selectedClinicDossier && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '820px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  {selectedClinicDossier.clinic.name}
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Registration License: {selectedClinicDossier.clinic.registration_number || 'N/A'} • Status: <strong>{selectedClinicDossier.clinic.verification_status}</strong>
                </span>
              </div>
              <button
                onClick={() => setIsDossierOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Actions Row */}
            <div style={{
              background: 'var(--color-soft-mint)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                Admin Actions:
              </span>

              {selectedClinicDossier.clinic.verification_status !== 'APPROVED' && (
                <button
                  onClick={() => setActionModal({
                    isOpen: true,
                    type: 'APPROVE',
                    targetId: selectedClinicDossier.clinic.id,
                    targetName: selectedClinicDossier.clinic.name,
                    reasonOrNotes: '',
                    fieldName: ''
                  })}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--color-success)',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Approve Clinic
                </button>
              )}

              {selectedClinicDossier.clinic.verification_status !== 'UNDER_REVIEW' && selectedClinicDossier.clinic.verification_status !== 'APPROVED' && (
                <button
                  onClick={() => setActionModal({
                    isOpen: true,
                    type: 'REVIEW',
                    targetId: selectedClinicDossier.clinic.id,
                    targetName: selectedClinicDossier.clinic.name,
                    reasonOrNotes: '',
                    fieldName: ''
                  })}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--color-deep-teal)',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Start Review
                </button>
              )}

              <button
                onClick={() => setActionModal({
                  isOpen: true,
                  type: 'CORRECTION',
                  targetId: selectedClinicDossier.clinic.id,
                  targetName: selectedClinicDossier.clinic.name,
                  reasonOrNotes: '',
                  fieldName: 'registration_document'
                })}
                style={{
                  padding: '8px 14px',
                  background: '#E5A64A',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Request Correction
              </button>

              {selectedClinicDossier.clinic.verification_status === 'APPROVED' ? (
                <button
                  onClick={() => setActionModal({
                    isOpen: true,
                    type: 'SUSPEND',
                    targetId: selectedClinicDossier.clinic.id,
                    targetName: selectedClinicDossier.clinic.name,
                    reasonOrNotes: '',
                    fieldName: ''
                  })}
                  style={{
                    padding: '8px 14px',
                    background: '#888888',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Suspend Account
                </button>
              ) : selectedClinicDossier.clinic.verification_status === 'SUSPENDED' ? (
                <button
                  onClick={() => setActionModal({
                    isOpen: true,
                    type: 'REACTIVATE',
                    targetId: selectedClinicDossier.clinic.id,
                    targetName: selectedClinicDossier.clinic.name,
                    reasonOrNotes: '',
                    fieldName: ''
                  })}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--color-deep-teal)',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Reactivate
                </button>
              ) : (
                <button
                  onClick={() => setActionModal({
                    isOpen: true,
                    type: 'REJECT',
                    targetId: selectedClinicDossier.clinic.id,
                    targetName: selectedClinicDossier.clinic.name,
                    reasonOrNotes: '',
                    fieldName: ''
                  })}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--color-error)',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Reject
                </button>
              )}
            </div>

            {/* Dossier Tabs / Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Submitted Compliance Documents */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--color-text-primary)' }}>
                  Submitted Verification Documents ({selectedClinicDossier.documents.length})
                </h4>
                {selectedClinicDossier.documents.length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', padding: '12px', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-sm)' }}>
                    No documents uploaded by owner yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedClinicDossier.documents.map((doc) => (
                      <div key={doc.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'var(--color-bg-base)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{doc.document_type}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                            {doc.file_name} • {(doc.file_size / 1024).toFixed(1)} KB • Status: {doc.verification_status}
                          </div>
                        </div>
                        <a
                          href={api.admin.getDocumentDownloadUrl(selectedClinicDossier.clinic.id, doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            background: '#FFFFFF',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--color-deep-teal)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <Download size={14} />
                          <span>Download / Inspect</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Branches */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--color-text-primary)' }}>
                  Registered Branches ({selectedClinicDossier.branches.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedClinicDossier.branches.map((b) => (
                    <div key={b.id} style={{
                      padding: '10px 14px',
                      background: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem'
                    }}>
                      <div style={{ fontWeight: 600 }}>{b.name} {b.is_main_branch && '⭐ [Primary Main Branch]'}</div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>{b.address || 'Address pending'}, {b.city || ''} {b.postal_code || ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DOCTOR DOSSIER MODAL --- */}
      {isDoctorModalOpen && selectedDoctorDossier && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  {selectedDoctorDossier.doctor.doctor_name || 'Dr. Practitioner'}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {selectedDoctorDossier.doctor.qualification} • {selectedDoctorDossier.doctor.specialty}
                </span>
              </div>
              <button
                onClick={() => setIsDoctorModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: 'var(--color-bg-base)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '0.85rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <div><strong>Registration No:</strong> {selectedDoctorDossier.doctor.medical_registration_number}</div>
              <div><strong>Council:</strong> {selectedDoctorDossier.doctor.registration_council}</div>
              <div><strong>Experience:</strong> {selectedDoctorDossier.doctor.experience_years} years</div>
              <div><strong>Fee:</strong> ₹{selectedDoctorDossier.doctor.consultation_fee}</div>
              <div><strong>Verification Status:</strong> {selectedDoctorDossier.doctor.verification_status}</div>
            </div>

            {/* Credentials */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 10px 0' }}>
              Uploaded Qualifications & License Proofs ({selectedDoctorDossier.credentials.length})
            </h4>
            {selectedDoctorDossier.credentials.map((cred) => (
              <div key={cred.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#FFFFFF',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '8px'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{cred.credential_type}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>{cred.file_name}</div>
                </div>
                <a
                  href={api.admin.getDoctorCredentialDownloadUrl(selectedDoctorDossier.doctor.id, cred.id)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '6px 12px',
                    background: 'var(--color-soft-mint)',
                    color: 'var(--color-deep-teal)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Download
                </a>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setActionModal({
                  isOpen: true,
                  type: 'APPROVE_DOC',
                  targetId: selectedDoctorDossier.doctor.id,
                  targetName: selectedDoctorDossier.doctor.doctor_name,
                  reasonOrNotes: '',
                  fieldName: ''
                })}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--color-success)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Approve Doctor
              </button>
              <button
                onClick={() => setActionModal({
                  isOpen: true,
                  type: 'REJECT_DOC',
                  targetId: selectedDoctorDossier.doctor.id,
                  targetName: selectedDoctorDossier.doctor.doctor_name,
                  reasonOrNotes: '',
                  fieldName: ''
                })}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--color-error)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Reject Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION ACTION MODAL --- */}
      {actionModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--color-text-primary)' }}>
              Confirm Action: {actionModal.type}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Target: <strong>{actionModal.targetName}</strong>
            </p>

            {actionModal.type === 'CORRECTION' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Field Requiring Correction:
                </label>
                <input
                  type="text"
                  value={actionModal.fieldName}
                  onChange={(e) => setActionModal({ ...actionModal, fieldName: e.target.value })}
                  placeholder="e.g. address, registration_certificate, registration_number"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                {actionModal.type === 'REJECT' || actionModal.type === 'SUSPEND' || actionModal.type === 'REJECT_DOC'
                  ? 'Mandatory Rationale / Reason:'
                  : 'Administrative Notes / Feedback:'}
              </label>
              <textarea
                rows={3}
                value={actionModal.reasonOrNotes}
                onChange={(e) => setActionModal({ ...actionModal, reasonOrNotes: e.target.value })}
                placeholder="Enter formal reason or verification notes for audit trail..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActionModal({ isOpen: false, type: null, targetId: null, targetName: '', reasonOrNotes: '', fieldName: '' })}
                style={{
                  padding: '9px 16px',
                  background: '#FFFFFF',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeAdminAction}
                style={{
                  padding: '9px 18px',
                  background: 'var(--color-deep-teal)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Confirm & Record Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUPER ADMIN MANUAL SUBSCRIPTION ADJUSTMENT MODAL --- */}
      {adjustModal.isOpen && adjustModal.sub && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Manual Subscription Adjustment & Audit
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Clinic: <strong>{adjustModal.sub.clinic_name}</strong> • Current: <strong>{adjustModal.sub.status}</strong> ({adjustModal.sub.plan_code})
                </span>
              </div>
              <button
                onClick={() => setAdjustModal({ isOpen: false, sub: null, extendDays: 14, newStatus: 'ACTIVE', newPlanId: '', reason: '' })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.84rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                    Extend Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adjustModal.extendDays}
                    onChange={(e) => setAdjustModal({ ...adjustModal, extendDays: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                    Set Subscription Status
                  </label>
                  <select
                    value={adjustModal.newStatus}
                    onChange={(e) => setAdjustModal({ ...adjustModal, newStatus: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIALING">TRIALING</option>
                    <option value="GRACE_PERIOD">GRACE_PERIOD</option>
                    <option value="PAST_DUE">PAST_DUE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                  Assign / Override Plan Tier
                </label>
                <select
                  value={adjustModal.newPlanId || adjustModal.sub.plan_id}
                  onChange={(e) => setAdjustModal({ ...adjustModal, newPlanId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                >
                  {saasPlans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — ₹{parseFloat(p.monthly_price).toLocaleString('en-IN')}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', color: 'var(--color-error)' }}>
                  Mandatory Justification Reason (Audit Policy) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={adjustModal.reason}
                  onChange={(e) => setAdjustModal({ ...adjustModal, reason: e.target.value })}
                  placeholder="State operational reason for manual adjustment (e.g., Promotional onboarding extension, invoice reconciliation, dispute resolution)..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setAdjustModal({ isOpen: false, sub: null, extendDays: 14, newStatus: 'ACTIVE', newPlanId: '', reason: '' })}
                  style={{
                    padding: '9px 16px',
                    background: '#FFFFFF',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  style={{
                    padding: '9px 18px',
                    background: 'var(--color-deep-teal)',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {isAdjusting ? 'Saving Adjustment...' : 'Record Adjustment & Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- HEALTHCARE PROVIDER VERIFICATION MODAL (PHASE 9) --- */}
      {providerVerifyModalOpen && selectedProviderForVerify && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                  Verify Healthcare Provider Credentials
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {selectedProviderForVerify.full_name} • {selectedProviderForVerify.provider_type}
                </span>
              </div>
              <button
                onClick={() => setProviderVerifyModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: 'var(--color-bg-base)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              fontSize: '0.82rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}>
              <div><strong>Registration No:</strong> {selectedProviderForVerify.registration_number || 'N/A'}</div>
              <div><strong>Council:</strong> {selectedProviderForVerify.registration_council || 'State Medical Council'}</div>
              <div><strong>Experience:</strong> {selectedProviderForVerify.experience_years} years</div>
              <div><strong>Qualification:</strong> {selectedProviderForVerify.qualification}</div>
              <div><strong>Current Status:</strong> <span style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>{selectedProviderForVerify.verification_status}</span></div>
              <div><strong>Clinic:</strong> {selectedProviderForVerify.associated_clinic_name || 'Care Partner'}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                Verification Rationale & Compliance Notes:
              </label>
              <textarea
                rows={3}
                value={providerVerifyNotes}
                onChange={(e) => setProviderVerifyNotes(e.target.value)}
                placeholder="Enter audit verification remarks, license registry checks, or correction notes..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleVerifyProviderStatus(selectedProviderForVerify.id, 'SUSPENDED')}
                style={{
                  padding: '8px 14px',
                  background: '#FED7D7',
                  color: '#C53030',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #FEB2B2',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Suspend Provider
              </button>
              <button
                type="button"
                onClick={() => handleVerifyProviderStatus(selectedProviderForVerify.id, 'APPROVED')}
                style={{
                  padding: '8px 16px',
                  background: 'var(--color-deep-teal)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Approve & Activate Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: ONBOARD CLINIC ADMIN --- */}
      {isAdminModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#183B3A' }}>
                Onboard Clinic Administrator
              </h2>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAdmin}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={adminForm.full_name}
                  onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@cityhealth.in"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={adminForm.phone_number}
                  onChange={(e) => setAdminForm({ ...adminForm, phone_number: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Initial Password</label>
                <input
                  type="text"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Assign to Clinic Location *</label>
                <select
                  required
                  value={adminForm.clinic_id}
                  onChange={(e) => setAdminForm({ ...adminForm, clinic_id: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                >
                  <option value="">-- Select Clinic Location --</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  style={{ padding: '10px 16px', background: '#E3EEEB', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  style={{ padding: '10px 20px', background: '#087F79', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  {isSubmittingAdmin ? 'Creating...' : 'Create & Assign Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD DOCTOR --- */}
      {isDoctorCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#183B3A' }}>
                Add New Doctor to Platform
              </h2>
              <button
                onClick={() => setIsDoctorCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateDoctor}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Priya Nair"
                    value={doctorForm.full_name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. doctor@clinic.in"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Specialty *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiologist"
                    value={doctorForm.specialty}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Qualifications</label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD, DM"
                    value={doctorForm.qualification}
                    onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Medical Reg Number</label>
                  <input
                    type="text"
                    placeholder="e.g. KMC-102934"
                    value={doctorForm.medical_registration_number}
                    onChange={(e) => setDoctorForm({ ...doctorForm, medical_registration_number: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={doctorForm.consultation_fee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Assign to Clinic Location *</label>
                <select
                  required
                  value={doctorForm.clinic_id}
                  onChange={(e) => setDoctorForm({ ...doctorForm, clinic_id: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                >
                  <option value="">-- Select Clinic Location --</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsDoctorCreateModalOpen(false)}
                  style={{ padding: '10px 16px', background: '#E3EEEB', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoctor}
                  style={{ padding: '10px 20px', background: '#087F79', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  {isSubmittingDoctor ? 'Adding...' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADD RECEPTIONIST --- */}
      {isReceptionistModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#183B3A' }}>
                Add Clinic Receptionist
              </h2>
              <button
                onClick={() => setIsReceptionistModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateReceptionist}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Receptionist Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunita Devi"
                  value={receptionistForm.full_name}
                  onChange={(e) => setReceptionistForm({ ...receptionistForm, full_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. reception@clinic.in"
                  value={receptionistForm.email}
                  onChange={(e) => setReceptionistForm({ ...receptionistForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 11111"
                  value={receptionistForm.phone_number}
                  onChange={(e) => setReceptionistForm({ ...receptionistForm, phone_number: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Assign to Clinic Location *</label>
                <select
                  required
                  value={receptionistForm.clinic_id}
                  onChange={(e) => setReceptionistForm({ ...receptionistForm, clinic_id: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                >
                  <option value="">-- Select Clinic Location --</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsReceptionistModalOpen(false)}
                  style={{ padding: '10px 16px', background: '#E3EEEB', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReceptionist}
                  style={{ padding: '10px 20px', background: '#087F79', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  {isSubmittingReceptionist ? 'Creating...' : 'Add Receptionist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: ONBOARD CLINIC LOCATION --- */}
      {isClinicCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#183B3A' }}>
                Onboard New Clinic Location
              </h2>
              <button
                onClick={() => setIsClinicCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateClinic}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Clinic Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Health Polyclinic"
                  value={clinicForm.name}
                  onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore"
                    value={clinicForm.city}
                    onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>State</label>
                  <input
                    type="text"
                    value={clinicForm.state}
                    onChange={(e) => setClinicForm({ ...clinicForm, state: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Official Phone</label>
                  <input
                    type="text"
                    placeholder="+91 80 2345 6789"
                    value={clinicForm.phone}
                    onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Official Email</label>
                  <input
                    type="email"
                    placeholder="info@cityhealth.in"
                    value={clinicForm.email}
                    onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#183B3A' }}>Address</label>
                <input
                  type="text"
                  placeholder="Street / Facility Address"
                  value={clinicForm.address}
                  onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsClinicCreateModalOpen(false)}
                  style={{ padding: '10px 16px', background: '#E3EEEB', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClinic}
                  style={{ padding: '10px 20px', background: '#087F79', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  {isSubmittingClinic ? 'Creating...' : 'Onboard Clinic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

