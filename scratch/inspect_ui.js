const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 2200 } });

  console.log('Navigating to car page...');
  await page.goto('http://localhost:3000/cars/cmui9bbmw00i710xa2pa3801b');

  console.log('Waiting 28s for valuation calculation to complete...');
  await page.waitForTimeout(28000);

  // Click the valuation bar button to expand if closed
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const txt = await b.innerText();
    if (txt.includes('تقرير التقييم العادل')) {
      console.log('Found valuation bar button! Text:', txt.slice(0, 100));
      console.log('Clicking to expand...');
      await b.click();
      await page.waitForTimeout(1500);
      break;
    }
  }

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('=== EXTRACTED UI STRINGS ===');
  const matched = pageText.split('\n')
    .map(l => l.trim())
    .filter(l => (
      l.includes('القيمة') ||
      l.includes('نطاق') ||
      l.includes('الموثوقية') ||
      l.includes('23,927') ||
      l.includes('28,182') ||
      l.includes('غير متاح') ||
      l.includes('24,500') ||
      l.includes('P83') ||
      l.includes('P92') ||
      l.includes('موقف السعر')
    ));
  console.log(matched.join('\n'));

  await page.screenshot({
    path: 'C:/Users/zi-jo.com/.gemini/antigravity/brain/90950266-bd9a-4cb1-8db4-48ecae25ef69/live_verified_ui.png',
    fullPage: true,
  });
  console.log('SCREENSHOT_SAVED');

  await browser.close();
})();
