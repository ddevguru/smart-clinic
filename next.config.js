/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    let raw = process.env.INTERNAL_BACKEND_URL || 'https://smart-clinic-backend-4ztd.onrender.com';
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = `http://${raw}:5000`;
    }
    const cleanHost = raw.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${cleanHost}/api/v1/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
