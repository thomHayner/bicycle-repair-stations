import type { Page } from "@playwright/test";

export const DENVER_GEO = { lat: 39.7392, lng: -104.9903, country: "US" };

export const MOCK_STATION = {
  type: "node",
  id: 9_000_001,
  lat: 39.7392,
  lon: -104.9903,
  tags: {
    name: "Downtown Bike Fix Station",
    "service:bicycle:tools": "yes",
    "service:bicycle:pump": "yes",
  },
};

const OVERPASS_RESPONSE = {
  version: 0.6,
  elements: [MOCK_STATION],
};

/**
 * Mock the IP-geo endpoint and all three Overpass mirrors so tests run fully
 * offline and deterministically.
 */
export async function mockApis(page: Page) {
  await page.route("**/api/geo", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(DENVER_GEO),
    })
  );

  for (const pattern of [
    "**/overpass-api.de/**",
    "**/overpass.kumi.systems/**",
    "**/overpass.openstreetmap.ru/**",
  ]) {
    await page.route(pattern, (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(OVERPASS_RESPONSE),
      })
    );
  }
}

/**
 * Wait for the loading overlay to be removed from the DOM.
 * Uses :not(.sr-only) to skip the always-present live region with the same role attrs.
 */
export async function waitForOverlayGone(page: Page) {
  await page
    .locator('[role="status"][aria-atomic="true"]:not(.sr-only)')
    .waitFor({ state: "detached", timeout: 20_000 });
}

/**
 * Open the hamburger menu drawer.
 */
export async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog", { name: "BicycleRepairStations" }).waitFor({ state: "visible" });
}
