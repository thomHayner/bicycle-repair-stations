import { test, expect } from "@playwright/test";
import { mockApis } from "./fixtures";

test.describe("Share sheet", () => {
  test.beforeEach(async ({ page }) => {
    await mockApis(page);
    await page.goto("/");
  });

  test("clicking Share FAB opens the share sheet dialog", async ({ page }) => {
    await page.getByRole("button", { name: "Share app" }).click();
    await expect(
      page.getByRole("dialog", { name: "Share this app" })
    ).toBeVisible({ timeout: 5_000 });
  });

  test("Escape key closes the share sheet", async ({ page }) => {
    await page.getByRole("button", { name: "Share app" }).click();
    await expect(page.getByRole("dialog", { name: "Share this app" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Share this app" })).not.toBeVisible({
      timeout: 3_000,
    });
  });

  test("Cancel button closes the share sheet", async ({ page }) => {
    await page.getByRole("button", { name: "Share app" }).click();
    const dialog = page.getByRole("dialog", { name: "Share this app" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });

  test("Copy link button shows 'Link copied' status when clipboard is available", async ({
    page,
    context,
    browserName,
  }) => {
    // WebKit does not honour the clipboard-write permission grant in headless mode
    test.skip(browserName === "webkit", "Clipboard permission not available in WebKit");

    await context.grantPermissions(["clipboard-write"]);
    await page.getByRole("button", { name: "Share app" }).click();
    await page.getByRole("button", { name: "Copy link" }).click();

    await expect(page.getByRole("status")).toContainText(/link copied/i, {
      timeout: 5_000,
    });
  });

  test("Share on X button opens a new tab with a Twitter URL", async ({ page, context }) => {
    await page.getByRole("button", { name: "Share app" }).click();

    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("button", { name: "Share on X" }).click(),
    ]);
    // The share URL uses x.com (Twitter's current domain)
    await expect(newPage.url()).toContain("x.com");
    await newPage.close();
  });
});
