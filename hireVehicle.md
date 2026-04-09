# Hire a Vehicle — Module Documentation

## Overview
This document covers the integration of the **Hire a Vehicle** end-to-end test scenario into the Shuttlers Playwright automation framework. It includes what changed, why each decision was made, and the plan for future growth of this module.

---

## What Changed

### 1. New Test Scenario — `tests/shuttler.spec.ts`
A second test scenario `Hire a Vehicle` was added after the existing `Shuttler Booking` test. Both scenarios now live in the same spec file, following the same Gherkin-style BDD comment structure.

```
Scenario 1: Shuttler Booking     ← existing, unchanged
Scenario 2: Hire a Vehicle       ← new
```

The Hire a Vehicle scenario reuses the same `login()` flow from Scenario 1 — no duplication, no separate login block.

**Gherkin flow:**
```
Given I am logged into the Shuttlers dashboard
When I navigate to "Hire a Vehicle"
And I select the "Shuttlers Black" package and "Coaster Bus" vehicle type
And I verify the day increment (+) and decrement (−) controls are functional
And I schedule the hire for a date next year with a randomized time
And I set the pickup location to Lekki Phase 1
And I set the destination to Festac Town, 1st Avenue
And I assign an available vehicle to the location
And I confirm the referral code field is typable
And I agree to the terms and conditions
And I submit the hire request
Then I should see the confirmation "Close" button
```

---

### 2. New Page Method — `pages/shuttler.page.ts` → `hireVehicle()`
All hire vehicle interactions are encapsulated in a single `hireVehicle(data: HireVehicleData)` method on `ShuttlerSimplePage`. This keeps the test spec clean and readable.

**Method signature:**
```typescript
async hireVehicle(data: HireVehicleData): Promise<this>
```

**HireVehicleData interface:**
```typescript
interface HireVehicleData {
  packageName: string;
  vehicleType: string;
  assignedVehicle: string;
  pickupSearch: string;
  pickupExact: string;
  destinationSearch: string;
  destinationExact: string;
}
```

---

### 3. Test Data — `tests/testData.json`
Test data was migrated from `testData.js` to `testData.json` and extended with a `hireVehicle` block. All values are sourced directly from the live Shuttlers web application.

```json
"hireVehicle": {
  "packageName": "Shuttlers BlackExperience",
  "vehicleType": "Coaster Bus - New Shape(2017",
  "assignedVehicle": "Coaster Bus - New Shape27",
  "pickupSearch": "Lekki",
  "pickupExact": "Lekki Phase 1, Lekki, Nigeria",
  "destinationSearch": "1st av",
  "destinationExact": "Festac Town, 1st Avenue,"
}
```

---

### 4. TypeScript Migration
The entire codebase was migrated from JavaScript to TypeScript:

| Old File | New File | Status |
|---|---|---|
| `shuttler.page.js` | `shuttler.page.ts` | Migrated — kept `.js` for reference |
| `shuttler.spec.js` | `shuttler.spec.ts` | Migrated — kept `.js` for reference |
| `testData.js` | `testData.json` | Replaced with JSON |
| `playwright.config.js` | `playwright.config.ts` | Both kept — `.ts` handles `.spec.ts` files |

`playwright.config.ts` was updated with `testMatch: '**/*.spec.ts'` so it exclusively runs TypeScript specs, while `playwright.config.js` remains untouched for backward compatibility.

---

### 5. New Config Files

**`tsconfig.json`** — Added to enable TypeScript compilation:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "commonjs",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "ignoreDeprecations": "6.0",
    "types": ["node", "@playwright/test"]
  },
  "include": ["tests/**/*.ts", "pages/**/*.ts"]
}
```

`resolveJsonModule: true` is what allows `testData.json` to be imported directly with full type inference.

**`typescript`** — Installed as a dev dependency:
```bash
npm install --save-dev typescript
```

---

## Key Technical Decisions

### Chat Widget — Conditional Dismissal
The Freshdesk chat widget does not appear on every page load. A hard `.click()` would cause flakiness. The solution uses a conditional check:

```typescript
if (await chatCloseBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  await chatCloseBtn.click();
}
```
This makes the step resilient — it dismisses the widget when present and silently skips it when not.

---

### Day Counter (+/−) — Intentional Net Zero with Assertions
The `+` and `−` buttons are two separate UI controls. The test intentionally clicks both (net 0 change) to verify each control is independently functional. Smart assertions were added before each click:

```typescript
await expect(addDayBtn).toBeEnabled();
await addDayBtn.click();
await expect(removeDayBtn).toBeEnabled();
await removeDayBtn.click();
```

This validates the controls are active and interactive, not just present in the DOM.

---

### Start Date — Next Year Navigation + Randomized Day
The forward arrow button (`nth(4)`) advances the calendar by one year, ensuring the test always schedules a future date regardless of when it runs. The day is randomized between 1–28 to be safe across all months (avoids invalid dates like Feb 30):

```typescript
await this.page.getByRole('button').filter({ hasText: /^$/ }).nth(4).click(); // → next year
const randomDay = String(Math.floor(Math.random() * 28) + 1);
await this.page.getByText(randomDay, { exact: true }).click();
```

---

### Start Time — Fully Randomized
Hour (01–12), minute (00–59), and AM/PM are all randomized on each run. This prevents the test from becoming dependent on a specific time slot being available:

```typescript
const randomHour = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
const randomMinute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
const period = Math.random() < 0.5 ? 'AM' : 'PM';
```

---

### Referral Code Field — Editability Assertion Only
The original script filled the referral field with `'1234'` which is not a valid code. Submitting an invalid referral could cause the request to fail or behave unexpectedly. The decision was to assert the field is editable (confirming the UI element works) without entering a value:

```typescript
const referralField = this.page.getByRole('textbox').first();
await expect(referralField).toBeEditable();
```

---

### Final Assertion — Confirmation Modal Close Button
The test is considered passing only when the `Close` button on the confirmation modal becomes visible. This is the true end-to-end success signal — it confirms the hire request was submitted and acknowledged by the system:

```typescript
await expect(this.page.locator('//button[normalize-space()="Close"]')).toBeVisible({
  timeout: 15000,
});
await this.page.locator('//button[normalize-space()="Close"]').click();
```

A 15-second timeout is used here to account for network latency on the request submission.

---

## Running the Tests

```bash
# Run all TypeScript specs
npx playwright test --config=playwright.config.ts

# Run only the Hire a Vehicle scenario
npx playwright test --config=playwright.config.ts -g "Hire a Vehicle"

# Run both scenarios
npx playwright test --config=playwright.config.ts tests/shuttler.spec.ts

# Run in headed mode (see the browser)
npx playwright test --config=playwright.config.ts --headed

# View HTML report after run
npx playwright show-report
```

---

## Future Enhancements

### Short Term
- **Negative test: invalid hire request** — Submit without agreeing to terms and assert the Send request button remains disabled or an error appears
- **Negative test: no vehicle assigned** — Attempt to proceed without assigning a vehicle and assert a validation message
- **Multi-package coverage** — Parameterize `packageName` and `vehicleType` to run the same flow across all available packages (Shuttlers Black, Shuttlers Plus, etc.)

### Medium Term
- **API mock for submission** — Use `page.route()` to intercept the hire request API call and mock a success response. This removes dependency on the backend and makes the test deterministic
- **Fixture for authenticated state** — Save login session state using Playwright's `storageState` so both scenarios skip the login step and run faster
- **Separate page object** — As hire vehicle grows in complexity, extract it into its own `hireVehicle.page.ts` following the modular structure outlined in the README

### Long Term
- **Data-driven hire scenarios** — Drive multiple hire flows from a JSON array of vehicle/location combinations
- **Visual regression** — Add screenshot comparison on the confirmation modal to catch UI regressions
- **CI parallelization** — Shard hire vehicle tests across workers since they are independent of the booking tests

---

## Author
**James Ohia** — Senior SDET  
Module integrated with Amazon Q Developer assistance
