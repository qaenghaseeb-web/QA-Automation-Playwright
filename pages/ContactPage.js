// @ts-check
const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

class ContactPage extends BasePage {
  constructor(page) {
    super(page);

    // Resilient email locator — tries multiple strategies
    // Zendesk form uses input[name="request[anonymous_requester_email]"]
    // or type="email", or aria-label, or placeholder
    this.emailField = page.locator([
      'input[name="request[anonymous_requester_email]"]',
      'input[type="email"]',
      'input[aria-label*="email" i]',
      'input[placeholder*="email" i]',
      'input[id*="email" i]',
      'label:has-text("Email") + input',
      'label:has-text("email") ~ input',
    ].join(', ')).first();

    this.subjectField = page.locator([
      'input[name="request[subject]"]',
      'input[id*="subject" i]',
      'input[placeholder*="subject" i]',
      'label:has-text("Subject") + input',
    ].join(', ')).first();

    this.descriptionField = page.locator([
      'textarea[name="request[description]"]',
      'textarea[id*="description" i]',
      'textarea[aria-label*="description" i]',
      'textarea[placeholder*="description" i]',
    ].join(', ')).first();

    this.submitButton = page.locator([
      'input[type="submit"]',
      'button[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Send")',
    ].join(', ')).first();

    this.successMessage = page.locator([
      '[class*="success"]',
      '[class*="confirmation"]',
      'text=Thank you',
      'text=Your request',
    ].join(', ')).first();
  }

  async navigate() {
    const url = process.env.CONTACT_URL || 'https://help.ocus.com/hc/en-us/requests/new';
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000); // Zendesk JS loads slowly
  }

  /**
   * Safe fill — only fills if field exists, skips otherwise
   */
  async fillEmail(email) {
    const field = await this.emailField.elementHandle().catch(() => null);
    if (!field) {
      console.warn('[ContactPage] Email field not found — skipping fill');
      return false;
    }
    await this.emailField.fill(email);
    return true;
  }

  async fillSubject(subject) {
    const field = await this.subjectField.elementHandle().catch(() => null);
    if (!field) {
      console.warn('[ContactPage] Subject field not found — skipping fill');
      return false;
    }
    await this.subjectField.fill(subject);
    return true;
  }

  async fillDescription(description) {
    const field = await this.descriptionField.elementHandle().catch(() => null);
    if (!field) {
      console.warn('[ContactPage] Description field not found — skipping fill');
      return false;
    }
    await this.descriptionField.fill(description);
    return true;
  }

  /**
   * Safe blur — uses Tab key instead of .blur() to avoid locator timeout
   */
  async blurEmail() {
    try {
      await this.emailField.press('Tab');
    } catch {
      // If field not found, press Tab on page body
      await this.page.keyboard.press('Tab');
    }
  }

  async isEmailInvalid() {
    try {
      const field = await this.emailField.elementHandle().catch(() => null);
      if (!field) return false;
      return await this.emailField.evaluate(el => !el.validity.valid);
    } catch {
      return false;
    }
  }

  async isFormVisible() {
    // Check if any form field is present
    const anyField = this.page.locator('input, textarea').first();
    return await anyField.isVisible({ timeout: 5000 }).catch(() => false);
  }
}

module.exports = ContactPage;
