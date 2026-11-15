// Smart Clinic OS — Central API URL Resolver
export const LIVE_BACKEND_ORIGIN = 'https://smart-clinic-backend-4ztd.onrender.com';

export const API_URL = (typeof window !== 'undefined')
  ? (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') : '/api/v1')
  : (process.env.INTERNAL_BACKEND_URL || `${LIVE_BACKEND_ORIGIN}/api/v1`);

export const BACKEND_ROOT = (typeof window !== 'undefined')
  ? (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '') : '')
  : (process.env.INTERNAL_BACKEND_URL || LIVE_BACKEND_ORIGIN);
