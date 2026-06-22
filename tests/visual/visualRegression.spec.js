const { test, expect } = require('../../fixtures/testFixtures');
const { createLogger } = require('../../utils/logger');

/**
 * VISUAL REGRESSION TEST SUITE
 *
 * Layer: 4 (Visual)
 * Priority: Medium
 * Estimated Time: 3-5 minutes
 *
 * Compares current screenshots against baselines.
 * First run generates baselines automatically.
 * Subsequent runs detect visual differences.
 *
 * To update baselines after intentional UI changes:
 *   npm run update:snapshots
 */

test.describe('Visual Regression Testing @visual', () => {
  const logger = createLogger('VisualRegression');

  test('Homepage visual matches baseline', async ({ page }) => {
    logger.step('Capturing homepage screenshot');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for animations to complete
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      timeout: 30000,
    });

    logger.result('Homepage Visual', true);
  });

  test('Homepage hero section matches baseline', async ({ page }) => {
    logger.step('Capturing hero section screenshot');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Capture just the above-the-fold area
    await expect(page).toHaveScreenshot('homepage-hero.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: false,
    });

    logger.result('Hero Section Visual', true);
  });

  test('Products page visual matches baseline', async ({ page }) => {
    logger.step('Capturing Products page screenshot');

    await page.goto('/product/pro-photography');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('product-pro-photography.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      timeout: 30000,
    });

    logger.result('Products Page Visual', true);
  });

  test('About Us page visual matches baseline', async ({ page }) => {
    logger.step('Capturing About Us page screenshot');

    await page.goto('/about-us');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('about-us-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      timeout: 30000,
    });

    logger.result('About Us Visual', true);
  });

  test('Food Industry page visual matches baseline', async ({ page }) => {
    logger.step('Capturing Food Industry page screenshot');

    await page.goto('/industry/food');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('industry-food.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      timeout: 30000,
    });

    logger.result('Food Industry Visual', true);
  });

  test('Navigation bar visual matches baseline', async ({ page }) => {
    logger.step('Capturing navigation bar screenshot');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('header').first();
    if (await nav.isVisible()) {
      await expect(nav).toHaveScreenshot('navigation-bar.png', {
        maxDiffPixelRatio: 0.03,
      });
    }

    logger.result('Navigation Bar Visual', true);
  });

  test('Footer visual matches baseline', async ({ page }) => {
    logger.step('Capturing footer screenshot');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const footer = page.locator('footer');
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot('footer.png', {
        maxDiffPixelRatio: 0.05,
      });
    }

    logger.result('Footer Visual', true);
  });
});
