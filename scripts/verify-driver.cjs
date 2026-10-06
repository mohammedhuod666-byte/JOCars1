// Verifies the Prisma driver against the REAL production database through the
// exact code path `src/lib/prisma.ts` uses — including the factory choice.
//
// The transport change is the kind of edit that compiles cleanly, passes types, and
// still returns wrong results. Comparing the adapter used here against the one the
// deployed Worker uses matters: `PrismaNeon` and `PrismaNeonHTTP` have different
// signatures, so it is possible to verify one and ship the other.
//
// This runs SEQUENTIALLY by default, because the Workers failure only reproduced on
// a warm pool — the first query succeeded and later ones failed. A single-shot test
// would have reported green for a configuration that 500s on the second request.
const fs = require('fs');
const path = require('path');

// Read .env exactly as Next does.
for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  if (/^\s*[A-Z0-9_]+\s*=/.test(line) && !line.trim().startsWith('#')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

// Which factory does src/lib/prisma.ts actually reference? Read the source rather
// than trusting this script's own imports to stay in sync with it.
const prismaSrc = fs.readFileSync(path.join('src', 'lib', 'prisma.ts'), 'utf8');
const factory = (prismaSrc.match(/require\('@prisma\/adapter-neon'\)[\s\S]{0,220}/) || [''])[0];
const usedFactory = (factory.match(/PrismaNeon(HTTP)?/) || [])[1];
console.log(`src/lib/prisma.ts uses: PrismaNeon${usedFactory || '?'} (HTTP=${usedFactory === 'HTTP'})`);

const { PrismaNeonHTTP } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');

const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL, { arrayMode: true });
const prisma = new PrismaClient({ adapter, log: ['error'] });

(async () => {
  let failed = 0;

  // Deliberately warm the pool first, then repeat: this is the shape that failed.
  const probe = async (label, fn) => {
    const t0 = Date.now();
    try {
      const v = await fn();
      console.log(`  PASS  ${String(Date.now() - t0).padStart(5)}ms  ${label.padEnd(34)} ${JSON.stringify(v)}`);
      return true;
    } catch (e) {
      failed++;
      console.log(`  FAIL  ${String(Date.now() - t0).padStart(5)}ms  ${label.padEnd(34)} ${e.name}: ${String(e.message).slice(0, 200)}`);
      return false;
    }
  };

  console.log('\n=== sequential repeats on a warm connection ===');
  for (let i = 1; i <= 5; i++) {
    await probe(`count(User) #${i}`, () => prisma.user.count());
  }

  console.log('\n=== the shapes the failing routes actually used ===');
  await probe('cars with relations + take', () =>
    prisma.car.findMany({ take: 3, orderBy: { createdAt: 'desc' }, select: { id: true, brand: true, status: true } })
      .then((r) => r.length));
  await probe('forum topic list shape', () =>
    prisma.forumTopic.count());
  await probe('part count', () => prisma.part.count());
  await probe('wanted ad count', () => prisma.wanted.count());
  await probe('transaction (read-only)', () =>
    prisma.$transaction(async (tx) => (await tx.car.count())));
  await probe('raw SELECT', () => prisma.$queryRawUnsafe('SELECT count(*)::int as n FROM "User"')
    .then((r) => r[0].n));

  console.log('\n=== concurrency (the pool must serve parallel requests too) ===');
  const t0 = Date.now();
  const settled = await Promise.allSettled([
    prisma.user.count(),
    prisma.car.count(),
    prisma.part.count(),
    prisma.wanted.count(),
    prisma.forumTopic.count(),
  ]);
  const rejected = settled.filter((s) => s.status === 'rejected');
  console.log(`  ${settled.length - rejected.length}/${settled.length} parallel queries resolved in ${Date.now() - t0}ms`);
  for (const r of rejected) console.log(`    rejected: ${r.reason?.name}: ${String(r.reason?.message).slice(0, 160)}`);
  failed += rejected.length;

  console.log(`\n  ${failed === 0 ? 'ALL PASS' : failed + ' FAILURE(S)'}`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});