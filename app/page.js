'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  CheckCircle2,
  Activity,
  Layers,
  ChevronRight,
  Zap,
  Phone,
  Key
} from 'lucide-react';
import { API_URL } from '../config/apiConfig';

export default function SmartClinicOSGateway() {
  const router = useRouter();
  const [backendStatus, setBackendStatus] = useState('checking'); // 'healthy' | 'offline'

  // Web Admin Login State
  const [identifier, setIdentifier] = useState('admin@smartclinicos.in');
  const [password, setPassword] = useState('Password@123');
  const [selectedAdminRole, setSelectedAdminRole] = useState('SUPER_ADMIN'); // 'SUPER_ADMIN' | 'LOCATION_ADMIN'
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

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

  const handleQuickSelect = (role, email, clinicId = null) => {
    setSelectedAdminRole(role);
    setIdentifier(email);
    setPassword('Password@123');
    setLoginError('');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_URL}/auth/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Authentication failed');
      }

      const role = data.data?.role;
      const token = data.data?.token;
      const clinicId = data.data?.clinic_id;

      if (typeof window !== 'undefined') {
        localStorage.setItem('scos_auth_token', token);
        localStorage.setItem('scos_user_role', role);
        if (clinicId) localStorage.setItem('scos_clinic_id', clinicId);
      }

      if (role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (role === 'CLINIC_OWNER' || role === 'ADMIN') {
        router.push('/owner');
      } else {
        setLoginError('This web portal is strictly for Super Admin and Location Admins. Doctors, Receptionists, and Patients please access via the Smart Clinic OS Mobile App.');
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
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
              Administration & Governance Web Console • Node.js & PostgreSQL
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
              {backendStatus === 'healthy' ? 'Express API: Active (Port 5000)' : 'Connecting to API...'}
            </span>
          </div>

          <div style={{ background: '#18A99A', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>
            Production Edition
          </div>
        </div>
      </header>

      {/* Hero Notice Banner */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#BFEDE5', color: '#087F79', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          <Shield size={16} /> Web Administration Portal
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#087F79', margin: '0 0 12px', letterSpacing: -0.8 }}>
          Healthcare Administration & Governance
        </h1>
        <p style={{ fontSize: 16, color: '#4A5568', maxWidth: 780, margin: '0 auto', lineHeight: 1.6 }}>
          Web access is exclusively reserved for <strong>Platform Super Admin</strong> (managing all clinics, admins, doctors, receptionists, and users) and <strong>Clinic Location Admins</strong> (managing their location-specific doctors, receptionists, patients, and queue).
        </p>
      </div>

      {/* Main Split Console: Web Admin Login & Portal Cards */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 40 }}>
          
          {/* Card 1: Super Admin Console */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '2px solid #2C5282', padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(44,82,130,0.1)', color: '#2C5282', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={28} />
              </div>
              <span style={{ background: '#2C5282', color: '#FFFFFF', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                Super Admin
              </span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#2C5282', margin: '0 0 8px' }}>
              Super Admin Console
            </h3>
            <p style={{ fontSize: 13, color: '#718096', margin: '0 0 16px', lineHeight: 1.5 }}>
              Universal platform oversight. View, manage, create, and verify all clinic locations, clinic admins, doctors, receptionists, registered users/patients, and SaaS subscriptions across India.
            </p>
            <div style={{ background: '#F7FAFC', padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 12, color: '#4A5568' }}>
              <strong>Scope:</strong> All Clinics • All Admins • All Doctors • All Receptionists • All Users
            </div>
            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={() => handleQuickSelect('SUPER_ADMIN', 'admin@smartclinicos.in')}
                style={{ width: '100%', background: '#2C5282', color: '#FFFFFF', border: 'none', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Access Super Admin Console <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Card 2: Clinic Location Admin Console */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '2px solid #087F79', padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: '#E5F7F3', color: '#087F79', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={28} />
              </div>
              <span style={{ background: '#087F79', color: '#FFFFFF', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                Location Admin
              </span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#087F79', margin: '0 0 8px' }}>
              Clinic Location Admin
            </h3>
            <p style={{ fontSize: 13, color: '#718096', margin: '0 0 16px', lineHeight: 1.5 }}>
              Strictly scoped to your clinic location. View and manage only doctors, receptionists, and patients registered at your specific clinic. Roster doctor schedules, monitor OP queues, and track local revenue.
            </p>
            <div style={{ background: '#F5FAF9', padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 12, color: '#4A5568' }}>
              <strong>Scope:</strong> Location Doctors • Location Receptionists • Location Patients • Local Revenue
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 'auto' }}>
              <button
                onClick={() => handleQuickSelect('LOCATION_ADMIN', 'owner@careplus.in')}
                style={{ background: '#087F79', color: '#FFFFFF', border: 'none', padding: '12px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
              >
                CarePlus Location
              </button>
              <button
                onClick={() => handleQuickSelect('LOCATION_ADMIN', 'owner@apex.in')}
                style={{ background: '#18A99A', color: '#FFFFFF', border: 'none', padding: '12px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
              >
                Apex Location
              </button>
            </div>
          </div>

          {/* Card 3: Interactive Web Admin Sign-In */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Lock size={20} color="#087F79" />
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#183B3A' }}>
                Web Admin Sign In
              </h3>
            </div>

            <form onSubmit={handleAdminLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4A5568', marginBottom: 6 }}>
                  Admin Email / Phone
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4A5568', marginBottom: 6 }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {loginError && (
                <div style={{ background: '#FFF5F5', color: '#C53030', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14, border: '1px solid #FEB2B2' }}>
                  {loginError}
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
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {isLoggingIn ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#718096', textAlign: 'center' }}>
              Default Test Password for all accounts: <code>Password@123</code>
            </div>
          </div>
        </div>

        {/* Big Showcase Section: Unified Mobile App for Users, Doctors, Receptionists */}
        <div style={{ background: '#FFFFFF', borderRadius: 20, border: '2px solid #BFEDE5', padding: '36px 32px', boxShadow: '0 8px 30px rgba(8,127,121,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, background: '#087F79', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(8,127,121,0.3)' }}>
                <Smartphone size={30} />
              </div>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E5F7F3', color: '#087F79', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                  📱 ONE UNIFIED MOBILE APPLICATION
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#183B3A', margin: 0 }}>
                  Mobile Client for Patients, Doctors & Receptionists
                </h2>
              </div>
            </div>

            <div style={{ background: '#F5FAF9', border: '1px solid #BFEDE5', borderRadius: 12, padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#087F79' }}>
              Built with Flutter • Role-Based Access on Login Page
            </div>
          </div>

          <p style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.6, marginBottom: 24 }}>
            In Smart Clinic OS, <strong>Users (Patients)</strong>, <strong>Doctors</strong>, and <strong>Receptionists</strong> all share <strong>one single unified mobile app</strong> (located in <code>patient_app/</code>). Upon opening the application, the login screen allows each role to authenticate and provides tailored access:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            
            {/* Feature 1: Patients / Users */}
            <div style={{ background: '#F5FAF9', borderRadius: 14, border: '1px solid #BFEDE5', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#18A99A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#087F79' }}>
                    1. Patients / Users
                  </h4>
                  <span style={{ fontSize: 11, color: '#718096' }}>Phone OTP or Password Login</span>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#4A5568', lineHeight: 1.8 }}>
                <li>Discover clinics & book appointment slots</li>
                <li>Live queue tracking with Google Maps traffic alert</li>
                <li>View & download digital prescriptions (SHA-256)</li>
                <li>Secure medical records consent sharing</li>
                <li>At-home nursing & teleconsultation video calls</li>
              </ul>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#087F79', fontWeight: 600 }}>
                Demo Phone: +919876543210 • OTP: 123456
              </div>
            </div>

            {/* Feature 2: Doctors */}
            <div style={{ background: '#F5FAF9', borderRadius: 14, border: '1px solid #BFEDE5', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#087F79', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#087F79' }}>
                    2. Doctors
                  </h4>
                  <span style={{ fontSize: 11, color: '#718096' }}>Doctor Credentials Login</span>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#4A5568', lineHeight: 1.8 }}>
                <li>Live OPD Queue caller ("Call Next Patient" button)</li>
                <li>Patient clinical examination & complaints view</li>
                <li>Structured Rx builder with dosage & instructions</li>
                <li>Publish digital prescription with cryptographic seal</li>
                <li>Instant complete consultation & teleconsultation</li>
              </ul>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#087F79', fontWeight: 600 }}>
                Demo Doctor: doctor@careplus.in • Password@123
              </div>
            </div>

            {/* Feature 3: Receptionists */}
            <div style={{ background: '#F5FAF9', borderRadius: 14, border: '1px solid #BFEDE5', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#2B6CB0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#2B6CB0' }}>
                    3. Receptionists
                  </h4>
                  <span style={{ fontSize: 11, color: '#718096' }}>Staff Credentials Login</span>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#4A5568', lineHeight: 1.8 }}>
                <li>Rapid walk-in patient check-in registration</li>
                <li>Instant sequential token issuance (e.g. W-01, W-02)</li>
                <li>Real-time front desk OP queue visualizer</li>
                <li>Record consultation payments (Cash / UPI / Card)</li>
                <li>Sequential receipt generation (RCP-YYYYMMDD-XXXX)</li>
              </ul>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#2B6CB0', fontWeight: 600 }}>
                Demo Receptionist: receptionist@careplus.in • Password@123
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
