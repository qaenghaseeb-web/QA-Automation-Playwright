const { BasePage } = require('./BasePage');

/**
 * HomePage — Page Object for OCUS Homepage (ocus.com)
 *
 * Encapsulates all homepage locators and actions.
 * Maps to the real OCUS homepage structure:
 * - Hero section with CTA
 * - Solutions breakout (4 products)
 * - Testimonials carousel
 * - Key figures section
 * - Industry cards (Food, Real Estate, eCommerce, Tourism)
 * - Final CTA + Footer
 */
class HomePage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    /* ─── Locators ─── */

    // Header / Logo
    this.logo = page.locator('header').locator('a').first();
    this.headerSection = page.locator('header');

    // Hero Section
    this.heroHeading = page.getByRole('heading', {
      name: /visual performance/i,
    });
    this.heroDescription = page.getByText(
      /4\+ billion images uploaded daily/i,
    );
    this.heroCTA = page.getByRole('link', { name: 'Contact Sales' }).first();

    // Solutions Breakout Section
    this.solutionsHeading = page.getByRole('heading', {
      name: /manage your visual performance/i,
    });
    this.productCards = {
      proPhotography: page.getByRole('link', {
        name: /access world-class|pro photography|discover/i,
      }).first(),
      aiModerate: page.getByText(/protect your brand/i),
      aiEnhance: page.getByText(/enhance and.*maximize/i),
      aiPerform: page.getByText(/quantify visual.*performance/i),
    };

    // Key Figures Section
    this.keyFiguresSection = page.getByText(/every visual.*optimized to perform/i);
    this.imagesRescuedStat = page.getByText(/images rescued/i);
    this.conversionStat = page.getByText(/conversion increase/i);
    this.costSavingsStat = page.getByText(/cost savings/i);
    this.imageOptimizationStat = page.getByText(/image optimization/i);

    // Industry Section
    this.industryHeading = page.getByRole('heading', {
      name: /serving global enterprises/i,
    });
    this.industryCards = {
      foodtech: page.getByText(/foodtech/i).first(),
      realEstate: page.getByText(/real estate/i).first(),
      ecommerce: page.getByText(/ecommerce/i).first(),
      tourism: page.getByText(/tourism/i).first(),
    };

    // Testimonials
    this.testimonials = page.locator('text=/they have enabled us|wow these results|best customer service|end of the pilot/i');

    // Footer CTA
    this.footerCTA = page.getByRole('link', { name: 'Contact Sales' }).last();

    // Footer
    this.footer = page.locator('footer');
  }

  /* ─── Actions ─── */

  /**
   * Open the OCUS homepage
   */
  async open() {
    await this.navigate('/');
    await this.acceptCookies();
  }

  /**
   * Verify the hero section is fully visible
   * @returns {Promise<boolean>}
   */
  async isHeroVisible() {
    return await this.isVisible(this.heroHeading);
  }

  /**
   * Verify all CTA buttons are present
   * @returns {Promise<number>} - Count of "Contact Sales" links
   */
  async getCTACount() {
    return await this.page.getByRole('link', { name: 'Contact Sales' }).count();
  }

  /**
   * Verify key figures section is visible
   * @returns {Promise<boolean>}
   */
  async areKeyFiguresVisible() {
    return await this.isVisible(this.imagesRescuedStat);
  }

  /**
   * Get all industry card names
   * @returns {Promise<string[]>}
   */
  async getIndustryCardNames() {
    const cards = [];
    for (const [name] of Object.entries(this.industryCards)) {
      cards.push(name);
    }
    return cards;
  }

  /**
   * Verify the footer is visible
   * @returns {Promise<boolean>}
   */
  async isFooterVisible() {
    await this.scrollToBottom();
    return await this.isVisible(this.footer);
  }

  /**
   * Verify logo is present and visible
   * @returns {Promise<boolean>}
   */
  async isLogoVisible() {
    return await this.isVisible(this.logo);
  }

  /**
   * Verify complete homepage structure
   * @returns {Promise<object>} - Visibility status of all sections
   */
  async verifyHomepageStructure() {
    return {
      logo: await this.isLogoVisible(),
      hero: await this.isHeroVisible(),
      ctaButtons: (await this.getCTACount()) > 0,
      keyFigures: await this.areKeyFiguresVisible(),
      footer: await this.isFooterVisible(),
    };
  }
}

module.exports = { HomePage };
