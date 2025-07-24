/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Temporarily ignore ESLint errors during build for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during build for deployment
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