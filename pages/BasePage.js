/**
 * BasePage — Abstract base class for all Page Objects
 *
 * Provides shared methods: navigation, cookie consent, screenshots,
 * SEO helpers, and page load waiting. All page objects extend this.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.baseURL = process.env.BASE_URL || 'https://www.ocus.com';
  }

  /* ─── Navigation ─── */

  /**
   * Navigate to a path relative to the base URL
   * @param {string} path - URL path (e.g., '/about-us')
   * @param {object} options - Playwright goto options
   */
  async navigate(path = '/', options = {}) {
    const defaultOptions = { waitUntil: 'domcontentloaded', ...options };
    await this.page.goto(path, defaultOptions);
  }

  /**
   * Wait for page to fully load (including network idle)
   * Use this for image-heavy pages where content loads lazily
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  /**
   * Wait for DOM content to be loaded (faster, for non-visual checks)
   */
  async waitForDOMReady() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /* ─── Cookie Consent ─── */

  /**
   * Dismiss cookie consent banner if it appears
   * Handles various button texts: Accept, Agree, Got it, OK
   */
  async acceptCookies() {
    try {
      const cookieButton = this.page.getByRole('button', {
        name: /accept|agree|got it|ok|allow|consent/i,
      });

      if (await cookieButton.isVisible({ timeout: 3000 })) {
        await cookieButton.click();
        // Wait for banner to disappear
        await cookieButton.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      }
    } catch {
      // Cookie banner not present — proceed silently
    }
  }

  /* ─── SEO Helpers ─── */

  /**
   * Get the page title
   * @returns {Promise<string>}
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Get meta description content
   * @returns {Promise<string|null>}
   */
  async getMetaDescription() {
    const meta = this.page.locator('meta[name="description"]');
    return await meta.getAttribute('content').catch(() => null);
  }

  /**
   * Get all H1 elements text
   * @returns {Promise<string[]>}
   */
  async getH1Tags() {
    return await this.page.locator('h1').allTextContents();
  }

  /**
   * Get canonical URL
   * @returns {Promise<string|null>}
   */
  async getCanonicalURL() {
    const link = this.page.locator('link[rel="canonical"]');
    return await link.getAttribute('href').catch(() => null);
  }

  /**
   * Get Open Graph metadata
   * @returns {Promise<object>}
   */
  async getOpenGraphData() {
    const ogTitle = await this.page
      .locator('meta[property="og:title"]')
      .getAttribute('content')
      .catch(() => null);

    const ogDescription = await this.page
      .locator('meta[property="og:description"]')
      .getAttribute('content')
      .catch(() => null);

    const ogImage = await this.page
      .locator('meta[property="og:image"]')
      .getAttribute('content')
      .catch(() => null);

    return { ogTitle, ogDescription, ogImage };
  }

  /* ─── Screenshot Helpers ─── */

  /**
   * Take a named screenshot
   * @param {string} name - Screenshot filename (without extension)
   */
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({
      path: `screenshots/${name}-${timestamp}.png`,
      fullPage: true,
    });
  }

  /* ─── Utility Methods ─── */

  /**
   * Get all links on the current page
   * @returns {Promise<Array<{text: string, href: string}>>}
   */
  async getAllLinks() {
    return await this.page.$$eval('a[href]', (links) =>
      links.map((link) => ({
        text: link.textContent?.trim() || '',
        href: link.href,
      })),
    );
  }

  /**
   * Check if an element is visible on the page
   * @param {import('@playwright/test').Locator} locator
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isVisible(locator, timeout = 5000) {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scroll to the bottom of the page to trigger lazy loading
   */
  async scrollToBottom() {
    await this.page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  /**
   * Get current URL
   * @returns {string}
   */
  getCurrentURL() {
    return this.page.url();
  }

  /**
   * Check for console errors during page interaction
   * @returns {Promise<string[]>}
   */
  async collectConsoleErrors() {
    const errors = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }
}

module.exports = { BasePage };
