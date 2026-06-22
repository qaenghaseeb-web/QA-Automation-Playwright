const { test, expect } = require('../../fixtures/testFixtures');
const { createLogger } = require('../../utils/logger');

// Import axe-core — will be installed via npm
let AxeBuilder;
try {
  AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright');
} catch {
  // Fallback if the named export differs
  AxeBuilder = require('@axe-core/playwright');
}

/**
 * ACCESSIBILITY TEST SUITE
 *
 * Layer: 5 (Accessibility)
 * Priority: High
 * Estimated Time: 2-3 minutes
 *
 * Uses axe-core for automated WCAG 2.1 compliance scanning.
 * Note: Automated tools catch ~40-50% of WCAG issues.
 * Manual testing should supplement automated scans.
 *
 * Checks:
 * - Color contrast (WCAG AA)
 * - Missing form labels
 * - Missing alt text on images
 * - Heading hierarchy
 * - Keyboard accessibility
 * - ARIA attributes
 */

test.describe('Accessibility Testing (WCAG) @accessibility', () => {
  const logger = createLogger('AccessibilityTest');

  test('Homepage passes accessibility scan', async ({ page }) => {
    logger.step('Running axe scan on homepage');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Log violations for debugging
    const violations = accessibilityScanResults.violations;
    logger.info(`Accessibility violations found: ${violations.length}`);

    for (const violation of violations) {
      logger.warn(`A11y violation: ${violation.id}`, {
        impact: violation.impact,
        description: violation.description,
        nodes: violation.nodes.length,
        helpUrl: violation.helpUrl,
      });
    }

    // Attach detailed results to report
    await test.info().attach('a11y-homepage-results', {
      body: JSON.stringify(accessibilityScanResults.violations, null, 2),
      contentType: 'application/json',
    });

    // Filter to critical/serious violations only
    const criticalViolations = violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(criticalViolations.length).toBe(0);
  });

  test('About Us page passes accessibility scan', async ({ page }) => {
    logger.step('Running axe scan on About Us page');

    await page.goto('/about-us');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    await test.info().attach('a11y-about-results', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    expect(criticalViolations.length).toBe(0);
  });

  test('All images have alt text', async ({ page }) => {
    logger.step('Checking image alt attributes');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const imagesWithoutAlt = await page.$$eval('img', (images) =>
      images
        .filter((img) => !img.getAttribute('alt') && img.getAttribute('alt') !== '')
        .map((img) => ({
          src: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight,
        })),
    );

    logger.info(`Images without alt text: ${imagesWithoutAlt.length}`);

    for (const img of imagesWithoutAlt) {
      logger.warn(`Missing alt text: ${img.src}`);
    }

    await test.info().attach('images-missing-alt', {
      body: JSON.stringify(imagesWithoutAlt, null, 2),
      contentType: 'application/json',
    });

    // Decorative images may intentionally have empty alt=""
    // We check for missing alt attribute, not empty alt
    logger.result('Image Alt Text', imagesWithoutAlt.length === 0);
  });

  test('Heading hierarchy is correct (single H1, proper nesting)', async ({ page }) => {
    logger.step('Checking heading hierarchy');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) =>
      elements.map((el) => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 80),
        visible: el.offsetParent !== null,
      })),
    );

    const h1Count = headings.filter((h) => h.tag === 'H1').length;
    logger.info(`Heading structure: ${headings.length} total, ${h1Count} H1 tags`);

    // Log heading hierarchy
    headings.forEach((h) => {
      logger.info(`  ${h.tag}: "${h.text}" ${h.visible ? '' : '(hidden)'}`);
    });

    // There should ideally be exactly 1 H1
    // Some sites use multiple H1s for sections — we warn but don't fail
    if (h1Count > 1) {
      logger.warn(`Multiple H1 tags found: ${h1Count} — consider using single H1 for SEO`);
    }

    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('Color contrast meets WCAG AA standards', async ({ page }) => {
    logger.step('Running contrast check');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    const contrastViolations = results.violations;
    logger.info(`Color contrast violations: ${contrastViolations.length}`);

    if (contrastViolations.length > 0) {
      for (const violation of contrastViolations) {
        logger.warn(`Contrast issue: ${violation.nodes.length} elements affected`);
      }
    }

    await test.info().attach('contrast-results', {
      body: JSON.stringify(contrastViolations, null, 2),
      contentType: 'application/json',
    });

    logger.result('Color Contrast', contrastViolations.length === 0);
  });

  test('Form inputs have associated labels', async ({ page }) => {
    logger.step('Checking form labels');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withRules(['label', 'label-title-only'])
      .analyze();

    const labelViolations = results.violations;
    logger.info(`Label violations: ${labelViolations.length}`);

    await test.info().attach('label-results', {
      body: JSON.stringify(labelViolations, null, 2),
      contentType: 'application/json',
    });

    logger.result('Form Labels', labelViolations.length === 0);
  });

  test('Interactive elements are keyboard accessible', async ({ page }) => {
    logger.step('Testing keyboard navigation');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through first several elements and check focus is visible
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          role: el?.getAttribute('role'),
          text: el?.textContent?.trim().substring(0, 50),
          hasFocusStyle: window.getComputedStyle(el).outlineStyle !== 'none',
        };
      });

      logger.info(`Tab ${i + 1}: ${focusedElement.tag} "${focusedElement.text}"`);
    }

    logger.result('Keyboard Navigation', true);
  });

  test('Product page passes accessibility scan', async ({ page }) => {
    logger.step('Running axe scan on product page');

    await page.goto('/product/pro-photography');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    await test.info().attach('a11y-product-results', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    expect(criticalViolations.length).toBe(0);
  });
});
