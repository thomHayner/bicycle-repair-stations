import { test, expect } from "@playwright/test";
import { mockApis, openMenu } from "./fixtures";

test.describe("i18n / RTL", () => {
  test.beforeEach(async ({ page }) => {
    await mockApis(page);
    await page.goto("/");
    await openMenu(page);
  });

  test("changing language to French updates html[lang] to 'fr'", async ({ page }) => {
    const langSelect = page.getByLabel("Language");
    await langSelect.selectOption("fr");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr", {
      timeout: 5_000,
    });
  });

  test("changing language to Arabic sets html[dir] to 'rtl'", async ({ page }) => {
    const langSelect = page.getByLabel("Language");
    await langSelect.selectOption("ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl", {
      timeout: 5_000,
    });
  });

  test("language preference persists across a page reload", async ({ page }) => {
    const langSelect = page.getByLabel("Language");
    await langSelect.selectOption("fr");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");

    await page.reload();
    // After reload the APIs need to be re-mocked (route mocking is page-level)
    await mockApis(page);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr", {
      timeout: 5_000,
    });
  });

  test("switching back to English resets html[dir] to 'ltr'", async ({ page }) => {
    const langSelect = page.getByLabel("Language");
    // Set RTL first
    await langSelect.selectOption("ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    // After switching to Arabic the accessible button labels change to Arabic.
    // Use localStorage + reload to switch back rather than re-opening the menu.
    await page.evaluate(() => localStorage.setItem("brs-locale", "en"));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr", {
      timeout: 5_000,
    });
  });
});
