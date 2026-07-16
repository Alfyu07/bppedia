import { expect, test } from "@playwright/test";

test.describe("BPPedia route foundation", () => {
  test("uses BPPedia document metadata", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("BPPedia");
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
  });

  test("employee chat landing remains available at root", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("landing-prompt-input")).toBeVisible();
  });

  test("admin workspace foundation is reachable", async ({ page }) => {
    await page.goto("/admin");

    await expect(
      page.getByRole("heading", { name: "Kelola BPP" })
    ).toBeVisible();
  });

  test("health endpoint remains available", async ({ request }) => {
    const response = await request.get("/ping");

    expect(response.status()).toBe(200);
    expect(await response.text()).toBe("pong");
  });
});
