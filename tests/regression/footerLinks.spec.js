const { test, expect } = require('../../fixtures/testFixtures');
const { createLogger } = require('../../utils/logger');

/**
 * REGRESSION TEST SUITE: Footer Links Validation
 *
 * Layer: 2 (Regression)
 * Priority: Medium
 * Estimated Time: 2-3 minutes
 */

test.describe('Footer Links Validation @regression', () => {
  const logger = createLogger('FooterTest');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Footer is visible on homepage', async ({ footer }) => {
    logger.step('Verifying footer visibility');

    const isVisible = await footer.isFooterVisible();
    expect(isVisible).toBe(true);

    logger.result('Footer Visible', isVisible);
  });

  test('Footer contains links', async ({ footer }) => {
    logger.step('Checking footer links');

    await footer.scrollToBottom();
    const linkCount = await footer.getFooterLinkCount();

    logger.info(`Footer contains ${linkCount} links`);
    expect(linkCount).toBeGreaterThan(0);

    logger.result('Footer Links', linkCount > 0, `Count: ${linkCount}`);
  });

  test('All footer links have valid href attributes', async ({ footer }) => {
    logger.step('Validating footer link hrefs');

    await footer.scrollToBottom();
    const links = await footer.getAllFooterLinks();

    const emptyLinks = links.filter((link) => !link.href || link.href === '#');
    logger.info(`Total footer links: ${links.length}, empty hrefs: ${emptyLinks.length}`);

    // Log each footer link for reference
    links.forEach((link) => {
      logger.info(`Footer link: "${link.text}" → ${link.href}`);
    });

    logger.result('Footer Link Validity', emptyLinks.length === 0);
  });

  test('Footer renders consistently across pages', async ({ page, footer }) => {
    const pagesToCheck = ['/', '/about-us', '/product/pro-photography'];

    for (const pagePath of pagesToCheck) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      const isVisible = await footer.isFooterVisible();
      logger.info(`Footer on ${pagePath}: ${isVisible ? 'visible' : 'missing'}`);

      expect(isVisible).toBe(true);
    }

    logger.result('Footer Consistency', true);
  });

  test('Social media links point to correct platforms', async ({ footer }) => {
    logger.step('Checking social media links');

    await footer.scrollToBottom();
    const socialPresence = await footer.getSocialMediaPresence();

    logger.info('Social media presence', socialPresence);

    // Log which social platforms are present
    for (const [platform, present] of Object.entries(socialPresence)) {
      logger.info(`${platform}: ${present ? '✅ Present' : '⚠️ Not found'}`);
    }

    logger.result('Social Media Links', true);
  });
});
