import { test, expect } from "@playwright/test";
import { mockApis } from "./fixtures";

test.describe("/guides page", () => {
  test("loads and shows repair video sections", async ({ page }) => {
    await mockApis(page);
    await page.goto("/guides");
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible({
      timeout: 10_000,
    });
    // Category headings are always-visible h2 elements (not accordion buttons)
    await expect(
      page.locator("h2").filter({ hasText: /flat tyre|brakes|gears|chain/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("/about page", () => {
  test("loads and shows privacy accordion", async ({ page }) => {
    await mockApis(page);
    await page.goto("/about");
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible({
      timeout: 10_000,
    });
    // Privacy Policy accordion button should be present
    await expect(page.getByRole("button").filter({ hasText: /privacy/i })).toBeVisible();
  });
});

test.describe("/report-bug page", () => {
  test("submit is disabled when required fields are empty", async ({ page }) => {
    await mockApis(page);
    await page.goto("/report-bug");
    const submitBtn = page.getByRole("button", { name: /submit bug report/i });
    await expect(submitBtn).toBeVisible({ timeout: 10_000 });
    await expect(submitBtn).toBeDisabled();
  });

  test("submit becomes enabled when all required fields are filled", async ({ page }) => {
    await mockApis(page);
    await page.goto("/report-bug");

    await page.fill("#bug-summary", "Map does not load");
    await page.fill("#bug-description", "When I open the app the map never appears.");
    await page.fill("#bug-steps", "1. Open app. 2. Wait.");
    await page.fill("#bug-expected", "Map loads within 5 seconds.");
    await page.fill("#bug-device", "iPhone 14, iOS 17");

    const submitBtn = page.getByRole("button", { name: /submit bug report/i });
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
  });
});

test.describe("/donate page", () => {
  test("preset amount buttons are visible and selectable", async ({ page }) => {
    await mockApis(page);
    await page.goto("/donate");
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible({
      timeout: 10_000,
    });

    // Preset amounts $1, $2, $5 should be present
    const oneBtn = page.getByRole("button", { name: /\$1/i }).first();
    await expect(oneBtn).toBeVisible();
    await oneBtn.click();

    // Donate button should become enabled after selecting an amount
    const donateBtn = page.getByRole("button", { name: /donate/i }).last();
    await expect(donateBtn).toBeEnabled({ timeout: 3_000 });
  });

  test("invalid custom amount disables the donate button", async ({ page }) => {
    await mockApis(page);
    await page.goto("/donate");
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible({
      timeout: 10_000,
    });

    const customInput = page.locator("#custom-amount");
    await expect(customInput).toBeVisible();

    // Enter a value below the $1 minimum (0 cents)
    await customInput.fill("0");

    const donateBtn = page.getByRole("button", { name: /donate/i }).last();
    await expect(donateBtn).toBeDisabled({ timeout: 3_000 });
  });
});
