import { expect, type Page, test } from "@playwright/test";

const CHAT_URL_REGEX = /\/chat\/[\w-]+$/;
const PROMPT = "Bagaimana cara mengajukan cuti tahunan?";

function collectChatRequests(page: Page) {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(chat|messages)/.test(request.url())) {
      requests.push(request.url());
    }
  });
  return requests;
}

test.describe("employee chat landing", () => {
  test("explains BPPedia and source-based answers", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Tanyakan kebijakan perusahaan" })
    ).toBeVisible();
    await expect(
      page.getByText("Setiap jawaban akan menyertakan sumber")
    ).toBeVisible();
    await expect(page.getByTestId("landing-product-preview")).toHaveCount(0);
  });

  test("submits one typed question without backend or prompt leakage", async ({
    page,
  }) => {
    const requests = collectChatRequests(page);
    await page.goto("/");

    await page.getByTestId("landing-prompt-input").fill(PROMPT);
    await page.getByTestId("landing-send-button").click();

    await expect(page).toHaveURL(CHAT_URL_REGEX);
    await expect(page.getByTestId("message-user")).toHaveCount(1);
    await expect(page.getByTestId("message-content")).toHaveText(PROMPT);
    await expect(page.getByTestId("message-assistant-loading")).toBeVisible();
    expect(page.url()).not.toContain(encodeURIComponent(PROMPT));
    expect(requests).toEqual([]);

    const leaked = await page.evaluate((prompt) => {
      const containsPrompt = (storage: Storage) =>
        Array.from({ length: storage.length }, (_, index) => {
          const key = storage.key(index);
          return key ? storage.getItem(key) : null;
        }).some((value) => value?.includes(prompt));

      return {
        cookie: document.cookie.includes(prompt),
        local: containsPrompt(localStorage),
        session: containsPrompt(sessionStorage),
      };
    }, PROMPT);

    expect(leaked).toEqual({ cookie: false, local: false, session: false });
  });

  test("submits a suggested question immediately", async ({ page }) => {
    const requests = collectChatRequests(page);
    await page.goto("/");

    const suggestion = page
      .getByTestId("suggested-actions")
      .getByRole("button")
      .first();
    const prompt = await suggestion.textContent();
    await suggestion.click();

    await expect(page).toHaveURL(CHAT_URL_REGEX);
    await expect(page.getByTestId("message-content")).toHaveText(prompt ?? "");
    await expect(page.getByTestId("message-assistant-loading")).toBeVisible();
    expect(requests).toEqual([]);
  });

  test("supports keyboard, multiline, and IME input", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("landing-prompt-input");

    await input.fill("Baris pertama");
    await input.press("Shift+Enter");
    await input.type("Baris kedua");
    await expect(input).toHaveValue("Baris pertama\nBaris kedua");

    await input.dispatchEvent("compositionstart");
    await input.press("Enter");
    await expect(page).toHaveURL("/");
    await input.dispatchEvent("compositionend");
    await input.press("Enter");
    await expect(page).toHaveURL(CHAT_URL_REGEX);
  });

  test("rejects whitespace-only input", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("landing-prompt-input").fill("   ");
    await expect(page.getByTestId("landing-send-button")).toBeDisabled();
  });

  test("keeps the composer full width without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/");

    const primary = await page.getByTestId("landing-primary").boundingBox();
    const composer = await page
      .getByTestId("landing-prompt-input")
      .boundingBox();

    expect(primary).not.toBeNull();
    expect(composer).not.toBeNull();
    expect(composer?.width).toBeGreaterThan((primary?.width ?? 0) * 0.9);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
});
