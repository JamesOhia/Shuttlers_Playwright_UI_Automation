const { expect } = require('@playwright/test');

/**
 * ShuttlerSimplePage - Handles login and booking flow (Happy Path)
 */
class ShuttlerSimplePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to login page
   * @returns {ShuttlerSimplePage}
   */
  async goto() {
    await this.page.goto('https://my.shuttlers.co/auth/login');
    return this;
  }

  /**
   * Perform login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {ShuttlerSimplePage}
   */
  async login(email, password) {
    await this.page.getByRole('textbox', { name: 'Email Address' }).fill(email);
    await this.page.getByRole('textbox', { name: 'Password Login with OTP' }).fill(password);
    await this.page.locator('[data-test="login-button"]').click();
    await expect(this.page).toHaveURL(/.*dashboard.*/, { timeout: 30000 });
    return this;
  }

  /**
   * Search for route
   * @param {string} pickup - Pickup location search text
   * @param {string} pickupExact - Exact pickup location to select
   * @param {string} destination - Destination search text
   * @param {string} destinationExact - Exact destination to select
   * @param {string} date - Date to select
   * @returns {ShuttlerSimplePage}
   */
  async searchRoute(pickup, pickupExact, destination, destinationExact, date) {
    await this.page.getByRole('textbox', { name: 'Pick up location' }).fill(pickup);
    await this.page.getByText(pickupExact, { exact: true }).click();
    await this.page.getByRole('textbox', { name: 'Search destination' }).fill(destination);
    await this.page.getByText(destinationExact, { exact: true }).click();
    await this.page.locator('i').getByRole('img').click();
    await this.page.getByText(date, { exact: true }).click();
    await this.page.getByTestId('find-trips-btn').click();
    return this;
  }

  /**
   * Book a trip
   * @param {string} tripId - Trip identifier
   * @returns {ShuttlerSimplePage}
   */
  async bookTrip(tripId) {
    await this.page.getByText(tripId).click();
    await this.page.getByRole('button', { name: 'Book Trip ₦' }).click();
    await expect(this.page.locator('label').filter({ hasText: /pay with/i }).first()).toBeVisible();
    return this;
  }
}

module.exports = { ShuttlerSimplePage };
