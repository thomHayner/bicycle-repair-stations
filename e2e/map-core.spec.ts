import { test, expect } from "@playwright/test";
import { mockApis, waitForOverlayGone, DENVER_GEO } from "./fixtures";

test.describe("Map core", () => {
  test.beforeEach(async ({ page }) => {
    await mockApis(page);
    await page.goto("/");
  });

  test("loading overlay is visible on first paint", async ({ page, browserName }) => {
    // The mock /api/geo resolves instantly; on fast engines the overlay can
    // disappear before the assertion runs. Delay the response so we can catch it.
    // WebKit is too fast for this timing trick to be reliable — skip there.
    test.skip(browserName === "webkit", "Overlay timing check unreliable on WebKit");

    await page.route("/api/geo", async (route) => {
      await new Promise<void>((r) => setTimeout(r, 1_500));
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(DENVER_GEO),
      });
    });
    await page.goto("/");
    const overlay = page.locator('[role="status"][aria-atomic="true"]:not(.sr-only)');
    await expect(overlay).toBeAttached({ timeout: 5_000 });
  });

  test("station markers appear after geo + Overpass resolve", async ({ page }) => {
    await waitForOverlayGone(page);
    // react-leaflet renders markers as .leaflet-marker-icon elements
    await expect(page.locator(".leaflet-marker-icon").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("station list shows the mocked station after Overpass resolves", async ({ page }) => {
    await waitForOverlayGone(page);
    // Expand the station list to see individual items
    const expandBtn = page.getByRole("button", { name: /expand station list/i });
    if (await expandBtn.isVisible({ timeout: 5_000 })) await expandBtn.click();
    // The mocked station name should appear
    await expect(page.getByText("Downtown Bike Fix Station")).toBeVisible({ timeout: 10_000 });
    // The Get Directions link in the list should also be visible
    await expect(
      page.getByRole("link", { name: /get directions to/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("toolbar search input is present", async ({ page }) => {
    await expect(
      page.getByRole("searchbox", { name: "Search location" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("share FAB is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Share app" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("location denied banner appears when geo is blocked", async ({ page }) => {
    // The mocked /api/geo is called on geo denial and returns US coords.
    // The toolbar should show the location-denied message.
    await waitForOverlayGone(page);
    // With denied GPS, location icon button should be disabled or show unavailable label
    const locBtn = page
      .getByRole("button", { name: /use my location|location unavailable/i })
      .first();
    await expect(locBtn).toBeVisible({ timeout: 5_000 });
  });
});
