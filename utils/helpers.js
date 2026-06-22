/**
 * helpers.js — Generic utility functions for the QA framework
 *
 * Provides: URL manipulation, status checking, timestamp generation,
 * data formatting, and common assertion helpers.
 */

/**
 * Convert a relative URL to absolute using a base URL
 * @param {string} relativeURL - The relative path
 * @param {string} baseURL - The base URL to prepend
 * @returns {string} - Absolute URL
 */
function toAbsoluteURL(relativeURL, baseURL = 'https://www.ocus.com') {
  if (!relativeURL) return '';
  if (relativeURL.startsWith('http://') || relativeURL.startsWith('https://')) {
    return relativeURL;
  }
  if (relativeURL.startsWith('//')) {
    return `https:${relativeURL}`;
  }
  if (relativeURL.startsWith('/')) {
    return `${baseURL}${relativeURL}`;
  }
  return `${baseURL}/${relativeURL}`;
}

/**
 * Check if an HTTP status code indicates success
 * @param {number} statusCode
 * @returns {boolean}
 */
function isSuccessStatus(statusCode) {
  return statusCode >= 200 && statusCode < 400;
}

/**
 * Check if an HTTP status code indicates an error
 * @param {number} statusCode
 * @returns {boolean}
 */
function isErrorStatus(statusCode) {
  return statusCode >= 400;
}

/**
 * Generate a timestamp string for filenames
 * @returns {string} - ISO timestamp with special chars replaced
 */
function generateTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
}

/**
 * Filter out non-navigable URLs (mailto, tel, javascript, anchors)
 * @param {string[]} urls - Array of URLs to filter
 * @returns {string[]} - Only navigable HTTP(S) URLs
 */
function filterNavigableURLs(urls) {
  return urls.filter((url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      !lower.startsWith('mailto:') &&
      !lower.startsWith('tel:') &&
      !lower.startsWith('javascript:') &&
      !lower.startsWith('#') &&
      lower.length > 0
    );
  });
}

/**
 * Deduplicate an array of URLs
 * @param {string[]} urls
 * @returns {string[]}
 */
function deduplicateURLs(urls) {
  return [...new Set(urls)];
}

/**
 * Check if a URL belongs to the OCUS domain
 * @param {string} url
 * @returns {boolean}
 */
function isOCUSDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('ocus.com');
  } catch {
    return false;
  }
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format milliseconds to human-readable duration
 * @param {number} ms
 * @returns {string}
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Wait for a specific duration (use sparingly — prefer Playwright's auto-waiting)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in ms (doubles each retry)
 * @returns {Promise<any>}
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
}

module.exports = {
  toAbsoluteURL,
  isSuccessStatus,
  isErrorStatus,
  generateTimestamp,
  filterNavigableURLs,
  deduplicateURLs,
  isOCUSDomain,
  formatBytes,
  formatDuration,
  sleep,
  retryWithBackoff,
};
