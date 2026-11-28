import sanitizeHtmlLib from 'sanitize-html';

/**
 * HTML sanitisation for user- and AI-authored content.
 *
 * WHY NOT DOMPurify HERE
 * DOMPurify needs a DOM. On Node the usual way to get one is
 * `isomorphic-dompurify`, which supplies jsdom — and jsdom reads
 * `browser/default-stylesheet.css` from disk at require time:
 *
 *   Failed to load external module jsdom: no such file or directory,
 *   readAll '/browser/default-stylesheet.css'
 *
 * Cloudflare Workers has no filesystem, so every one of the eleven routes that
 * import this module returned an empty 500. That failure is not theoretical; it
 * was observed after deploying.
 *
 * Two pure-JavaScript DOMs were tried as a drop-in so DOMPurify could stay, and
 * BOTH were rejected on evidence:
 *   - linkedom lacks `window.NodeFilter`, so DOMPurify's support check fails and
 *     its documented fallback is to RETURN THE INPUT UNCHANGED. Every payload
 *     survived.
 *   - happy-dom passes the support check but the first instance created from a
 *     window silently passes input through; only a second instance sanitised.
 *     Behaviour that depends on construction order is not a security control.
 *
 * `sanitize-html` is used instead because it is built for exactly this job: it
 * runs on a streaming parser (htmlparser2) with an allow-list model, so it needs
 * no DOM, no filesystem, and no native module. Its dependency tree is pure
 * JavaScript, which is what makes it deployable to Workers at all.
 *
 * The allow-lists below match the previous DOMPurify configuration tag for tag
 * and attribute for attribute. `scripts/verify-sanitizer.cjs` runs an XSS corpus
 * through this implementation and the retired jsdom one and fails if anything
 * dangerous survives or if allowed formatting is lost — so the change is measured,
 * not assumed.
 *
 * One deliberate hardening: links carrying `target="_blank"` get
 * `rel="noopener noreferrer"`. Without it the opened page can navigate the
 * original window through `window.opener`. DOMPurify did not add this and the
 * existing configuration did not either.
 */

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

const SHARED_OPTIONS = {
  // Defence in depth beyond the allow-list: even if a tag were ever added to the
  // list, these containers can never appear.
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed', 'form', 'input'],
  // Reject `javascript:`, `vbscript:`, `data:` and `file:` in any URL attribute.
  // Checked on the decoded value, so `&#106;avascript:` cannot slip past.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {},
  allowProtocolRelative: false,
  enforceHtmlBoundary: false,
};

const HTML_OPTIONS: sanitizeHtmlLib.IOptions = {
  ...SHARED_OPTIONS,
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: { a: ALLOWED_ATTR },
  transformTags: {
    a: (tagName, attribs) => {
      const next: Record<string, string> = { ...attribs };
      if (next.target === '_blank') {
        // Preserve any existing rel values rather than overwriting them.
        const rel = new Set((next.rel || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        next.rel = Array.from(rel).join(' ');
      }
      return { tagName, attribs: next };
    },
  },
};

// Plain text strips everything, so it is built by naming what differs rather than by
// spreading HTML_OPTIONS and re-declaring the same three keys.
//
// The spread-then-override form is behaviourally correct JavaScript — the later keys
// win — but it emits `Duplicate key "allowedTags" in object literal` from esbuild at
// build time. That warning points at a security configuration, which is precisely the
// kind of noise that trains people to ignore warnings. Every other option is inherited,
// so the scheme and nonTextTags rules are still identical to the HTML path.
// Plain text strips every tag, so it is built from SHARED_OPTIONS rather than by
// spreading HTML_OPTIONS and re-declaring the same three keys.
//
// The spread-then-override form is behaviourally correct — later keys win — but
// esbuild reports `Duplicate key "allowedTags" in object literal` for it at build
// time. Those warnings point straight at the sanitiser's security configuration,
// which is exactly the kind of noise that teaches people to ignore warnings. Every
// other option is inherited, so the scheme rules and nonTextTags list are identical
// to the HTML path.
const TEXT_OPTIONS: sanitizeHtmlLib.IOptions = {
  ...SHARED_OPTIONS,
  allowedTags: [],
  allowedAttributes: {},
};

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return sanitizeHtmlLib(input, HTML_OPTIONS);
}

export function sanitizePlainText(input: string): string {
  if (typeof input !== 'string') return '';
  return sanitizeHtmlLib(input, TEXT_OPTIONS);
}

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.hostname.includes('javascript');
  } catch {
    return false;
  }
}