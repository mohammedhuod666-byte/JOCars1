import { test, expect, request, type APIRequestContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

// Parallel-bids race test. NEVER runs against production:
// - Fully skipped unless TEST_DATABASE_URL is set.
// - Aborts if TEST_DATABASE_URL looks like the production host.
// - Creates its own users/car/auction and deletes every created row in afterAll.
//
// Needs the app running against the test database, e.g.:
//   TEST_DATABASE_URL=... PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test bids-race

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const PROD_HOST_MARKER = 'neon.tech';

function isProductionUrl(url: string): boolean {
  return url.includes(PROD_HOST_MARKER);
}

test.skip(!TEST_DB_URL, 'Skipped: TEST_DATABASE_URL is not set (race test needs an isolated test database).');
test.skip(
  !!TEST_DB_URL && isProductionUrl(TEST_DB_URL),
  'Refusing to run: TEST_DATABASE_URL looks like production.',
);

const db = TEST_DB_URL && !isProductionUrl(TEST_DB_URL)
  ? new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } })
  : null;

const runId = Date.now();
const bidderEmails = [`race-bidder-a-${runId}@example.com`, `race-bidder-b-${runId}@example.com`];
const sellerEmail = `race-seller-${runId}@example.com`;
// Must satisfy registerSchema password policy (upper + lower + digit + special, 8+ chars).
const PASSWORD = `RaceTest1!${runId % 10000}`;

let sellerId = '';
let bidderTokens: string[] = [];
let auctionId = '';
let startingPrice = 0;
const createdUserIds: string[] = [];
let createdCarId = '';

async function registerUser(ctx: APIRequestContext, email: string, name: string) {
  const res = await ctx.post('/api/auth/register', { data: { name, email, password: PASSWORD } });
  if (!res.ok()) throw new Error(`register failed for ${email}`);
  const body = (await res.json()) as { data: { user: { id: string }; token: string } };
  createdUserIds.push(body.data.user.id);
  return body.data;
}

test.beforeAll(async () => {
  if (!db || !TEST_DB_URL) return;
  if (isProductionUrl(TEST_DB_URL)) throw new Error('Refusing to run: TEST_DATABASE_URL looks like production.');
  const ctx = await request.newContext({ baseURL: BASE_URL });
  try {
    const seller = await registerUser(ctx, sellerEmail, 'Race Seller');
    sellerId = seller.user.id;
    const bidderA = await registerUser(ctx, bidderEmails[0], 'Race Bidder A');
    const bidderB = await registerUser(ctx, bidderEmails[1], 'Race Bidder B');
    bidderTokens = [bidderA.token, bidderB.token];

    const brand = await db.brand.findFirst();
    const city = await db.city.findFirst();
    const model = brand ? await db.carModel.findFirst({ where: { brandId: brand.id } }) : null;
    if (!brand || !model || !city) {
      test.skip(true, 'Skipped: test database has no Brand/CarModel/City seed rows.');
      return;
    }

    const car = await db.car.create({
      data: {
        slug: `race-car-${runId}`,
        status: 'APPROVED',
        brandId: brand.id,
        modelId: model.id,
        year: 2020,
        kilometers: 50000,
        fuelType: 'PETROL',
        transmission: 'AUTOMATIC',
        color: 'Silver',
        drivetrain: 'FWD',
        condition: 'GOOD',
        description: 'Race-test car, created by bids-race.spec.ts and deleted in afterAll.',
        price: 1000,
        cityId: city.id,
        phone: '0790000000',
        userId: sellerId,
      },
    });
    createdCarId = car.id;

    startingPrice = 1000;
    const auction = await db.auction.create({
      data: {
        carId: car.id,
        sellerId,
        startingPrice,
        currentPrice: startingPrice,
        minBidIncrement: 10,
        endDate: new Date(Date.now() + 60 * 60 * 1000),
        status: 'ACTIVE',
      },
    });
    auctionId = auction.id;
  } finally {
    await ctx.dispose();
  }
});

test.afterAll(async () => {
  if (!db || !TEST_DB_URL) return;
  if (isProductionUrl(TEST_DB_URL)) throw new Error('Refusing to clean: TEST_DATABASE_URL looks like production.');
  try {
    if (auctionId) {
      await db.bid.deleteMany({ where: { auctionId } });
      await db.notification.deleteMany({ where: { userId: { in: createdUserIds } } });
      await db.auction.deleteMany({ where: { id: auctionId } });
    }
    if (createdCarId) await db.car.deleteMany({ where: { id: createdCarId } });
    if (createdUserIds.length > 0) await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  } finally {
    await db.$disconnect();
  }
});

test('20 concurrent bids from 2 users: at least one wins, price advances', async ({ request: api }) => {
  expect(auctionId).not.toBe('');
  expect(bidderTokens).toHaveLength(2);

  const attempts = Array.from({ length: 20 }, (_, i) => ({
    amount: startingPrice + 10 * (i + 1),
    token: bidderTokens[i % 2],
  }));

  const results = await Promise.all(
    attempts.map((a) =>
      api.post(`/api/auctions/${auctionId}/bid`, {
        headers: { Authorization: `Bearer ${a.token}` },
        data: { amount: a.amount },
      }),
    ),
  );

  const statuses = results.map((r) => r.status());
  const wins = statuses.filter((s) => s === 201);
  expect(wins.length).toBeGreaterThanOrEqual(1);
  for (const s of statuses) {
    expect([201, 400, 409]).toContain(s);
  }

  const auction = await db!.auction.findUniqueOrThrow({ where: { id: auctionId } });
  expect(auction.currentPrice).toBeGreaterThan(startingPrice);
});
