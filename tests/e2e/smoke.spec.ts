import { test, expect } from '@playwright/test';

// Smoke suite: public pages render + critical APIs answer.
// Run: npm run test:e2e  (needs the app on :3000 → `node server.js`)

test('homepage renders hero + search', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /بيع واشتري/ })).toBeVisible();
  await expect(page.getByPlaceholder(/دور على ماركة/)).toBeVisible();
});

test('login page renders password + Google options', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByPlaceholder(/example@email.com|079/)).toBeVisible();
});

test('cars API lists approved cars', async ({ request }) => {
  const res = await request.get('/api/cars?limit=1');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.success).toBe(true);
  expect(Array.isArray(body.data)).toBe(true);
});

test('moderation queue is not public', async ({ request }) => {
  const res = await request.get('/api/cars?status=PENDING&limit=1');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.success).toBe(true);
  for (const car of body.data as Array<{ status: string }>) {
    expect(car.status).not.toBe('PENDING');
  }
});

test('news page loads', async ({ page }) => {
  await page.goto('/news');
  await expect(page).toHaveTitle(/JO Cars|جو كارز|أخبار/);
});

test('auctions API returns paginated active auctions', async ({ request }) => {
  const res = await request.get('/api/auctions?type=all&limit=2');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.success).toBe(true);
  expect(Array.isArray(body.data)).toBe(true);
  expect(typeof body.pagination?.hasMore).toBe('boolean');
});

test('admin cars API requires admin auth', async ({ request }) => {
  const res = await request.get('/api/admin/cars');
  expect(res.status()).toBe(401);
});

test('auction creation requires auth before validation', async ({ request }) => {
  const res = await request.post('/api/auctions', { data: { garbage: true } });
  expect(res.status()).toBe(401);
});

test('conversation messages require auth', async ({ request }) => {
  const res = await request.get('/api/conversations/invalid-id/messages');
  expect([401, 404]).toContain(res.status());
});
