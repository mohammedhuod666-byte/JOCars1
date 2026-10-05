const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 1600 },
    locale: 'ar-JO'
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to car page...');
  await page.goto('http://127.0.0.1:3000/cars/cmui9bbmw00i710xa2pa3801b', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log('Waiting for /api/valuations response...');
  try {
    const valResponse = await page.waitForResponse(
      res => res.url().includes('/api/valuations'),
      { timeout: 50000 }
    );
    console.log('Valuation API responded with status:', valResponse.status());
  } catch (e) {
    console.log('Timed out waiting for /api/valuations response:', e.message);
  }

  // Wait 2 seconds for React to finish rendering
  await page.waitForTimeout(2000);

  // Click the Valuation accordion header to expand the cards
  const accordionHeader = page.locator('button:has-text("تقرير التقييم العادل")').first();
  if (await accordionHeader.count() > 0) {
    console.log('Clicking ValuationReport accordion header to expand...');
    await accordionHeader.click();
    await page.waitForTimeout(1500);
  } else {
    console.log('Accordion header not found!');
  }

  // Scroll accordion into view
  if (await accordionHeader.count() > 0) {
    await accordionHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  // Take screenshot
  const artifactPath = path.resolve('C:/Users/zi-jo.com/.gemini/antigravity/brain/90950266-bd9a-4cb1-8db4-48ecae25ef69/live_verified_ui.png');
  await page.screenshot({ path: artifactPath, fullPage: true });
  console.log(`Saved screenshot to ${artifactPath}`);

  // Find any text containing 23,927 or 24,500 or القيمة السوقية
  const bodyText = await page.innerText('body');
  console.log('RESULTS CHECK:');
  console.log('- Contains 23,927 (New supporting range)?', bodyText.includes('23,927') || bodyText.includes('23927'));
  console.log('- Contains 28,182 (New supporting range)?', bodyText.includes('28,182') || bodyText.includes('28182'));
  console.log('- Contains 24,500 (Old stale FMV)?', bodyText.includes('24,500') || bodyText.includes('24500'));
  console.log('- Contains "غير متاح (شواهد داعمة فقط)"?', bodyText.includes('غير متاح'));
  console.log('- Contains "النطاق الاسترشادي للشواهد الداعمة"?', bodyText.includes('النطاق الاسترشادي للشواهد الداعمة'));
  console.log('- Contains P83?', bodyText.includes('P83'));
  console.log('- Contains P92 (Old stale percentile)?', bodyText.includes('P92'));

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
