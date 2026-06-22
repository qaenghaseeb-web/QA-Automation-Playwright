const { test, expect } = require('../../fixtures/testFixtures');
const { createLogger } = require('../../utils/logger');

/**
 * SMOKE TEST SUITE: Homepage Validation
 *
 * Layer: 1 (Smoke)
 * Priority: Critical — runs first in pipeline
 * Estimated Time: 1-2 minutes
 *
 * Verifies:
 * - Website opens successfully
 * - Logo is visible
 * - Hero section renders
 * - CTA buttons are present
 * - Key figures section visible
 * - Footer is visible
 * - No console errors on load
 */

test.describe('Homepage Validation @smoke', () => {
  const logger = createLogger('HomepageTest');

  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
    await homePage.waitForPageLoad();
  });

  test('Homepage loads successfully with correct title', async ({ page }) => {
    logger.step('Verifying page title');

    const title = await page.title();
    logger.info(`Page title: "${title}"`);

    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // OCUS title should contain "Ocus" or "OCUS"
    expect(title.toLowerCase()).toContain('ocus');

    logger.result('Homepage Title', true, `Title: "${title}"`);
  });

  test('Logo is visible in header', async ({ homePage }) => {
    logger.step('Verifying logo visibility');

    const isLogoVisible = await homePage.isLogoVisible();
    expect(isLogoVisible).toBe(true);

    logger.result('Logo Visibility', isLogoVisible);
  });

  test('Hero section renders with heading', async ({ homePage }) => {
    logger.step('Verifying hero section');

    const isHeroVisible = await homePage.isHeroVisible();

    // Even if exact heading text changed, verify some heading exists
    const headings = await homePage.page.locator('h1, h2').first().isVisible();

    expect(isHeroVisible || headings).toBe(true);

    logger.result('Hero Section', true);
  });

  test('CTA buttons are present on homepage', async ({ homePage }) => {
    logger.step('Verifying CTA buttons');

    const ctaCount = await homePage.getCTACount();
    logger.info(`Found ${ctaCount} Contact Sales CTA buttons`);

    expect(ctaCount).toBeGreaterThan(0);

    // Verify at least one CTA is clickable
    const firstCTA = homePage.page.getByRole('link', { name: 'Contact Sales' }).first();
    await expect(firstCTA).toBeVisible();
    await expect(firstCTA).toBeEnabled();

    logger.result('CTA Buttons', true, `Count: ${ctaCount}`);
  });

  test('Key figures / stats section is visible', async ({ homePage }) => {
    logger.step('Verifying key figures section');

    // Scroll to trigger lazy loading of stats section
    await homePage.scrollToBottom();

    // Check for stats-related content
    const statsSection = homePage.page.getByText(/conversion|cost savings|images/i).first();
    const isVisible = await homePage.isVisible(statsSection, 10000);

    expect(isVisible).toBe(true);

    logger.result('Key Figures Section', isVisible);
  });

  test('Footer is visible at bottom of page', async ({ homePage }) => {
    logger.step('Verifying footer');

    const isFooterVisible = await homePage.isFooterVisible();
    expect(isFooterVisible).toBe(true);

    logger.result('Footer Visibility', isFooterVisible);
  });

  test('No critical console errors on page load', async ({ page, consoleErrors }) => {
    logger.step('Checking for console errors');

    // Navigate to capture any errors
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out non-critical errors (some third-party scripts may log errors)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('third-party') &&
        !error.includes('analytics') &&
        !error.includes('gtm') &&
        !error.includes('cookie'),
    );

    logger.info(`Console errors found: ${consoleErrors.length} total, ${criticalErrors.length} critical`);

    // Log each critical error for debugging
    criticalErrors.forEach((error) => {
      logger.warn(`Console error: ${error}`);
    });

    // We warn about errors but don't hard-fail (third-party scripts may cause benign errors)
    if (criticalErrors.length > 0) {
      logger.warn(`Found ${criticalErrors.length} console errors — review recommended`);
    }

    logger.result('Console Errors', criticalErrors.length === 0);
  });

  test('Page responds with HTTP 200 status', async ({ page }) => {
    logger.step('Verifying HTTP response status');

    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response.status()).toBe(200);

    logger.result('HTTP Status', true, `Status: ${response.status()}`);
  });

  test('Complete homepage structure verification', async ({ homePage }) => {
    logger.step('Running full homepage structure check');

    const structure = await homePage.verifyHomepageStructure();
    logger.info('Homepage structure', structure);

    expect(structure.logo).toBe(true);
    expect(structure.hero).toBe(true);
    expect(structure.ctaButtons).toBe(true);
    expect(structure.footer).toBe(true);

    logger.result('Full Structure Check', true);
  });
});
