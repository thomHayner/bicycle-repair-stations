import { test, expect } from "@playwright/test";
import { mockApis, openMenu } from "./fixtures";

test.describe("Theme settings", () => {
  test.beforeEach(async ({ page }) => {
    await mockApis(page);
    await page.goto("/");
    await openMenu(page);
  });

  test("selecting Dark theme adds .dark class to <html>", async ({ page }) => {
    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 3_000 });
  });

  test("selecting Light theme removes .dark class from <html>", async ({ page }) => {
    // First enable dark
    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    // Then switch back to light
    await page.getByRole("button", { name: "Light" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/, { timeout: 3_000 });
  });

  test("theme persists across a page reload", async ({ page }) => {
    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5_000 });
  });
});
