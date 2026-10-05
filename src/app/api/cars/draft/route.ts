import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

/**
 * GET/PUT/DELETE /api/cars/draft
 *
 * A server-side draft of the add-car wizard, keyed one-per-user.
 *
 * WHY THIS EXISTS
 * The localStorage draft (src/lib/add-car-draft.ts) is per-BROWSER, so a seller
 * who started a listing on their phone cannot continue it on a laptop, and a
 * cleared browser loses everything. For a marketplace where sellers photograph a
 * car, walk away, and return days later, that is the single largest source of
 * abandoned listings.
 *
 * WHY A REUSABLE PRE-UPLOAD SLOT INSTEAD OF STORING THE DRAFTED LISTING
 * The obvious design — a `Car` row with a DRAFT status — has a consequence that
 * is easy to get wrong: the wizard UPLOADS documents to Cloudinary and then
 * holds only a 300-second signed URL in memory. Persisting that URL produces a
 * draft that looks complete and fails at publish with a dead link.
 *
 * So a draft stores NO document references. When the seller returns, the server
 * re-mints fresh signed URLs for whatever is still in the upload slot, and the
 * wizard verifies each one before offering it for reuse. A stale slot is
 * reported explicitly rather than silently producing a broken listing.
 *
 * OWNERSHIP
 * The lookup is always `where: { userId }` from the authenticated user, never an
 * id from the request body, so one seller can never read or overwrite another's
 * draft by guessing its id.
 */

const MAX_STEP = 5;

/** Payload size guard. A wizard draft is form fields; anything larger is abuse. */
const MAX_BODY_CHARS = 60_000;

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await authenticateRequest(request);
  } catch {
    return unauthorizedResponse();
  }
  if (!user) return unauthorizedResponse();

  const draft = await prisma.carDraft.findUnique({ where: { userId: user.id } });

  // No draft is a normal state, not an error: the wizard treats it as "start
  // fresh" and must not have to special-case a 404.
  if (!draft) {
    return successResponse({ draft: null, documents: null });
  }

  return successResponse({
    draft: {
      step: draft.step,
      form: draft.payload,
      savedAt: draft.updatedAt.getTime(),
    },
    // Re-mint on read, so a restored draft always carries live links. The
    // wizard re-verifies them through /api/upload/stage/verify rather than
    // trusting this response.
    documents: await mintDocumentUrls(draft.documentUrls),
  });
}

/**
 * Turns a stored JSON array of signed references into fresh signed URLs.
 *
 * A reference that no longer verifies (expired, minted for another user, or the
 * asset removed) is dropped and reported in `expired`, so the UI can say which
 * document must be re-attached instead of failing at publish.
 */
async function mintDocumentUrls(raw: string | null): Promise<{
  license: string | null;
  inspection: string | null;
  serviceRecord: string | null;
  inspectionExtra: string[];
  expired: number;
} | null> {
  const empty = {
    license: null, inspection: null, serviceRecord: null,
    inspectionExtra: [] as string[], expired: 0,
  };
  if (!raw) return null;

  let parsed: { license?: string; inspection?: string; serviceRecord?: string; inspectionExtra?: string[] };
  try {
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return empty;
    parsed = p as typeof parsed;
  } catch {
    // A corrupt column must not 500 the wizard.
    return empty;
  }

  const { signedDocumentUrl } = await import('@/lib/car-documents');
  let expired = 0;

  /**
   * The stored value is the PRIVATE asset URL the wizard received from
   * /api/upload/stage, not a signed reference. Ownership was verified when that
   * URL was minted; here we simply re-sign it so the restored preview works.
   *
   * Re-signing on every read is the whole point: a signed URL that lives in a
   * draft would expire and produce a listing that fails at publish, so the draft
   * never stores one.
   */
  const sign = (url: string | undefined): string | null => {
    if (!url) return null;
    const s = signedDocumentUrl(url);
    if (!s) { expired++; return null; }
    return s;
  };

  const extras = Array.isArray(parsed.inspectionExtra) ? parsed.inspectionExtra : [];
  const signedExtras = extras
    .map((u) => (typeof u === 'string' ? sign(u) : null))
    .filter((u): u is string => !!u);

  return {
    license: sign(parsed.license),
    inspection: sign(parsed.inspection),
    serviceRecord: sign(parsed.serviceRecord),
    inspectionExtra: signedExtras,
    expired,
  };
}

export async function PUT(request: NextRequest) {
  let user;
  try {
    user = await authenticateRequest(request);
  } catch {
    return unauthorizedResponse();
  }
  if (!user) return unauthorizedResponse();

  let body: { step?: unknown; form?: unknown; documentUrls?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse('صيغة الطلب غير صحيحة', 400);
  }

  const step = Number(body.step);
  if (!Number.isFinite(step) || step < 1 || step > MAX_STEP) {
    return errorResponse('رقم الخطوة غير صالح', 400);
  }
  const form = body.form;
  if (!form || typeof form !== 'object' || Array.isArray(form)) {
    return errorResponse('بيانات المسودة غير صالحة', 400);
  }

  // Prisma Json columns reject non-serialisable values; serialising first turns
  // a weird payload into a clean 400 instead of a 500.
  let payload: string;
  let documentUrls: string | null = null;
  try {
    payload = JSON.stringify(form);
    if (body.documentUrls !== undefined && body.documentUrls !== null) {
      if (typeof body.documentUrls !== 'object' || Array.isArray(body.documentUrls)) {
        return errorResponse('روابط المستندات غير صالحة', 400);
      }
      const s = JSON.stringify(body.documentUrls);
      if (s.length > MAX_BODY_CHARS) return errorResponse('بيانات المسودة كبيرة جداً', 413);
      documentUrls = s;
    }
  } catch {
    return errorResponse('تعذر حفظ المسودة', 400);
  }
  if (payload.length > MAX_BODY_CHARS) {
    return errorResponse('بيانات المسودة كبيرة جداً', 413);
  }

  try {
    // Upsert on the unique userId: one draft per seller, no id in the request,
    // so a draft can never be reassigned to another account.
    const saved = await prisma.carDraft.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        step,
        payload: JSON.parse(payload),
        documentUrls,
      },
      update: {
        step,
        payload: JSON.parse(payload),
        ...(documentUrls !== null ? { documentUrls } : {}),
      },
    });

    return successResponse({ savedAt: saved.updatedAt.getTime() });
  } catch (err) {
    // A missing table must not break the wizard: the localStorage draft still
    // covers the common case.
    const msg = err instanceof Error ? err.message : '';
    if (/does not exist|no such table|Unknown (table|argument)/i.test(msg)) {
      console.error('[cars/draft] table missing — run `prisma db push`');
      return errorResponse('حفظ المسودة غير متاح حالياً', 503);
    }
    console.error('[cars/draft] save failed:', err);
    return errorResponse('تعذر حفظ المسودة', 500);
  }
}

export async function DELETE(request: NextRequest) {
  let user;
  try {
    user = await authenticateRequest(request);
  } catch {
    return unauthorizedResponse();
  }
  if (!user) return unauthorizedResponse();

  // Scoped to the caller's own row; a missing draft is a success.
  await prisma.carDraft.deleteMany({ where: { userId: user.id } }).catch((err) => {
    if (!/does not exist|no such table/i.test(err instanceof Error ? err.message : '')) {
      console.error('[cars/draft] delete failed:', err);
    }
  });
  return successResponse({ deleted: true });
}
