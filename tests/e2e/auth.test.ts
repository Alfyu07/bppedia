import { expect, test } from "@playwright/test";

test.describe("Admin authentication route", () => {
  test("admin login foundation is reachable", async ({ page }) => {
    await page.goto("/admin/login");

    await expect(
      page.getByRole("heading", { name: "Admin BPPedia" })
    ).toBeVisible();
  });

  test("legacy login redirects to admin login", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("public registration redirects to admin login", async ({ page }) => {
    await page.goto("/register");

    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
