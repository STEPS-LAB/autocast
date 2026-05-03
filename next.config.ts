import type { NextConfig } from 'next'

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
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // framer-motion не додаємо: optimizePackageImports може зламати AnimatePresence / exit.
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
