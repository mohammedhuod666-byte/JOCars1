/**
 * Local crash-recovery for the add-car wizard.
 *
 * Why localStorage and not a server draft:
 *   - a "draft" DB row requires a status change, ownership rules, a listing in
 *     the dashboard and a migration; local persistence removes the #1 drop-off
 *     (accidental tab close losing 20+ fields) with zero schema risk;
 *   - it is per-browser and keyed by the logged-in user, so one seller can
 *     never read another's half-finished data on a shared machine.
 *
 * Scope is deliberately text-only: files (gallery, documents) are NOT stored,
 * because base64 photos would blow the ~5MB localStorage quota. The UI says so
 * explicitly so the seller is not misled into thinking images survived.
 */

const KEY_PREFIX = 'jo-cars:add-car-draft:';
const VERSION = 1;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // stale drafts are noise after 2 weeks

export interface AddCarDraft {
  version: number;
  savedAt: number;
  step: number;
  form: Record<string, unknown>;
  /** True when the seller picked files that will NOT be restored. */
  hadFiles: boolean;
}

function storageKey(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

function available(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const probe = '__jc_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    // Private-mode Safari / quota / disabled storage.
    return false;
  }
}

/**
 * Persist wizard progress. Failures are swallowed on purpose: losing the cache
 * must never break the publish flow.
 */
export function saveAddCarDraft(
  userId: string,
  payload: { step: number; form: Record<string, unknown>; hadFiles: boolean },
): boolean {
  if (!available()) return false;
  try {
    const draft: AddCarDraft = {
      version: VERSION,
      savedAt: Date.now(),
      step: payload.step,
      form: payload.form,
      hadFiles: payload.hadFiles,
    };
    window.localStorage.setItem(storageKey(userId), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/** Returns null when nothing usable is stored (absent, too old, other user). */
export function loadAddCarDraft(userId: string): AddCarDraft | null {
  if (!available()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AddCarDraft;
    if (!parsed || parsed.version !== VERSION) return null;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearAddCarDraft(userId);
      return null;
    }
    if (!parsed.form || typeof parsed.form !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAddCarDraft(userId: string): void {
  if (!available()) return;
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    /* nothing to do */
  }
}

export function draftAgeLabel(savedAt: number): string {
  const mins = Math.floor((Date.now() - savedAt) / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'أمس' : `قبل ${days} يوم`;
}
