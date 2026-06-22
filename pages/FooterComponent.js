const { BasePage } = require('./BasePage');

/**
 * FooterComponent — Reusable component for OCUS footer
 *
 * Tests footer structure, link validity, and social media links.
 */
class FooterComponent extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    /* ─── Locators ─── */
    this.footerContainer = page.locator('footer');
    this.footerLinks = page.locator('footer a[href]');
    this.copyrightText = page.locator('footer').getByText(/©|copyright|ocus/i);

    // Social media links (common patterns)
    this.socialLinks = {
      linkedin: page.locator('footer a[href*="linkedin"]'),
      twitter: page.locator('footer a[href*="twitter"], footer a[href*="x.com"]'),
      instagram: page.locator('footer a[href*="instagram"]'),
      facebook: page.locator('footer a[href*="facebook"]'),
    };
  }

  /* ─── Actions ─── */

  /**
   * Scroll to footer and verify it is visible
   * @returns {Promise<boolean>}
   */
  async isFooterVisible() {
    await this.scrollToBottom();
    return await this.isVisible(this.footerContainer, 5000);
  }

  /**
   * Get all footer link URLs
   * @returns {Promise<Array<{text: string, href: string}>>}
   */
  async getAllFooterLinks() {
    const links = await this.footerLinks.all();
    const result = [];
    for (const link of links) {
      const text = (await link.textContent()) || '';
      const href = (await link.getAttribute('href')) || '';
      result.push({ text: text.trim(), href });
    }
    return result;
  }

  /**
   * Get count of footer links
   * @returns {Promise<number>}
   */
  async getFooterLinkCount() {
    return await this.footerLinks.count();
  }

  /**
   * Check which social media links are present
   * @returns {Promise<object>}
   */
  async getSocialMediaPresence() {
    const presence = {};
    for (const [platform, locator] of Object.entries(this.socialLinks)) {
      presence[platform] = (await locator.count()) > 0;
    }
    return presence;
  }

  /**
   * Verify copyright text is present
   * @returns {Promise<boolean>}
   */
  async hasCopyrightText() {
    await this.scrollToBottom();
    return await this.isVisible(this.copyrightText, 3000);
  }
}

module.exports = { FooterComponent };
