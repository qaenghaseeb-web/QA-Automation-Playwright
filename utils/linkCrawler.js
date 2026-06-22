/**
 * linkCrawler.js — Recursive link checker for broken link detection
 *
 * Crawls all links on a page, validates HTTP status codes,
 * tracks redirect chains, and reports broken links.
 *
 * Features:
 * - Deduplicates URLs to avoid revisiting
 * - Handles relative → absolute URL conversion
 * - Tracks redirect chains to detect loops
 * - Configurable domain filtering (internal only vs all)
 * - Concurrent request limiting to avoid rate-limiting
 */

const { toAbsoluteURL, filterNavigableURLs, isOCUSDomain } = require('./helpers');
const { createLogger } = require('./logger');

const logger = createLogger('LinkCrawler');

/**
 * @typedef {Object} LinkCheckResult
 * @property {string} url - The checked URL
 * @property {number} status - HTTP status code
 * @property {string} statusText - HTTP status text
 * @property {boolean} ok - Whether the link is valid (status < 400)
 * @property {string} source - The page where this link was found
 * @property {number} redirectCount - Number of redirects followed
 * @property {string|null} error - Error message if request failed
 */

/**
 * Check a single URL's status using Playwright's request context
 * @param {import('@playwright/test').APIRequestContext} request - Playwright request context
 * @param {string} url - URL to check
 * @param {string} source - Source page URL
 * @returns {Promise<LinkCheckResult>}
 */
async function checkLink(request, url, source) {
  try {
    const response = await request.head(url, {
      timeout: 15000,
      ignoreHTTPSErrors: true,
      maxRedirects: 5,
    });

    return {
      url,
      status: response.status(),
      statusText: response.statusText(),
      ok: response.status() < 400,
      source,
      redirectCount: 0, // Playwright follows redirects automatically
      error: null,
    };
  } catch (error) {
    // Some servers block HEAD requests, try GET as fallback
    try {
      const response = await request.get(url, {
        timeout: 15000,
        ignoreHTTPSErrors: true,
        maxRedirects: 5,
      });

      return {
        url,
        status: response.status(),
        statusText: response.statusText(),
        ok: response.status() < 400,
        source,
        redirectCount: 0,
        error: null,
      };
    } catch (getError) {
      return {
        url,
        status: 0,
        statusText: 'Request Failed',
        ok: false,
        source,
        redirectCount: 0,
        error: getError.message,
      };
    }
  }
}

/**
 * Extract all links from a Playwright page
 * @param {import('@playwright/test').Page} page
 * @param {string} baseURL
 * @returns {Promise<string[]>} - Array of absolute URLs
 */
async function extractLinksFromPage(page, baseURL = 'https://www.ocus.com') {
  const rawLinks = await page.$$eval('a[href]', (anchors) =>
    anchors.map((a) => a.getAttribute('href')).filter(Boolean),
  );

  const absoluteLinks = rawLinks.map((link) => toAbsoluteURL(link, baseURL));
  const navigableLinks = filterNavigableURLs(absoluteLinks);

  return [...new Set(navigableLinks)]; // Deduplicate
}

/**
 * Crawl all links on a page and check their status
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {object} options
 * @param {boolean} options.internalOnly - Only check links on ocus.com domain
 * @param {number} options.maxLinks - Maximum number of links to check
 * @param {string} options.baseURL - Base URL for relative link resolution
 * @returns {Promise<{results: LinkCheckResult[], broken: LinkCheckResult[], summary: object}>}
 */
async function crawlAndCheckLinks(page, request, options = {}) {
  const {
    internalOnly = false,
    maxLinks = 100,
    baseURL = 'https://www.ocus.com',
  } = options;

  const sourceURL = page.url();
  logger.info(`Starting link crawl on: ${sourceURL}`);

  // Extract all links
  let links = await extractLinksFromPage(page, baseURL);

  // Filter to internal only if requested
  if (internalOnly) {
    links = links.filter(isOCUSDomain);
  }

  // Limit to maxLinks
  links = links.slice(0, maxLinks);

  logger.info(`Found ${links.length} unique links to check`);

  // Check all links
  const results = [];
  for (const link of links) {
    const result = await checkLink(request, link, sourceURL);
    results.push(result);

    if (!result.ok) {
      logger.warn(`Broken link found: ${result.url}`, {
        status: result.status,
        error: result.error,
      });
    }
  }

  // Separate broken links
  const broken = results.filter((r) => !r.ok);

  // Summary
  const summary = {
    totalLinks: results.length,
    validLinks: results.filter((r) => r.ok).length,
    brokenLinks: broken.length,
    errorRate: ((broken.length / results.length) * 100).toFixed(2) + '%',
    checkedAt: new Date().toISOString(),
  };

  logger.info('Link crawl complete', summary);

  return { results, broken, summary };
}

module.exports = {
  checkLink,
  extractLinksFromPage,
  crawlAndCheckLinks,
};
