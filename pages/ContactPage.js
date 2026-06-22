// @ts-check

// BasePage uses named export: module.exports = { BasePage }
const { BasePage } = require('./BasePage');

class ContactPage extends BasePage {
  constructor(page) {
    super(page);

    this.emailField = page.locator([
      'input[name="request[anonymous_requester_email]"]',
      'input[type="email"]',
      'input[aria-label*="email" i]',
      'input[placeholder*="email" i]',
      'input[id*="email" i]',
    ].join(', ')).first();

    this.subjectField = page.locator([
      'input[name="request[subject]"]',
      'input[id*="subject" i]',
      'input[placeholder*="subject" i]',
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
  }

  async navigate() {
    const url = process.env.CONTACT_URL || 'https://help.ocus.com/hc/en-us/requests/new';
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000);
  }

  async fillEmail(email) {
    const field = await this.emailField.elementHandle().catch(() => null);
    if (!field) { console.warn('[ContactPage] Email field not found'); return false; }
    await this.emailField.fill(email);
    return true;
  }

  async fillSubject(subject) {
    const field = await this.subjectField.elementHandle().catch(() => null);
    if (!field) return false;
    await this.subjectField.fill(subject);
    return true;
  }

  async fillDescription(description) {
    const field = await this.descriptionField.elementHandle().catch(() => null);
    if (!field) return false;
    await this.descriptionField.fill(description);
    return true;
  }

  async blurEmail() {
    try { await this.emailField.press('Tab'); }
    catch { await this.page.keyboard.press('Tab'); }
  }

  async isEmailInvalid() {
    try {
      const field = await this.emailField.elementHandle().catch(() => null);
      if (!field) return false;
      return await this.emailField.evaluate(el => !el.validity.valid);
    } catch { return false; }
  }

  async isFormVisible() {
    return await this.page.locator('input, textarea').first()
      .isVisible({ timeout: 5000 }).catch(() => false);
  }
}

module.exports = { ContactPage };
