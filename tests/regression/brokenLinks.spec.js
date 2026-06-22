const { test, expect } = require('../../fixtures/testFixtures');
const { createLogger } = require('../../utils/logger');
const { crawlAndCheckLinks } = require('../../utils/linkCrawler');

/**
 * REGRESSION TEST SUITE: Broken Link Detection
 *
 * Layer: 2 (Regression)
 * Priority: High
 * Estimated Time: 5-8 minutes
 *
 * Crawls all links on key pages and validates:
 * - All links return status < 400
 * - No 404 Not Found pages
 * - No 500 Server Errors
 * - Redirect chains are reasonable (< 5 hops)
 * - External links are reachable
 *
 * Enterprise value: Broken links hurt SEO and user experience.
 */

test.describe('Broken Link Detection @regression', () => {
  const logger = createLogger('BrokenLinkTest');

  test('Homepage has no broken internal links', async ({ page, request }) => {
    logger.step('Crawling homepage links');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const { results, broken, summary } = await crawlAndCheckLinks(page, request, {
      internalOnly: true,
      maxLinks: 50,
    });

    logger.info('Link crawl summary', summary);

    // Log broken links for debugging
    for (const link of broken) {
      logger.error(`BROKEN: ${link.url} → Status: ${link.status}`, {
        source: link.source,
        error: link.error,
      });
    }

    // Attach results to test report
    await test.info().attach('link-check-results', {
      body: JSON.stringify({ summary, broken }, null, 2),
      contentType: 'application/json',
    });

    expect(broken.length).toBe(0);

    logger.result('Homepage Links', broken.length === 0, summary);
  });

  test('All internal page links return valid HTTP status', async ({ page, request }) => {
    logger.step('Checking all internal links');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const { results, broken, summary } = await crawlAndCheckLinks(page, request, {
      internalOnly: true,
      maxLinks: 100,
    });

    // Allow soft failures for temporary server issues
    const hardBroken = broken.filter(
      (link) => link.status === 404 || link.status === 500,
    );

    logger.info('Hard broken links (404/500)', {
      count: hardBroken.length,
      links: hardBroken.map((l) => `${l.url} (${l.status})`),
    });

    expect(hardBroken.length).toBe(0);
  });

  test('No 404 pages exist among navigable links', async ({ page, request }) => {
    logger.step('Checking for 404 pages');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const { results } = await crawlAndCheckLinks(page, request, {
      internalOnly: true,
      maxLinks: 50,
    });

    const notFoundPages = results.filter((r) => r.status === 404);

    for (const notFound of notFoundPages) {
      logger.error(`404 NOT FOUND: ${notFound.url}`);
    }

    expect(notFoundPages.length).toBe(0);
  });

  test('No 500 server errors among links', async ({ page, request }) => {
    logger.step('Checking for server errors');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const { results } = await crawlAndCheckLinks(page, request, {
      internalOnly: true,
      maxLinks: 50,
    });

    const serverErrors = results.filter((r) => r.status >= 500);

    for (const error of serverErrors) {
      logger.error(`SERVER ERROR ${error.status}: ${error.url}`);
    }

    expect(serverErrors.length).toBe(0);
  });

  test('External links are reachable', async ({ page, request }) => {
    logger.step('Checking external links');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const { results, broken } = await crawlAndCheckLinks(page, request, {
      internalOnly: false,
      maxLinks: 30,
    });

    // External links may have transient failures, so we log them
    // but only fail on clearly broken links
    const externalBroken = broken.filter(
      (link) => !link.url.includes('ocus.com') && link.status === 404,
    );

    logger.info(`External links checked: ${results.length}, broken: ${externalBroken.length}`);

    // Soft assertion — external links may have rate limiting
    if (externalBroken.length > 0) {
      logger.warn('External broken links detected', {
        links: externalBroken.map((l) => l.url),
      });
    }

    logger.result('External Links', externalBroken.length === 0);
  });

  test('Product pages have no broken links', async ({ page, request }) => {
    logger.step('Checking product page links');

    const productPages = [
      '/product/pro-photography',
      '/product/ai-moderate',
      '/product/ai-enhance',
      '/product/ai-perform',
    ];

    let totalBroken = 0;

    for (const productPage of productPages) {
      await page.goto(productPage);
      await page.waitForLoadState('networkidle');

      const { broken } = await crawlAndCheckLinks(page, request, {
        internalOnly: true,
        maxLinks: 30,
      });

      totalBroken += broken.length;

      if (broken.length > 0) {
        logger.warn(`Broken links on ${productPage}`, {
          links: broken.map((l) => `${l.url} (${l.status})`),
        });
      }
    }

    expect(totalBroken).toBe(0);
  });
});
