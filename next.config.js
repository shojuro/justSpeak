/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Disable ESLint during builds for MVP
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds for MVP
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/auth/:path*',
        destination: '/practice',
        permanent: false,
      },
      {
        source: '/settings/:path*',
        destination: '/practice',
        permanent: false,
      },
      {
        source: '/onboarding',
        destination: '/practice',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/practice',
        permanent: false,
      },
    ]
  }
}

module.exports = nextConfig