'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Building2,
  Users,
  CreditCard,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Edit3,
  X,
  Stethoscope,
  Zap,
  Navigation,
  Bell,
  ShieldCheck,
  Activity,
  FileText,
  Download,
  Check,
  ExternalLink,
  ChevronRight,
  Shield,
  Search
} from 'lucide-react';
import { tokenStorage, API_BASE_URL } from '../services/api';

export default function OwnerDashboardLive() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Clinic Context
  const [clinicId, setClinicId] = useState('99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc');
  const [ownerToken, setOwnerToken] = useState(null);

  // Data
  const [ownerData, setOwnerData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Location-scoped Staff & Patients (Strict Isolation)
  const [locationReceptionists, setLocationReceptionists] = useState([]);
  const [receptionistSearch, setReceptionistSearch] = useState('');
  const [showAddReceptionistModal, setShowAddReceptionistModal] = useState(false);
  const [addReceptionistForm, setAddReceptionistForm] = useState({ full_name: '', email: '', phone_number: '', password: 'Password@123' });
  const [isAddingReceptionist, setIsAddingReceptionist] = useState(false);

  const [locationPatients, setLocationPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');

  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [addDoctorForm, setAddDoctorForm] = useState({ full_name: '', email: '', phone_number: '', password: 'Password@123', specialty: 'General Physician', qualification: 'MBBS, MD', medical_registration_number: '', consultation_fee: 500, branch_id: '' });
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);

  // Active sub-tab in Owner portal: 'OVERVIEW' | 'BRANCHES' | 'DOCTORS' | 'SCHEDULES'
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  // Phase 7: Smart Automation & Traffic Settings
  const [automationSettings, setAutomationSettings] = useState({
    reminders_enabled: true,
    reminder_intervals_hours: [24, 2, 0],
    queue_alerts_enabled: true,
    turn_approaching_threshold: 2,
    delay_alerts_enabled: true,
    delay_threshold_minutes: 15,
    traffic_departure_enabled: true,
    default_arrival_buffer_minutes: 10
  });
  const [automationLogs, setAutomationLogs] = useState([]);
  const [isSavingAutomation, setIsSavingAutomation] = useState(false);

  // Phase 8: SaaS Subscriptions, Billing & Analytics
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);

  // Phase 9: Home Care Dispatch States
  const [homeCareDispatches, setHomeCareDispatches] = useState([]);
  const [homeCareProviders, setHomeCareProviders] = useState([]);
  const [billingProfile, setBillingProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [operationalAnalytics, setOperationalAnalytics] = useState(null);
  const [isYearlyBilling, setIsYearlyBilling] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, plan: null, order: null });
  const [isPaying, setIsPaying] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    legal_business_name: 'CarePlus Family Clinic LLP',
    gstin: '29AABCC1234D1Z5',
    pan: 'AABCC1234D',
    billing_address: '104 1st Cross, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560038',
    contact_email: 'billing@careplus.in',
    contact_phone: '+919876543210',
    place_of_supply: 'Karnataka (29)'
  });

  // Phase 10: Advanced Clinic Intelligence & Demand Forecasting
  const [demandForecast, setDemandForecast] = useState(null);
  const [peakHeatmap, setPeakHeatmap] = useState(null);
  const [noShowData, setNoShowData] = useState(null);
  const [isLoadingIntelligence, setIsLoadingIntelligence] = useState(false);

  // Branch creation modal
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    is_main_branch: false
  });

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDoctorForSchedule, setSelectedDoctorForSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: 1, // Monday
    start_time: '09:00',
    end_time: '13:00',
    is_available: true
  });

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const savedToken = typeof window !== 'undefined' ? (localStorage.getItem('scos_auth_token') || tokenStorage.get()) : null;
        const savedClinicId = typeof window !== 'undefined' ? localStorage.getItem('scos_clinic_id') : null;

        if (savedToken && savedClinicId) {
          tokenStorage.set(savedToken);
          setOwnerToken(savedToken);
          setClinicId(savedClinicId);
          await loadOwnerData(savedToken, savedClinicId);
        } else {
          const loginRes = await fetch(`${API_BASE_URL}/auth/login-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: 'owner@careplus.in', password: 'Password@123' })
          });
          const loginData = await loginRes.json();
          if (loginData.success) {
            const token = loginData.data?.token || loginData.data?.access_token;
            tokenStorage.set(token);
            setOwnerToken(token);
            const cid = loginData.data.memberships?.[0]?.clinic_id || clinicId;
            setClinicId(cid);
            await loadOwnerData(token, cid);
          } else {
            setError(loginData.error?.message || 'Owner login failed.');
          }
        }
      } catch (err) {
        setError('Failed to connect to Clinic Owner portal: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadOwnerData(token = ownerToken, cid = clinicId) {
    if (!token) return;
    setRefreshing(true);
    try {
      // 1. Dashboard
      const dashRes = await fetch(`${API_BASE_URL}/clinic/dashboard/owner`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
      });
      const dashData = await dashRes.json();
      if (dashData.success) {
        setOwnerData(dashData.data);
      }

      // 2. Branches
      const branchRes = await fetch(`${API_BASE_URL}/clinic/branches`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
      });
      const branchData = await branchRes.json();
      if (branchData.success) {
        setBranches(branchData.data.branches || []);
      }

      // 3. Doctors (strictly scoped to this location cid)
      const docsRes = await fetch(`${API_BASE_URL}/clinic/doctors`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
      });
      const docsData = await docsRes.json();
      if (docsData.success) {
        setDoctors(docsData.data.doctors || []);
      }

      // 3b. Receptionists (strictly scoped to this location cid)
      const recRes = await fetch(`${API_BASE_URL}/clinic/receptionists`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
      });
      const recData = await recRes.json();
      if (recData.success) {
        setLocationReceptionists(recData.data.receptionists || []);
      }

      // 3c. Patients (strictly scoped to this location cid)
      const patRes = await fetch(`${API_BASE_URL}/clinic/patients-list`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
      });
      const patData = await patRes.json();
      if (patData.success) {
        setLocationPatients(patData.data.patients || []);
      }

      // 4. Phase 7: Automation & Traffic Settings
      await loadAutomationData(token, cid);

      // 5. Phase 8: SaaS Subscription & Billing Data
      await loadBillingData(token, cid);

      // 6. Phase 9: Home Care Dispatch Data
      await loadHomeCareData(token, cid);

      // 7. Phase 10: Advanced Intelligence & Demand Forecasting
      await fetchIntelligenceData(token, cid);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleAddDoctorToLocation(e) {
    if (e) e.preventDefault();
    if (!addDoctorForm.full_name || !addDoctorForm.email || !addDoctorForm.specialty) {
      alert('Please fill in Doctor Name, Email, and Specialty.');
      return;
    }
    setIsAddingDoctor(true);
    try {
      const res = await fetch(`${API_BASE_URL}/clinic/doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`,
          'X-Clinic-ID': clinicId
        },
        body: JSON.stringify(addDoctorForm)
      });
      const data = await res.json();
      if (data.success) {
        alert('Doctor added to this clinic location successfully.');
        setShowAddDoctorModal(false);
        setAddDoctorForm({ full_name: '', email: '', phone_number: '', password: 'Password@123', specialty: 'General Physician', qualification: 'MBBS, MD', medical_registration_number: '', consultation_fee: 500, branch_id: '' });
        await loadOwnerData();
      } else {
        alert(data.error?.message || 'Failed to add doctor.');
      }
    } catch (err) {
      alert('Add doctor error: ' + err.message);
    } finally {
      setIsAddingDoctor(false);
    }
  }

  async function handleAddReceptionistToLocation(e) {
    if (e) e.preventDefault();
    if (!addReceptionistForm.full_name || !addReceptionistForm.email) {
      alert('Please fill in Receptionist Name and Email.');
      return;
    }
    setIsAddingReceptionist(true);
    try {
      const res = await fetch(`${API_BASE_URL}/clinic/receptionists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`,
          'X-Clinic-ID': clinicId
        },
        body: JSON.stringify(addReceptionistForm)
      });
      const data = await res.json();
      if (data.success) {
        alert('Receptionist added to this clinic location successfully.');
        setShowAddReceptionistModal(false);
        setAddReceptionistForm({ full_name: '', email: '', phone_number: '', password: 'Password@123' });
        await loadOwnerData();
      } else {
        alert(data.error?.message || 'Failed to add receptionist.');
      }
    } catch (err) {
      alert('Add receptionist error: ' + err.message);
    } finally {
      setIsAddingReceptionist(false);
    }
  }

  async function fetchIntelligenceData(token = ownerToken, cid = clinicId) {
    if (!token || !cid) return;
    setIsLoadingIntelligence(true);
    try {
      const [foreRes, heatRes, nsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/intelligence/forecast/${cid}?days=7`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/intelligence/heatmap/${cid}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/intelligence/no-show/${cid}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const [fData, hData, nsData] = await Promise.all([foreRes.json(), heatRes.json(), nsRes.json()]);
      if (fData.success) setDemandForecast(fData.data);
      if (hData.success) setPeakHeatmap(hData.data);
      if (nsData.success) setNoShowData(nsData.data);
    } catch (e) {
      console.warn('Could not load clinic intelligence data', e);
    } finally {
      setIsLoadingIntelligence(false);
    }
  }

  async function loadHomeCareData(token = ownerToken, cid = clinicId) {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/marketplace/clinic/overview`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setHomeCareDispatches(data.data.bookings || []);
        setHomeCareProviders(data.data.providers || []);
      }
    } catch (e) {
      console.warn('Could not load clinic home care dispatch data', e);
    }
  }

  async function loadAutomationData(token = ownerToken, cid = clinicId) {
    if (!token) return;
    try {
      const [sRes, lRes] = await Promise.all([
        fetch(`${API_BASE_URL}/clinic/automation/settings`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
        }),
        fetch(`${API_BASE_URL}/clinic/automation/logs?limit=25`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
        })
      ]);
      const sData = await sRes.json();
      if (sData.success && sData.data) {
        setAutomationSettings(sData.data);
      }
      const lData = await lRes.json();
      if (lData.success && lData.data) {
        setAutomationLogs(lData.data);
      }
    } catch (e) {
      console.warn('Could not load automation settings', e);
    }
  }

  async function handleSaveAutomation(e) {
    e.preventDefault();
    setIsSavingAutomation(true);
    try {
      const res = await fetch(`${API_BASE_URL}/clinic/automation/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`,
          'X-Clinic-ID': clinicId
        },
        body: JSON.stringify(automationSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Smart automation and traffic departure settings saved successfully!');
        setAutomationSettings(data.data);
      } else {
        setError(data.error?.message || 'Failed to update automation settings.');
      }
    } catch (err) {
      setError('Automation settings save error: ' + err.message);
    } finally {
      setIsSavingAutomation(false);
    }
  }

  // Phase 8: Subscription, Billing & Invoicing Handlers
  async function loadBillingData(token = ownerToken, cid = clinicId) {
    if (!token) return;
    try {
      const [curRes, plansRes, invRes, anaRes, profRes] = await Promise.all([
        fetch(`${API_BASE_URL}/clinic/subscriptions/current`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
        }),
        fetch(`${API_BASE_URL}/clinic/subscriptions/plans`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/clinic/subscriptions/invoices`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
        }),
        fetch(`${API_BASE_URL}/clinic/subscriptions/analytics`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
        }),
        fetch(`${API_BASE_URL}/clinic/subscriptions/billing-profile`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Clinic-ID': cid }
        })
      ]);

      const curData = await curRes.json();
      if (curData.success && curData.data) {
        setSubscription(curData.data.subscription);
        setUsage(curData.data.usage);
        if (curData.data.billing_profile) {
          setBillingProfile(curData.data.billing_profile);
          setProfileForm(curData.data.billing_profile);
        }
      }

      const pData = await plansRes.json();
      if (pData.success && pData.data) {
        setPlans(pData.data.plans || []);
      }

      const iData = await invRes.json();
      if (iData.success && iData.data) {
        setInvoices(iData.data.invoices || []);
      }

      const aData = await anaRes.json();
      if (aData.success && aData.data) {
        setOperationalAnalytics(aData.data);
      }

      const profData = await profRes.json();
      if (profData.success && profData.data) {
        setBillingProfile(profData.data);
        setProfileForm(profData.data);
      }
    } catch (e) {
      console.warn('Could not load billing data', e);
    }
  }

  async function handleInitiateCheckout(plan) {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/clinic/subscriptions/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`,
          'X-Clinic-ID': clinicId
        },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_interval: isYearlyBilling ? 'YEARLY' : 'MONTHLY'
        })
      });
      const data = await res.json();
      if (data.success) {
        setCheckoutModal({ isOpen: true, plan, order: data.data });
      } else {
        setError(data.error?.message || 'Failed to create subscription payment order.');
      }
    } catch (err) {
      setError('Checkout error: ' + err.message);
    }
  }

  async function handleVerifyPayment() {
    if (!checkoutModal.order) return;
    setIsPaying(true);
    setError(null);
    try {
      const { plan, order } = checkoutModal;
      const paymentId = 'pay_' + Math.random().toString(36).substring(2, 12);
      const res = await fetch(`${API_BASE_URL}/clinic/subscriptions/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`,
          'X-Clinic-ID': clinicId
        },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_interval: isYearlyBilling ? 'YEARLY' : 'MONTHLY',
          order_id: order.order_id,
          payment_id: paymentId,
          signature: 'sig_test_' + Date.now()
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Payment verified! Subscribed to ${plan.name}. Tax Invoice ${data.data.invoice?.invoice_number} generated.`);
        setCheckoutModal({ isOpen: false, plan: null, order: null });
        await loadBillingData();
        await loadOwnerData();
      } else {
        setError(data.error?.message || 'Payment verification failed.');
      }
    } catch (err) {
      setError('Payment verification error: ' + err.message);
    } finally {
      setIsPaying(false);
    }
  }

  async function handleSaveBillingProfile(e) {
    if (e) e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE_URL}/clinic/subscriptions/billing-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`,
          'X-Clinic-ID': clinicId
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Clinic legal entity and GST profile updated successfully!');
        setBillingProfile(data.data);
      } else {
        setError(data.error?.message || 'Failed to update billing profile.');
      }
    } catch (err) {
      setError('Profile save error: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDownloadInvoice(inv) {
    try {
      const res = await fetch(`${API_BASE_URL}/clinic/subscriptions/invoices/${inv.id}/download`, {
        headers: { 'Authorization': `Bearer ${ownerToken}`, 'X-Clinic-ID': clinicId }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${inv.invoice_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const err = await res.json();
        setError(err.error?.message || 'Failed to download PDF invoice.');
      }
    } catch (e) {
      setError('Invoice download error: ' + e.message);
    }
  }

  async function handleCreateBranch(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/clinic/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`,
          'X-Clinic-ID': clinicId
        },
        body: JSON.stringify(branchForm)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Branch "${data.data.branch.name}" created successfully!`);
        setShowBranchModal(false);
        setBranchForm({ name: '', phone: '', email: '', address: '', city: 'Bengaluru', state: 'Karnataka', is_main_branch: false });
        await loadOwnerData();
      } else {
        setError(data.error?.message || 'Failed to create branch.');
      }
    } catch (err) {
      setError('Branch creation error: ' + err.message);
    }
  }

  async function handleSaveSchedule(e) {
    e.preventDefault();
    if (!selectedDoctorForSchedule) return;
    try {
      const res = await fetch(`${API_BASE_URL}/clinic/schedules/doctor/${selectedDoctorForSchedule.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`,
          'X-Clinic-ID': clinicId
        },
        body: JSON.stringify({
          branch_id: branches[0]?.id,
          day_of_week: parseInt(scheduleForm.day_of_week, 10),
          start_time: scheduleForm.start_time,
          end_time: scheduleForm.end_time,
          is_available: scheduleForm.is_available
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Schedule updated for ${selectedDoctorForSchedule.full_name}!`);
        setShowScheduleModal(false);
        await loadOwnerData();
      } else {
        setError(data.error?.message || 'Failed to update schedule.');
      }
    } catch (err) {
      setError('Schedule error: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5FAF9', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={36} className="spin" style={{ color: '#087F79', marginBottom: 16 }} />
          <h3 style={{ color: '#183B3A', margin: 0 }}>Connecting to Clinic Owner Portal...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5FAF9', color: '#183B3A', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Dedicated Owner Top Navigation Header */}
      <header style={{ background: '#087F79', color: '#FFFFFF', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(8,127,121,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#087F79', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.2 }}>
              Clinic Owner Executive Portal
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Dr. Ramesh Gupta (Owner) • {ownerData?.clinic?.name || 'CarePlus Family Clinic'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => loadOwnerData()}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFFFFF', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh KPIs'}</span>
          </button>

          <a
            href="/"
            style={{ color: '#BFEDE5', textDecoration: 'none', fontSize: 12, fontWeight: 600, padding: '6px 12px', border: '1px solid rgba(191,237,229,0.3)', borderRadius: 6 }}
          >
            Portal Gateway
          </a>
        </div>
      </header>

      {/* Internal Owner Tab Navigation (Branches, Doctors, Analytics) */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E3EEEB', padding: '0 28px', display: 'flex', gap: 24 }}>
        {[
          { id: 'OVERVIEW', label: 'Executive Analytics', icon: TrendingUp },
          { id: 'DOCTORS', label: 'My Doctors', icon: Stethoscope },
          { id: 'RECEPTIONISTS', label: 'My Receptionists', icon: Users },
          { id: 'PATIENTS', label: 'Location Patients', icon: Activity },
          { id: 'BRANCHES', label: 'Location Branches', icon: Building2 },
          { id: 'BILLING', label: 'Subscription & Billing', icon: CreditCard },
          { id: 'AUTOMATION', label: 'Queue Automation & Traffic', icon: Zap }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 4px',
                fontSize: 14,
                fontWeight: 700,
                color: isActive ? '#087F79' : '#708583',
                borderBottom: isActive ? '3px solid #087F79' : '3px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ margin: '16px 28px 0', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#C53030', fontSize: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#C53030', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
      )}

      {successMsg && (
        <div style={{ margin: '16px 28px 0', background: '#E6FFFA', border: '1px solid #81E6D9', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#234E52', fontSize: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color="#087F79" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#234E52', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* Main Tab Content */}
      <div style={{ padding: '24px 28px' }}>
        {activeTab === 'OVERVIEW' && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: 14, border: '1px solid #E3EEEB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#708583', textTransform: 'uppercase' }}>Today's Revenue</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#087F79', marginTop: 4 }}>
                  ₹{(ownerData?.metrics?.today_revenue || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 11, color: '#38A169', marginTop: 4 }}>Direct collections</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: 14, border: '1px solid #E3EEEB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#708583', textTransform: 'uppercase' }}>MTD Revenue</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#183B3A', marginTop: 4 }}>
                  ₹{(ownerData?.metrics?.mtd_revenue || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 11, color: '#708583', marginTop: 4 }}>This month to date</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: 14, border: '1px solid #E3EEEB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#708583', textTransform: 'uppercase' }}>Registered Patients</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#3182CE', marginTop: 4 }}>
                  {ownerData?.metrics?.total_patients || 0}
                </div>
                <div style={{ fontSize: 11, color: '#708583', marginTop: 4 }}>Across all branches</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: 14, border: '1px solid #E3EEEB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#708583', textTransform: 'uppercase' }}>Operating Branches</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#D69E2E', marginTop: 4 }}>
                  {ownerData?.metrics?.total_branches || 1}
                </div>
                <div style={{ fontSize: 11, color: '#708583', marginTop: 4 }}>{doctors.length} doctors onboarded</div>
              </div>
            </div>

            {/* Financial Separation Section: Patient Consultation Collections vs SaaS Platform Expense */}
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 24, marginBottom: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#087F79', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={20} />
                    <span>Dual Financial Separation & Clinic Operating Margin</span>
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#708583' }}>
                    Strict isolation of Patient Consultation Collections (Clinic Revenue) from SaaS Platform Subscription Fees (Operating Cost)
                  </p>
                </div>
                <span style={{ background: '#E6FFFA', color: '#234E52', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  GST Compliant SaaS
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div style={{ background: '#F5FAF9', padding: 18, borderRadius: 10, border: '1px solid #BFEDE5' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#087F79', textTransform: 'uppercase' }}>Workflow A: Patient OPD Collections</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#087F79', marginTop: 4 }}>
                    ₹{(operationalAnalytics?.financials?.patient_consultation_collections || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 11, color: '#708583', marginTop: 4 }}>
                    {operationalAnalytics?.financials?.receipts_issued_count || 0} receipts issued (OPD consultation payments)
                  </div>
                </div>

                <div style={{ background: '#FFF5F5', padding: 18, borderRadius: 10, border: '1px solid #FEB2B2' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#C53030', textTransform: 'uppercase' }}>Workflow B: SaaS Subscription Expense</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#C53030', marginTop: 4 }}>
                    ₹{(operationalAnalytics?.financials?.platform_saas_subscription_expense || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 11, color: '#708583', marginTop: 4 }}>
                    Operating fee paid to Smart Clinic OS (Includes 18% GST)
                  </div>
                </div>

                <div style={{ background: '#EBF8FF', padding: 18, borderRadius: 10, border: '1px solid #BEE3F8' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2B6CB0', textTransform: 'uppercase' }}>Net Clinic Operational Margin</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#2B6CB0', marginTop: 4 }}>
                    ₹{(operationalAnalytics?.financials?.net_clinic_operational_margin || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 11, color: '#708583', marginTop: 4 }}>
                    Collections minus SaaS platform software cost
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Appointments & Clinic Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: '#087F79' }}>
                  Recent Patient Visits Today
                </h3>
                {(!ownerData?.recent_appointments || ownerData.recent_appointments.length === 0) ? (
                  <div style={{ color: '#708583', fontSize: 13, padding: '20px 0' }}>No visits recorded today yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {ownerData.recent_appointments.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F5FAF9', borderRadius: 10, border: '1px solid #E3EEEB' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#183B3A' }}>{a.patient_name}</div>
                          <div style={{ fontSize: 12, color: '#708583' }}>Doctor: {a.doctor_name} ({a.specialty})</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#087F79' }}>₹{a.consultation_fee}</span>
                          <div style={{ fontSize: 11, color: '#708583' }}>{a.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clinic License & Legal Status */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: '#087F79' }}>
                  Regulatory & Facility Dossier
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                  <div>
                    <span style={{ color: '#708583', display: 'block', fontSize: 11 }}>Registration Number</span>
                    <strong>{ownerData?.clinic?.registration_number || 'REG-KA-2024-8841'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#708583', display: 'block', fontSize: 11 }}>Verification Status</span>
                    <span style={{ background: '#C6F6D5', color: '#22543D', fontWeight: 700, fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>
                      {ownerData?.clinic?.verification_status || 'VERIFIED'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#708583', display: 'block', fontSize: 11 }}>Headquarters Address</span>
                    <span>{ownerData?.clinic?.address}, {ownerData?.clinic?.city}</span>
                  </div>
                  <div>
                    <span style={{ color: '#708583', display: 'block', fontSize: 11 }}>Official Contact</span>
                    <span>{ownerData?.clinic?.phone} • {ownerData?.clinic?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 8: SaaS Subscription, Billing & Plan Entitlements */}
        {activeTab === 'BILLING' && (
          <div>
            {/* 1. Current Plan & Status Card */}
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 24, marginBottom: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#E6FFFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#087F79' }}>
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#183B3A' }}>
                        {subscription?.plan_name || 'Active Subscription'}
                      </h2>
                      <span style={{
                        background: subscription?.status === 'ACTIVE' ? '#C6F6D5' : '#EBF8FF',
                        color: subscription?.status === 'ACTIVE' ? '#22543D' : '#2B6CB0',
                        fontSize: 12,
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 20,
                        textTransform: 'uppercase'
                      }}>
                        {subscription?.status || 'ACTIVE'}
                      </span>
                      <span style={{ background: '#EDF2F7', color: '#4A5568', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                        {subscription?.billing_interval || 'MONTHLY'} CYCLE
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#708583', marginTop: 4 }}>
                      Valid: {subscription?.current_period_start ? new Date(subscription.current_period_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
                      {' '}—{' '}
                      {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 days'}
                      {' '}• Next Renewal: <strong>₹{subscription?.monthly_price ? parseFloat(subscription.monthly_price).toLocaleString('en-IN') : '4,999'}</strong> + 18% GST
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => {
                      const pro = plans.find(p => p.code === 'PRO') || plans[0];
                      if (pro) handleInitiateCheckout(pro);
                    }}
                    style={{ background: '#087F79', color: '#FFFFFF', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <CreditCard size={16} /> Renew / Change Plan
                  </button>
                </div>
              </div>

              {/* Resource Entitlements Utilization Progress */}
              <div style={{ borderTop: '1px solid #E3EEEB', paddingTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#183B3A', marginBottom: 14 }}>
                  Plan Capacity & Real-Time Entitlement Usage
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  {/* Branches */}
                  <div style={{ background: '#F5FAF9', padding: 14, borderRadius: 10, border: '1px solid #E3EEEB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#708583', marginBottom: 6 }}>
                      <span>Branch Capacity</span>
                      <strong style={{ color: '#087F79' }}>{usage?.branches_used || 1} / {subscription?.max_branches === -1 ? '∞' : (subscription?.max_branches || 3)}</strong>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, ((usage?.branches_used || 1) / (subscription?.max_branches || 3)) * 100)}%`,
                        height: '100%',
                        background: '#087F79'
                      }} />
                    </div>
                  </div>

                  {/* Doctors */}
                  <div style={{ background: '#F5FAF9', padding: 14, borderRadius: 10, border: '1px solid #E3EEEB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#708583', marginBottom: 6 }}>
                      <span>Active Doctors</span>
                      <strong style={{ color: '#087F79' }}>{usage?.doctors_used || 1} / {subscription?.max_doctors === -1 ? '∞' : (subscription?.max_doctors || 6)}</strong>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, ((usage?.doctors_used || 1) / (subscription?.max_doctors || 6)) * 100)}%`,
                        height: '100%',
                        background: '#087F79'
                      }} />
                    </div>
                  </div>

                  {/* Staff */}
                  <div style={{ background: '#F5FAF9', padding: 14, borderRadius: 10, border: '1px solid #E3EEEB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#708583', marginBottom: 6 }}>
                      <span>Clinic Staff</span>
                      <strong style={{ color: '#087F79' }}>{usage?.staff_used || 2} / {subscription?.max_staff === -1 ? '∞' : (subscription?.max_staff || 10)}</strong>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, ((usage?.staff_used || 2) / (subscription?.max_staff || 10)) * 100)}%`,
                        height: '100%',
                        background: '#087F79'
                      }} />
                    </div>
                  </div>

                  {/* Monthly Appointments */}
                  <div style={{ background: '#F5FAF9', padding: 14, borderRadius: 10, border: '1px solid #E3EEEB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#708583', marginBottom: 6 }}>
                      <span>Monthly OPD Bookings</span>
                      <strong style={{ color: '#087F79' }}>{usage?.monthly_appointments_used || 0} / {subscription?.max_monthly_appointments === -1 ? '∞' : (subscription?.max_monthly_appointments || 1500)}</strong>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, ((usage?.monthly_appointments_used || 0) / (subscription?.max_monthly_appointments || 1500)) * 100)}%`,
                        height: '100%',
                        background: '#087F79'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Upgrade & Plans Comparison Grid */}
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 24, marginBottom: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#183B3A' }}>
                    Explore SaaS Subscription Plans
                  </h3>
                  <div style={{ fontSize: 13, color: '#708583', marginTop: 2 }}>
                    Transparent healthcare SaaS tiers for single clinics and expanding hospital chains.
                  </div>
                </div>

                {/* Monthly / Yearly Billing Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F5FAF9', padding: '4px 6px', borderRadius: 8, border: '1px solid #BFEDE5' }}>
                  <button
                    onClick={() => setIsYearlyBilling(false)}
                    style={{
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: !isYearlyBilling ? '#087F79' : 'transparent',
                      color: !isYearlyBilling ? '#FFFFFF' : '#708583'
                    }}
                  >
                    Monthly Billing
                  </button>
                  <button
                    onClick={() => setIsYearlyBilling(true)}
                    style={{
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: isYearlyBilling ? '#087F79' : 'transparent',
                      color: isYearlyBilling ? '#FFFFFF' : '#708583'
                    }}
                  >
                    Annual Billing (Save 20%)
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {plans.filter(p => p.code !== 'TRIAL').map(plan => {
                  const isCurrent = subscription?.plan_code === plan.code;
                  const price = isYearlyBilling ? parseFloat(plan.yearly_price) : parseFloat(plan.monthly_price);
                  return (
                    <div
                      key={plan.id}
                      style={{
                        background: isCurrent ? '#F5FAF9' : '#FFFFFF',
                        borderRadius: 14,
                        border: isCurrent ? '2px solid #087F79' : '1px solid #E3EEEB',
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isCurrent ? '0 4px 12px rgba(8,127,121,0.08)' : '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#183B3A' }}>{plan.name}</span>
                          {isCurrent && (
                            <span style={{ background: '#087F79', color: '#FFFFFF', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                              Current Plan
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#708583', minHeight: 36, marginBottom: 16 }}>
                          {plan.description}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                          <span style={{ fontSize: 28, fontWeight: 800, color: '#087F79' }}>
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: 12, color: '#708583' }}>
                            /{isYearlyBilling ? 'year' : 'month'} + 18% GST
                          </span>
                        </div>

                        <div style={{ borderTop: '1px solid #E3EEEB', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, marginBottom: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check size={16} color="#087F79" />
                            <span>Up to <strong>{plan.max_branches === -1 ? 'Unlimited' : plan.max_branches}</strong> Operating Branches</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check size={16} color="#087F79" />
                            <span>Up to <strong>{plan.max_doctors === -1 ? 'Unlimited' : plan.max_doctors}</strong> Doctor Profiles</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check size={16} color="#087F79" />
                            <span><strong>{plan.max_monthly_appointments === -1 ? 'Unlimited' : plan.max_monthly_appointments}</strong> OPD Appointments/mo</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check size={16} color="#087F79" />
                            <span>Digital Prescriptions & Health Records</span>
                          </div>
                          {plan.code !== 'BASIC' && (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Check size={16} color="#087F79" />
                                <span>Google Maps Traffic Departure System</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Check size={16} color="#087F79" />
                                <span>Advanced Operational & Financial Analytics</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleInitiateCheckout(plan)}
                        disabled={isCurrent}
                        style={{
                          width: '100%',
                          padding: '11px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: isCurrent ? 'default' : 'pointer',
                          background: isCurrent ? '#E2E8F0' : '#087F79',
                          color: isCurrent ? '#718096' : '#FFFFFF',
                          border: 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isCurrent ? 'Active Subscription' : `Upgrade to ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Invoices & Billing History + Legal Billing Profile */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 24 }}>
              {/* Invoices List */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: '#183B3A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="#087F79" />
                  <span>GST Tax Invoices & Payment Records</span>
                </h3>

                {invoices.length === 0 ? (
                  <div style={{ color: '#708583', fontSize: 13, padding: '20px 0' }}>No SaaS subscription invoices issued yet.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E3EEEB', color: '#708583', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px' }}>Invoice #</th>
                          <th style={{ padding: '8px 10px' }}>Plan</th>
                          <th style={{ padding: '8px 10px' }}>Amount</th>
                          <th style={{ padding: '8px 10px' }}>Status</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id} style={{ borderBottom: '1px solid #F5FAF9' }}>
                            <td style={{ padding: '10px 10px', fontWeight: 700, color: '#087F79' }}>
                              {inv.invoice_number}
                              <div style={{ fontSize: 11, color: '#708583', fontWeight: 400 }}>
                                {new Date(inv.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td style={{ padding: '10px 10px' }}>{inv.plan_name}</td>
                            <td style={{ padding: '10px 10px' }}>
                              <strong>₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}</strong>
                              <div style={{ fontSize: 10, color: '#708583' }}>Incl. 18% GST</div>
                            </td>
                            <td style={{ padding: '10px 10px' }}>
                              <span style={{ background: '#C6F6D5', color: '#22543D', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                                {inv.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleDownloadInvoice(inv)}
                                style={{
                                  background: '#F5FAF9',
                                  border: '1px solid #BFEDE5',
                                  color: '#087F79',
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <Download size={14} /> PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Clinic Billing Profile & GSTIN Settings */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: '#183B3A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={18} color="#087F79" />
                  <span>Clinic Legal & Tax Dossier</span>
                </h3>

                <form onSubmit={handleSaveBillingProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#708583', marginBottom: 4 }}>Legal Entity Name</label>
                    <input
                      value={profileForm.legal_business_name}
                      onChange={(e) => setProfileForm({ ...profileForm, legal_business_name: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E0', fontSize: 13 }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#708583', marginBottom: 4 }}>GSTIN (15-digit)</label>
                      <input
                        value={profileForm.gstin || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value.toUpperCase() })}
                        placeholder="29AABCC1234D1Z5"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E0', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#708583', marginBottom: 4 }}>PAN Number</label>
                      <input
                        value={profileForm.pan || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, pan: e.target.value.toUpperCase() })}
                        placeholder="AABCC1234D"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E0', fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#708583', marginBottom: 4 }}>Billing Address</label>
                    <input
                      value={profileForm.billing_address}
                      onChange={(e) => setProfileForm({ ...profileForm, billing_address: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E0', fontSize: 13 }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#708583', marginBottom: 4 }}>City</label>
                      <input
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E0', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#708583', marginBottom: 4 }}>Place of Supply</label>
                      <input
                        value={profileForm.place_of_supply}
                        onChange={(e) => setProfileForm({ ...profileForm, place_of_supply: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E0', fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    style={{
                      background: '#087F79',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: 6
                    }}
                  >
                    {isSavingProfile ? 'Saving Profile...' : 'Save Legal Dossier'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === 'BRANCHES' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#183B3A' }}>Multi-Branch Network</h3>
                <div style={{ fontSize: 13, color: '#708583', marginTop: 2 }}>Manage facilities, operating status, and location profiles.</div>
              </div>
              <button
                onClick={() => setShowBranchModal(true)}
                style={{ background: '#087F79', color: '#FFFFFF', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> Add New Branch
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {branches.map(b => (
                <div key={b.id} style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#183B3A' }}>{b.name}</div>
                    <span style={{ background: '#C6F6D5', color: '#22543D', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                      {b.operating_status || 'OPERATIONAL'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#708583', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={14} /> {b.address || 'Address not listed'}, {b.city}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} /> {b.phone || '+919876543210'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={14} /> {b.email || 'branch@careplus.in'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctors & Rostering Tab */}
        {activeTab === 'DOCTORS' && (
          <div>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#183B3A' }}>My Location Doctors & OPD Rosters</h3>
                <div style={{ fontSize: 13, color: '#708583', marginTop: 2 }}>Doctors assigned strictly to this clinic location ({doctors.length} Doctors).</div>
              </div>
              <button
                onClick={() => setShowAddDoctorModal(true)}
                style={{ background: '#087F79', color: '#FFFFFF', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> Add Doctor to Location
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {doctors.map(d => (
                <div key={d.id} style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#183B3A' }}>{d.full_name}</div>
                      <div style={{ fontSize: 12, color: '#708583' }}>{d.qualification} • {d.specialty}</div>
                    </div>
                    <span style={{ background: '#D9F3EF', color: '#087F79', fontWeight: 800, fontSize: 13, padding: '4px 10px', borderRadius: 6 }}>
                      ₹{d.consultation_fee}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#708583', marginBottom: 16 }}>
                    Reg No: <strong>{d.medical_registration_number}</strong> • Experience: {d.experience_years} years
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDoctorForSchedule(d);
                      setShowScheduleModal(true);
                    }}
                    style={{ background: '#087F79', color: '#FFFFFF', border: 'none', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Calendar size={14} /> Configure Weekly OPD Timetable
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receptionists Tab (Scoped strictly to this location) */}
        {activeTab === 'RECEPTIONISTS' && (
          <div>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#183B3A' }}>My Location Receptionists</h3>
                <div style={{ fontSize: 13, color: '#708583', marginTop: 2 }}>Front desk staff managing live OPD walk-ins and collections for this clinic location ({locationReceptionists.length} Receptionists).</div>
              </div>
              <button
                onClick={() => setShowAddReceptionistModal(true)}
                style={{ background: '#087F79', color: '#FFFFFF', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> Add Receptionist to Location
              </button>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F5FAF9', borderBottom: '1px solid #E3EEEB', color: '#708583', fontSize: 12, fontWeight: 700 }}>
                    <th style={{ padding: '12px 20px' }}>Staff Full Name</th>
                    <th style={{ padding: '12px 20px' }}>Email Address</th>
                    <th style={{ padding: '12px 20px' }}>Phone Number</th>
                    <th style={{ padding: '12px 20px' }}>Status</th>
                    <th style={{ padding: '12px 20px' }}>Joined Location</th>
                  </tr>
                </thead>
                <tbody>
                  {locationReceptionists.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#708583' }}>
                        No receptionists currently assigned to this location. Click <strong>Add Receptionist to Location</strong>.
                      </td>
                    </tr>
                  ) : (
                    locationReceptionists.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F0F6F5' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#183B3A' }}>{r.full_name}</td>
                        <td style={{ padding: '14px 20px', color: '#087F79', fontWeight: 600 }}>{r.email}</td>
                        <td style={{ padding: '14px 20px', color: '#708583' }}>{r.phone_number || 'N/A'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: r.is_active ? '#D9F3EF' : '#FDE8E8', color: r.is_active ? '#087F79' : '#C53030' }}>
                            {r.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#708583', fontSize: 13 }}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Active'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Patients Tab (Scoped strictly to this location) */}
        {activeTab === 'PATIENTS' && (
          <div>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#183B3A' }}>Location Registered & Visiting Patients</h3>
                <div style={{ fontSize: 13, color: '#708583', marginTop: 2 }}>Patients registered at or attending consultations in this clinic location ({locationPatients.length} Patients).</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', padding: '8px 14px', borderRadius: 8, border: '1px solid #E3EEEB', width: 320 }}>
                <Search size={16} color="#708583" />
                <input
                  type="text"
                  placeholder="Filter patients by name or phone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, width: '100%' }}
                />
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F5FAF9', borderBottom: '1px solid #E3EEEB', color: '#708583', fontSize: 12, fontWeight: 700 }}>
                    <th style={{ padding: '12px 20px' }}>Patient Full Name</th>
                    <th style={{ padding: '12px 20px' }}>Phone Number</th>
                    <th style={{ padding: '12px 20px' }}>Gender & Age</th>
                    <th style={{ padding: '12px 20px' }}>Appointments at this Clinic</th>
                    <th style={{ padding: '12px 20px' }}>Last Visit Date</th>
                  </tr>
                </thead>
                <tbody>
                  {locationPatients.filter(p => {
                    if (!patientSearch) return true;
                    const q = patientSearch.toLowerCase();
                    return (
                      (p.full_name && p.full_name.toLowerCase().includes(q)) ||
                      (p.phone_number && p.phone_number.includes(q))
                    );
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#708583' }}>
                        No patients found matching your search.
                      </td>
                    </tr>
                  ) : (
                    locationPatients
                      .filter(p => {
                        if (!patientSearch) return true;
                        const q = patientSearch.toLowerCase();
                        return (
                          (p.full_name && p.full_name.toLowerCase().includes(q)) ||
                          (p.phone_number && p.phone_number.includes(q))
                        );
                      })
                      .map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #F0F6F5' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ fontWeight: 700, color: '#183B3A' }}>{p.full_name}</div>
                            <div style={{ fontSize: 12, color: '#708583' }}>ID: {p.id.slice(0, 8)}...</div>
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: 600 }}>{p.phone_number || 'N/A'}</td>
                          <td style={{ padding: '14px 20px', color: '#708583' }}>{p.gender || 'Not specified'} • {p.blood_group || 'O+'}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: '#D9F3EF', color: '#087F79' }}>
                              {p.appointments_at_clinic || 1} Visits
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', color: '#708583' }}>
                            {p.last_visit_date ? new Date(p.last_visit_date).toLocaleDateString() : 'Today'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Phase 7: Smart Automation, Queue Intelligence & Traffic Engine */}
        {activeTab === 'AUTOMATION' && (
          <div>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#183B3A' }}>
                  Smart Automation & Traffic Departure Intelligence
                </h3>
                <div style={{ fontSize: 13, color: '#708583', marginTop: 2 }}>
                  Configure patient reminders, queue alert thresholds, and traffic-aware departure recommendation calibration.
                </div>
              </div>
              <button
                type="button"
                onClick={() => loadAutomationData()}
                style={{
                  background: '#F5FAF9',
                  border: '1px solid #BFEDE5',
                  color: '#087F79',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <RefreshCw size={14} /> Refresh Logs
              </button>
            </div>

            {/* Automation Settings Form */}
            <form onSubmit={handleSaveAutomation} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 28 }}>
              {/* Card 1: Multi-Channel Patient Reminders */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: '#D9F3EF', color: '#087F79', padding: 8, borderRadius: 8 }}>
                    <Bell size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#183B3A' }}>
                      Automated Appointment Reminders
                    </h4>
                    <span style={{ fontSize: 12, color: '#708583' }}>SMS, WhatsApp & In-App Notifications</span>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={automationSettings.reminders_enabled}
                      onChange={(e) => setAutomationSettings({ ...automationSettings, reminders_enabled: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: '#087F79' }}
                    />
                    <span>Enable Multi-Stage Appointment Reminders</span>
                  </label>
                  <p style={{ margin: '6px 0 0 28px', fontSize: 11, color: '#708583' }}>
                    Automatically sends 24h, 2h, and 30m reminders with built-in deduplication protection.
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={automationSettings.queue_alerts_enabled}
                      onChange={(e) => setAutomationSettings({ ...automationSettings, queue_alerts_enabled: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: '#087F79' }}
                    />
                    <span>Real-Time Live Queue Progress Notifications</span>
                  </label>
                  <p style={{ margin: '6px 0 0 28px', fontSize: 11, color: '#708583' }}>
                    Alerts patient when token is called or their turn is approaching.
                  </p>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#183B3A', marginBottom: 4 }}>
                    Turn Approaching Threshold (Patients ahead)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={automationSettings.turn_approaching_threshold}
                    onChange={(e) => setAutomationSettings({ ...automationSettings, turn_approaching_threshold: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '1px solid #BFEDE5', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#183B3A', marginBottom: 4 }}>
                    Doctor Delay Alert Threshold (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={automationSettings.delay_threshold_minutes}
                    onChange={(e) => setAutomationSettings({ ...automationSettings, delay_threshold_minutes: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '1px solid #BFEDE5', fontSize: 13 }}
                  />
                  <span style={{ fontSize: 11, color: '#708583' }}>Auto-notifies queued patients when doctor is delayed past this mark.</span>
                </div>
              </div>

              {/* Card 2: Google Maps Traffic Intelligence & Departure Engine */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: '#D9F3EF', color: '#087F79', padding: 8, borderRadius: 8 }}>
                      <Navigation size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#183B3A' }}>
                        Google Maps Traffic-Aware Departure
                      </h4>
                      <span style={{ fontSize: 12, color: '#708583' }}>Routes API & Peak Hours Model</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={automationSettings.traffic_departure_enabled}
                        onChange={(e) => setAutomationSettings({ ...automationSettings, traffic_departure_enabled: e.target.checked })}
                        style={{ width: 18, height: 18, accentColor: '#087F79' }}
                      />
                      <span>Enable Intelligent Departure Recommendations</span>
                    </label>
                    <p style={{ margin: '6px 0 0 28px', fontSize: 11, color: '#708583' }}>
                      Calculates exact leave-by time: <code>turn_time - travel_time - buffer</code>.
                    </p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#183B3A', marginBottom: 6 }}>
                      Default Arrival Buffer: {automationSettings.default_arrival_buffer_minutes} minutes
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[10, 12, 15].map(buf => (
                        <button
                          key={buf}
                          type="button"
                          onClick={() => setAutomationSettings({ ...automationSettings, default_arrival_buffer_minutes: buf })}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: 8,
                            border: automationSettings.default_arrival_buffer_minutes === buf ? '2px solid #087F79' : '1px solid #BFEDE5',
                            background: automationSettings.default_arrival_buffer_minutes === buf ? '#D9F3EF' : '#F5FAF9',
                            color: automationSettings.default_arrival_buffer_minutes === buf ? '#087F79' : '#183B3A',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer'
                          }}
                        >
                          {buf} Minutes Buffer
                        </button>
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: '#708583', display: 'block', marginTop: 4 }}>
                      Ensures patient arrives at clinic reception 10â€“15 mins before their consultation.
                    </span>
                  </div>

                  <div style={{ background: '#F5FAF9', padding: '12px 14px', borderRadius: 10, border: '1px solid #BFEDE5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#087F79', marginBottom: 4 }}>
                      <ShieldCheck size={14} /> Cost Control & Indian Data Privacy
                    </div>
                    <div style={{ fontSize: 11, color: '#708583', lineHeight: 1.5 }}>
                      â€¢ SHA-256 route snapshots cached for 10 minutes to minimize API cost.<br/>
                      â€¢ Google Maps API keys are 100% backend-protected (never sent to Flutter app).<br/>
                      â€¢ On-demand calculation only; no continuous background battery or GPS draining.
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <button
                    type="submit"
                    disabled={isSavingAutomation}
                    style={{
                      width: '100%',
                      background: '#087F79',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 2px 6px rgba(8,127,121,0.3)'
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{isSavingAutomation ? 'Saving...' : 'Save & Apply Automation Settings'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Section 2: Automation Activity & Audit Logs */}
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #E3EEEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#183B3A' }}>
                  <Activity size={18} color="#087F79" />
                  <span>Real-Time Automation Job Dispatch & Idempotency Audit Logs</span>
                </div>
                <span style={{ fontSize: 12, color: '#708583' }}>
                  {automationLogs.length} recent executions
                </span>
              </div>

              {automationLogs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#708583', fontSize: 13 }}>
                  No automated jobs dispatched yet for this clinic. Trigger reminders or queue events to observe audit logs.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F5FAF9', borderBottom: '1px solid #E3EEEB', color: '#708583' }}>
                        <th style={{ padding: '12px 18px', fontWeight: 700 }}>JOB TYPE</th>
                        <th style={{ padding: '12px 18px', fontWeight: 700 }}>RECIPIENT / PATIENT</th>
                        <th style={{ padding: '12px 18px', fontWeight: 700 }}>NOTIFICATION CHANNEL</th>
                        <th style={{ padding: '12px 18px', fontWeight: 700 }}>STATUS</th>
                        <th style={{ padding: '12px 18px', fontWeight: 700 }}>IDEMPOTENCY HASH</th>
                        <th style={{ padding: '12px 18px', fontWeight: 700 }}>DISPATCH TIME</th>
                      </tr>
                    </thead>
                    <tbody>
                      {automationLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #F0F4F3' }}>
                          <td style={{ padding: '12px 18px', fontWeight: 700, color: '#087F79' }}>
                            {log.job_type}
                          </td>
                          <td style={{ padding: '12px 18px' }}>
                            {log.recipient_name || log.recipient_user_id || 'Queued Patient'}
                          </td>
                          <td style={{ padding: '12px 18px' }}>
                            <span style={{ background: '#E6FFFA', color: '#087F79', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                              {log.channel}
                            </span>
                          </td>
                          <td style={{ padding: '12px 18px' }}>
                            <span style={{
                              background: log.status === 'SENT' ? '#C6F6D5' : '#FED7D7',
                              color: log.status === 'SENT' ? '#22543D' : '#9B2C2C',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 700,
                              fontSize: 11
                            }}>
                              {log.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: '#708583', fontSize: 11 }}>
                            {log.idempotency_key?.slice(0, 24)}...
                          </td>
                          <td style={{ padding: '12px 18px', color: '#708583' }}>
                            {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 9: Home Care Dispatch */}
        {activeTab === 'HOME_CARE' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#183B3A', margin: 0 }}>
                  Clinic Home Care Dispatch Hub
                </h2>
                <p style={{ fontSize: 13, color: '#708583', margin: '4px 0 0 0' }}>
                  Manage clinic-affiliated at-home healthcare professionals, home visit requests, and real-time dispatch routes.
                </p>
              </div>
              <button
                onClick={() => loadHomeCareData(ownerToken, clinicId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #BFEDE5',
                  background: '#FFFFFF',
                  color: '#087F79',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} /> Refresh Dispatch Desk
              </button>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E3EEEB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 12, color: '#708583', fontWeight: 700, textTransform: 'uppercase' }}>Affiliated Professionals</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#087F79', marginTop: 4 }}>
                  {homeCareProviders.length || 4}
                </div>
                <div style={{ fontSize: 11, color: '#087F79', fontWeight: 600 }}>Doctors, Nurses, Physios, Phlebotomists</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E3EEEB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 12, color: '#708583', fontWeight: 700, textTransform: 'uppercase' }}>Clinic Home Dispatches</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#183B3A', marginTop: 4 }}>
                  {homeCareDispatches.length || 0}
                </div>
                <div style={{ fontSize: 11, color: '#708583' }}>Total scheduled visits</div>
              </div>

              <div style={{ background: '#E5F7F3', padding: 20, borderRadius: 12, border: '1px solid #BFEDE5' }}>
                <div style={{ fontSize: 12, color: '#087F79', fontWeight: 700, textTransform: 'uppercase' }}>Service Radius</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#087F79', marginTop: 4 }}>
                  15 km
                </div>
                <div style={{ fontSize: 11, color: '#087F79', fontWeight: 600 }}>Bengaluru (560038 & surrounding)</div>
              </div>
            </div>

            {/* Affiliated Healthcare Providers Grid */}
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#183B3A', margin: '0 0 14px 0' }}>
                Affiliated Healthcare Professional Team ({homeCareProviders.length || 4})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {(homeCareProviders.length > 0 ? homeCareProviders : [
                  { id: '1', full_name: 'Dr. Rajesh Sharma', provider_type: 'DOCTOR', specialty: 'Geriatric & Family Medicine', qualification: 'MBBS, MD', rating_avg: '5.00' },
                  { id: '2', full_name: 'Sister Mary Varghese', provider_type: 'NURSE', specialty: 'Critical Care & Suture Care', qualification: 'B.Sc Nursing, RN', rating_avg: '5.00' },
                  { id: '3', full_name: 'Dr. Arun Kumar, BPT', provider_type: 'PHYSIOTHERAPIST', specialty: 'Orthopedic Rehabilitation', qualification: 'BPT, MPT', rating_avg: '5.00' },
                  { id: '4', full_name: 'Suresh Nair', provider_type: 'PHLEBOTOMIST', specialty: 'Diagnostic Blood Draw', qualification: 'DMLT', rating_avg: '5.00' }
                ]).map((p) => (
                  <div key={p.id} style={{
                    padding: 14,
                    borderRadius: 10,
                    background: '#F5FAF9',
                    border: '1px solid #BFEDE5'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <strong style={{ fontSize: 14, color: '#183B3A' }}>{p.full_name}</strong>
                      <span style={{ fontSize: 10, fontWeight: 800, background: '#BFEDE5', color: '#087F79', padding: '2px 6px', borderRadius: 4 }}>
                        {p.provider_type}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#087F79', fontWeight: 600, marginBottom: 2 }}>{p.specialty}</div>
                    <div style={{ fontSize: 11, color: '#708583' }}>{p.qualification} • ★ {p.rating_avg || '5.00'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispatches Table */}
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E3EEEB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#183B3A' }}>
                  Live Dispatches & Visit Requests
                </h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F5FAF9', borderBottom: '1px solid #E3EEEB', color: '#708583' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>REFERENCE</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>SERVICE</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>PROVIDER</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>SCHEDULED</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>STATUS</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>FEE</th>
                  </tr>
                </thead>
                <tbody>
                  {homeCareDispatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px 18px', textAlign: 'center', color: '#708583' }}>
                        No home visit dispatches recorded for this clinic yet.
                      </td>
                    </tr>
                  ) : (
                    homeCareDispatches.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #F0F4F3' }}>
                        <td style={{ padding: '12px 18px', fontWeight: 700, color: '#087F79' }}>{d.booking_reference}</td>
                        <td style={{ padding: '12px 18px', fontWeight: 600 }}>{d.service_name}</td>
                        <td style={{ padding: '12px 18px' }}>{d.provider_name || 'Assigned Professional'}</td>
                        <td style={{ padding: '12px 18px' }}>{d.scheduled_date} ({d.scheduled_start_time})</td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: d.status === 'COMPLETED' ? '#C6F6D5' : '#E5F7F3',
                            color: d.status === 'COMPLETED' ? '#22543D' : '#087F79'
                          }}>
                            {d.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: '#087F79' }}>
                          ₹{d.total_amount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Phase 10: Advanced Clinic Intelligence & Demand Forecasting Tab */}
        {activeTab === 'INTELLIGENCE' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#183B3A', margin: 0 }}>
                  Clinic Demand Forecasting & Peak Congestion Intelligence
                </h2>
                <div style={{ fontSize: 13, color: '#708583', marginTop: 4 }}>
                  7 to 14-day moving average OPD volume projections, dynamic doctor staffing recommendations & hourly congestion heatmap.
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchIntelligenceData()}
                disabled={isLoadingIntelligence}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#FFFFFF',
                  border: '1px solid #BFEDE5',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#087F79',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} className={isLoadingIntelligence ? 'spin' : ''} />
                <span>{isLoadingIntelligence ? 'Recalculating...' : 'Refresh AI Projections'}</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #E3EEEB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#708583', textTransform: 'uppercase' }}>7-Day Projected Volume</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#087F79', marginTop: 4 }}>
                  {demandForecast?.daily_projections ? demandForecast.daily_projections.reduce((a, b) => a + b.predicted_patient_count, 0) : 168} Visits
                </div>
                <div style={{ fontSize: 11, color: '#38A169', marginTop: 2, fontWeight: 600 }}>+25% Surge on Mondays</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #E3EEEB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#708583', textTransform: 'uppercase' }}>Peak Doctor Staffing</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#183B3A', marginTop: 4 }}>
                  {demandForecast?.daily_projections?.[0]?.staffing_recommendations?.doctors_on_duty || 3} Doctors On Duty
                </div>
                <div style={{ fontSize: 11, color: '#708583', marginTop: 2 }}>{demandForecast?.daily_projections?.[0]?.staffing_recommendations?.nursing_support || 4} Nursing Support Staff</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #E3EEEB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#708583', textTransform: 'uppercase' }}>Overall No-Show Rate</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#D69E2E', marginTop: 4 }}>
                  {noShowData?.metrics?.no_show_rate_percent || 6.7}%
                </div>
                <div style={{ fontSize: 11, color: '#38A169', marginTop: 2, fontWeight: 600 }}>Completion Rate: {noShowData?.metrics?.completion_rate_percent || 84.4}%</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #E3EEEB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#708583', textTransform: 'uppercase' }}>Forecast Confidence</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#087F79', marginTop: 4 }}>92% CI</div>
                <div style={{ fontSize: 11, color: '#708583', marginTop: 2 }}>Historical 30-day moving avg</div>
              </div>
            </div>

            {/* Main Forecasting & Heatmap Split Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Daily Projections */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px 0', color: '#087F79', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} />
                  <span>7-Day Forward Patient Volume Forecast</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {demandForecast?.daily_projections?.map((proj, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F5FAF9', borderRadius: 8, border: '1px solid #E3EEEB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: '#087F79', width: 40 }}>{proj.day_name}</span>
                        <span style={{ fontSize: 12, color: '#708583' }}>{proj.date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#183B3A' }}>{proj.predicted_patient_count}</span>
                          <span style={{ fontSize: 11, color: '#708583', marginLeft: 4 }}>visits</span>
                          <div style={{ fontSize: 10, color: '#708583' }}>({proj.confidence_interval?.lower_bound} - {proj.confidence_interval?.upper_bound})</div>
                        </div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: proj.staffing_recommendations?.doctors_on_duty >= 3 ? '#FED7D7' : '#D9F3EF',
                          color: proj.staffing_recommendations?.doctors_on_duty >= 3 ? '#9B2C2C' : '#087F79'
                        }}>
                          {proj.staffing_recommendations?.doctors_on_duty} Docs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {demandForecast?.summary_insight && (
                  <div style={{ marginTop: 14, background: '#E5F7F3', border: '1px solid #BFEDE5', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#087F79' }}>
                    💡 <strong>AI Staffing Insight:</strong> {demandForecast.summary_insight}
                  </div>
                )}
              </div>

              {/* Congestion Heatmap Matrix */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px 0', color: '#087F79', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} />
                  <span>Hourly Outpatient Congestion Matrix (8 AM - 8 PM)</span>
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                  {peakHeatmap?.heatmap_cells?.slice(0, 36).map((cell, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid #E2E8F0',
                        background: cell.level === 'PEAK' ? '#FED7D7' : cell.level === 'HIGH' ? '#FEEBC8' : cell.level === 'MEDIUM' ? '#E5F7F3' : '#FFFFFF',
                        color: cell.level === 'PEAK' ? '#9B2C2C' : cell.level === 'HIGH' ? '#9C4221' : cell.level === 'MEDIUM' ? '#087F79' : '#4A5568',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700 }}>{cell.day.slice(0, 3)} {cell.hour}</div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{cell.congestion_score}%</div>
                      <div style={{ fontSize: 9, opacity: 0.9 }}>~{cell.estimated_wait_minutes}m wait</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 11, color: '#708583' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: '#FED7D7' }}></span> Peak
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: '#FEEBC8' }}></span> High
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: '#E5F7F3' }}></span> Medium
                    </span>
                  </div>
                  <span>Calibrated with real-time consultation velocity</span>
                </div>
              </div>
            </div>

            {/* No-Show Risk Factors & Mitigations */}
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E3EEEB', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0', color: '#183B3A' }}>
                Predictive No-Show Factors & Automated Interventions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {noShowData?.risk_factors?.map((rf, idx) => (
                  <div key={idx} style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#183B3A' }}>{rf.factor}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#E53E3E', margin: '4px 0' }}>{rf.impact}</div>
                    <div style={{ fontSize: 11, color: '#087F79', marginTop: 4 }}>
                      âœ… <strong>Automated Mitigation:</strong> {rf.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        </div>

      {/* Add Branch Modal */}
      {showBranchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, width: 440, padding: 24, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#183B3A' }}>Create New Branch</div>
              <button onClick={() => setShowBranchModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateBranch}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Branch Name *</label>
                <input required placeholder="e.g. Indiranagar East Diagnostic" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #BFEDE5', fontSize: 13 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>City *</label>
                <input required placeholder="Bengaluru" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #BFEDE5', fontSize: 13 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Street Address</label>
                <input placeholder="100ft Road" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #BFEDE5', fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" onClick={() => setShowBranchModal(false)} style={{ background: '#E2E8F0', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#087F79', color: '#FFFFFF', border: 'none', padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, width: 420, padding: 24, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#183B3A' }}>Configure Doctor OPD Schedule</div>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveSchedule}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Doctor</label>
                <input disabled value={selectedDoctorForSchedule?.full_name} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, background: '#EDF2F7', border: '1px solid #CBD5E0', fontSize: 13 }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Day of Week</label>
                <select value={scheduleForm.day_of_week} onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #BFEDE5', fontSize: 13 }}>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Start Time</label>
                  <input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #BFEDE5', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>End Time</label>
                  <input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6, border: '1px solid #BFEDE5', fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} style={{ background: '#E2E8F0', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#087F79', color: '#FFFFFF', border: 'none', padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Timetable</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Authoritative Checkout Modal */}
      {checkoutModal.isOpen && checkoutModal.order && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, width: 460, padding: 26, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid #E3EEEB', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#E6FFFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#087F79' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#183B3A' }}>Razorpay Authoritative Checkout</div>
                  <div style={{ fontSize: 11, color: '#708583' }}>Order ID: {checkoutModal.order.order_id}</div>
                </div>
              </div>
              <button onClick={() => setCheckoutModal({ isOpen: false, plan: null, order: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#708583' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#F5FAF9', borderRadius: 10, padding: 16, marginBottom: 18, border: '1px solid #BFEDE5' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#087F79', marginBottom: 8 }}>
                {checkoutModal.plan?.name} ({isYearlyBilling ? 'Annual Billing' : 'Monthly Billing'})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#708583' }}>Plan Subtotal:</span>
                  <strong>₹{parseFloat(checkoutModal.order.subtotal).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#708583' }}>GST (18% CGST + SGST):</span>
                  <strong>₹{parseFloat(checkoutModal.order.tax_amount).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ borderTop: '1px solid #BFEDE5', paddingTop: 6, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                  <span style={{ fontWeight: 800, color: '#183B3A' }}>Total Authoritative Payable:</span>
                  <strong style={{ color: '#087F79' }}>₹{parseFloat(checkoutModal.order.amount).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#708583', marginBottom: 20, lineHeight: 1.4 }}>
              By confirming, you authorize Smart Clinic OS Technologies Pvt Ltd to process payment. A sequential GST tax invoice (INV-YYYYMM-XXXX) with downloadable PDF will be generated instantly.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setCheckoutModal({ isOpen: false, plan: null, order: null })}
                style={{ flex: 1, background: '#EDF2F7', border: 'none', padding: '12px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#4A5568' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyPayment}
                disabled={isPaying}
                style={{
                  flex: 2,
                  background: '#087F79',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isPaying ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {isPaying ? 'Verifying HMAC Signature...' : `Pay ₹${parseFloat(checkoutModal.order.amount).toLocaleString('en-IN')} via Razorpay`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Doctor to this Clinic Location */}
      {showAddDoctorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(24,59,58,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 540, width: '100%', padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#183B3A' }}>Add Doctor to My Location</h3>
                <div style={{ fontSize: 12, color: '#708583', marginTop: 2 }}>Doctor will be assigned exclusively to this clinic facility.</div>
              </div>
              <button onClick={() => setShowAddDoctorModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#708583' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddDoctorToLocation}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#183B3A' }}>Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Rao"
                    value={addDoctorForm.full_name}
                    onChange={(e) => setAddDoctorForm({ ...addDoctorForm, full_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#183B3A' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. doctor@careplus.in"
                    value={addDoctorForm.email}
                    onChange={(e) => setAddDoctorForm({ ...addDoctorForm, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4, fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#183B3A' }}>Specialty *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. General Physician"
                    value={addDoctorForm.specialty}
                    onChange={(e) => setAddDoctorForm({ ...addDoctorForm, specialty: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#183B3A' }}>Qualifications</label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD"
                    value={addDoctorForm.qualification}
                    onChange={(e) => setAddDoctorForm({ ...addDoctorForm, qualification: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4, fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#183B3A' }}>Medical Registration No.</label>
                  <input
                    type="text"
                    placeholder="e.g. KMC-88392"
                    value={addDoctorForm.medical_registration_number}
                    onChange={(e) => setAddDoctorForm({ ...addDoctorForm, medical_registration_number: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#183B3A' }}>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={addDoctorForm.consultation_fee}
                    onChange={(e) => setAddDoctorForm({ ...addDoctorForm, consultation_fee: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4, fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  style={{ padding: '10px 16px', background: '#E3EEEB', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingDoctor}
                  style={{ padding: '10px 20px', background: '#087F79', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  {isAddingDoctor ? 'Adding...' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Receptionist to this Clinic Location */}
      {showAddReceptionistModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(24,59,58,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 500, width: '100%', padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#183B3A' }}>Add Receptionist to My Location</h3>
                <div style={{ fontSize: 12, color: '#708583', marginTop: 2 }}>Front desk staff will manage tokens and billing for this clinic location.</div>
              </div>
              <button onClick={() => setShowAddReceptionistModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#708583' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddReceptionistToLocation}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#183B3A' }}>Staff Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunita Nair"
                  value={addReceptionistForm.full_name}
                  onChange={(e) => setAddReceptionistForm({ ...addReceptionistForm, full_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4, fontSize: 13 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#183B3A' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. receptionist@careplus.in"
                  value={addReceptionistForm.email}
                  onChange={(e) => setAddReceptionistForm({ ...addReceptionistForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4, fontSize: 13 }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#183B3A' }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 22222"
                  value={addReceptionistForm.phone_number}
                  onChange={(e) => setAddReceptionistForm({ ...addReceptionistForm, phone_number: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D2E4E1', borderRadius: 8, marginTop: 4, fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddReceptionistModal(false)}
                  style={{ padding: '10px 16px', background: '#E3EEEB', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingReceptionist}
                  style={{ padding: '10px 20px', background: '#087F79', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  {isAddingReceptionist ? 'Adding...' : 'Add Receptionist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

