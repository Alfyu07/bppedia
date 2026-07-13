import { expect, test } from "@playwright/test";

test.describe("BPPedia design review", () => {
  test("presents the cinematic institutional direction", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/design-review");

    await expect(page).toHaveTitle(/Design Review.*BPPedia/);
    await expect(page.getByRole("navigation")).toContainText("BPPedia");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Pengetahuan yang bergerak bersama perusahaan.",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Jelajahi BPPedia" })
    ).toHaveAttribute("href", "/");
    await expect(page.getByTestId("institution-ribbon")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Satu identitas. Tiga tugas warna." })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Kebijakan bukan halaman statis.",
      })
    ).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
