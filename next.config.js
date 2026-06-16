/** @type {import('next').NextConfig} */

// Content-Security-Policy source allowlist derived from a codebase survey
// (see docs/SECURITY_AUDIT.md). Only browser-initiated resources are listed;
// server-side fetch hosts are NOT included because CSP does not govern them.
// Keep this in sync when adding external scripts/iframes/fonts/images.
const CSP_SRC = {
  frameSrc: 'https://ssltvc.investing.com',
  styleSrc: ['https://fonts.googleapis.com'],
  fontSrc: ['https://fonts.gstatic.com'],
  imgSrc: ['https://images.unsplash.com', 'data:'],
  // Supabase project host is env-driven; wildcard the subdomain.
  connectSrc: ['https://*.supabase.co'],
}

function buildCsp(isDev) {
  const parts = [
    // Next.js App Router injects inline scripts for hydration/state, and
    // components use styled-jsx inline styles, so both need 'unsafe-inline'.
    // script-src has no external hosts by design — all app JS is same-origin.
    // In dev, the webpack middleware uses eval() and needs 'unsafe-eval'.
    "default-src 'self'",
    `script-src 'self'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline' ${CSP_SRC.styleSrc.join(' ')}`,
    `font-src 'self' ${CSP_SRC.fontSrc.join(' ')}`,
    `img-src 'self' ${CSP_SRC.imgSrc.join(' ')}`,
    `frame-src 'self' ${CSP_SRC.frameSrc}`,
    `connect-src 'self' ${CSP_SRC.connectSrc.join(' ')}`,
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ]
  return parts.join('; ')
}

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['yahoo-finance2'],
  },
  async headers() {
    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: buildCsp(process.env.NODE_ENV === 'development'),
      },
      {
        // HSTS — only meaningful over HTTPS; Render terminates TLS.
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        // Prevent clickjacking. frame-ancestors 'none' in CSP also covers this.
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        // Force MIME sniffing off so uploaded HTML isn't executed as a page.
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        // Control the Referrer header leaked to outbound links.
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        // Disable Flash/PDF plugin embedding (defense in depth).
        key: 'X-Permitted-Cross-Domain-Policies',
        value: 'none',
      },
    ]
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  webpack(config) {
    config.resolve.alias['@'] = __dirname
    return config
  },
}

module.exports = nextConfig
