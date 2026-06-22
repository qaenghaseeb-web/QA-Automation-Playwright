const { test, expect } = require('../../fixtures/testFixtures');
const { createLogger } = require('../../utils/logger');
const { formatDuration } = require('../../utils/helpers');

/**
 * API VALIDATION TEST SUITE
 *
 * Layer: 3 (API)
 * Priority: Medium
 * Estimated Time: 2-3 minutes
 *
 * Captures and validates all network requests during page load:
 * - All resources return HTTP 200
 * - Response times are within acceptable thresholds
 * - No mixed content (HTTP on HTTPS page)
 * - Image CDN responds correctly
 * - No failed resource loads
 */

test.describe('API & Network Validation @api', () => {
  const logger = createLogger('APIValidation');

  test('All network requests succeed during homepage load', async ({ page }) => {
    logger.step('Capturing network requests on homepage');

    const failedRequests = [];
    const allRequests = [];

    page.on('response', (response) => {
      const request = response.request();
      const resourceType = request.resourceType();

      allRequests.push({
        url: response.url(),
        status: response.status(),
        type: resourceType,
      });

      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          type: resourceType,
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    logger.info(`Total requests: ${allRequests.length}, Failed: ${failedRequests.length}`);

    // Log failed requests for debugging
    for (const failed of failedRequests) {
      logger.error(`Failed request: ${failed.url}`, {
        status: failed.status,
        type: failed.type,
      });
    }

    // Attach to report
    await test.info().attach('network-requests', {
      body: JSON.stringify(
        {
          total: allRequests.length,
          failed: failedRequests,
          summary: {
            images: allRequests.filter((r) => r.type === 'image').length,
            scripts: allRequests.filter((r) => r.type === 'script').length,
            stylesheets: allRequests.filter((r) => r.type === 'stylesheet').length,
            fonts: allRequests.filter((r) => r.type === 'font').length,
            xhr: allRequests.filter((r) => r.type === 'xhr' || r.type === 'fetch').length,
          },
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });

    // Filter out known acceptable failures (favicon, analytics, etc.)
    const criticalFailures = failedRequests.filter(
      (r) =>
        !r.url.includes('favicon') &&
        !r.url.includes('analytics') &&
        !r.url.includes('gtm.js') &&
        !r.url.includes('hotjar') &&
        r.type !== 'other',
    );

    expect(criticalFailures.length).toBe(0);
  });

  test('API response times are within acceptable thresholds', async ({ page }) => {
    logger.step('Measuring API response times');

    const slowRequests = [];
    const MAX_RESPONSE_TIME = 2000; // 2 seconds

    page.on('response', async (response) => {
      const timing = response.request().timing();
      const responseTime = timing?.responseEnd || 0;

      if (responseTime > MAX_RESPONSE_TIME) {
        slowRequests.push({
          url: response.url(),
          responseTime: Math.round(responseTime),
          type: response.request().resourceType(),
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Log slow requests
    for (const slow of slowRequests) {
      logger.warn(`Slow request: ${slow.url}`, {
        responseTime: formatDuration(slow.responseTime),
        type: slow.type,
      });
    }

    // Allow some slow requests (images can be large)
    const slowNonImageRequests = slowRequests.filter(
      (r) => r.type !== 'image' && r.type !== 'media',
    );

    logger.info(`Slow requests: ${slowRequests.length} total, ${slowNonImageRequests.length} non-image`);

    // Non-image requests should respond within threshold
    expect(slowNonImageRequests.length).toBeLessThanOrEqual(3);
  });

  test('No mixed content (all resources over HTTPS)', async ({ page }) => {
    logger.step('Checking for mixed content');

    const httpRequests = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('http://') && !url.includes('localhost')) {
        httpRequests.push({
          url,
          type: request.resourceType(),
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    logger.info(`HTTP (non-HTTPS) requests found: ${httpRequests.length}`);

    for (const httpReq of httpRequests) {
      logger.warn(`Mixed content: ${httpReq.url}`);
    }

    expect(httpRequests.length).toBe(0);
  });

  test('Image resources load successfully', async ({ page }) => {
    logger.step('Validating image loading');

    const failedImages = [];

    page.on('response', (response) => {
      if (response.request().resourceType() === 'image' && response.status() >= 400) {
        failedImages.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    logger.info(`Failed images: ${failedImages.length}`);

    for (const img of failedImages) {
      logger.error(`Failed image: ${img.url} (${img.status})`);
    }

    expect(failedImages.length).toBe(0);
  });

  test('No JavaScript errors during page interaction', async ({ page }) => {
    logger.step('Monitoring JS errors');

    const jsErrors = [];

    page.on('pageerror', (error) => {
      jsErrors.push({
        message: error.message,
        stack: error.stack,
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll through page to trigger lazy-loaded scripts
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    logger.info(`JavaScript errors captured: ${jsErrors.length}`);

    for (const error of jsErrors) {
      logger.error(`JS Error: ${error.message}`);
    }

    // Attach errors to report
    if (jsErrors.length > 0) {
      await test.info().attach('js-errors', {
        body: JSON.stringify(jsErrors, null, 2),
        contentType: 'application/json',
      });
    }

    expect(jsErrors.length).toBe(0);
  });

  test('Key pages return correct status codes', async ({ request }) => {
    logger.step('Checking status codes for key pages');

    const pages = [
      { path: '/', expectedStatus: 200 },
      { path: '/about-us', expectedStatus: 200 },
      { path: '/product/pro-photography', expectedStatus: 200 },
      { path: '/product/ai-moderate', expectedStatus: 200 },
      { path: '/product/ai-enhance', expectedStatus: 200 },
      { path: '/product/ai-perform', expectedStatus: 200 },
      { path: '/industry/food', expectedStatus: 200 },
      { path: '/industry/ecommerce', expectedStatus: 200 },
      { path: '/industry/travel', expectedStatus: 200 },
      { path: '/industry/real-estate', expectedStatus: 200 },
    ];

    for (const pageInfo of pages) {
      const url = `https://www.ocus.com${pageInfo.path}`;
      const response = await request.get(url);

      logger.info(`${pageInfo.path} → Status: ${response.status()}`);

      expect(response.status()).toBe(pageInfo.expectedStatus);
    }
  });
});
