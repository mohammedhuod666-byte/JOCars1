/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loaderFile: './src/lib/image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: '*.ngrok-free.app' },
      { protocol: 'https', hostname: '*.ngrok.io' },
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: '127.0.0.1' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  /**
   * Files that must ship with the server bundle even though the dependency
   * tracer does not see them.
   *
   * `schema.prisma` is the generated client's runtime model description. The client
   * references it through `path.join(__dirname, "schema.prisma")` as a bundling hint
   * for the file tracer, which is not something a tracer can follow on its own.
   *
   * The Query Compiler's `query_compiler_bg.wasm` is deliberately NOT listed: it is
   * inlined into the client as base64 by `scripts/patch-prisma-wasm-inline.cjs`,
   * because Workers have no filesystem to read it from. Listing it here would only
   * upload 1.86 MB that nothing loads.
   *
   * This is purely a bundling concern. The Prisma version, schema, and client
   * construction are untouched.
   */
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/schema.prisma'],
  },
  // Keep this list explicit; a wildcard permits arbitrary development origins.
  allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000'],
  compress: true,
    poweredByHeader: false,
    async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://res.cloudinary.com https://maps.googleapis.com https://maps.google.com https://*.tile.openstreetmap.org https://*.ngrok-free.app https://*.ngrok.io https://*.googleusercontent.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' wss: ws: https://res.cloudinary.com https://api.cloudinary.com https://*.ngrok-free.app https://*.ngrok.io https://accounts.google.com https://oauth2.googleapis.com https://rest.ably.io https://*.ably.io https://main.realtime.ably.net https://*.ably-realtime.com; object-src 'none'; media-src 'self' blob: data: https://res.cloudinary.com; base-uri 'self'; form-action 'self'; frame-src 'self' https://www.openstreetmap.org https://maps.google.com https://maps.googleapis.com https://www.youtube.com https://youtube.com https://youtu.be https://accounts.google.com; frame-ancestors 'none';" },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // DEFAULT-DENY for the whole API surface.
        //
        // Next/Vercel stamp `public, max-age=0, must-revalidate` on dynamic route
        // handlers by default. `max-age=0` forces a compliant cache to revalidate
        // on every use, so it is not a live stale-data leak — but `public` on a
        // response that varies by authentication is still the wrong declaration,
        // and it applies to ~190 routes at once. Any non-compliant intermediary
        // (corporate proxy, some older browsers) is then free to store and
        // replay a seller's or an admin's response.
        //
        // Measured across 22 protected endpoints: 19 carried `public` with no
        // `Vary`. Two routes genuinely want long public caching and are
        // re-declared below so the more specific rule wins.
        //
        // The perf cost is nil: these responses already revalidated every time.
        // Ordering matters — Next applies matching rules in order and the last
        // header for a key wins, so the specific rules below override this one.
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'Vary', value: 'Authorization, Cookie' },
        ],
      },
      {
        // Public, immutable, and identical for every caller.
        source: '/api/news-image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        // Audio for an APPROVED listing. The route itself returns
        // `private, no-store` for the unapproved branch, so only the public case
        // is declared cacheable here.
        source: '/api/sounds/stream/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // (The cars API needed its own rule once; it is now covered by the
        // blanket /api/:path* deny above. Kept as an explicit, self-documenting
        // entry because the cars prefix carries the document endpoints, and a
        // future edit to the blanket rule should not silently re-expose them.)
        source: '/api/cars/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'Vary', value: 'Authorization, Cookie' },
        ],
      },
      {
        source: '/api/ai/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
