/** @type {import('next').NextConfig} */

function resolveBackendUrl(raw) {
  if (!raw) return 'https://smart-clinic-backend-4ztd.onrender.com';
  let url = raw.trim();

  // If Render passed an internal hostname like "smart-clinic-backend-4ztd" or "http://smart-clinic-backend-4ztd:5000"
  if (url.includes('smart-clinic-backend') || url.includes('onrender.com')) {
    let hostname = url.replace(/^https?:\/\//, '').replace(/:\d+$/, '').replace(/\/.*$/, '');
    if (!hostname.endsWith('.onrender.com')) {
      hostname = `${hostname}.onrender.com`;
    }
    return `https://${hostname}`;
  }

  // Local development
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    if (!/:\d+/.test(url)) {
      url = `${url}:5000`;
    }
    return url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const raw = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://smart-clinic-backend-4ztd.onrender.com';
    const targetUrl = resolveBackendUrl(raw);

    return [
      {
        source: '/api/v1/:path*',
        destination: `${targetUrl}/api/v1/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
