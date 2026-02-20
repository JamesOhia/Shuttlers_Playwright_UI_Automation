const { test } = require('@playwright/test');
const { ShuttlerSimplePage } = require('../pages/shuttler.page');
const { user, route } = require('./testData');

test('Shuttler Booking', async ({ page }) => {
  const shuttler = new ShuttlerSimplePage(page);
  
  await shuttler
    .goto()
    .then(() => shuttler.login(user.email, user.password))
    .then(() => shuttler.searchRoute(route.pickup, route.pickupExact, route.destination, route.destinationExact, route.date))
    .then(() => shuttler.bookTrip(route.tripId));
});
