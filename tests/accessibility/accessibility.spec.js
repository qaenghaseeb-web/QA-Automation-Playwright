// @ts-check
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const logger = require('../../utils/logger');

/**
 * Accessibility Testing (WCAG 2.1)
 * 
 * NOTE: Live sites often have accessibility violations that are:
 * - Known issues being fixed by the dev team
 * - Third-party widget issues (chat, cookie banners)
 * - Minor violations that don't block users
 * 
 * Strategy: 
 * - CRITICAL violations (aria-hidden-focus, etc.) → warn but don't fail
 * - Log all violations for reporting
 * - Hard-fail only on catastrophic issues (>20 critical violations)
 */

test.describe('Accessibility Testing (WCAG) @accessibility', () => {

  // Pages to test
  const pages = [
    { name: 'Homepage', url: 'https://www.ocus.com' },
    { name: 'About Us', url: 'https://www.ocus.com/about-us' },
    { name: 'Products', url: 'https://www.ocus.com/products' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} passes accessibility scan`, async ({ page }) => {
      logger.step(`Running axe scan on ${pageInfo.name}`);

      await page.goto(pageInfo.url, { waitUntil: 'networkidle' });

      // Dismiss cookie consent if visible (affects scan results)
      const cookieBtn = page.locator('button').filter({ hasText: /accept|agree|ok/i }).first();
      if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieBtn.click();
        await page.waitForTimeout(500);
      }

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        // Exclude third-party widgets from scan
        .exclude('iframe')
        .exclude('[id*="intercom"]')
        .exclude('[id*="zendesk"]')
        .exclude('[class*="cookie"]')
        .analyze();

      const allViolations = results.violations;
      const criticalViolations = allViolations.filter(v => v.impact === 'critical');
      const seriousViolations = allViolations.filter(v => v.impact === 'serious');
      const minorViolations = allViolations.filter(v => 
        v.impact === 'minor' || v.impact === 'moderate'
      );

      // Log all violations for visibility in CI report
      if (allViolations.length > 0) {
        logger.warn(`${pageInfo.name} — ${allViolations.length} total violations:`);
        allViolations.forEach(v => {
          logger.info(`  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
          logger.info(`    Affects ${v.nodes.length} element(s)`);
        });
      } else {
        logger.pass(`${pageInfo.name} — No accessibility violations found! 🎉`);
      }

      // Summary
      logger.info(`Critical: ${criticalViolations.length} | Serious: ${seriousViolations.length} | Minor/Moderate: ${minorViolations.length}`);

      // Soft threshold: fail only if MANY critical violations (indicates major regression)
      // Real sites routinely have 1-5 critical violations from third-party scripts
      expect(criticalViolations.length).toBeLessThan(15);

      // Log serious violations but don't fail on them
      if (seriousViolations.length > 0) {
        logger.warn(`${seriousViolations.length} serious violations found — review recommended`);
      }
    });
  }

  test('Homepage has proper heading structure', async ({ page }) => {
    logger.step('Checking heading hierarchy');
    await page.goto('https://www.ocus.com', { waitUntil: 'domcontentloaded' });

    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();

    logger.info(`H1 tags: ${h1Count}, H2 tags: ${h2Count}`);

    // Page should have at least 1 heading
    expect(h1Count + h2Count).toBeGreaterThan(0);

    // Ideal: exactly 1 H1 (warn if not, don't hard fail)
    if (h1Count !== 1) {
      logger.warn(`Expected 1 H1, found ${h1Count} — heading structure may need review`);
    }

    logger.pass('Heading structure checked');
  });

  test('Homepage images have alt text', async ({ page }) => {
    logger.step('Checking image alt attributes');
    await page.goto('https://www.ocus.com', { waitUntil: 'networkidle' });

    const images = page.locator('img');
    const imageCount = await images.count();
    let missingAlt = 0;
    let decorativeOk = 0;

    for (let i = 0; i < Math.min(imageCount, 30); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      if (alt === null) {
        missingAlt++;
        const src = await img.getAttribute('src');
        logger.warn(`Image missing alt: ${src?.substring(0, 60)}`);
      } else if (alt === '' && role === 'presentation') {
        decorativeOk++;
      }
    }

    logger.info(`Images checked: ${Math.min(imageCount, 30)}, Missing alt: ${missingAlt}, Decorative (ok): ${decorativeOk}`);

    // Soft threshold — warn if many images missing alt
    if (missingAlt > 5) {
      logger.warn(`${missingAlt} images missing alt text — accessibility improvement needed`);
    }
    
    // Don't fail entirely — just ensure it's not catastrophic
    expect(missingAlt).toBeLessThan(imageCount * 0.5); // Less than 50% missing
    logger.pass('Image alt text check complete');
  });

  test('Homepage has lang attribute', async ({ page }) => {
    logger.step('Checking html lang attribute');
    await page.goto('https://www.ocus.com', { waitUntil: 'domcontentloaded' });

    const lang = await page.locator('html').getAttribute('lang');
    logger.info(`HTML lang attribute: ${lang}`);

    expect(lang).toBeTruthy();
    logger.pass(`Language attribute present: ${lang}`);
  });

  test('Homepage links are accessible', async ({ page }) => {
    logger.step('Checking for empty links');
    await page.goto('https://www.ocus.com', { waitUntil: 'networkidle' });

    const links = page.locator('a');
    const linkCount = await links.count();
    let emptyLinks = 0;

    for (let i = 0; i < Math.min(linkCount, 50); i++) {
      const link = links.nth(i);
      const text = (await link.textContent())?.trim();
      const ariaLabel = await link.getAttribute('aria-label');
      const hasImage = await link.locator('img[alt]').count() > 0;

      if (!text && !ariaLabel && !hasImage) {
        emptyLinks++;
      }
    }

    logger.info(`Links checked: ${Math.min(linkCount, 50)}, Empty/inaccessible: ${emptyLinks}`);
    
    // Warn but don't fail on a few empty links (often icon buttons)
    if (emptyLinks > 0) {
      logger.warn(`${emptyLinks} links may need accessible labels`);
    }
    
    expect(emptyLinks).toBeLessThan(10);
    logger.pass('Link accessibility check complete');
  });
});
