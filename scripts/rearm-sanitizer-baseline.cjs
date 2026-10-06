// Restore the jsdom baseline so verify-sanitizer.cjs can keep proving equivalence.
//
// isomorphic-dompurify was uninstalled after the migration to sanitize-html, which
// made the script degrade to "90/90 with baseline comparisons made: 0" — the residue
// and formatting checks still ran, but the part that proves the NEW library is as
// strict as the OLD one silently stopped running. A security test that quietly loses
// its comparison is worse than no test, because the output still says PASS.
//
// jsdom only runs inside this script, on Node. It is never bundled for Workers: it
// reads `browser/default-stylesheet.css` from disk at require time, which is exactly
// why the app cannot import it. Installing it here re-arms the comparison without
// putting it back on any runtime path.
//
// --no-save so it does not re-enter package.json dependencies and get traced into
// the Worker bundle by a future `npm install`.
const { execFileSync } = require('child_process');

console.log('installing isomorphic-dompurify for local comparison only...');
try {
  const out = execFileSync(
    'npm.cmd',
    ['install', '--no-save', '--ignore-scripts', 'isomorphic-dompurify'],
    { encoding: 'utf8', timeout: 1800000, shell: true },
  );
  console.log(out.split('\n').slice(-4).join('\n'));
} catch (e) {
  console.error('install failed:', String(e.message).slice(0, 300));
  process.exit(1);
}

// Confirm it loads, and that package.json was not modified.
try {
  const s = require('isomorphic-dompurify');
  const fn = s.default || s;
  const out = fn.sanitize('<img src=x onerror=alert(1)><b>ok</b>', {
    ALLOWED_TAGS: ['b'],
    ALLOWED_ATTR: [],
  });
  console.log('\njsdom baseline loads. sample sanitize ->', JSON.stringify(out));
  if (/<img/i.test(out) || /onerror/i.test(out)) {
    console.error('baseline is NOT sanitising — the comparison would be meaningless.');
    process.exit(1);
  }
  const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
  const declared = (pkg.dependencies || {})['isomorphic-dompurify'] || (pkg.devDependencies || {})['isomorphic-dompurify'];
  console.log('declared in package.json:', declared || 'no (correct)');
  console.log('\nbaseline re-armed.');
} catch (e) {
  console.error('could not load isomorphic-dompurify:', e.message.slice(0, 200));
  process.exit(1);
}