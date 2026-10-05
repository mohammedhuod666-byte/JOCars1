/**
 * Validation for reordering a published listing's gallery.
 *
 * Extracted from the route handler so the security-critical rule can be tested
 * without a database. The rule exists because the request body is untrusted: a
 * seller could otherwise submit image ids belonging to ANOTHER listing, which
 * would both leak that listing's gallery order and — via coverImageId — point
 * their own cover at an image they do not own.
 *
 * The check is "the submitted order is EXACTLY the set of this car's images":
 *   - same length      → nothing omitted, nothing extra
 *   - no duplicates    → a repeated id would silently drop another image
 *   - every id known   → ownership verified against the DATABASE, not the body
 */

/** Discriminates a result so the caller can pick the right HTTP status. */
export type OrderCheck =
  | { ok: true }
  | { ok: false; code: 'NOT_AN_ARRAY' | 'INVALID_ID' | 'TOO_MANY' | 'LENGTH_MISMATCH' | 'DUPLICATE' | 'FOREIGN_ID' | 'FOREIGN_COVER' };

/** Bound on the array we will even iterate. Comfortably above any real listing. */
export const MAX_ORDERABLE_IMAGES = 40;

export function checkImageOrder(
  submitted: unknown,
  existingIds: string[],
  coverImageId?: unknown,
): OrderCheck {
  if (!Array.isArray(submitted)) return { ok: false, code: 'NOT_AN_ARRAY' };
  if (submitted.length > MAX_ORDERABLE_IMAGES) return { ok: false, code: 'TOO_MANY' };
  if (submitted.some((x) => typeof x !== 'string' || !x)) return { ok: false, code: 'INVALID_ID' };

  const known = new Set(existingIds);

  // Length first: it is the cheapest way to reject a partial or padded list.
  if (submitted.length !== known.size) return { ok: false, code: 'LENGTH_MISMATCH' };

  const seen = new Set<string>();
  for (const id of submitted as string[]) {
    if (seen.has(id)) return { ok: false, code: 'DUPLICATE' };
    seen.add(id);
    if (!known.has(id)) return { ok: false, code: 'FOREIGN_ID' };
  }

  // The cover must be one of THIS car's images when the caller names one.
  if (typeof coverImageId === 'string' && coverImageId && !known.has(coverImageId)) {
    return { ok: false, code: 'FOREIGN_COVER' };
  }

  return { ok: true };
}

/** Arabic message per failure, safe to return verbatim to the client. */
export function orderErrorMessage(code: OrderCheck extends { ok: false } ? never : string): string {
  const messages: Record<string, string> = {
    NOT_AN_ARRAY: 'قائمة ترتيب الصور غير صالحة',
    INVALID_ID: 'قائمة ترتيب الصور غير صالحة',
    TOO_MANY: 'عدد الصور يتجاوز الحد المسموح',
    LENGTH_MISMATCH: 'قائمة الصور لا تطابق صور الإعلان',
    DUPLICATE: 'قائمة الترتيب تحتوي على تكرار',
    FOREIGN_ID: 'قائمة الترتيب تحتوي على صورة لا تخص هذا الإعلان',
    FOREIGN_COVER: 'صورة الغلاف لا تخص هذا الإعلان',
  };
  return messages[code] || 'طلب ترتيب الصور غير صالح';
}
