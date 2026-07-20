import type { NextConfig } from 'next'

/** Hashed build assets — safe to cache immutably for 1 year. */
const IMMUTABLE_ONE_YEAR = 'public, max-age=31536000, immutable'

/** Public files without content hashes — short browser TTL + long SWR. */
const PUBLIC_ASSET_SHORT = 'public, max-age=86400, stale-while-revalidate=604800'

/** HTML / public JSON at the CDN edge (Vercel) with quick revalidation. */
const HTML_CDN = 'public, max-age=0, must-revalidate, s-maxage=60, stale-while-revalidate=30'

/** Auth, checkout, admin — never cache. */
const PRIVATE_NO_STORE = 'private, no-store, max-age=0, must-revalidate'

const nextConfig: NextConfig = {
  images: {
    /** Дозволяє `next/image` для файлів з `public/images/` і query (напр. `?rev=` для скидання кешу). */
    localPatterns: [{ pathname: '/images/**' }],
    qualities: [75, 80],
    // DNS (e.g. NAT64 / 64:ff9b::…) can make public CDNs resolve to addresses Next
    // treats as “private”, which breaks `/_next/image` for Supabase storage.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'torssen.com',
        pathname: '/image/**',
      },
      {
        protocol: 'https',
        hostname: 'www.torssen.com',
        pathname: '/image/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  serverExternalPackages: ['exceljs'],
  experimental: {
    // framer-motion не додаємо: optimizePackageImports може зламати AnimatePresence / exit.
    optimizePackageImports: ['lucide-react'],
    serverActions: {
      bodySizeLimit: '50mb',
    },
    proxyClientMaxBodySize: '50mb',
  },

  async headers() {
    // Immutable hashed chunks break Turbopack HMR in development (stale module factories).
    const isDev = process.env.NODE_ENV === 'development'

    const productionAssetHeaders = isDev
      ? []
      : [
          {
            source: '/_next/static/:path*',
            headers: [{ key: 'Cache-Control', value: IMMUTABLE_ONE_YEAR }],
          },
          {
            source: '/_next/image/:path*',
            headers: [{ key: 'Cache-Control', value: IMMUTABLE_ONE_YEAR }],
          },
        ]

    return [
      ...productionAssetHeaders,

      // ─── Public static assets (no hash in path — moderate TTL) ───────────
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE_ONE_YEAR }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: PUBLIC_ASSET_SHORT }],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: PUBLIC_ASSET_SHORT }],
      },
      {
        source: '/robots.txt',
        headers: [{ key: 'Cache-Control', value: PUBLIC_ASSET_SHORT }],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },

      // ─── API: cacheable public reference data (must precede /api catch-alls) ─
      {
        source: '/api/services',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
      {
        source: '/api/np/cities',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/api/np/warehouses',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },

      // ─── API: sensitive / user-specific — never cache ────────────────────
      {
        source: '/api/admin/:path*',
        headers: [{ key: 'Cache-Control', value: PRIVATE_NO_STORE }],
      },
      {
        source: '/api/auth/:path*',
        headers: [{ key: 'Cache-Control', value: PRIVATE_NO_STORE }],
      },
      {
        source: '/api/orders/:path*',
        headers: [{ key: 'Cache-Control', value: PRIVATE_NO_STORE }],
      },
      {
        source: '/api/checkout/:path*',
        headers: [{ key: 'Cache-Control', value: PRIVATE_NO_STORE }],
      },
      {
        source: '/api/contact',
        headers: [{ key: 'Cache-Control', value: PRIVATE_NO_STORE }],
      },
      {
        source: '/api/search',
        headers: [{ key: 'Cache-Control', value: PRIVATE_NO_STORE }],
      },
      {
        source: '/api/vin',
        headers: [{ key: 'Cache-Control', value: PRIVATE_NO_STORE }],
      },
      {
        source: '/api/health/:path*',
        headers: [{ key: 'Cache-Control', value: PRIVATE_NO_STORE }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: PRIVATE_NO_STORE }],
      },

      // ─── HTML documents (exclude api, _next, static public assets) ─────
      {
        source: '/',
        headers: [{ key: 'Cache-Control', value: HTML_CDN }],
      },
      {
        source: '/((?!api|_next|images|fonts|manifest.json|robots.txt|sitemap.xml).*)',
        headers: [{ key: 'Cache-Control', value: HTML_CDN }],
      },
    ]
  },
}

export default nextConfig
