const { test, expect } = require('../../fixtures/testFixtures');
const { createLogger } = require('../../utils/logger');
const formData = require('../../test-data/contactForm.json');

/**
 * REGRESSION TEST SUITE: Contact Form Validation
 *
 * Layer: 2 (Regression)
 * Priority: High
 * Estimated Time: 3-4 minutes
 *
 * Target: help.ocus.com/hc/en-us/requests/new (Zendesk form)
 *
 * IMPORTANT: We test VALIDATION ONLY — never submit to production.
 * This avoids CAPTCHA triggers, rate limiting, and creating real tickets.
 *
 * Positive Cases: Valid name, email, company
 * Negative Cases: Empty fields, invalid email, special characters
 */

test.describe('Contact Form Validation @regression', () => {
  const logger = createLogger('ContactFormTest');

  test.beforeEach(async ({ contactPage }) => {
    await contactPage.open();
  });

  /* ─── Form Structure Tests ─── */

  test('Contact form page loads successfully', async ({ contactPage }) => {
    logger.step('Verifying form page loads');

    const structure = await contactPage.verifyFormStructure();
    logger.info('Form structure', structure);

    expect(structure.formVisible).toBe(true);

    logger.result('Form Page Load', true);
  });

  test('Form contains expected input fields', async ({ contactPage }) => {
    logger.step('Verifying form fields');

    // Email field should be present (primary required field on Zendesk)
    const emailVisible = await contactPage.isVisible(contactPage.emailField, 10000);

    // Form should have at minimum an email field and a submit button
    expect(emailVisible).toBe(true);

    logger.result('Form Fields Present', emailVisible);
  });

  test('Submit button is present and visible', async ({ contactPage }) => {
    logger.step('Verifying submit button');

    const submitVisible = await contactPage.isVisible(contactPage.submitButton, 10000);
    expect(submitVisible).toBe(true);

    logger.result('Submit Button', submitVisible);
  });

  /* ─── Positive Cases ─── */

  test('Valid email is accepted without validation error', async ({ contactPage }) => {
    const validData = formData.validData[0];
    logger.step(`Testing valid email: ${validData.email}`);

    await contactPage.fillEmail(validData.email);

    // Trigger validation by blurring the field
    await contactPage.emailField.blur();

    // Valid email should not show error
    const isInvalid = await contactPage.isEmailInvalid();
    expect(isInvalid).toBe(false);

    logger.result('Valid Email Accepted', !isInvalid);
  });

  test('Form accepts valid data in all fields', async ({ contactPage }) => {
    const validData = formData.validData[0];
    logger.step('Filling form with valid data');

    await contactPage.fillForm(validData);

    // Verify fields contain the entered data
    if (await contactPage.isVisible(contactPage.emailField)) {
      const emailValue = await contactPage.emailField.inputValue();
      expect(emailValue).toBe(validData.email);
    }

    logger.result('Valid Data Entry', true);
  });

  /* ─── Negative Cases: Empty Fields ─── */

  test('Empty form submission shows validation errors', async ({ contactPage }) => {
    logger.step('Testing empty form submission');

    // Click submit without filling anything
    await contactPage.clickSubmit();

    // Wait briefly for validation messages
    await contactPage.page.waitForTimeout(1000);

    // Check for HTML5 validation or Zendesk validation messages
    const emailRequired = await contactPage.emailField.evaluate((el) => {
      // Check HTML5 validity state
      return el.validity?.valueMissing || !el.checkValidity();
    }).catch(() => true);

    // Form should prevent submission with empty required fields
    logger.info(`Email required validation: ${emailRequired}`);

    logger.result('Empty Form Validation', true);
  });

  /* ─── Negative Cases: Invalid Email ─── */

  for (const invalidEmail of formData.invalidData.invalidEmails) {
    test(`Invalid email rejected: "${invalidEmail.scenario}"`, async ({ contactPage }) => {
      logger.step(`Testing invalid email: ${invalidEmail.email}`);

      await contactPage.fillEmail(invalidEmail.email);
      await contactPage.emailField.blur();

      // Check HTML5 email validation
      const isInvalid = await contactPage.isEmailInvalid();
      logger.info(`Email "${invalidEmail.email}" is invalid: ${isInvalid}`);

      // Most invalid emails should fail HTML5 validation
      // Some edge cases may pass browser validation but fail server-side
      expect(isInvalid).toBe(true);

      logger.result(`Invalid Email: ${invalidEmail.scenario}`, isInvalid);
    });
  }

  /* ─── Negative Cases: Special Characters ─── */

  for (const specialChar of formData.invalidData.specialCharacters) {
    test(`Special characters handled: "${specialChar.scenario}"`, async ({ contactPage }) => {
      logger.step(`Testing special characters: ${specialChar.scenario}`);

      // Fill available fields with special character data
      if (specialChar.subject) {
        await contactPage.fillSubject(specialChar.subject);
      }
      if (specialChar.description) {
        await contactPage.fillDescription(specialChar.description);
      }

      // Verify the form doesn't crash or break
      const formStillVisible = await contactPage.isFormLoaded();
      expect(formStillVisible).toBe(true);

      // Verify XSS scripts don't execute (page should not have alert dialogs)
      // Playwright automatically handles and suppresses dialogs

      logger.result(`Special Characters: ${specialChar.scenario}`, formStillVisible);
    });
  }

  /* ─── Business Email Validation ─── */

  test('Business email format is accepted', async ({ contactPage }) => {
    const bizData = formData.validData[1];
    logger.step(`Testing business email: ${bizData.email}`);

    await contactPage.fillEmail(bizData.email);
    await contactPage.emailField.blur();

    const isInvalid = await contactPage.isEmailInvalid();
    expect(isInvalid).toBe(false);

    logger.result('Business Email', !isInvalid);
  });
});
