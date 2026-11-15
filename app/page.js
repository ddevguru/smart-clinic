'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Building2,
  Stethoscope,
  ClipboardList,
  Users,
  Smartphone,
  Lock,
  ArrowRight,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  MapPin
} from 'lucide-react';
import { API_URL } from '../config/apiConfig';

export default function SmartClinicOSGateway() {
  const router = useRouter();
  const [backendStatus, setBackendStatus] = useState('checking'); // 'healthy' | 'offline'

  // Web Admin Login State
  const [identifier, setIdentifier] = useState('admin@smartclinicos.in');
  const [password, setPassword] = useState('Password@123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccessNotice, setLoginSuccessNotice] = useState('');

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${API_URL}/health`);
        const data = await res.json();
        if (data.status === 'healthy') {
          setBackendStatus('healthy');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    }
    checkHealth();
  }, []);

  const handleFillDemo = (email, pass = 'Password@123') => {
    setIdentifier(email);
    setPassword(pass);
    setLoginError('');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    setLoginSuccessNotice('');

    try {
      const res = await fetch(`${API_URL}/auth/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Authentication failed. Please verify credentials.');
      }

      const role = data.data?.role;
      const token = data.data?.token || data.data?.access_token;
      const clinicId = data.data?.clinic_id;
      const clinicName = data.data?.clinic_name;
      const fullName = data.data?.user?.full_name || 'Administrator';

      if (typeof window !== 'undefined') {
        localStorage.setItem('scos_auth_token', token);
        localStorage.setItem('scos_user_role', role);
        if (clinicId) localStorage.setItem('scos_clinic_id', clinicId);
        if (clinicName) localStorage.setItem('scos_clinic_name', clinicName);
        if (fullName) localStorage.setItem('scos_user_name', fullName);
      }

      if (role === 'SUPER_ADMIN') {
        setLoginSuccessNotice('Super Admin authenticated. Redirecting to Universal Platform Console...');
        setTimeout(() => router.push('/admin'), 600);
      } else if (role === 'CLINIC_OWNER' || role === 'LOCATION_ADMIN' || role === 'ADMIN') {
        setLoginSuccessNotice(`Location Admin verified for "${clinicName || 'Assigned Clinic'}". Redirecting to Scoped Console...`);
        setTimeout(() => router.push('/owner'), 600);
      } else {
        setLoginError('Doctor, Receptionist, and Patient logins must be accessed via the Smart Clinic OS Mobile Application. Web access is restricted to Platform and Location Administrators.');
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5FAF9', color: '#183B3A', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Top Navigation Bar */}
      <header style={{ background: '#087F79', color: '#FFFFFF', padding: '16px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(8,127,121,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FFFFFF', color: '#087F79', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>
              Smart Clinic OS
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Healthcare Administration & Governance Web Portal • Multi-Location SaaS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Backend Health Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: backendStatus === 'healthy' ? 'rgba(72,187,120,0.2)' : 'rgba(245,101,101,0.2)',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            border: backendStatus === 'healthy' ? '1px solid #48BB78' : '1px solid #F56565'
          }}>
            <Server size={14} color={backendStatus === 'healthy' ? '#48BB78' : '#F56565'} />
            <span>
              {backendStatus === 'healthy' ? 'Cloud Backend: Active & Healthy' : 'Connecting to API...'}
            </span>
          </div>

          <div style={{ background: '#18A99A', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>
            Production Edition
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 24px 60px' }}>
        
        {/* Header Notice */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#BFEDE5', color: '#087F79', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            <Shield size={16} /> Web Administration & Multi-Location Portal
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#087F79', margin: '0 0 10px', letterSpacing: -0.8 }}>
            Smart Clinic OS Administrative Console
          </h1>
          <p style={{ fontSize: 15, color: '#4A5568', maxWidth: 760, margin: '0 auto', lineHeight: 1.6 }}>
            Sign in below to automatically access your administrative console. The system dynamically reads your account profile and routes you to the <strong>Universal Super Admin Dashboard</strong> or your specific <strong>Clinic Location Dashboard</strong>.
          </p>
        </div>

        {/* Central Clean Unified Login Form Card */}
        <div style={{ maxWidth: 520, margin: '0 auto 48px', background: '#FFFFFF', borderRadius: 20, border: '1.5px solid #D2E4E1', padding: '36px 32px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #EAEAEA' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E5F7F3', color: '#087F79', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#183B3A' }}>
                Administrator Sign In
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#718096' }}>
                Enter your registered administrator email or phone
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2D3748', marginBottom: 6 }}>
                Admin Email or Phone
              </label>
              <input
                type="text"
                placeholder="e.g. admin@smartclinicos.in or owner@careplus.in"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #CBD5E0', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' }}
                required
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2D3748', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #CBD5E0', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' }}
                required
              />
            </div>

            {loginError && (
              <div style={{ background: '#FFF5F5', color: '#C53030', padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16, border: '1px solid #FEB2B2', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccessNotice && (
              <div style={{ background: '#F0FFF4', color: '#276749', padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16, border: '1px solid #9AE6B4', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} />
                <span>{loginSuccessNotice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%',
                background: '#087F79',
                color: '#FFFFFF',
                border: 'none',
                padding: '13px 18px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 800,
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(8,127,121,0.25)',
                transition: 'background 0.2s'
              }}
            >
              {isLoggingIn ? 'Verifying Credentials...' : 'Sign In to Portal'} <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #EDF2F7' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#718096', marginBottom: 10, textAlign: 'center' }}>
              Quick Fill Demo Credentials (Password: <code>Password@123</code>):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => handleFillDemo('admin@smartclinicos.in')}
                style={{
                  background: '#EDF2F7',
                  border: '1px solid #CBD5E0',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#2C5282',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                🛡️ Platform Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('owner@careplus.in')}
                style={{
                  background: '#E5F7F3',
                  border: '1px solid #A2E3D8',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#087F79',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                🏢 Location Admin Demo
              </button>
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 11, color: '#718096', textAlign: 'center', lineHeight: 1.5 }}>
              💡 <strong>Multi-Location Dynamic Routing:</strong> Any newly added clinic location and its location admin created by Super Admin in the database can sign in through this form.
            </p>
          </div>
        </div>

        {/* Roles & Isolation Architecture Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 40 }}>
          
          {/* Card 1: Super Admin Console Scope */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '2px solid #2C5282', padding: 26, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(44,82,130,0.1)', color: '#2C5282', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} />
              </div>
              <span style={{ background: '#2C5282', color: '#FFFFFF', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                Universal Access
              </span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2C5282', margin: '0 0 8px' }}>
              1. Platform Super Admin
            </h3>
            <p style={{ fontSize: 13, color: '#4A5568', margin: '0 0 14px', lineHeight: 1.6 }}>
              Full governance across all clinics in India. Super Admin can onboard unlimited new clinic locations, create & assign clinic admins, inspect doctors, receptionists, registered users/patients, and oversee SaaS billing.
            </p>
            <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10, fontSize: 12, color: '#2D3748' }}>
              <strong>Scope:</strong> All Clinics • All Admins • All Doctors • All Receptionists • All Users • Global Revenue
            </div>
          </div>

          {/* Card 2: Clinic Location Admin Console Scope */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '2px solid #087F79', padding: 26, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E5F7F3', color: '#087F79', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} />
              </div>
              <span style={{ background: '#087F79', color: '#FFFFFF', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                Dynamic Location Scoped
              </span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#087F79', margin: '0 0 8px' }}>
              2. Clinic Location Admin
            </h3>
            <p style={{ fontSize: 13, color: '#4A5568', margin: '0 0 14px', lineHeight: 1.6 }}>
              Strictly isolated to their assigned clinic location. Location Admin views and manages <strong>only</strong> doctors, receptionists, and patients registered at their clinic. No cross-clinic data leakage.
            </p>
            <div style={{ background: '#F5FAF9', border: '1px solid #BFEDE5', padding: 12, borderRadius: 10, fontSize: 12, color: '#087F79' }}>
              <strong>Scope:</strong> Location Doctors • Location Receptionists • Location Patients • OPD Queue • Local Revenue
            </div>
          </div>

        </div>

        {/* Mobile Application Section for Doctors, Receptionists, Patients */}
        <div style={{ background: '#FFFFFF', borderRadius: 20, border: '2px solid #BFEDE5', padding: '32px 28px', boxShadow: '0 8px 30px rgba(8,127,121,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: '#087F79', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(8,127,121,0.3)' }}>
                <Smartphone size={28} />
              </div>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E5F7F3', color: '#087F79', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                  📱 ONE UNIFIED MOBILE APPLICATION
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#183B3A', margin: 0 }}>
                  Mobile Client for Patients, Doctors & Receptionists
                </h2>
              </div>
            </div>

            <div style={{ background: '#F5FAF9', border: '1px solid #BFEDE5', borderRadius: 12, padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#087F79' }}>
              Built with Flutter • Role-Based Access on Login Page
            </div>
          </div>

          <p style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.6, marginBottom: 20 }}>
            In Smart Clinic OS, <strong>Users (Patients)</strong>, <strong>Doctors</strong>, and <strong>Receptionists</strong> all share <strong>one single unified mobile app</strong> (located in <code>patient_app/</code>). Upon opening the application, the login screen allows each role to authenticate:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            
            {/* Feature 1: Patients / Users */}
            <div style={{ background: '#F5FAF9', borderRadius: 14, border: '1px solid #BFEDE5', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#18A99A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#087F79' }}>
                    1. Patients / Users
                  </h4>
                  <span style={{ fontSize: 11, color: '#718096' }}>Phone OTP Login</span>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#4A5568', lineHeight: 1.8 }}>
                <li>Discover clinics & book appointment slots</li>
                <li>Live queue tracking with Google Maps traffic alert</li>
                <li>View & download digital prescriptions (SHA-256)</li>
                <li>Secure medical records consent sharing</li>
                <li>At-home nursing & teleconsultation video calls</li>
              </ul>
              <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#087F79', fontWeight: 600 }}>
                Demo Phone: +919876543210 • OTP: 123456
              </div>
            </div>

            {/* Feature 2: Doctors */}
            <div style={{ background: '#F5FAF9', borderRadius: 14, border: '1px solid #BFEDE5', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#087F79', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#087F79' }}>
                    2. Doctors
                  </h4>
                  <span style={{ fontSize: 11, color: '#718096' }}>Doctor Credentials Login</span>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#4A5568', lineHeight: 1.8 }}>
                <li>Live OPD Queue caller ("Call Next Patient" button)</li>
                <li>Patient clinical examination & complaints view</li>
                <li>Structured Rx builder with dosage & instructions</li>
                <li>Publish digital prescription with cryptographic seal</li>
                <li>Instant complete consultation & teleconsultation</li>
              </ul>
              <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#087F79', fontWeight: 600 }}>
                Demo Doctor: doctor@careplus.in • Password@123
              </div>
            </div>

            {/* Feature 3: Receptionists */}
            <div style={{ background: '#F5FAF9', borderRadius: 14, border: '1px solid #BFEDE5', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2B6CB0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#2B6CB0' }}>
                    3. Receptionists
                  </h4>
                  <span style={{ fontSize: 11, color: '#718096' }}>Staff Credentials Login</span>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#4A5568', lineHeight: 1.8 }}>
                <li>Rapid walk-in patient check-in registration</li>
                <li>Instant sequential token issuance (e.g. W-01, W-02)</li>
                <li>Real-time front desk OP queue visualizer</li>
                <li>Record consultation payments (Cash / UPI / Card)</li>
                <li>Sequential receipt generation (RCP-YYYYMMDD-XXXX)</li>
              </ul>
              <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#2B6CB0', fontWeight: 600 }}>
                Demo Receptionist: reception@careplus.in • Password@123
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{ background: '#183B3A', color: '#FFFFFF', padding: '24px 36px', textAlign: 'center', fontSize: 13, opacity: 0.9 }}>
        Smart Clinic OS • Indian Healthcare Operating System • Enterprise Multi-Tenant Platform
      </footer>

    </div>
  );
}
