import { cloudinary } from '../media/cloudinary';

/**
 * Official documents (license / inspection) are uploaded as Cloudinary
 * AUTHENTICATED assets (`access_mode: 'authenticated'`), so the public CDN URL
 * 403s for everyone. Access is granted only through short-lived signed URLs
 * that this module mints after the caller has authorised the request.
 *
 * Why authenticated assets rather than a private API route:
 *  - a signed Cloudinary URL expires (minutes), so a leaked link is useless
 *    shortly after the fact, and it is still CDN-cached and fast;
 *  - no application server sits in the hot path for document viewing;
 *  - the public_id is never enough on its own — the signature is required.
 *
 * `docsUrlExpirySeconds` is deliberately short: documents are opened for a
 * few seconds at a time inside an admin/seller review UI.
 */
export const DOC_URL_EXPIRY_SECONDS = 300;

const AUTHENTICATED_ASSET_URL = /\/image\/authenticated\//;

/**
 * True when a stored document URL points at an authenticated (non-public)
 * asset. Used to decide whether a signed URL has to be minted, and to avoid
 * re-signing a URL that is still plainly public.
 */
export function isAuthenticatedAssetUrl(url: string): boolean {
  return AUTHENTICATED_ASSET_URL.test(url);
}

/**
 * Derive the Cloudinary `public_id` from a stored delivery URL so it can be
 * re-signed. Cloudinary URLs embed the public_id (minus extension) in the
 * version path segment.
 *
 * Example:
 *   https://res.cloudinary.com/<cloud>/image/authenticated/v123/jo-cars/docs/abc.png
 *   -> "jo-cars/docs/abc"
 */
export function publicIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Path looks like: /<cloud>/image/authenticated/v123456/folder/file.png
    const parts = parsed.pathname.split('/').filter(Boolean);
    const versionIdx = parts.findIndex((p) => /^v\d+$/.test(p));
    if (versionIdx === -1 || versionIdx === parts.length - 1) return null;
    const file = parts[versionIdx + 1];
    // public_id may contain dots in the name; only strip a known extension.
    const withoutExt = file.replace(/\.(png|jpe?g|webp|gif|mp4|mov|pdf)$/i, '');
    return [...parts.slice(versionIdx + 1, -1), withoutExt].join('/');
  } catch {
    return null;
  }
}

/**
 * Mint a short-lived signed URL for a stored document. Returns null when the
 * asset is already public or the public_id cannot be derived — callers must
 * treat null as "do not expose".
 */
export function signedDocumentUrl(
  storedUrl: string,
  opts?: { expiresInSeconds?: number; format?: string },
): string | null {
  if (!storedUrl || !isAuthenticatedAssetUrl(storedUrl)) return null;
  const publicId = publicIdFromUrl(storedUrl);
  if (!publicId) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + (opts?.expiresInSeconds ?? DOC_URL_EXPIRY_SECONDS);

  return cloudinary.url(publicId, {
    resource_type: 'image',
    type: 'authenticated',
    version: extractVersion(storedUrl) ?? undefined,
    format: opts?.format ?? guessFormat(storedUrl) ?? undefined,
    sign_url: true,
    expires_at: expiresAt,
  });
}

function extractVersion(url: string): number | null {
  const m = url.match(/\/v(\d+)\//);
  return m ? parseInt(m[1], 10) : null;
}

function guessFormat(url: string): string | null {
  const m = url.match(/\.([a-z0-9]+)(?:\?|#|$)/i);
  if (!m) return null;
  const ext = m[1].toLowerCase();
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf'].includes(ext) ? ext : null;
}
