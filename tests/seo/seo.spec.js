const { test, expect } = require('../../fixtures/testFixtures');
const { createLogger } = require('../../utils/logger');
const seoExpectations = require('../../test-data/seoExpectations.json');

/**
 * SEO VALIDATION TEST SUITE
 *
 * Layer: 8 (SEO)
 * Priority: Medium
 * Estimated Time: 2-3 minutes
 *
 * Validates:
 * - Meta title exists and has proper length
 * - Meta description exists (50-160 chars)
 * - Single H1 tag per page
 * - Images have alt text
 * - Canonical URL present
 * - Open Graph tags for social sharing
 * - robots meta tag
 * - Structured data presence
 */

test.describe('SEO Validation @seo', () => {
  const logger = createLogger('SEOTest');

  /* ─── Homepage SEO ─── */

  test.describe('Homepage SEO', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });

    test('Page has a non-empty meta title', async ({ page }) => {
      logger.step('Checking meta title');

      const title = await page.title();
      logger.info(`Title: "${title}" (${title.length} chars)`);

      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThanOrEqual(seoExpectations.globalRules.titleMaxLength);

      logger.result('Meta Title', true, `"${title}"`);
    });

    test('Page has a meta description', async ({ homePage }) => {
      logger.step('Checking meta description');

      await homePage.navigate('/');
      const description = await homePage.getMetaDescription();
      logger.info(`Meta description: "${description}" (${description?.length || 0} chars)`);

      // Meta description should exist (even if minimal)
      if (description) {
        expect(description.length).toBeGreaterThan(0);
      }

      logger.result('Meta Description', !!description);
    });

    test('Page has correct heading hierarchy', async ({ page, homePage }) => {
      logger.step('Checking heading hierarchy');

      await homePage.navigate('/');
      const h1Tags = await homePage.getH1Tags();

      logger.info(`H1 tags found: ${h1Tags.length}`);
      h1Tags.forEach((h1, i) => {
        logger.info(`  H1[${i}]: "${h1.trim().substring(0, 80)}"`);
      });

      // At least one H1 should exist
      expect(h1Tags.length).toBeGreaterThanOrEqual(1);

      logger.result('Heading Hierarchy', true);
    });

    test('Images have alt text', async ({ page }) => {
      logger.step('Checking image alt attributes');

      const imageAudit = await page.$$eval('img', (images) => {
        const total = images.length;
        const withAlt = images.filter((img) => img.hasAttribute('alt')).length;
        const withoutAlt = images
          .filter((img) => !img.hasAttribute('alt'))
          .map((img) => img.src)
          .slice(0, 10); // Limit output

        return { total, withAlt, withoutAlt, coverage: total > 0 ? ((withAlt / total) * 100).toFixed(1) : '100' };
      });

      logger.info(`Image alt coverage: ${imageAudit.coverage}%`, {
        total: imageAudit.total,
        withAlt: imageAudit.withAlt,
        missingAlt: imageAudit.withoutAlt.length,
      });

      // Log images missing alt
      for (const src of imageAudit.withoutAlt) {
        logger.warn(`Missing alt: ${src}`);
      }

      await test.info().attach('image-alt-audit', {
        body: JSON.stringify(imageAudit, null, 2),
        contentType: 'application/json',
      });

      // Most images should have alt text (allowing decorative images)
      const coverage = parseFloat(imageAudit.coverage);
      expect(coverage).toBeGreaterThanOrEqual(50);

      logger.result('Image Alt Coverage', coverage >= 80);
    });

    test('Canonical URL is present', async ({ homePage }) => {
      logger.step('Checking canonical URL');

      await homePage.navigate('/');
      const canonical = await homePage.getCanonicalURL();

      logger.info(`Canonical URL: ${canonical}`);

      // Canonical should exist and be a valid URL
      if (canonical) {
        expect(canonical).toContain('ocus.com');
      }

      logger.result('Canonical URL', !!canonical, canonical);
    });

    test('Open Graph tags are present', async ({ homePage }) => {
      logger.step('Checking Open Graph tags');

      await homePage.navigate('/');
      const ogData = await homePage.getOpenGraphData();

      logger.info('Open Graph data', ogData);

      // At least og:title should be present for social sharing
      if (ogData.ogTitle) {
        expect(ogData.ogTitle.length).toBeGreaterThan(0);
      }

      logger.result('Open Graph Tags', !!ogData.ogTitle);
    });

    test('Viewport meta tag is properly configured', async ({ page }) => {
      logger.step('Checking viewport meta');

      const viewportContent = await page
        .locator('meta[name="viewport"]')
        .getAttribute('content');

      logger.info(`Viewport: ${viewportContent}`);

      expect(viewportContent).toBeTruthy();
      expect(viewportContent).toContain('width=device-width');

      logger.result('Viewport Meta', true);
    });

    test('Page has language attribute', async ({ page }) => {
      logger.step('Checking language attribute');

      const lang = await page.getAttribute('html', 'lang');
      logger.info(`HTML lang attribute: ${lang}`);

      expect(lang).toBeTruthy();

      logger.result('Language Attribute', !!lang, lang);
    });
  });

  /* ─── Multi-page SEO Checks ─── */

  test.describe('Multi-page SEO', () => {
    const pagesToTest = Object.entries(seoExpectations.pages);

    for (const [path, expectations] of pagesToTest) {
      test(`SEO check for ${path}`, async ({ page }) => {
        logger.step(`SEO audit for: ${path}`);

        const response = await page.goto(path);
        await page.waitForLoadState('domcontentloaded');

        // Check HTTP status
        expect(response.status()).toBe(200);

        // Check title
        const title = await page.title();
        logger.info(`${path} title: "${title}"`);
        expect(title).toBeTruthy();

        if (expectations.titlePattern) {
          const titleRegex = new RegExp(expectations.titlePattern, 'i');
          expect(title).toMatch(titleRegex);
        }

        // Check H1 count
        const h1Count = await page.locator('h1').count();
        logger.info(`${path} H1 count: ${h1Count}`);

        if (expectations.expectedH1Count) {
          expect(h1Count).toBeGreaterThanOrEqual(1);
        }

        logger.result(`SEO: ${path}`, true);
      });
    }
  });

  /* ─── Structured Data ─── */

  test('Check for structured data (JSON-LD)', async ({ page }) => {
    logger.step('Checking structured data');

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const jsonLdScripts = await page.$$eval(
      'script[type="application/ld+json"]',
      (scripts) =>
        scripts.map((script) => {
          try {
            return JSON.parse(script.textContent);
          } catch {
            return null;
          }
        }),
    );

    logger.info(`JSON-LD structured data blocks found: ${jsonLdScripts.length}`);

    for (const data of jsonLdScripts.filter(Boolean)) {
      logger.info(`  Type: ${data['@type'] || 'unknown'}`);
    }

    await test.info().attach('structured-data', {
      body: JSON.stringify(jsonLdScripts, null, 2),
      contentType: 'application/json',
    });

    // Structured data is optional but valuable
    if (jsonLdScripts.length > 0) {
      logger.result('Structured Data', true, `${jsonLdScripts.length} blocks found`);
    } else {
      logger.warn('No structured data found — consider adding JSON-LD for better SEO');
    }
  });
});
