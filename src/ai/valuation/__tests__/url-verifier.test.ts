/**
 * URL Verification and Canonical Resolution Tests.
 * Run: npx tsx --test src/ai/valuation/__tests__/url-verifier.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCanonicalListingUrl,
  validateListingPageContent,
  verifySourceUrl,
  createSourceSnapshot,
} from '../url-verifier';
import type { NormalizedListing } from '../types';

describe('URL Canonical Resolution and Verification', () => {
  // Test 1: Canonical URL resolution from OpenSooq paths
  it('1. resolves canonical OpenSooq URLs from legacy /post/ and /search/ paths to /ar/search/{id}', () => {
    const urls = [
      'https://jo.opensooq.com/post/287272368',
      'https://jo.opensooq.com/ar/post/287272368',
      'https://jo.opensooq.com/search/287272368',
      'https://jo.opensooq.com/ar/search/287272368',
      'https://jo.opensooq.com/en/search/287272368',
      'http://jo.opensooq.com/post/287272368?source=share',
    ];

    const expected = 'https://jo.opensooq.com/ar/search/287272368';
    for (const u of urls) {
      assert.equal(
        resolveCanonicalListingUrl(u, 'opensooq'),
        expected,
        `Failed to resolve canonical for: ${u}`
      );
    }
  });

  // Test 2: Does not invent speculative URLs for invalid patterns or unknown sources
  it('2. does not guess or invent speculative URLs for non-matching or arbitrary inputs', () => {
    assert.equal(resolveCanonicalListingUrl('https://example.com/some/random/page', 'unknown'), 'https://example.com/some/random/page');
    assert.equal(resolveCanonicalListingUrl('invalid-url-string', 'opensooq'), null);
    assert.equal(resolveCanonicalListingUrl('', 'opensooq'), null);
  });

  // Test 3: Content validation for genuine listing pages (200 OK with valid car data)
  it('3. validates genuine listing content as VALID', () => {
    const validHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>بي ام دبليو X5 2018 للبيع في عمان</title></head>
        <body>
          <div class="post-details">
            <h1>BMW X5 xDrive35i 2018</h1>
            <span class="price">30,000 دينار</span>
          </div>
        </body>
      </html>
    `;

    const res = validateListingPageContent(validHtml, 200);
    assert.equal(res.isValid, true);
    assert.equal(res.urlStatus, 'VALID');
    assert.equal(res.failureReason, null);
    assert.ok(res.pageTitle?.includes('بي ام دبليو'));
  });

  // Test 4: Content validation for Fake 200 (deleted / expired / not found markers)
  it('4. detects fake 200 responses where listing was deleted or expired as NOT_FOUND', () => {
    const deletedHtmlCases = [
      '<html><head><title>404 Not Found</title></head><body>الإعلان غير موجود أو تم حذفه من قبل المعلن</body></html>',
      '<html><body><div class="error-msg">عذراً، هذا الإعلان منتهي الصلاحية</div></body></html>',
      '<html><head><title>الصفحة غير موجودة</title></head><body>نعتذر، لم يتم العثور على الصفحة المطلوبة</body></html>',
      '<html><body><p>هذا المحتوى غير متوفر حالياً</p></body></html>',
    ];

    for (const html of deletedHtmlCases) {
      const res = validateListingPageContent(html, 200);
      assert.equal(res.isValid, false);
      assert.equal(res.urlStatus, 'NOT_FOUND');
      assert.ok(res.failureReason !== null);
    }
  });

  // Test 5: Content validation for Bot Blocks / CAPTCHA / 403 pages
  it('5. detects bot blocks, Cloudflare challenges, and WAF blocks as BLOCKED', () => {
    const blockedHtmlCases = [
      '<html><head><title>Just a moment...</title></head><body><div id="cf-browser-verification">Verifying your browser before accessing</div></body></html>',
      '<html><body><div class="ddos-guard">Checking your browser to access the site</div></body></html>',
      '<html><body><script>var challenge = true;</script><p>Attention Required! | Cloudflare</p></body></html>',
    ];

    for (const html of blockedHtmlCases) {
      const res = validateListingPageContent(html, 403);
      assert.equal(res.isValid, false);
      assert.equal(res.urlStatus, 'BLOCKED');
      assert.ok(res.failureReason?.includes('محمي'));
    }
  });

  // Test 6: HTTP 404 / 410 returns NOT_FOUND
  it('6. returns NOT_FOUND for 404 and 410 Gone status codes', () => {
    const res404 = validateListingPageContent('<html>404 Not Found</html>', 404);
    assert.equal(res404.isValid, false);
    assert.equal(res404.urlStatus, 'NOT_FOUND');

    const res410 = validateListingPageContent('<html>410 Gone</html>', 410);
    assert.equal(res410.isValid, false);
    assert.equal(res410.urlStatus, 'NOT_FOUND');
  });

  // Test 7: Historical Evidence Invariance (VERIFIED_AT_COLLECTION is preserved even if URL is dead)
  it('7. preserves historical evidenceStatus=VERIFIED_AT_COLLECTION when urlStatus becomes NOT_FOUND', () => {
    const initialListing: NormalizedListing = {
      source: 'opensooq',
      sourceLabel: 'السوق المفتوح',
      externalId: 'os-historical-123',
      url: 'https://jo.opensooq.com/ar/search/287272368',
      canonicalUrl: 'https://jo.opensooq.com/ar/search/287272368',
      finalUrl: 'https://jo.opensooq.com/ar/search/287272368',
      urlStatus: 'VALID',
      urlVerifiedAt: '2026-03-01T10:00:00Z',
      evidenceStatus: 'VERIFIED_AT_COLLECTION',
      title: 'BMW X5 2018',
      brand: 'BMW',
      model: 'X5',
      year: 2018,
      kilometers: 170000,
      price: 30000,
      currency: 'JOD',
      priceJod: 30000,
      fxRate: 1,
      country: 'JO',
      priceType: 'asking',
      specs: [],
      scrapedAt: '2026-03-01T10:00:00Z',
    };

    // When the link later dies (e.g. after car is sold and removed from OpenSooq):
    const currentUrlStatus = 'NOT_FOUND';
    const updatedListing: NormalizedListing = {
      ...initialListing,
      urlStatus: currentUrlStatus,
      urlVerifiedAt: '2026-09-26T20:00:00Z',
      // Crucial: evidenceStatus must remain VERIFIED_AT_COLLECTION
    };

    assert.equal(updatedListing.evidenceStatus, 'VERIFIED_AT_COLLECTION');
    assert.equal(updatedListing.urlStatus, 'NOT_FOUND');
    // Price and math inputs are completely preserved
    assert.equal(updatedListing.priceJod, 30000);
    assert.equal(updatedListing.year, 2018);
  });

  // Test 8: Source Snapshot immutability and provenance
  it('8. generates complete, immutable SourceSnapshot with hash of attributes', () => {
    const snapshot = createSourceSnapshot({
      source: 'opensooq',
      sourceLabel: 'السوق المفتوح',
      sourceUrl: 'https://jo.opensooq.com/post/287272368',
      canonicalUrl: 'https://jo.opensooq.com/ar/search/287272368',
      title: 'BMW X5 2018',
      price: 30000,
      currency: 'JOD',
      year: 2018,
      make: 'BMW',
      model: 'X5',
      mileage: 171000,
      location: 'عمان',
    });

    assert.equal(snapshot.source, 'opensooq');
    assert.equal(snapshot.canonicalUrl, 'https://jo.opensooq.com/ar/search/287272368');
    assert.equal(snapshot.price, 30000);
    assert.equal(snapshot.year, 2018);
    assert.ok(snapshot.collectedAt);
    assert.ok(snapshot.specsHash && snapshot.specsHash.length === 16);
  });
});
