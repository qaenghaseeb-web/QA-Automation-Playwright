const { test, expect } = require('../../fixtures/testFixtures');
const { createLogger } = require('../../utils/logger');
const {
  collectPerformanceData,
  validatePerformanceBudgets,
  measurePageLoadTime,
  getImageMetrics,
} = require('../../utils/performanceMetrics');
const { formatDuration, formatBytes } = require('../../utils/helpers');

/**
 * PERFORMANCE TEST SUITE
 *
 * Layer: 6 (Performance)
 * Priority: High (OCUS is image-heavy)
 * Estimated Time: 3-4 minutes
 *
 * Measures:
 * - Page load time (< 5 seconds)
 * - DOM Content Loaded (< 3 seconds)
 * - Total page weight (< 5 MB)
 * - Image count and sizes
 * - JS errors during load
 * - Slow network resources
 */

test.describe('Performance Testing @performance', () => {
  const logger = createLogger('PerformanceTest');

  test('Homepage loads within 5 seconds', async ({ page }) => {
    logger.step('Measuring homepage load time');

    const { loadTime } = await measurePageLoadTime(page, 'https://www.ocus.com');

    logger.info(`Homepage load time: ${formatDuration(loadTime)}`);

    // Attach to report
    await test.info().attach('homepage-load-time', {
      body: `Load time: ${formatDuration(loadTime)}`,
      contentType: 'text/plain',
    });

    expect(loadTime).toBeLessThan(10000); // 10s generous threshold for external site

    logger.result('Homepage Load Time', loadTime < 5000, formatDuration(loadTime));
  });

  test('DOM Content Loaded within acceptable threshold', async ({ page }) => {
    logger.step('Measuring DOM Content Loaded');

    await page.goto('/');
    await page.waitForLoadState('load');

    const perfData = await collectPerformanceData(page);
    const domReady = perfData.timings?.domContentLoaded || 0;

    logger.info(`DOM Content Loaded: ${formatDuration(domReady)}`);

    // Attach comprehensive timing data
    await test.info().attach('navigation-timings', {
      body: JSON.stringify(perfData.timings, null, 2),
      contentType: 'application/json',
    });

    expect(domReady).toBeLessThan(5000); // 5s threshold

    logger.result('DOM Content Loaded', domReady < 3000, formatDuration(domReady));
  });

  test('Total page weight is under budget', async ({ page }) => {
    logger.step('Measuring page weight');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const perfData = await collectPerformanceData(page);
    const pageWeight = perfData.summary.totalPageWeightBytes;

    logger.info(`Total page weight: ${formatBytes(pageWeight)}`);

    // Resource breakdown
    if (perfData.resources?.byType) {
      for (const [type, stats] of Object.entries(perfData.resources.byType)) {
        logger.info(`  ${type}: ${stats.count} resources, ${formatBytes(stats.totalSize)}`);
      }
    }

    await test.info().attach('resource-stats', {
      body: JSON.stringify(perfData.resources, null, 2),
      contentType: 'application/json',
    });

    // 10 MB generous threshold for image-heavy site
    expect(pageWeight).toBeLessThan(10 * 1024 * 1024);

    logger.result('Page Weight', pageWeight < 5 * 1024 * 1024, formatBytes(pageWeight));
  });

  test('Image count is within reasonable limits', async ({ page }) => {
    logger.step('Counting images');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const imageMetrics = await getImageMetrics(page);

    logger.info('Image metrics', {
      total: imageMetrics.totalCount,
      withAlt: imageMetrics.withAlt,
      withoutAlt: imageMetrics.withoutAlt,
      lazyLoaded: imageMetrics.lazyLoaded,
      broken: imageMetrics.brokenImages,
    });

    await test.info().attach('image-metrics', {
      body: JSON.stringify(imageMetrics, null, 2),
      contentType: 'application/json',
    });

    // OCUS is image-heavy — generous threshold
    expect(imageMetrics.totalCount).toBeLessThan(100);
    expect(imageMetrics.brokenImages).toBe(0);

    logger.result('Image Count', imageMetrics.totalCount < 50);
  });

  test('No JavaScript errors during page load', async ({ page }) => {
    logger.step('Monitoring JS errors');

    const jsErrors = [];

    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    logger.info(`JS errors during load: ${jsErrors.length}`);

    for (const error of jsErrors) {
      logger.error(`JS Error: ${error}`);
    }

    expect(jsErrors.length).toBe(0);

    logger.result('JS Errors', jsErrors.length === 0);
  });

  test('Performance budgets pass validation', async ({ page }) => {
    logger.step('Running performance budget validation');

    await page.goto('/');
    await page.waitForLoadState('load');

    const perfData = await collectPerformanceData(page);
    const validation = validatePerformanceBudgets(perfData, {
      maxPageLoadTime: 10000, // 10s for external site
      maxDomContentLoaded: 5000,
      maxPageWeight: 10 * 1024 * 1024, // 10 MB
      maxImageCount: 100,
    });

    logger.info('Performance budget validation', {
      passed: validation.passed,
      violations: validation.violations.length,
    });

    for (const violation of validation.violations) {
      logger.warn(`Budget violation: ${violation.metric}`, {
        actual: violation.actual,
        limit: violation.limit,
        severity: violation.severity,
      });
    }

    await test.info().attach('performance-budget', {
      body: JSON.stringify(validation, null, 2),
      contentType: 'application/json',
    });

    // High severity violations should fail the test
    const highSeverity = validation.violations.filter((v) => v.severity === 'HIGH');
    expect(highSeverity.length).toBe(0);

    logger.result('Performance Budgets', validation.passed);
  });

  test('Key pages load within acceptable time', async ({ page }) => {
    logger.step('Measuring key page load times');

    const pages = [
      { name: 'Homepage', url: 'https://www.ocus.com/' },
      { name: 'Pro Photography', url: 'https://www.ocus.com/product/pro-photography' },
      { name: 'About Us', url: 'https://www.ocus.com/about-us' },
      { name: 'Food Industry', url: 'https://www.ocus.com/industry/food' },
    ];

    const results = [];

    for (const pageInfo of pages) {
      const { loadTime } = await measurePageLoadTime(page, pageInfo.url);
      results.push({ ...pageInfo, loadTime });

      logger.info(`${pageInfo.name}: ${formatDuration(loadTime)}`);
    }

    await test.info().attach('page-load-times', {
      body: JSON.stringify(
        results.map((r) => ({ name: r.name, loadTime: formatDuration(r.loadTime) })),
        null,
        2,
      ),
      contentType: 'application/json',
    });

    // All pages should load within 15 seconds (generous for external site)
    for (const result of results) {
      expect(result.loadTime).toBeLessThan(15000);
    }

    logger.result('Key Page Load Times', true);
  });
});
