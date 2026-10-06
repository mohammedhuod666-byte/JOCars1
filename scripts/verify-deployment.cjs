// Final state check for the Cloudflare deployment, read from the API rather than
// from wrangler's exit code.
//
// Wrangler printed no ERROR on the last deploy, but its exit status and the trigger
// message were ambiguous in earlier runs, and "the CLI looked happy" is not evidence.
// Two things are checked directly:
//
//   1. the three cron schedules are attached
//   2. the deployed script really contains both injected pieces: the `scheduled`
//      export (without which crons fire into nothing) and the Query Compiler module
//      (without which every database query fails)
//
// The script GET returns multipart, so it is scanned as text rather than parsed as
// JSON — the point is presence, not structure.
const fs = require('fs');
const https = require('https');

const ACC = 'b1f057b456a47aa84e94ad33eeeedc05';
const WORKER = 'jo-cars-marketplace';
const CONFIG = 'C:/Users/zi-jo.com/AppData/Roaming/xdg.config/.wrangler/config/default.toml';
const token = (fs.readFileSync(CONFIG, 'utf8').match(/oauth_token\s*=\s*"([^"]+)"/) || [])[1];

function api(p) {
  return new Promise((resolve) => {
    const req = https.request(
      { host: 'api.cloudflare.com', path: '/client/v4' + p, headers: { Authorization: `Bearer ${token}` } },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({
            s: res.statusCode,
            // latin1 keeps byte offsets 1:1 with the raw bytes, so splitting the
            // multipart body on its boundary cannot corrupt the wasm parts.
            b: Buffer.concat(chunks).toString('latin1'),
            ctype: res.headers['content-type'] || '',
          }),
        );
      },
    );
    req.on('error', (e) => resolve({ s: 0, b: e.message }));
    req.end();
  });
}

const EXPECTED = ['0 1 * * *', '0 4 * * *', '0 6 * * *'];

(async () => {
  let failures = 0;
  const check = (label, ok, detail) => {
    if (!ok) failures++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  — ' + detail : ''}`);
  };

  console.log('=== 1. cron schedules ===');
  const s = await api(`/accounts/${ACC}/workers/scripts/${WORKER}/schedules`);
  let live = [];
  try {
    live = JSON.parse(s.b).result.schedules.map((x) => x.cron).sort();
  } catch {
    /* handled below */
  }
  console.log(`     attached: ${JSON.stringify(live)}`);
  check('all three schedules attached', live.length === 3, `got ${live.length}`);
  check('schedules match wrangler.jsonc', JSON.stringify(live) === JSON.stringify([...EXPECTED].sort()));

  console.log('\n=== 2. deployed script contents ===');
  // Read ONLY the worker.js part of the multipart body. Scanning the whole body gives
  // false results: it mixes three wasm binaries and the bundle, so a regex either
  // matches an unrelated occurrence or misses the real one. That produced two
  // contradictory readings earlier ("has a scheduled export: true" alongside
  // "default export carries scheduled: false") on a build that was in fact correct.
  const script = await api(`/accounts/${ACC}/workers/scripts/${WORKER}`);
  const whole = script.b;
  const boundary = /boundary=([0-9a-f]+)/.exec(script.ctype || '');
  let js = '';
  if (boundary) {
    const parts = whole.split('--' + boundary[1]);
    const workerPart = parts.find((p) => /name="worker\.js"/.test(p));
    if (workerPart) {
      const at = workerPart.indexOf('\r\n\r\n');
      js = at >= 0 ? workerPart.slice(at + 4) : workerPart;
    }
  }
  console.log(`     multipart parts: ${boundary ? whole.split('--' + boundary[1]).length : 'n/a'}, worker.js: ${js.length.toLocaleString()} bytes`);
  check('worker.js part located', js.length > 1000);

  // esbuild flattens the entry's exports into one trailing `export { ... }` list, so
  // `scheduled` must appear there. Checking for a `function scheduled` definition
  // instead would pass on an unexported function, which the runtime cannot invoke.
  check('scheduled is EXPORTED', /export\s*\{[\s\S]{0,300}?\bscheduled\b/.test(js));
  check('Query Compiler uploaded as a module', /prisma-query-compiler\.wasm|prisma-qu/.test(js));
  check('fetch handler present', /\bfetch\b/.test(js.slice(-4000)));

  console.log('\n=== 3. live HTTP ===');
  const paths = ['/api/health', '/api/cars', '/api/wanted'];
  for (const p of paths) {
    const code = await new Promise((resolve) => {
      const req = https.get(
        'https://jo-cars-marketplace.mohammedhuod666.workers.dev' + p,
        { headers: { accept: 'application/json' } },
        (res) => {
          res.resume();
          res.on('end', () => resolve(res.statusCode));
        },
      );
      req.on('error', () => resolve(0));
      req.setTimeout(30000, () => {
        req.destroy();
        resolve('TIMEOUT');
      });
    });
    check(`${p} -> ${code}`, code === 200, '');
  }

  console.log(`\n  ${failures === 0 ? 'ALL GREEN' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures ? 1 : 0);
})();