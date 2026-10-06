// End-to-end verification of the deployed Cloudflare Worker.
//
// Purpose-built rather than a loop of curl commands because:
//   - PowerShell mangles Arabic error bodies, which produces both false negatives
//     and false positives when reading them. Node reads the bytes as UTF-8.
//   - Each route needs its own status expectation. A blanket "is it 200" pass is
//     meaningless: some routes require auth (401) or only accept POST (405), and
//     those are correct behaviour that must not be reported as failures.
//   - A route returning 500 with an EMPTY body is the exact symptom that has been
//     hiding every backend failure so far, so empty-500 is called out separately.
//
// Usage: node scripts/verify-worker.cjs [baseUrl]
const fs = require('fs');

const BASE = process.argv[2] || 'https://jo-cars-marketplace.mohammedhuod666.workers.dev';

// [path, method, expectation, note]
//   200 = must work
//   401 = must reject unauthenticated (correct, not a failure)
//   405 = method not allowed (correct for a POST-only route)
//   page = HTML page, judged on 200 + content
const CASES = [
  ['/', 'GET', 'page', 'homepage'],
  ['/cars', 'GET', 'page', 'listings index'],
  ['/cars/add', 'GET', 'page', 'sell wizard'],
  // /login is a 307 to /auth/login. Following it matters: a bare 307 proves a route
  // exists, not that the user can log in, and that is the page that matters.
  ['/login', 'GET', 'pageFollow', 'login (follows redirect)'],
  ['/api/health', 'GET', 200, 'liveness'],
  ['/api/cars', 'GET', 200, 'cars list (DB)'],
  ['/api/cars/brands', 'GET', 200, 'brands (DB)'],
  ['/api/parts', 'GET', 200, 'spare parts (DB)'],
  ['/api/wanted', 'GET', 200, 'wanted ads (DB)'],
  ['/api/forum/topics', 'GET', 200, 'forum topics (DB)'],
  ['/api/cars/my', 'GET', 401, 'must reject anonymous'],
  ['/api/admin/stats', 'GET', 401, 'must reject anonymous'],
];

const pages = [];
const results = [];

(async () => {
  for (const [path, method, expect, note] of CASES) {
    const started = Date.now();
    let status = 0;
    let body = '';
    let ctype = '';
    try {
      const res = await fetch(BASE + path, {
        method,
        headers: { accept: method === 'GET' ? 'text/html,application/json' : 'application/json' },
        redirect: expect === 'pageFollow' ? 'follow' : 'manual',
      });
      status = res.status;
      ctype = res.headers.get('content-type') || '';
      body = await res.text();
    } catch (e) {
      results.push({ path, note, status: 0, ms: 0, verdict: 'FAIL', detail: e.message });
      continue;
    }
    const ms = Date.now() - started;

    let verdict;
    let detail = '';
    if (expect === 'page' || expect === 'pageFollow') {
      const isHtml = /text\/html/.test(ctype);
      if (status !== 200) {
        verdict = 'FAIL';
        detail = `expected HTML 200, got ${status}`;
      } else if (!isHtml || body.length < 1000) {
        verdict = 'FAIL';
        detail = `not a real page (ctype=${ctype || 'none'}, ${body.length}B)`;
      } else {
        verdict = 'PASS';
        detail = `${(body.length / 1024).toFixed(0)}KB html`;
        pages.push({ path, kb: Math.round(body.length / 1024) });
      }
    } else {
      if (status === expect) {
        verdict = 'PASS';
        detail = body.slice(0, 90);
      } else if (status === 500) {
        verdict = 'FAIL';
        detail = body ? `500 ${body.slice(0, 90)}` : '500 with EMPTY body (backend throwing)';
      } else {
        verdict = 'FAIL';
        detail = `expected ${expect}, got ${status} ${body.slice(0, 90)}`;
      }
    }
    results.push({ path, note, status, ms, verdict, detail });
  }

  console.log(`=== deployed Worker: ${BASE} ===\n`);
  for (const r of results) {
    console.log(
      `  ${r.verdict}  ${String(r.status).padStart(3)}  ${String(r.ms).padStart(5)}ms  ` +
        `${r.path.padEnd(22)} ${r.note}`,
    );
    if (r.verdict === 'FAIL') console.log(`        ${r.detail}`);
  }

  const pass = results.filter((r) => r.verdict === 'PASS').length;
  const dbFails = results.filter((r) => r.verdict === 'FAIL' && /DB/.test(r.note)).length;
  console.log(`\n  ${pass}/${results.length} passed`);
  if (pages.length) {
    console.log('  pages rendered: ' + pages.map((p) => `${p.path} (${p.kb}KB)`).join(', '));
  }
  console.log(`  database-backed failures: ${dbFails}`);

  if (dbFails) {
    console.log('\n  The Worker serves pages but the data layer is still failing.');
  } else if (pass !== results.length) {
    console.log('\n  Something other than the database is failing.');
  } else {
    console.log('\n  The Worker is fully functional: pages and database both green.');
  }
  process.exit(pass === results.length ? 0 : 1);
})();