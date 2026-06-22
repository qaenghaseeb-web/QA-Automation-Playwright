const { test: base, expect } = require('@playwright/test');

/**
 * Custom Test Fixtures for OCUS QA Framework
 *
 * Extends Playwright's default test with:
 * 1. Automatic cookie consent dismissal
 * 2. Page Object auto-instantiation
 * 3. Console error tracking
 *
 * All test files should import { test, expect } from this fixture
 * instead of directly from '@playwright/test'.
 */

const { HomePage } = require('../pages/HomePage');
const { ContactPage } = require('../pages/ContactPage');
const { NavigationComponent } = require('../pages/NavigationComponent');
const { FooterComponent } = require('../pages/FooterComponent');

/**
 * Extended test with auto-injected page objects
 */
const test = base.extend({
  /**
   * HomePage fixture — auto-instantiated
   */
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  /**
   * ContactPage fixture — auto-instantiated
   */
  contactPage: async ({ page }, use) => {
    const contactPage = new ContactPage(page);
    await use(contactPage);
  },

  /**
   * NavigationComponent fixture — auto-instantiated
   */
  navigation: async ({ page }, use) => {
    const navigation = new NavigationComponent(page);
    await use(navigation);
  },

  /**
   * FooterComponent fixture — auto-instantiated
   */
  footer: async ({ page }, use) => {
    const footer = new FooterComponent(page);
    await use(footer);
  },

  /**
   * Console error tracker — collects errors during test
   * Usage: test('...', async ({ consoleErrors }) => { ... })
   */
  consoleErrors: async ({ page }, use) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await use(errors);
  },

  /**
   * Network failure tracker — collects failed network requests
   */
  networkFailures: async ({ page }, use) => {
    const failures = [];
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failures.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });
    await use(failures);
  },
});

module.exports = { test, expect };
