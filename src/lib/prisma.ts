import { PrismaClient } from '@prisma/client';

/**
 * Prisma client construction.
 *
 * ONE CLIENT, EVERY RUNTIME
 * The schema generates the Rust-free Query Compiler (WASM, `engineType = "client"`)
 * because Cloudflare Workers cannot load native binaries at all. That engine type
 * requires a driver adapter on every platform, so the adapter is not an edge-case
 * branch here — it is the only valid configuration for this client. Two independent
 * generator outputs (engine for Node, adapter for Workers) were considered and
 * rejected: they force a conditional module import into every call site and ship
 * both clients in both bundles, so "what is tested" and "what is deployed" drift.
 *
 * THE TRANSPORT IS THE INTERESTING PART, AND THE OBVIOUS FACTORY IS THE WRONG ONE
 * `@prisma/adapter-neon` exports two factories. Reading only their names, or their
 * constructor signatures, strongly suggests `PrismaNeon` is the HTTP one. It is not:
 * its queryable class is literally named `NeonWsQueryable<neon.Pool>` — it is
 * WebSocket-backed. `PrismaNeonHTTP` is the fetch-based one. Using the default
 * factory therefore looks correct and is not.
 *
 * The failure was observed on the deployed Worker, not predicted. The FIRST query
 * succeeded (1.2s, correct rows) and every subsequent one returned `error code:
 * 1101` in 30-40ms. The runtime's own log names the mechanism:
 *
 *   Warning: A promise was resolved or rejected from a different request context
 *   than the one it was created in.
 *   The Workers runtime canceled this request because it detected that your
 *   Worker's code had hung and would never generate a response.
 *
 * A WebSocket pool opens its socket inside one request, then settles later
 * continuations from the socket's own event loop. That outlives the request
 * context, and Workers refuses to deliver the result — so the connection is not
 * merely slow, it is unusable. The fetch transport is stateless per query, so every
 * continuation belongs to the request that created it.
 *
 * `PrismaNeonHTTP` also takes a bare connection string, so the pool size option
 * disappears with the pool it configured.
 *
 * `require` is used rather than `import()` because the client is constructed
 * synchronously at module load. An earlier version resolved the adapter lazily
 * behind a Proxy; Prisma introspects the adapter object to match it against the
 * schema provider and rejected it with "The Driver Adapter ... is not compatible
 * with the provider 'postgres'".
 *
 * `datasources` is intentionally absent: Prisma refuses the combination outright
 * ("Custom datasource configuration is not compatible with Prisma Driver Adapters")
 * because the adapter is the single source of the connection string.
 */

/**
 * Reported for diagnostics and deployment notes. It no longer selects a different
 * client — the client is identical everywhere — so it describes the platform
 * rather than choosing a construction.
 */
export const ENGINE_BYPASSED =
  process.env.NEXT_RUNTIME === 'edge' ||
  process.env.PRISMA_ENGINE_BYPASS === '1' ||
  // Workers sets `globalThis.navigator.userAgent` to "Cloudflare-Workers".
  (typeof navigator !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    /Cloudflare-Workers/i.test(navigator.userAgent || ''));

function buildClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // During build (next build), DATABASE_URL may not be available.
    // Throw a clear error only when actually used at runtime.
    if (process.env.NEXT_PHASE === 'phase-production-build' || 
        (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL)) {
      console.warn('[Prisma] DATABASE_URL not available during build - deferring client creation');
      return null;
    }
    throw new Error(
      'DATABASE_URL is required: this Prisma client uses the WASM Query Compiler, ' +
        'which reaches Postgres only through the Neon driver adapter.',
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaNeonHTTP } = require('@prisma/adapter-neon');

  // fetch-based transport, NOT the WebSocket pool `PrismaNeon` opens. See the note
  // at the top of this file: the socket's continuations outlive the request that
  // created them, which Workers cancels with error 1101.
  const adapter = new PrismaNeonHTTP(connectionString, { arrayMode: true });

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    adapter,
  });
}

let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const client = buildClient();
    if (!client) {
      // During build - return a proxy that throws helpful errors when accessed
      return new Proxy({} as PrismaClient, {
        get(_target: any, prop: string | symbol) {
          if (prop === 'then' || prop === 'catch' || prop === 'finally') {
            return undefined;
          }
          return () => {
            throw new Error(
              `Prisma client accessed during build (${String(prop)}). DATABASE_URL is not available during build. ` +
              'Ensure DATABASE_URL is set in production environment variables.'
            );
          };
        },
      }) as PrismaClient;
    }
    prismaInstance = client;
  }
  return prismaInstance;
}

/**
 * Lazy Prisma client getter.
 * Initializes the client on first access, which allows build-time to succeed
 * without DATABASE_URL (client is only created at runtime).
 */
export function getPrisma(): PrismaClient {
  return getPrismaClient();
}

// For backward compatibility - export a proxy that calls getPrisma() on each access
const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target: any, prop: string | symbol) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export const prisma = prismaProxy as PrismaClient;

export default prismaProxy;

const NodeCache = require('../lib/cache');

export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
  const cached = NodeCache.get(key);
  if (cached !== null) return cached as T;
  const data = await fetcher();
  NodeCache.set(key, data, ttlMs);
  return data;
}

export function invalidateCache(prefix: string) {
  NodeCache.delPattern(prefix);
}