// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Visual Regression Testing
 * 
 * HOW BASELINES WORK:
 * - First run: snapshots are CREATED (tests pass automatically)
 * - Subsequent runs: screenshots COMPARED to baseline
 * - To update baselines: npx playwright test tests/visual/ --update-snapshots
 * 
 * CI NOTE: We use --update-snapshots in CI so baselines are always
 * regenerated fresh. For strict visual diffing, commit snapshots to repo.
 */

test.describe('Visual Regression Testing @visual', () => {

  test.beforeEach(async ({ page }) => {
    // Block cookie consent / chat widgets that cause flakiness
    await page.route('**/*intercom*', route => route.abort());
    await page.route('**/*zendesk*', route => route.abort());
    await page.route('**/*hubspot*', route => route.abort());
  });

  test('Homepage visual matches baseline', async ({ page }) => {
    await page.goto('https://www.ocus.com', { waitUntil: 'networkidle' });
    
    // Dismiss cookie banner if present
    const cookieBtn = page.locator('button').filter({ hasText: /accept|agree|ok|got it/i }).first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(500);
    }

    // Mask dynamic/animated elements
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: false,
      mask: [
        page.locator('[class*="cookie"]'),
        page.locator('[class*="chat"]'),
        page.locator('[class*="intercom"]'),
        page.locator('video'),
        page.locator('iframe'),
      ],
      maxDiffPixelRatio: 0.05, // 5% tolerance for dynamic content
      animations: 'disabled',
    });
  });

  test('Homepage hero section matches baseline', async ({ page }) => {
    await page.goto('https://www.ocus.com', { waitUntil: 'networkidle' });
    
    // Find hero section — try multiple selectors
    const hero = page.locator('section').first();
    
    await expect(hero).toHaveScreenshot('hero-section.png', {
      mask: [page.locator('video'), page.locator('iframe')],
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('Products page visual matches baseline', async ({ page }) => {
    await page.goto('https://www.ocus.com/products', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Let lazy images load
    
    await expect(page).toHaveScreenshot('products-page.png', {
      fullPage: false,
      mask: [page.locator('video'), page.locator('iframe')],
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('About Us page visual matches baseline', async ({ page }) => {
    await page.goto('https://www.ocus.com/about-us', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('about-us-page.png', {
      fullPage: false,
      mask: [page.locator('video'), page.locator('iframe')],
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('Food Industry page visual matches baseline', async ({ page }) => {
    // Try multiple possible URLs for food industry page
    const urls = [
      'https://www.ocus.com/industries/food',
      'https://www.ocus.com/food',
      'https://www.ocus.com/solutions/food',
    ];
    
    let loaded = false;
    for (const url of urls) {
      const response = await page.goto(url, { waitUntil: 'networkidle' }).catch(() => null);
      if (response && response.ok()) {
        loaded = true;
        break;
      }
    }
    
    if (!loaded) {
      test.skip(true, 'Food Industry page URL not found — skipping visual test');
      return;
    }
    
    await expect(page).toHaveScreenshot('food-industry-page.png', {
      fullPage: false,
      mask: [page.locator('video'), page.locator('iframe')],
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('Navigation bar visual matches baseline', async ({ page }) => {
    await page.goto('https://www.ocus.com', { waitUntil: 'networkidle' });
    
    // Try multiple nav selectors
    const nav = page.locator('nav, header, [role="navigation"]').first();
    await nav.waitFor({ state: 'visible', timeout: 10000 });
    
    await expect(nav).toHaveScreenshot('navigation-bar.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('Footer visual matches baseline', async ({ page }) => {
    await page.goto('https://www.ocus.com', { waitUntil: 'networkidle' });
    
    const footer = page.locator('footer').first();
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Let lazy-loaded footer content appear
    
    await expect(footer).toHaveScreenshot('footer.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

});
