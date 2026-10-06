import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext (Cloudflare Workers) build configuration.
 *
 * Context: this app runs on Vercel today. Vercel serverless functions cap a
 * request body at 4.5MB, which is the root cause of a long chain of upload
 * problems (a 20-photo gallery, any multi-page PDF). Cloudflare Workers allows a
 * 100MB body, so moving here removes that ceiling structurally rather than by
 * working around it with compression ladders.
 *
 * The price of the move is that Workers has no native binaries and no writable
 * filesystem. See the notes in wrangler.jsonc and src/lib for how sharp, the
 * filesystem writes and Prisma are handled.
 */
export default defineCloudflareConfig();
