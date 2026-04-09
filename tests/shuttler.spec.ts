import { test } from '@playwright/test';
import { ShuttlerSimplePage } from '../pages/shuttler.page';
import testData from './testData.json';

const { user, route, hireVehicle } = testData;

// ─── Scenario 1: Shuttler Booking ────────────────────────────────────────────
test('Shuttler Booking', async ({ page }) => {
  // Given I am on the Shuttlers login page
  // When I log in with valid credentials
  // And I search for a route from Festac to Eko Hotel
  // And I select and book an available trip
  // Then I should see the payment options on the booking page

  const shuttler = new ShuttlerSimplePage(page);

  await shuttler
    .goto()
    .then(() => shuttler.login(user.email, user.password))
    .then(() =>
      shuttler.searchRoute(
        route.pickup,
        route.pickupExact,
        route.destination,
        route.destinationExact,
        route.date
      )
    )
    .then(() => shuttler.bookTrip(route.tripId));
});

// ─── Scenario 2: Hire a Vehicle ──────────────────────────────────────────────
test('Hire a Vehicle', async ({ page }) => {
  // Given I am logged into the Shuttlers dashboard
  // When I navigate to "Hire a Vehicle"
  // And I select the "Shuttlers Black" package and "Coaster Bus" vehicle type
  // And I verify the day increment (+) and decrement (−) controls are functional
  // And I schedule the hire for a date next year with a randomized time
  // And I set the pickup location to Lekki Phase 1
  // And I set the destination to Festac Town, 1st Avenue
  // And I assign an available vehicle to the location
  // And I confirm the referral code field is typable
  // And I agree to the terms and conditions
  // And I submit the hire request
  // Then I should see the confirmation "Close" button

  const shuttler = new ShuttlerSimplePage(page);

  await shuttler
    .goto()
    .then(() => shuttler.login(user.email, user.password))
    .then(() => shuttler.hireVehicle(hireVehicle));
});
