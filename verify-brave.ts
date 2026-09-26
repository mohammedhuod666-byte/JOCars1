import { chromium } from 'playwright';
import path from 'path';

async function verifyBrave() {
  const bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
  
  const browser = await chromium.launch({
    executablePath: bravePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    locale: 'ar-JO',
    extraHTTPHeaders: { 'ngrok-skip-browser-warning': 'true' },
  });

  const page = await context.newPage();
  const targetUrl = 'http://localhost:3000/cars/cmui9bbmw00i710xa2pa3801b';

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const screenshotDir = path.resolve('C:\\Users\\zi-jo.com\\.gemini\\antigravity\\brain\\90950266-bd9a-4cb1-8db4-48ecae25ef69');
    
    // Open accordion
    const accordionBtn = page.locator('button:has-text("القيمة السوقية العادلة (تحليل AI)")').first();
    if (await accordionBtn.isVisible()) {
      await accordionBtn.click();
      await page.waitForTimeout(1500);

      // Scroll to the comparables table
      const compsTable = page.locator('text=أين ذهبت الإعلانات؟').first();
      if (await compsTable.isVisible()) {
        await compsTable.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        const compsPath = path.join(screenshotDir, 'brave_comps_matrix.png');
        await page.screenshot({ path: compsPath });
        console.log(`📸 تم حفظ لقطة شاشة جدول المقارنات: ${compsPath}`);
      }
    }
  } catch (err: any) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

verifyBrave();
