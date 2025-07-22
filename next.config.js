/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // ESLint errors will now fail the build
    ignoreDuringBuilds: false,
  },
  typescript: {
    // TypeScript errors will now fail the build
    ignoreBuildErrors: false,
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