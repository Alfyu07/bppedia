import { expect, test } from "@playwright/test";

test.describe("BPPedia design review", () => {
  test("presents the approved institutional-tech direction", async ({
    page,
  }) => {
    await page.goto("/design-review");

    await expect(page).toHaveTitle(/Design Review.*BPPedia/);
    await expect(page.getByRole("navigation")).toContainText("BPPedia");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Temukan kebijakan. Pahami konteksnya.",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Mulai mencari" })
    ).toHaveAttribute("href", "/");
    await expect(page.getByTestId("brand-green")).toBeVisible();
    await expect(page.getByTestId("action-blue")).toBeVisible();
    await expect(page.getByTestId("attention-gold")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Pengetahuan perusahaan, tanpa menebak.",
      })
    ).toBeVisible();
  });
});
