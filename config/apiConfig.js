// Smart Clinic OS — Central API URL Resolver
export const API_URL = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL)
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  : (typeof window !== 'undefined' ? '/api/v1' : 'http://localhost:5000/api/v1');

export const BACKEND_ROOT = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL)
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')
  : (typeof window !== 'undefined' ? '' : 'http://localhost:5000');
