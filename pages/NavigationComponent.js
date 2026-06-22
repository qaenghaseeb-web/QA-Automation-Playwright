const { BasePage } = require('./BasePage');

/**
 * NavigationComponent — Reusable component for OCUS navigation
 *
 * Real OCUS navigation structure (from live site analysis):
 *
 * Top bar: For enterprise | For photographers | For restaurants
 *
 * Main nav:
 * ├── Products (dropdown)
 * │   ├── Professional Photography
 * │   ├── AI Moderate
 * │   ├── AI Enhance
 * │   └── AI Perform
 * ├── Solutions (dropdown)
 * │   ├── Global Photography Coverage
 * │   ├── Brand Protection & Policing
 * │   └── Audit Existing Catalog
 * ├── Industries (dropdown)
 * │   ├── Food
 * │   ├── Real Estate
 * │   ├── Travel
 * │   └── eCommerce
 * ├── About us
 * ├── Careers
 * └── Resources
 */
class NavigationComponent extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    /* ─── Top Bar Locators ─── */
    this.topBarEnterprise = page.getByRole('link', { name: 'For enterprise' });
    this.topBarPhotographers = page.getByRole('link', { name: 'For photographers' });
    this.topBarRestaurants = page.getByRole('link', { name: 'For restaurants' });

    /* ─── Main Nav Locators ─── */
    this.navContainer = page.locator('nav, header').first();

    // Dropdown triggers
    this.productsMenu = page.getByText('Products').first();
    this.solutionsMenu = page.getByText('Solutions').first();
    this.industriesMenu = page.getByText('Industries').first();

    // Static links
    this.aboutUsLink = page.getByRole('link', { name: 'About us' }).first();
    this.careersLink = page.getByRole('link', { name: 'Careers' }).first();
    this.resourcesLink = page.getByRole('link', { name: 'Resources' }).first();
    this.contactSalesLink = page.getByRole('link', { name: 'Contact Sales' }).first();

    // Product dropdown items
    this.productLinks = {
      proPhotography: page.getByRole('link', { name: /professional photography/i }).first(),
      aiModerate: page.getByRole('link', { name: /ai moderate/i }).first(),
      aiEnhance: page.getByRole('link', { name: /ai enhance/i }).first(),
      aiPerform: page.getByRole('link', { name: /ai perform/i }).first(),
    };

    // Solution dropdown items
    this.solutionLinks = {
      globalPhotography: page.getByRole('link', { name: /global photography coverage/i }).first(),
      brandProtection: page.getByRole('link', { name: /brand protection/i }).first(),
      auditCatalog: page.getByRole('link', { name: /audit existing catalog/i }).first(),
    };

    // Industry dropdown items
    this.industryLinks = {
      food: page.getByRole('link', { name: /^food$/i }).first(),
      realEstate: page.getByRole('link', { name: /real estate/i }).first(),
      travel: page.getByRole('link', { name: /^travel$/i }).first(),
      ecommerce: page.getByRole('link', { name: /ecommerce/i }).first(),
    };

    // Mobile menu
    this.mobileMenuButton = page.getByRole('button', { name: /menu|hamburger|toggle/i });
    this.mobileMenuClose = page.getByRole('button', { name: /close/i });
  }

  /* ─── Actions ─── */

  /**
   * Open a dropdown menu by hovering/clicking
   * @param {'products'|'solutions'|'industries'} menuName
   */
  async openDropdown(menuName) {
    const menus = {
      products: this.productsMenu,
      solutions: this.solutionsMenu,
      industries: this.industriesMenu,
    };

    const menu = menus[menuName];
    if (menu) {
      await menu.hover();
      // Some menus require a click on mobile
      if (!(await this.isDropdownOpen(menuName))) {
        await menu.click();
      }
    }
  }

  /**
   * Check if a dropdown menu is currently open
   * @param {'products'|'solutions'|'industries'} menuName
   * @returns {Promise<boolean>}
   */
  async isDropdownOpen(menuName) {
    const linkSets = {
      products: this.productLinks,
      solutions: this.solutionLinks,
      industries: this.industryLinks,
    };

    const firstLink = Object.values(linkSets[menuName])[0];
    return await this.isVisible(firstLink, 3000);
  }

  /**
   * Navigate to a specific page via the navigation menu
   * @param {string} pageName - Name of the page to navigate to
   */
  async navigateTo(pageName) {
    const pageMap = {
      'about us': this.aboutUsLink,
      'careers': this.careersLink,
      'resources': this.resourcesLink,
      'contact sales': this.contactSalesLink,
    };

    const link = pageMap[pageName.toLowerCase()];
    if (link) {
      await link.click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  /**
   * Navigate to a product page via dropdown
   * @param {string} productName - Key from productLinks
   */
  async navigateToProduct(productName) {
    await this.openDropdown('products');
    const link = this.productLinks[productName];
    if (link) {
      await link.click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  /**
   * Navigate to a solution page via dropdown
   * @param {string} solutionName - Key from solutionLinks
   */
  async navigateToSolution(solutionName) {
    await this.openDropdown('solutions');
    const link = this.solutionLinks[solutionName];
    if (link) {
      await link.click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  /**
   * Navigate to an industry page via dropdown
   * @param {string} industryName - Key from industryLinks
   */
  async navigateToIndustry(industryName) {
    await this.openDropdown('industries');
    const link = this.industryLinks[industryName];
    if (link) {
      await link.click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  /**
   * Verify all main navigation links are present
   * @returns {Promise<object>}
   */
  async verifyNavStructure() {
    return {
      productsMenu: await this.isVisible(this.productsMenu),
      solutionsMenu: await this.isVisible(this.solutionsMenu),
      industriesMenu: await this.isVisible(this.industriesMenu),
      aboutUs: await this.isVisible(this.aboutUsLink),
      careers: await this.isVisible(this.careersLink),
      resources: await this.isVisible(this.resourcesLink),
    };
  }

  /**
   * Check if the mobile hamburger menu is visible
   * @returns {Promise<boolean>}
   */
  async isMobileMenuVisible() {
    return await this.isVisible(this.mobileMenuButton, 3000);
  }

  /**
   * Open mobile hamburger menu
   */
  async openMobileMenu() {
    if (await this.isMobileMenuVisible()) {
      await this.mobileMenuButton.click();
    }
  }

  /**
   * Get all navigation link URLs for broken link testing
   * @returns {Promise<string[]>}
   */
  async getAllNavLinks() {
    const links = await this.navContainer.locator('a[href]').all();
    const urls = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) urls.push(href);
    }
    return [...new Set(urls)]; // Deduplicate
  }
}

module.exports = { NavigationComponent };
