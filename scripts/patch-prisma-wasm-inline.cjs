#!/usr/bin/env node
/**
 * Makes Prisma's WASM Query Compiler loadable on a platform with no filesystem.
 *
 * WHY
 * The schema uses `engineType = "client"` — the Rust-free Query Compiler — because
 * Cloudflare Workers cannot load native binaries at all. With that engine type,
 * the generated client loads its compiler like this:
 *
 *   getQueryCompilerWasmModule: async () => {
 *     const p = require('path').join(config.dirname, 'query_compiler_bg.wasm')
 *     const bytes = require('fs').readFileSync(p)
 *     return new WebAssembly.Module(bytes)
 *   }
 *
 * A filesystem read. Two independent things break on Workers:
 *
 *   a) OpenNext registers only JavaScript entries in `handler.mjs.meta.json`
 *      (it lists `query_compiler_bg.js`, never the `.wasm`), so the file is not
 *      uploaded and the read fails with
 *      "no such file or directory, readAll '/bundle/.../query_compiler_bg.wasm'".
 *   b) Even delivered, Workers REFUSE to compile WebAssembly from bytes. Measured
 *      on the real runtime, all three byte paths fail identically:
 *        new WebAssembly.Module(bytes)   -> CompileError: Wasm code generation
 *        WebAssembly.compile(bytes)      ->   disallowed by embedder
 *        WebAssembly.instantiate(bytes)  ->   (same)
 *      Only a statically imported, pre-compiled module works
 *      (verified: `import m from './x.wasm'` compiled and ran).
 *
 * THE FIX — two paths, one client
 *   1. Preferred: if `globalThis.__JO_CARS_PRISMA_WASM__` is already set, use it.
 *      `scripts/inject-prisma-wasm-worker.cjs` injects it as a static import into
 *      the built Worker's entry module, which is what the Workers path needs.
 *   2. Fallback: compile the inlined base64 bytes. This is what Node — and
 *      therefore Vercel and local development — uses, and it needs no filesystem
 *      and no bundler cooperation.
 *
 * One generated client serves both platforms, so there is no second Prisma
 * generator output and no risk of the two drifting apart.
 *
 * The decoded module is memoised on `globalThis`: compiling ~1.9 MB of WebAssembly
 * per query would dominate latency, and the module is stateless and safe to share
 * across concurrent requests.
 *
 * RUNS AFTER `prisma generate`, which rewrites this file every time.
 * Idempotent, and fails loudly if the expected code is not found — a silent no-op
 * would produce a Worker that looks deployed and 500s on every query.
 */

const fs = require('fs');
const path = require('path');

const CLIENT_DIR = path.join('node_modules', '.prisma', 'client');
const TARGET = path.join(CLIENT_DIR, 'index.js');
const WASM = path.join(CLIENT_DIR, 'query_compiler_bg.wasm');

const MARKER = 'jo-cars: WASM query compiler loader';

const NEEDLE = `      getQueryCompilerWasmModule: async () => {
        const queryCompilerWasmFilePath = require('path').join(config.dirname, 'query_compiler_bg.wasm')
        const queryCompilerWasmFileBytes = require('fs').readFileSync(queryCompilerWasmFilePath)

        return new WebAssembly.Module(queryCompilerWasmFileBytes)
      }`;

if (!fs.existsSync(TARGET) || !fs.existsSync(WASM)) {
  console.log('[patch-prisma-wasm] generated client not present — run prisma generate first.');
  process.exit(0);
}

let src = fs.readFileSync(TARGET, 'utf8');

if (src.includes(MARKER)) {
  console.log('[patch-prisma-wasm] already patched.');
  process.exit(0);
}

if (!src.includes(NEEDLE)) {
  console.error(
    '[patch-prisma-wasm] The expected readFileSync block was not found in ' +
      TARGET + '.\n' +
      'Prisma has changed how the compiler is loaded. Re-check whether Workers ' +
      'can still reach it before deploying — do not assume this patch is needed ' +
      'or that it still applies.',
  );
  process.exit(1);
}

const b64 = fs.readFileSync(WASM).toString('base64');

const REPLACEMENT = `      getQueryCompilerWasmModule: async () => {
        /* ${MARKER}
           Upstream read this file with fs.readFileSync. Workers have no
           filesystem AND refuse to compile WebAssembly from bytes, so the
           compiler arrives pre-compiled as a static import instead; on Node the
           inlined bytes below are used. Same module either way.
           See scripts/patch-prisma-wasm-inline.cjs. */
        const g = globalThis
        if (!g.__JO_CARS_PRISMA_WASM__) {
          const bin = atob('${b64}')
          const bytes = new Uint8Array(bin.length)
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
          g.__JO_CARS_PRISMA_WASM__ = new WebAssembly.Module(bytes)
        }
        return g.__JO_CARS_PRISMA_WASM__
      }`;

src = src.replace(NEEDLE, REPLACEMENT);
fs.writeFileSync(TARGET, src, 'utf8');

console.log(
  `[patch-prisma-wasm] loader installed; ${(fs.statSync(WASM).size / 1048576).toFixed(2)} MB ` +
    `of compiler inlined as fallback (${b64.length} base64 chars).`,
);
