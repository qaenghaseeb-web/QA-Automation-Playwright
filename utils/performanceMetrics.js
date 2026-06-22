/**
 * performanceMetrics.js — Web performance measurement utilities
 *
 * Collects: Navigation Timing API data, resource counts,
 * page weight, and performance budget validation.
 *
 * Designed for OCUS which is an image-heavy site.
 */

const { createLogger } = require('./logger');
const { formatBytes, formatDuration } = require('./helpers');

const logger = createLogger('PerformanceMetrics');

/**
 * @typedef {Object} PerformanceData
 * @property {number} domContentLoaded - Time until DOM content is loaded (ms)
 * @property {number} fullLoad - Time until full page load (ms)
 * @property {number} firstPaint - Time until first paint (ms)
 * @property {number} domInteractive - Time until DOM is interactive (ms)
 * @property {number} totalResources - Total number of resources loaded
 * @property {object} resourcesByType - Resources grouped by type
 * @property {number} totalPageWeight - Total page size in bytes
 * @property {number} imageCount - Number of images loaded
 * @property {number} totalImageSize - Total image payload in bytes
 * @property {string[]} jsErrors - JavaScript errors captured
 */

/**
 * Collect navigation timing metrics from the Performance API
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<object>} - Navigation timing data
 */
async function getNavigationTimings(page) {
  return await page.evaluate(() => {
    const timing = performance.getEntriesByType('navigation')[0];
    if (!timing) return null;

    return {
      domContentLoaded: Math.round(timing.domContentLoadedEventEnd - timing.startTime),
      fullLoad: Math.round(timing.loadEventEnd - timing.startTime),
      firstByte: Math.round(timing.responseStart - timing.startTime),
      domInteractive: Math.round(timing.domInteractive - timing.startTime),
      dnsLookup: Math.round(timing.domainLookupEnd - timing.domainLookupStart),
      tcpConnect: Math.round(timing.connectEnd - timing.connectStart),
      tlsHandshake: Math.round(timing.secureConnectionStart > 0
        ? timing.connectEnd - timing.secureConnectionStart
        : 0),
      serverResponse: Math.round(timing.responseEnd - timing.requestStart),
      domParsing: Math.round(timing.domInteractive - timing.responseEnd),
      resourceLoading: Math.round(timing.loadEventStart - timing.domContentLoadedEventEnd),
    };
  });
}

/**
 * Get resource loading statistics grouped by type
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<object>}
 */
async function getResourceStats(page) {
  return await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    const stats = {
      total: resources.length,
      byType: {},
      totalSize: 0,
      slowest: null,
      largest: null,
    };

    resources.forEach((resource) => {
      // Determine resource type from initiatorType or URL
      let type = resource.initiatorType || 'other';
      if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg|avif|ico)/i)) {
        type = 'image';
      } else if (resource.name.match(/\.(js)/i)) {
        type = 'script';
      } else if (resource.name.match(/\.(css)/i)) {
        type = 'stylesheet';
      } else if (resource.name.match(/\.(woff2?|ttf|eot|otf)/i)) {
        type = 'font';
      }

      if (!stats.byType[type]) {
        stats.byType[type] = { count: 0, totalSize: 0, avgDuration: 0 };
      }

      stats.byType[type].count++;
      const size = resource.transferSize || 0;
      stats.byType[type].totalSize += size;
      stats.totalSize += size;

      const duration = resource.duration;

      // Track slowest resource
      if (!stats.slowest || duration > stats.slowest.duration) {
        stats.slowest = {
          name: resource.name.split('/').pop().split('?')[0],
          url: resource.name,
          duration: Math.round(duration),
          type,
        };
      }

      // Track largest resource
      if (!stats.largest || size > stats.largest.size) {
        stats.largest = {
          name: resource.name.split('/').pop().split('?')[0],
          url: resource.name,
          size,
          type,
        };
      }
    });

    return stats;
  });
}

/**
 * Get image-specific metrics (critical for OCUS)
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<object>}
 */
async function getImageMetrics(page) {
  return await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const imageData = {
      totalCount: images.length,
      withAlt: 0,
      withoutAlt: 0,
      lazyLoaded: 0,
      brokenImages: 0,
      oversized: [],
    };

    images.forEach((img) => {
      if (img.alt && img.alt.trim().length > 0) {
        imageData.withAlt++;
      } else {
        imageData.withoutAlt++;
      }

      if (img.loading === 'lazy') {
        imageData.lazyLoaded++;
      }

      if (!img.complete || img.naturalWidth === 0) {
        imageData.brokenImages++;
      }

      // Flag images over 1MB (estimated from naturalWidth/Height)
      if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
        imageData.oversized.push({
          src: img.src.split('/').pop().split('?')[0],
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
    });

    return imageData;
  });
}

/**
 * Measure page load time from navigation start to load event
 * @param {import('@playwright/test').Page} page
 * @param {string} url - URL to load
 * @returns {Promise<{loadTime: number, url: string}>}
 */
async function measurePageLoadTime(page, url) {
  const startTime = Date.now();
  await page.goto(url, { waitUntil: 'load' });
  const loadTime = Date.now() - startTime;

  logger.info(`Page load time for ${url}: ${formatDuration(loadTime)}`);

  return { loadTime, url };
}

/**
 * Collect comprehensive performance data for a page
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<PerformanceData>}
 */
async function collectPerformanceData(page) {
  const [timings, resources, images] = await Promise.all([
    getNavigationTimings(page),
    getResourceStats(page),
    getImageMetrics(page),
  ]);

  const data = {
    url: page.url(),
    timestamp: new Date().toISOString(),
    timings,
    resources,
    images,
    summary: {
      pageLoadTime: timings?.fullLoad || 0,
      domReady: timings?.domContentLoaded || 0,
      totalResources: resources?.total || 0,
      totalPageWeight: formatBytes(resources?.totalSize || 0),
      totalPageWeightBytes: resources?.totalSize || 0,
      imageCount: images?.totalCount || 0,
      brokenImages: images?.brokenImages || 0,
    },
  };

  logger.info('Performance data collected', data.summary);

  return data;
}

/**
 * Validate performance against budgets
 * @param {PerformanceData} perfData
 * @param {object} budgets - Performance budgets
 * @returns {object} - Validation results
 */
function validatePerformanceBudgets(perfData, budgets = {}) {
  const defaults = {
    maxPageLoadTime: 5000, // 5 seconds
    maxDomContentLoaded: 3000, // 3 seconds
    maxPageWeight: 5 * 1024 * 1024, // 5 MB
    maxImageCount: 50,
    maxSingleImageSize: 1024 * 1024, // 1 MB
    maxResourceCount: 100,
  };

  const limits = { ...defaults, ...budgets };
  const violations = [];

  if (perfData.summary.pageLoadTime > limits.maxPageLoadTime) {
    violations.push({
      metric: 'Page Load Time',
      actual: formatDuration(perfData.summary.pageLoadTime),
      limit: formatDuration(limits.maxPageLoadTime),
      severity: 'HIGH',
    });
  }

  if (perfData.summary.domReady > limits.maxDomContentLoaded) {
    violations.push({
      metric: 'DOM Content Loaded',
      actual: formatDuration(perfData.summary.domReady),
      limit: formatDuration(limits.maxDomContentLoaded),
      severity: 'MEDIUM',
    });
  }

  if (perfData.summary.totalPageWeightBytes > limits.maxPageWeight) {
    violations.push({
      metric: 'Total Page Weight',
      actual: perfData.summary.totalPageWeight,
      limit: formatBytes(limits.maxPageWeight),
      severity: 'HIGH',
    });
  }

  if (perfData.summary.imageCount > limits.maxImageCount) {
    violations.push({
      metric: 'Image Count',
      actual: perfData.summary.imageCount,
      limit: limits.maxImageCount,
      severity: 'MEDIUM',
    });
  }

  return {
    passed: violations.length === 0,
    violations,
    checkedAt: new Date().toISOString(),
  };
}

module.exports = {
  getNavigationTimings,
  getResourceStats,
  getImageMetrics,
  measurePageLoadTime,
  collectPerformanceData,
  validatePerformanceBudgets,
};
