/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Trong Docker, backend service có tên là "backend"
    return [
      {
        source: '/login',
        destination: '/', // Redirect /login to the root page
      },
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/:path*', // Proxy to Backend container using service name
      },
      {
        source: '/faces/:path*',
        destination: 'http://backend:8000/faces/:path*', // Proxy to Backend faces folder using service name
      },
    ];
  },
  // Enable CORS for development
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
}

export default nextConfig
