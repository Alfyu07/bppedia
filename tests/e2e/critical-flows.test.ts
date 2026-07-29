import { expect, test } from "@playwright/test";

const CHAT_URL = /\/chat\/[\w-]+$/;
const PROMPT = "Bagaimana cara mengajukan cuti tahunan?";
type TestPage = import("@playwright/test").Page;

async function startConversation(page: TestPage) {
  await page.goto("/");
  await page.getByTestId("landing-prompt-input").fill(PROMPT);
  await page.getByTestId("landing-send-button").click();
  await expect(page).toHaveURL(CHAT_URL);
  await expect(page.getByTestId("message-user")).toHaveCount(1);
  await expect(page.getByTestId("message-assistant")).toHaveCount(1);
}

test.describe("critical user flows", () => {
  test("employee asks a question and receives an answer", async ({ page }) => {
    await startConversation(page);
    await expect(
      page.getByTestId("message-user").getByTestId("message-content")
    ).toHaveText(PROMPT);
    await expect(page.getByTestId("message-assistant-loading")).toHaveCount(0);
  });

  test("employee continues the conversation", async ({ page }) => {
    await startConversation(page);
    await page
      .getByTestId("multimodal-input")
      .fill("Dokumen apa yang dibutuhkan?");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("message-user")).toHaveCount(2);
    await expect(page.getByTestId("message-assistant")).toHaveCount(2);
    await expect(page.getByText("Cantumkan tanggal cuti")).toBeVisible();
  });

  test("employee answer-to-source round trip restores the exact journey", async ({
    page,
  }) => {
    await startConversation(page);
    const chatUrl = page.url();
    const input = page.getByTestId("multimodal-input");
    await input.fill("What documents should I prepare?");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("message-assistant")).toHaveCount(2);
    const helpful = page
      .getByRole("group", { name: "Penilaian jawaban" })
      .last()
      .getByRole("button", { name: "Ya, jawaban ini membantu" });
    await helpful.click();
    await input.fill("Keep this draft while I check the source");

    await page.locator('[data-document-id="employee-benefits"]').last().click();
    await expect(page).toHaveURL(/\/documents\/employee-benefits\?page=12$/);
    await expect(page.getByRole("status")).toHaveText("Halaman 12 dari 12");
    await page.getByRole("button", { name: "Kembali ke percakapan" }).click();

    await expect(page).toHaveURL(chatUrl);
    await expect(page.getByTestId("message-user")).toHaveCount(2);
    await expect(page.getByTestId("message-assistant")).toHaveCount(2);
    await expect(input).toHaveValue("Keep this draft while I check the source");
    await expect(input).toBeFocused();
    await expect(helpful).toHaveAttribute("aria-pressed", "true");
  });

  test("employee retries a failed answer without duplicating the question", async ({
    page,
  }) => {
    await page.goto("/?mock-conversation=retryable-error");
    await page.getByTestId("landing-prompt-input").fill(PROMPT);
    await page.getByTestId("landing-send-button").click();
    const input = page.getByTestId("multimodal-input");
    const errorAlert = page
      .getByRole("alert")
      .filter({ hasText: "Jawaban belum dapat dibuat" });
    await expect(errorAlert).toBeVisible();
    await input.press("Enter");
    await expect(page.getByTestId("message-user")).toHaveCount(1);
    await expect(page.getByTestId("message-assistant")).toHaveCount(1);
    await expect(errorAlert).toHaveCount(0);
  });

  test("employee can reformulate after an honest no-answer response", async ({
    page,
  }) => {
    await page.goto("/?mock-conversation=no-answer");
    await page
      .getByTestId("landing-prompt-input")
      .fill("Apakah ada tunjangan relokasi antarkota?");
    await page.getByTestId("landing-send-button").click();
    await expect(
      page.getByRole("heading", { name: "Jawaban andal tidak ditemukan" })
    ).toBeVisible();
    await page
      .getByTestId("multimodal-input")
      .fill("Benefit apa saja yang tersedia?");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("message-user")).toHaveCount(2);
    await expect(page.getByTestId("message-assistant")).toHaveCount(2);
  });

  test("employee can rate an answer", async ({ page }) => {
    await startConversation(page);
    const feedback = page.getByRole("group", { name: "Penilaian jawaban" });
    const helpful = feedback.getByRole("button", {
      name: "Ya, jawaban ini membantu",
    });
    await helpful.click();
    await expect(helpful).toHaveAttribute("aria-pressed", "true");
    await expect(feedback).toContainText(/tersimpan|terima kasih/i);
  });

  test("admin authentication entry points remain available", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await expect(
      page.getByRole("heading", { name: "Admin BPPedia" })
    ).toBeVisible();
    await page.goto("/login");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("core routes and document viewer remain healthy", async ({
    page,
    request,
  }) => {
    const health = await request.get("/ping");
    expect(health.status()).toBe(200);
    expect(await health.text()).toBe("pong");
    await page.goto("/");
    await expect(page).toHaveTitle("BPPedia");
    await expect(page.getByTestId("landing-prompt-input")).toBeVisible();
    await page.goto("/documents/employee-benefits?page=7");
    await expect(page.getByRole("status")).toHaveText("Halaman 7 dari 12");
    await expect(page.locator('object[type="application/pdf"]')).toBeVisible();
  });
});
