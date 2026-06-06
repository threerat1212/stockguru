/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['yahoo-finance2'],
  },
  webpack(config) {
    config.resolve.alias['@'] = __dirname
    return config
  },
}

module.exports = nextConfig
