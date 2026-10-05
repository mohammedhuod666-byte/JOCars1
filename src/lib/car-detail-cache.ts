// Tiny in-memory cache for car detail payloads so reopening an ad
// the user just visited is instant (no loader flash). TTL keeps data fresh.
// Views are only tracked on real network fetches, not cache hits.

interface CacheEntry {
  data: unknown;
  ts: number;
}

const TTL_MS = 90_000;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<void>>();

export function getCachedCarDetail(id: string): unknown | null {
  const entry = cache.get(id);
  if (!entry || Date.now() - entry.ts > TTL_MS) {
    if (entry) cache.delete(id);
    return null;
  }
  return entry.data;
}

export function setCachedCarDetail(id: string, data: unknown): void {
  cache.set(id, { data, ts: Date.now() });
}

/** Fire-and-forget warm-up (used on card hover). Never throws. */
export function warmCarDetailCache(id: string): void {
  if (!id || getCachedCarDetail(id) || inflight.has(id)) return;
  const p = fetch(`/api/cars/${id}`)
    .then((r) => r.json())
    .then((d) => {
      if (d?.success && d.data) setCachedCarDetail(id, d.data);
    })
    .catch(() => {})
    .finally(() => {
      inflight.delete(id);
    });
  inflight.set(id, p);
}
