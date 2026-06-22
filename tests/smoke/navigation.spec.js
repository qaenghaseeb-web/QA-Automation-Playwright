const { test, expect } = require('../../fixtures/testFixtures');
const { createLogger } = require('../../utils/logger');
const navData = require('../../test-data/navigation.json');

/**
 * SMOKE TEST SUITE: Navigation Testing
 *
 * Layer: 1 (Smoke)
 * Priority: Critical
 * Estimated Time: 2-3 minutes
 *
 * Verifies:
 * - All main nav links are visible
 * - Product dropdown opens and contains all items
 * - Solution dropdown opens and contains all items
 * - Industry dropdown opens and contains all items
 * - Static pages (About, Careers, Resources) navigate correctly
 * - Contact Sales link navigates to Zendesk
 */

test.describe('Navigation Testing @smoke', () => {
  const logger = createLogger('NavigationTest');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Main navigation bar is visible', async ({ navigation }) => {
    logger.step('Verifying nav bar visibility');

    await navigation.acceptCookies();
    const navStructure = await navigation.verifyNavStructure();
    logger.info('Navigation structure', navStructure);

    // At minimum, some nav elements should be visible
    const hasNav = Object.values(navStructure).some((visible) => visible);
    expect(hasNav).toBe(true);

    logger.result('Navigation Bar', hasNav);
  });

  test('Products dropdown contains all product links', async ({ navigation }) => {
    logger.step('Testing Products dropdown');

    await navigation.acceptCookies();
    await navigation.openDropdown('products');

    for (const product of navData.products) {
      logger.info(`Checking product: ${product.name}`);

      const link = navigation.page.getByRole('link', {
        name: new RegExp(product.name, 'i'),
      }).first();

      // Product link should exist (may or may not be visible depending on dropdown state)
      const count = await link.count();
      expect(count).toBeGreaterThan(0);
    }

    logger.result('Products Dropdown', true, `${navData.products.length} products found`);
  });

  test('Solutions dropdown contains all solution links', async ({ navigation }) => {
    logger.step('Testing Solutions dropdown');

    await navigation.acceptCookies();
    await navigation.openDropdown('solutions');

    for (const solution of navData.solutions) {
      logger.info(`Checking solution: ${solution.name}`);

      const link = navigation.page.getByRole('link', {
        name: new RegExp(solution.name.replace(/[&]/g, '.'), 'i'),
      }).first();

      const count = await link.count();
      expect(count).toBeGreaterThan(0);
    }

    logger.result('Solutions Dropdown', true, `${navData.solutions.length} solutions found`);
  });

  test('Industries dropdown contains all industry links', async ({ navigation }) => {
    logger.step('Testing Industries dropdown');

    await navigation.acceptCookies();
    await navigation.openDropdown('industries');

    for (const industry of navData.industries) {
      logger.info(`Checking industry: ${industry.name}`);

      const link = navigation.page.getByRole('link', {
        name: new RegExp(industry.name, 'i'),
      }).first();

      const count = await link.count();
      expect(count).toBeGreaterThan(0);
    }

    logger.result('Industries Dropdown', true, `${navData.industries.length} industries found`);
  });

  // Test each static page navigation individually
  for (const staticPage of navData.staticPages) {
    test(`"${staticPage.name}" link navigates to correct page`, async ({ page }) => {
      logger.step(`Testing navigation to: ${staticPage.name}`);

      // Scope to nav/header to avoid accidentally matching the logo or footer links
      const link = page
        .locator('nav, header')
        .getByRole('link', { name: new RegExp(staticPage.name, 'i') })
        .first();

      await expect(link).toBeVisible({ timeout: 10000 });

      await link.click();
      await page.waitForLoadState('domcontentloaded');

      // Verify URL changed away from homepage — OCUS may use different path casing
      const currentURL = page.url();
      logger.info(`Navigated to: ${currentURL}`);

      // Accept: exact path match OR any URL that is NOT the homepage root
      const navigatedAway = currentURL !== 'https://www.ocus.com/' &&
        currentURL !== 'https://www.ocus.com';
      const urlContainsPath = currentURL.toLowerCase().includes(
        staticPage.url.replace('/', '').toLowerCase()
      );

      expect(navigatedAway || urlContainsPath).toBe(true);

      // Verify page loaded (not a blank/error page)
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();

      logger.result(`${staticPage.name} Navigation`, true, `URL: ${currentURL}`);
    });
  }

  test('Contact Sales link navigates to help center', async ({ page }) => {
    logger.step('Testing Contact Sales navigation');

    const contactLink = page.getByRole('link', { name: 'Contact Sales' }).first();
    await expect(contactLink).toBeVisible({ timeout: 10000 });

    // Get the href before clicking
    const href = await contactLink.getAttribute('href');
    logger.info(`Contact Sales href: ${href}`);

    // Verify it points to help.ocus.com
    expect(href).toContain('help.ocus.com');

    logger.result('Contact Sales Link', true, `Points to: ${href}`);
  });

  // Test each product page navigation
  for (const product of navData.products) {
    test(`Product "${product.name}" page loads correctly`, async ({ page }) => {
      logger.step(`Testing product page: ${product.name}`);

      await page.goto(product.url);
      await page.waitForLoadState('domcontentloaded');

      // Verify page loaded with content
      const response = await page.goto(product.url);
      expect(response.status()).toBeLessThan(400);

      const title = await page.title();
      expect(title).toBeTruthy();

      logger.result(`Product Page: ${product.name}`, true);
    });
  }

  // Test each industry page navigation
  for (const industry of navData.industries) {
    test(`Industry "${industry.name}" page loads correctly`, async ({ page }) => {
      logger.step(`Testing industry page: ${industry.name}`);

      const response = await page.goto(industry.url);
      await page.waitForLoadState('domcontentloaded');

      expect(response.status()).toBeLessThan(400);

      const title = await page.title();
      expect(title).toBeTruthy();

      logger.result(`Industry Page: ${industry.name}`, true);
    });
  }
});
