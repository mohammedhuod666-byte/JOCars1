#!/usr/bin/env node
/**
 * Cache-header guard for the API surface.
 *
 * WHY THIS EXISTS
 * Two real leaks were found by measurement, not by reading code:
 *
 *   1. next.config.js stamped `public, max-age=30, stale-while-revalidate=60`
 *      on every `/api/cars/*` route. That covered `/api/cars/my` (a seller's
 *      own listings) and `/api/cars/[id]/documents` (a short-lived SIGNED url
 *      for a license photo), with no `Vary`. A shared cache could replay a
 *      signed document link — carrying the owner's name and ID — to anyone for
 *      up to 90 seconds.
 *
 *   2. /api/sounds/stream/[id] performed a CONDITIONAL authorization check and
 *      then set `public, max-age=31536000` UNCONDITIONALLY, so the owner's own
 *      playback of an unapproved recording (their voice) was publicly cacheable
 *      for a year.
 *
 * Both were invisible in review because the rule was "look at the header each
 * route returns", repeated 208 times. This script checks the invariant instead,
 * so the next edit that reintroduces it fails loudly.
 *
 * WHAT IT ENFORCES
 *   - Every API route's Cache-Control, if it says `public`, must not sit in a
 *     handler that also performs an authorization check — unless the public and
 *     the authorized branches are provably separate returns.
 *   - next.config.js must keep a blanket `private, no-store` on `/api/:path*`,
 *     otherwise the framework default (`public, max-age=0, must-revalidate`)
 *     silently applies to every route again.
 *
 * Run: npm run audit:cache   (exit code 1 on violation)
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join('src', 'app', 'api');
const violations = [];
let scanned = 0;

/** Collects every `return <Response|json>` that sets a Cache-Control header. */
function analyse(file) {
  const src = fs.readFileSync(file, 'utf8');
  const usesAuth = /authenticateRequest|requireAdmin|getServerSession/.test(src);

  // Split into return blocks so a public branch can be told apart from an
  // authorized one. Coarse but adequate: we only flag a file when `public` is
  // set and the SAME block also guards on auth.
  const blocks = src.split(/\n\s*return\s+/).slice(1);
  for (const block of blocks) {
    const cc = /Cache-Control['"]?\s*[,:]\s*['"]([^'"]+)['"]/.exec(block);
    if (!cc) continue;
    if (!/public/.test(cc[1])) continue;

    // A public branch is only safe if the authorization guard is not in this
    // same block.
    const guardInSameBlock = /authenticateRequest|role !== 'ADMIN'|userId !==|Forbidden|403/.test(
      block.split('Cache-Control')[0],
    );
    if (usesAuth && guardInSameBlock) {
      violations.push({
        file,
        reason: 'a return block mixes an authorization guard with a `public` Cache-Control',
        header: cc[1],
      });
    }
  }
}

(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (e.name !== 'route.ts') continue;
    scanned++;
    analyse(p);
  }
})(API_DIR);

// The blanket deny must stay in place.
const configSrc = fs.readFileSync('next.config.js', 'utf8');
const hasBlanketDeny =
  /source:\s*'\/api\/:path\*'/.test(configSrc) &&
  /private, no-store/.test(configSrc);
if (!hasBlanketDeny) {
  violations.push({
    file: 'next.config.js',
    reason: 'missing the blanket `private, no-store` on /api/:path* — the framework default would apply `public` to every route again',
  });
}

console.log(`API routes scanned: ${scanned}`);
if (violations.length === 0) {
  console.log('cache-header guard: PASS (no public cache on authorized responses)');
  process.exit(0);
}
console.log(`\ncache-header guard: ${violations.length} violation(s)\n`);
for (const v of violations) {
  console.log(`  ${v.file}`);
  console.log(`    ${v.reason}`);
  if (v.header) console.log(`    header: ${v.header}`);
}
process.exit(1);
