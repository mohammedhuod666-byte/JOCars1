import { createHmac, timingSafeEqual } from 'crypto';

/**
 * A signed reference to a file the seller already uploaded.
 *
 * WHY THIS EXISTS
 * The platform caps a route-handler request body at 4.5MB (measured — see
 * src/lib/upload-limits.ts), and the publish endpoint is multipart. Images are
 * bounded by count after client compression, but a DOCUMENT is not: a scanned
 * multi-page inspection PDF is routinely 3-8MB and cannot be compressed in the
 * browser without corrupting it. So documents are uploaded in their own request
 * (src/app/api/upload/stage) and the publish call carries only a reference.
 *
 * WHY A SIGNATURE AND NOT JUST A URL
 * The tempting shortcut is to let the client POST `licenseDocUrl: "https://..."`.
 * That is a serious vulnerability: the server would store an arbitrary URL,
 * including one pointing at another user's document, or at a public image, or at
 * a tracking pixel that reports when the ad page was viewed. Since documents are
 * private, authenticated Cloudinary assets, a leaked raw URL is normally useless
 * — but "normally" is not a security property.
 *
 * So the reference is an HMAC over (userId, url, kind, expiry) keyed by the
 * server's signing secret. Consequences:
 *   - a seller can only reference files THEY uploaded;
 *   - a seller cannot swap in a different kind (an inspection report cannot be
 *     smuggled in as the license);
 *   - a reference expires, so a captured one cannot be replayed indefinitely;
 *   - the payload is verifiable without any server-side storage, so this adds no
 *     database column and no cleanup job.
 *
 * Deliberately NOT used for gallery images: those are public by design and are
 * still uploaded inside the publish request.
 */

/** Bump when the payload shape changes, so old tokens stop verifying. */
const TOKEN_VERSION = 'v1';

/**
 * Reference lifetime. Generous enough that a seller can compose a long listing
 * in stages, short enough that a leaked URL in a chat log stops working.
 */
export const UPLOAD_REF_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/** Which slot a staged file may be attached to. Binds a token to one purpose. */
export type UploadRefKind = 'license' | 'inspection' | 'inspectionExtra' | 'serviceRecord';

export const UPLOAD_REF_KINDS: UploadRefKind[] = [
  'license', 'inspection', 'inspectionExtra', 'serviceRecord',
];

export function isUploadRefKind(v: unknown): v is UploadRefKind {
  return typeof v === 'string' && (UPLOAD_REF_KINDS as string[]).includes(v);
}

/**
 * Resolves the HMAC key.
 *
 * Diagnostic detail (candidate NAME and length only, never the value) is
 * emitted when resolution fails, because "signing unavailable" in production is
 * indistinguishable from a crypto bug otherwise — and the first real
 * occurrence of it turned out to be an environment problem, not a code one.
 */
function signingSecret(): string | null {
  const candidates: [string, string | undefined][] = [
    ['JWT_SECRET', process.env.JWT_SECRET],
    ['NEXTAUTH_SECRET', process.env.NEXTAUTH_SECRET],
    ['BACKUP_ENCRYPTION_KEY', process.env.BACKUP_ENCRYPTION_KEY],
  ];
  for (const [name, value] of candidates) {
    if (value && value.length >= 16) return value;
  }
  if (process.env.NODE_ENV !== 'production') {
    // Matches lib/auth.ts: dev must not throw, or local verification of the
    // wizard becomes impossible without a .env file.
    return 'dev-insecure-placeholder';
  }
  console.error('[upload-token] no usable signing secret', JSON.stringify({
    present: candidates.map(([name, v]) => ({ name, set: !!v, length: v ? v.length : 0 })),
  }));
  return null;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function hmac(payload: string): Buffer {
  const secret = signingSecret();
  if (!secret) throw new Error('UPLOAD_REF_SIGNING_UNAVAILABLE');
  return createHmac('sha256', secret).update(payload).digest();
}

interface RefPayload {
  v: string;
  uid: string;
  url: string;
  kind: string;
  exp: number;
}

/** Mints a reference. Server-side only; never call from a client component. */
export function signUploadRef(userId: string, url: string, kind: UploadRefKind): string {
  const payload: RefPayload = {
    v: TOKEN_VERSION,
    uid: userId,
    url,
    kind,
    exp: Date.now() + UPLOAD_REF_TTL_MS,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${b64url(hmac(body))}`;
}

/**
 * Verifies a reference and returns the URL it authorises.
 *
 * Returns null on ANY failure — bad shape, bad signature, wrong owner, wrong
 * kind, expired. Callers must treat null as "this document was not supplied",
 * which the publish gate then rejects.
 */
export function verifyUploadRef(
  token: unknown,
  userId: string,
  expectedKind: UploadRefKind,
): string | null {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const secret = signingSecret();
  if (!secret) return null;

  const [body, sig] = token.split('.', 2);
  if (!body || !sig) return null;

  let providedSig: Buffer;
  let expectedSig: Buffer;
  try {
    providedSig = fromB64url(sig);
    expectedSig = hmac(body);
  } catch {
    return null;
  }
  // timingSafeEqual throws on a length mismatch, so compare lengths first.
  if (providedSig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(providedSig, expectedSig)) return null;

  let payload: RefPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== 'object') return null;
  if (payload.v !== TOKEN_VERSION) return null;
  if (payload.uid !== userId) return null;
  if (payload.kind !== expectedKind) return null;
  if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;

  // Defence in depth: even a correctly signed token must not be able to point
  // somewhere outside our own Cloudinary account. A bug in the signer should not
  // become an open redirect / SSRF-shaped primitive for stored URLs.
  if (!isOurAssetUrl(payload.url)) return null;

  return payload.url;
}

/**
 * Confirms a stored document URL really points at our Cloudinary account.
 *
 * Deliberately strict, and duplicated here (rather than trusting the signer's
 * output) so that the storage layer can validate URLs that predate signing.
 */
export function isOurAssetUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.startsWith('https://res.cloudinary.com/')) return false;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return false;
  // Path must begin with /<cloud>/ and then a delivery type.
  const rest = url.slice('https://res.cloudinary.com/'.length);
  const slash = rest.indexOf('/');
  if (slash <= 0) return false;
  const hostPart = rest.slice(0, slash);
  if (hostPart !== cloud) return false;
  const after = rest.slice(slash + 1).split('/')[0];
  // image | video | raw — authenticated delivery is still served from res.
  return after === 'image' || after === 'video' || after === 'raw';
}
