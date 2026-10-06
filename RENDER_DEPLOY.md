# Render Free deployment runbook.
#
# Why this file exists: Render cannot be provisioned from inside OpenCode because it
# requires an authenticated Render account and a linked Git remote. Everything below
# is the exact configuration and the manual actions that remain.
#
# Target architecture:
#   Next.js (Node 24) -> custom server.js (socket.io + Next request handler)
#   -> Neon PostgreSQL (via PrismaNeonHTTP)   -> Cloudinary (uploads)
#
# Nothing in the Render runtime path depends on Cloudflare:
#   - wrangler / OpenNext builds are only in build:cloudflare, not build/start.
#   - src/lib/prisma.ts uses PrismaNeonHTTP (plain fetch), not WebSocket.
#
# Build command (Render):
#   npm ci && npm run build
# Start command (Render):
#   npm start            # -> node server.js
#
# Node version is pinned by package.json engines: node 24.x. Render picks this up.
#
# ---------------------------------------------------------------------------
# Runtime environment variables Render MUST set (values are already in your
# local .env — paste them into Render's Environment section, do NOT commit them):
#
#   DATABASE_URL                  (Neon connection string)
#   JWT_SECRET
#   NEXTAUTH_SECRET
#   NEXT_PUBLIC_APP_URL          https://<service>.onrender.com
#   CLOUDINARY_API_KEY
#   CLOUDINARY_API_SECRET
#   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
#   NEXT_PUBLIC_CLOUDINARY_VIDEO_PRESET
#   GOOGLE_CLIENT_ID
#   GOOGLE_CLIENT_SECRET          (if Google OAuth is used)
#   NVIDIA_API_KEY
#   NEXTAU_URL / GOOGLE callback origin must be added in Google Cloud Console:
#     https://<service>.onrender.com/api/auth/google/callback
#
# ---------------------------------------------------------------------------
# After deploy, on https://<service>.onrender.com verify:
#   /                  200 html
#   /api/health        200 json
#   /_next/static/...  200 correct content-type
#   /api/cars          200 (Neon reachable)
#   POST /api/auth/login 200 (bcrypt + JWT + Prisma over Neon HTTP)
#
# NOTE on /uploads: server.js serves uploaded files from public/uploads on disk.
# Render Free disk is ephemeral — uploads in this directory will NOT survive a
# redeploy/restart. The app already routes car/user media through Cloudinary, so
# this is acceptable; do NOT rely on public/uploads as durable storage.
