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
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*', // Proxy to Backend
      },
      {
        source: '/faces/:path*',
        destination: 'http://localhost:8000/faces/:path*', // Proxy to Backend faces folder
      },
    ];
  },
}

export default nextConfig
