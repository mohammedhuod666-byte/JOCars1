#!/usr/bin/env node
/**
 * Lets OpenNext's Cloudflare build run on Windows without Administrator rights.
 *
 * THE PROBLEM
 * OpenNext reproduces the traced dependency layout of a Next.js standalone
 * build. When an entry in `.nft.json` is itself a symlink — which npm creates for
 * linked/workspace packages, and `node_modules/keyv` is one here — it recreates
 * it with `symlinkSync`. On Windows that requires either Administrator rights or
 * Developer Mode, so the build dies with:
 *
 *   EPERM: operation not permitted, symlink 'node_modules\keyv' ->
 *   '.open-next\server-functions\default\.next\node_modules\keyv-...'
 *
 * The failure has nothing to do with the app or with Cloudflare: the bundle had
 * already been produced, and the process was only copying files into place.
 *
 * THE FIX
 * When `symlinkSync` is refused, copy the resolved target instead. The end state
 * of the output directory is identical from the bundler's point of view — the
 * dependency is present at that path — so nothing downstream can tell the
 * difference. Copying is slower and uses disk, which is the whole reason the
 * symlink exists; on a CI machine or with Developer Mode enabled the original
 * branch still runs untouched.
 *
 * Applied by patching the installed file, because there is no supported flag for
 * it. Wired into `postinstall` so a fresh `npm install` re-applies it, and
 * idempotent so re-running is a no-op.
 */

const fs = require('fs');
const path = require('path');

const TARGET = path.join(
  'node_modules', '@opennextjs', 'aws', 'dist', 'build', 'copyTracedFiles.js',
);

const MARKER = 'jo-cars: windows symlink fallback';

if (!fs.existsSync(TARGET)) {
  console.log('[patch-opennext] @opennextjs/aws not installed yet — nothing to patch.');
  process.exit(0);
}

let src = fs.readFileSync(TARGET, 'utf8');

if (src.includes(MARKER)) {
  console.log('[patch-opennext] already patched.');
  process.exit(0);
}

const NEEDLE = `            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }`;

const REPLACEMENT = `            catch (e) {
                if (e.code === "EEXIST") {
                    // Already present; nothing to do.
                }
                else if (e.code === "EPERM" || e.code === "EACCES" || e.code === "ENOTSUP") {
                    // ${MARKER}
                    // Windows refuses symlink creation without Administrator
                    // rights or Developer Mode. Copy the resolved target so the
                    // dependency exists at the expected path; the bundle cannot
                    // tell the difference.
                    try {
                        const resolved = path.resolve(path.dirname(from), symlink);
                        cpSync(resolved, to, { recursive: true, dereference: true });
                    }
                    catch (copyError) {
                        logger.debug("Error copying symlink target:", copyError);
                        erroredFiles.push(to);
                    }
                }
                else {
                    throw e;
                }
            }`;

if (!src.includes(NEEDLE)) {
  console.error(
    '[patch-opennext] The expected catch block was not found. The installed ' +
    '@opennextjs/aws version has changed; re-check whether the Windows symlink ' +
    'problem still applies before deploying.',
  );
  process.exit(1);
}

src = src.replace(NEEDLE, REPLACEMENT);

// cpSync must be imported for the fallback above to work.
if (!/cpSync/.test(src.split('\n')[0]) && !/import[^;]*cpSync[^;]*from "node:fs"/.test(src)) {
  src = src.replace(
    /(import \{[^}]*?)(\} from "node:fs")/,
    (m, head, tail) => (head.includes('cpSync') ? m : `${head} cpSync,${tail}`),
  );
}

fs.writeFileSync(TARGET, src, 'utf8');
console.log('[patch-opennext] patched copyTracedFiles.js with a Windows copy fallback.');