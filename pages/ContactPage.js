const { BasePage } = require('./BasePage');

/**
 * ContactPage — Page Object for OCUS Contact Form
 *
 * The "Contact Sales" link on ocus.com redirects to:
 * https://help.ocus.com/hc/en-us/requests/new (Zendesk)
 *
 * IMPORTANT: We test validation behavior ONLY.
 * We NEVER submit forms to production to avoid:
 * - CAPTCHA triggers
 * - Rate limiting
 * - Spam detection
 * - Creating real support tickets
 */
class ContactPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    this.contactURL = process.env.CONTACT_URL || 'https://help.ocus.com/hc/en-us/requests/new';

    /* ─── Locators ─── */

    // Form fields — Zendesk form structure
    this.emailField = page.getByLabel(/email/i).first();
    this.subjectField = page.getByLabel(/subject/i).first();
    this.descriptionField = page.getByLabel(/description|message|how can we help/i).first();

    // Dropdowns (Zendesk custom fields)
    this.categoryDropdown = page.locator('select').first();

    // Submit button
    this.submitButton = page.getByRole('button', { name: /submit/i });

    // Validation messages
    this.validationErrors = page.locator('.notification-error, [role="alert"], .error');
    this.requiredFieldError = page.getByText(/required|can't be blank|please fill/i);

    // Page elements
    this.formContainer = page.locator('form').first();
    this.pageHeading = page.getByRole('heading').first();
  }

  /* ─── Actions ─── */

  /**
   * Navigate to the contact form page
   */
  async open() {
    await this.page.goto(this.contactURL, { waitUntil: 'domcontentloaded' });
    await this.acceptCookies();
  }

  /**
   * Check if the form page loaded successfully
   * @returns {Promise<boolean>}
   */
  async isFormLoaded() {
    return await this.isVisible(this.formContainer);
  }

  /**
   * Fill in the email field
   * @param {string} email
   */
  async fillEmail(email) {
    if (await this.isVisible(this.emailField)) {
      await this.emailField.fill(email);
    }
  }

  /**
   * Fill in the subject field
   * @param {string} subject
   */
  async fillSubject(subject) {
    if (await this.isVisible(this.subjectField)) {
      await this.subjectField.fill(subject);
    }
  }

  /**
   * Fill in the description field
   * @param {string} description
   */
  async fillDescription(description) {
    if (await this.isVisible(this.descriptionField)) {
      await this.descriptionField.fill(description);
    }
  }

  /**
   * Fill the complete form with test data
   * @param {object} data - { email, subject, description }
   */
  async fillForm(data) {
    if (data.email) await this.fillEmail(data.email);
    if (data.subject) await this.fillSubject(data.subject);
    if (data.description) await this.fillDescription(data.description);
  }

  /**
   * Click submit WITHOUT actually submitting (for validation testing)
   * The click will trigger client-side validation
   */
  async clickSubmit() {
    if (await this.isVisible(this.submitButton)) {
      await this.submitButton.click();
    }
  }

  /**
   * Check if validation errors are displayed
   * @returns {Promise<boolean>}
   */
  async hasValidationErrors() {
    return await this.isVisible(this.validationErrors, 3000) ||
           await this.isVisible(this.requiredFieldError, 3000);
  }

  /**
   * Get count of visible validation error messages
   * @returns {Promise<number>}
   */
  async getValidationErrorCount() {
    try {
      return await this.validationErrors.count();
    } catch {
      return 0;
    }
  }

  /**
   * Check HTML5 validation state of the email field
   * @returns {Promise<boolean>} - true if email is invalid
   */
  async isEmailInvalid() {
    try {
      return await this.emailField.evaluate((el) => !el.checkValidity());
    } catch {
      return false;
    }
  }

  /**
   * Verify all expected form fields are present
   * @returns {Promise<object>}
   */
  async verifyFormStructure() {
    return {
      formVisible: await this.isFormLoaded(),
      emailField: await this.isVisible(this.emailField),
      submitButton: await this.isVisible(this.submitButton),
    };
  }
}

module.exports = { ContactPage };
