// What fraction of the 208 API routes actually work on Workers?
//
// The 12-case suite proves the stack is sound: Prisma reaches Neon, pages render,
// auth is enforced. It does NOT prove the other ~196 routes work, and a migration
// that is declared done on 12 samples is a migration with 196 unknowns — the
// previous 4.5MB upload incident was likewise invisible until the exact route that
// broke was exercised.
//
// Every route is probed once, unauthenticated, and classified by what the response
// PROVES rather than by a bare status:
//   200/401/405/400 -> the handler ran and made a decision (reachable)
//   500 + empty     -> the handler threw (broken)
//   500 + HTML      -> NOT our JSON handler at all; Cloudflare or a proxy page.
//                      Classified separately because calling it "our 500" would be wrong.
//   404             -> route does not exist (informational; some paths are dynamic)
//
// This is a reachability and crash sweep, not a functional test of 208 features.
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'https://jo-cars-marketplace.mohammedhuod666.workers.dev';
const ROOT = path.join('src', 'app', 'api');

// Discover routes from the filesystem rather than a hardcoded list, so a route added
// tomorrow is covered without editing this script.
const routes = [];
(function walk(dir, prefix = '') {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      // [id] style segments are dynamic: probe them with a plausible value.
      walk(path.join(dir, e.name), `${prefix}/${e.name}`);
    } else if (e.name === 'route.ts' || e.name === 'route.tsx') {
      routes.push(prefix || '/');
    }
  }
})(ROOT);

const timeoutFor = (ms) => AbortSignal.timeout(ms);

function classify(status, body, ctype) {
  const isJson = /application\/json/.test(ctype);
  const isHtml = /text\/html/.test(ctype);
  if (status === 500 || status === 502 || status === 503) {
    if (!isJson && isHtml) return { kind: 'platform500', why: 'HTML error page, not our JSON handler' };
    if (body.trim() === '') return { kind: 'threw500', why: 'empty body — handler threw' };
    return { kind: 'error500', why: body.slice(0, 80) };
  }
  if (status === 404) {
    // Next.js serves its own 404 page as HTML for unmatched paths, so a 404 here can
    // mean either "no API route at this path" or "route exists but it called
    // NextResponse.json({...}, {status:404})". Only the second is a live route, so
    // the content type is what separates them.
    if (isJson) return { kind: 'notFound', why: '404 JSON — handler ran, no such record' };
    return { kind: 'missing', why: '404 HTML — Next.js 404 page, no API handler' };
  }
  if ([200, 201, 204, 301, 302, 307, 308].includes(status)) return { kind: 'ok', why: `${status}` };
  if ([400, 401, 403, 405, 409, 422, 429].includes(status)) return { kind: 'rejected', why: `${status} (handler ran)` };
  // Anything else is grouped by its hundreds digit rather than lumped together: a
  // 3xx that a redirect: 'manual' probe follows up on is a live route, and lumping it
  // in with 418s hides the difference between "works" and "unknown".
  if (status >= 300 && status < 400) return { kind: 'redirect', why: `${status} (route exists)` };
  return { kind: 'other', why: `unclassified status ${status}` };
}

async function probe(route) {
  // A dynamic segment gets a concrete id; a real slug would be better but any value
  // is enough to tell "handler crashed" from "handler rejected the input".
  const url = route.replace(/\[\.\.\.(\w+)\]/g, '1').replace(/\[(\w+)\]/g, 'probe-id');
  const t0 = Date.now();
  try {
    const res = await fetch(BASE + url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: timeoutFor(25000),
      redirect: 'manual',
    });
    const ctype = res.headers.get('content-type') || '';
    const body = await res.text();
    // `fetch` is undici's Response, which exposes `.status`. `.statusCode` is
    // Node's http.IncomingMessage and is undefined here — using it classified all
    // 210 routes as "other" because every status check silently failed.
    const status = res.status;
    return { route, url, status, ms: Date.now() - t0, ctype, body, ...classify(status, body, ctype) };
  } catch (e) {
    return {
      route, url, status: 0, ms: Date.now() - t0, ctype: '', body: '',
      kind: 'networkError', why: e.name + ': ' + String(e.message).slice(0, 70),
    };
  }
}

(async () => {
  console.log(`=== sweeping ${routes.length} API routes on ${BASE} ===\n`);

  const results = [];
  // STRICTLY SEQUENTIAL, deliberately.
  //
  // The first sweep ran 6 requests in parallel and reported 11 routes as timing out
  // at 25004-25016ms against a 25000ms client budget — the signature of the client
  // giving up, not of eleven backend faults. Re-probed one at a time with a 60s
  // budget, all 11 answered in 36-116ms. So parallel probing here measures the
  // sweep's own concurrency, not the app, and any "failure" it produces is an
  // artifact.
  //
  // Sequential probing is slower but honest. Load behaviour is a separate question
  // and needs a load test, not a reachability sweep.
  for (let i = 0; i < routes.length; i++) {
    results.push(await probe(routes[i]));
    process.stdout.write(`  probed ${i + 1}/${routes.length}\r`);
  }
  console.log(' '.repeat(60) + '\n');

  const by = (k) => results.filter((r) => r.kind === k);

  console.log('=== summary ===');
  for (const k of ['ok', 'redirect', 'rejected', 'notFound', 'missing', 'threw500', 'error500', 'platform500', 'networkError', 'other']) {
    const rows = by(k);
    console.log(`  ${k.padEnd(13)} ${String(rows.length).padStart(4)}`);
  }

  const broken = [...by('threw500'), ...by('error500'), ...by('networkError'), ...by('platform500')];
  // "Live" means the handler executed code, not that the feature works. A 404 JSON
  // body counts: it came from a handler calling NextResponse.json with status 404,
  // whereas the 404 HTML page means no API handler exists at that path at all.
  const live = by('ok').length + by('redirect').length + by('rejected').length + by('notFound').length;
  console.log(`\n  live API handlers (ran code) : ${live}/${results.length}`);
  console.log(`  no handler at this path      : ${by('missing').length}/${results.length}`);
  console.log(`  broken (throw / crash / timeout): ${broken.length}`);

  if (broken.length) {
    console.log('\n=== broken routes (full detail) ===');
    for (const r of broken.sort((a, b) => b.ms - a.ms)) {
      console.log(`  ${String(r.status).padStart(7)} ${String(r.ms).padStart(6)}ms  ${r.route}`);
      console.log(`          ${r.why}`);
    }
  }

  const slow = results.filter((r) => ['ok', 'rejected', 'notFound'].includes(r.kind)).sort((a, b) => b.ms - a.ms).slice(0, 6);
  console.log('\n=== slowest 5 ===');
  for (const r of slow) console.log(`  ${String(r.ms).padStart(6)}ms  ${String(r.status).padStart(3)}  ${r.route}`);

  console.log('\n  NOTE: unauthenticated GET sweep. 401/403/405 mean the handler ran,');
  console.log('  not that the feature works. Functional coverage needs authed tests.');
  process.exit(broken.length ? 1 : 0);
})();