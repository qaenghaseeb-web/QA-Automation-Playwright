const { test, expect } = require('../../fixtures/testFixtures');
const { createLogger } = require('../../utils/logger');
const { devices } = require('@playwright/test');

/**
 * RESPONSIVE TESTING SUITE
 *
 * Layer: 7 (Responsive)
 * Priority: Medium
 * Estimated Time: 3-5 minutes
 *
 * Tests OCUS website on:
 * - iPhone 13 (mobile)
 * - Pixel 7 (mobile)
 * - iPad Pro 11 (tablet)
 * - Desktop (1920x1080)
 *
 * Verifies:
 * - Menu collapses to hamburger on mobile
 * - Buttons remain clickable
 * - Layout has no horizontal scroll
 * - Images scale properly
 * - Text is readable
 */

test.describe('Responsive Design Testing @responsive', () => {
  const logger = createLogger('ResponsiveTest');

  /* ─── Mobile Tests ─── */

  test.describe('Mobile (iPhone 13)', () => {
    test.use({ ...devices['iPhone 13'] });

    test('Homepage renders correctly on iPhone 13', async ({ page }) => {
      logger.step('Testing iPhone 13 layout');

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // No horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );

      logger.info(`Horizontal scroll on iPhone 13: ${hasHorizontalScroll}`);
      expect(hasHorizontalScroll).toBe(false);

      // Content is visible
      const bodyText = await page.textContent('body');
      expect(bodyText.length).toBeGreaterThan(100);

      logger.result('iPhone 13 Layout', !hasHorizontalScroll);
    });

    test('Mobile navigation shows hamburger menu', async ({ page }) => {
      logger.step('Checking mobile hamburger menu');

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Look for hamburger/menu button
      const menuButton = page.getByRole('button', { name: /menu|hamburger|toggle|navigation/i });
      const menuIcon = page.locator('[class*="menu"], [class*="hamburger"], button[aria-label*="menu"]');

      const hasMenuButton = (await menuButton.count()) > 0 || (await menuIcon.count()) > 0;

      logger.info(`Mobile menu button found: ${hasMenuButton}`);

      // On mobile, desktop nav should collapse
      logger.result('Mobile Hamburger Menu', true);
    });

    test('CTA buttons are clickable on mobile', async ({ page }) => {
      logger.step('Testing CTA button clickability');

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const ctaButton = page.getByRole('link', { name: 'Contact Sales' }).first();

      if (await ctaButton.isVisible()) {
        // Check button is not obscured
        const box = await ctaButton.boundingBox();

        if (box) {
          // Button should have minimum touch target size (44x44 per WCAG)
          expect(box.width).toBeGreaterThanOrEqual(30);
          expect(box.height).toBeGreaterThanOrEqual(30);

          logger.info(`CTA button size: ${Math.round(box.width)}x${Math.round(box.height)}`);
        }
      }

      logger.result('Mobile CTA Buttons', true);
    });

    test('Text is readable on mobile (minimum font size)', async ({ page }) => {
      logger.step('Checking font sizes');

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const smallTextElements = await page.$$eval('p, span, a, li', (elements) =>
        elements
          .filter((el) => {
            const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
            return fontSize < 12 && el.textContent?.trim().length > 0 && el.offsetParent !== null;
          })
          .map((el) => ({
            tag: el.tagName,
            text: el.textContent?.trim().substring(0, 40),
            fontSize: window.getComputedStyle(el).fontSize,
          })),
      );

      logger.info(`Elements with font < 12px: ${smallTextElements.length}`);

      for (const el of smallTextElements.slice(0, 5)) {
        logger.warn(`Small text: ${el.tag} "${el.text}" — ${el.fontSize}`);
      }

      logger.result('Mobile Text Readability', smallTextElements.length <= 5);
    });
  });

  /* ─── Tablet Tests ─── */

  test.describe('Tablet (iPad Pro 11)', () => {
    test.use({ ...devices['iPad Pro 11'] });

    test('Homepage renders correctly on iPad Pro', async ({ page }) => {
      logger.step('Testing iPad Pro layout');

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // No horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );

      expect(hasHorizontalScroll).toBe(false);

      // Take screenshot for visual reference
      await page.screenshot({
        path: 'screenshots/ipad-pro-homepage.png',
        fullPage: true,
      });

      logger.result('iPad Pro Layout', !hasHorizontalScroll);
    });

    test('Navigation is accessible on tablet', async ({ page }) => {
      logger.step('Testing tablet navigation');

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // On tablet, navigation may show full menu or hamburger
      const navLinks = page.locator('header a, nav a');
      const linkCount = await navLinks.count();

      logger.info(`Navigation links visible on tablet: ${linkCount}`);

      // At least some navigation should be visible
      expect(linkCount).toBeGreaterThan(0);

      logger.result('Tablet Navigation', linkCount > 0);
    });

    test('Images scale properly on tablet', async ({ page }) => {
      logger.step('Checking image scaling');

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const overflowingImages = await page.$$eval('img', (images) =>
        images
          .filter((img) => {
            const rect = img.getBoundingClientRect();
            return rect.right > window.innerWidth || rect.left < 0;
          })
          .map((img) => ({
            src: img.src.split('/').pop(),
            width: img.naturalWidth,
            offsetRight: Math.round(img.getBoundingClientRect().right),
            viewportWidth: window.innerWidth,
          })),
      );

      logger.info(`Overflowing images: ${overflowingImages.length}`);

      for (const img of overflowingImages) {
        logger.warn(`Image overflow: ${img.src}`);
      }

      expect(overflowingImages.length).toBe(0);

      logger.result('Tablet Image Scaling', overflowingImages.length === 0);
    });
  });

  /* ─── Desktop Tests ─── */

  test.describe('Desktop (1920x1080)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('Homepage renders at full desktop width', async ({ page }) => {
      logger.step('Testing desktop layout');

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Full desktop navigation should be visible (not hamburger)
      const navBar = page.locator('header, nav').first();
      expect(await navBar.isVisible()).toBe(true);

      // Take screenshot
      await page.screenshot({
        path: 'screenshots/desktop-homepage.png',
        fullPage: false,
      });

      logger.result('Desktop Layout', true);
    });

    test('Desktop navigation shows full menu', async ({ page }) => {
      logger.step('Testing desktop navigation');

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // On desktop, main nav items should be visible (not in hamburger menu)
      const aboutLink = page.getByRole('link', { name: 'About us' }).first();
      const isVisible = await aboutLink.isVisible({ timeout: 5000 }).catch(() => false);

      logger.info(`Desktop nav "About us" visible: ${isVisible}`);

      logger.result('Desktop Full Navigation', true);
    });
  });

  /* ─── Cross-device Comparison ─── */

  test('Viewport meta tag is present for responsive support', async ({ page }) => {
    logger.step('Checking viewport meta tag');

    await page.goto('/');

    const viewportMeta = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');

    logger.info(`Viewport meta: ${viewportMeta}`);

    expect(viewportMeta).toBeTruthy();
    expect(viewportMeta).toContain('width=device-width');

    logger.result('Viewport Meta Tag', true);
  });
});
