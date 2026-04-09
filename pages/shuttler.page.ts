import { Page, expect } from '@playwright/test';

interface HireVehicleData {
  packageName: string;
  vehicleType: string;
  assignedVehicle: string;
  pickupSearch: string;
  pickupExact: string;
  destinationSearch: string;
  destinationExact: string;
}

export class ShuttlerSimplePage {
  constructor(private page: Page) {}

  async goto(): Promise<this> {
    await this.page.goto('https://my.shuttlers.co/auth/login');
    return this;
  }

  async login(email: string, password: string): Promise<this> {
    await this.page.getByRole('textbox', { name: 'Email Address' }).fill(email);
    await this.page.getByRole('textbox', { name: 'Password Login with OTP' }).fill(password);
    await this.page.locator('[data-test="login-button"]').click();
    await expect(this.page).toHaveURL(/.*dashboard.*/, { timeout: 30000 });
    return this;
  }

  async searchRoute(
    pickup: string,
    pickupExact: string,
    destination: string,
    destinationExact: string,
    date: string
  ): Promise<this> {
    await this.page.getByRole('textbox', { name: 'Pick up location' }).fill(pickup);
    await this.page.getByText(pickupExact, { exact: true }).click();
    await this.page.getByRole('textbox', { name: 'Search destination' }).fill(destination);
    await this.page.getByText(destinationExact, { exact: true }).click();
    await this.page.locator('i').getByRole('img').click();
    await this.page.getByText(date, { exact: true }).click();
    await this.page.getByTestId('find-trips-btn').click();
    return this;
  }

  async bookTrip(tripId: string): Promise<this> {
    await this.page.getByText(tripId).click();
    await this.page.getByRole('button', { name: 'Book Trip ₦' }).click();
    await expect(this.page.locator('label').filter({ hasText: /pay with/i }).first()).toBeVisible();
    return this;
  }

  async hireVehicle(data: HireVehicleData): Promise<this> {
    // Navigate to Hire a Vehicle section
    await this.page.getByRole('link', { name: 'Hire a Vehicle' }).click();

    // Select vehicle package and type
    await this.page.getByRole('article').filter({ hasText: data.packageName }).click();
    await this.page.getByRole('article').filter({ hasText: data.vehicleType }).click();

    // Dismiss chat widget if present
    const chatCloseBtn = this.page
      .locator('[data-test-id="chat-widget-iframe"]')
      .contentFrame()
      .locator('[data-test-id="welcome-message-close-button"]');
    if (await chatCloseBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatCloseBtn.click();
    }

    // Verify + and - day controls are interactive, then confirm net 0 change
    const addDayBtn = this.page.getByRole('button', { name: '+' });
    const removeDayBtn = this.page.getByRole('button', { name: '−' });
    await expect(addDayBtn).toBeEnabled();
    await addDayBtn.click();
    await expect(removeDayBtn).toBeEnabled();
    await removeDayBtn.click();

    await this.page.getByRole('button', { name: 'Add to charter' }).click();
    await this.page.getByRole('button', { name: 'Proceed' }).click();

    // Select start date: click date field, navigate to next year, pick a random day
    await this.page.getByRole('textbox').nth(1).click();
    await this.page.getByRole('button').filter({ hasText: /^$/ }).nth(4).click(); // forward arrow → next year

    const randomDay = String(Math.floor(Math.random() * 28) + 1); // 1–28 safe for all months
    // Scope to current-month cells only (exclude not-current-month overflow days)
    await this.page
      .locator('.mx-table-date td.cell:not(.not-current-month) div')
      .filter({ hasText: new RegExp(`^${randomDay}$`) })
      .first()
      .click();

    // Select start time: randomized hour (01–12), minute (00–59), AM/PM
    await this.page.getByRole('textbox').nth(2).click();

    const randomHour = Math.floor(Math.random() * 12) + 1;   // 1–12
    const randomMinute = Math.floor(Math.random() * 60);      // 0–59
    const period = Math.random() < 0.5 ? 'AM' : 'PM';

    // Each column is a .mx-time-column — hour=0, minute=1, period=2
    const timeColumns = this.page.locator('.mx-time-column');

    // Click hour by data-index (0-based: hour 1 = index 1)
    await timeColumns.nth(0).locator(`li[data-index="${randomHour}"]`).click();

    // Wait for minute column to stabilise after hour selection re-renders
    await this.page.waitForTimeout(300);

    // Click minute by data-index (0-based: minute 0 = index 0)
    await timeColumns.nth(1).locator(`li[data-index="${randomMinute}"]`).click();

    // Click AM or PM in the period column
    await timeColumns.nth(2).getByText(period, { exact: true }).click();

    await this.page.getByRole('button', { name: 'proceed' }).click();

    // Set pickup and destination locations
    await this.page.getByRole('textbox', { name: 'Pick up location' }).fill(data.pickupSearch);
    await this.page.getByText(data.pickupExact).click();
    await this.page.getByRole('textbox', { name: 'Search destination' }).fill(data.destinationSearch);
    await this.page.getByText(data.destinationExact).first().click();

    // Assign vehicle
    await this.page.getByRole('button', { name: 'Assign vehicle' }).click();
    await this.page.getByRole('article').filter({ hasText: data.assignedVehicle }).click();
    await this.page.getByRole('button', { name: 'Assign to location' }).click();
    await this.page.getByRole('button', { name: 'proceed' }).click();

    // Verify referral code field is typable if present (field exists but no valid code to submit)
    const referralField = this.page.locator('input[placeholder*="eferr" i], input[name*="eferr" i], input[placeholder*="romo" i]').first();
    if (await referralField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(referralField).toBeEditable();
    }
/*
    // Agree to terms and send request
    await this.page.getByRole('checkbox', { name: 'I agree that the total amount' }).check();
    await expect(
      this.page.getByRole('checkbox', { name: 'I agree that the total amount' })
    ).toBeChecked();

    await this.page.getByRole('button', { name: 'Send request' }).click();

    // Final assertion: confirmation Close button appears
    await expect(this.page.locator('//button[normalize-space()="Close"]')).toBeVisible({
      timeout: 15000,
    });
    await this.page.locator('//button[normalize-space()="Close"]').click();
*/
    return this;
  }
}
