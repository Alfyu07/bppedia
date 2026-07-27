import {
  type BrowserContext,
  expect,
  type Locator,
  type Page,
  test,
} from "@playwright/test";

const CHAT_URL_REGEX = /\/chat\/[\w-]+$/;
const PROMPT = "Bagaimana cara mengajukan cuti tahunan?";
const FEEDBACK_GROUP_NAME = "Penilaian jawaban";
const HELPFUL_NAME = "Ya, jawaban ini membantu";
const NOT_HELPFUL_NAME = "Tidak, jawaban ini tidak membantu";
const { DEMO_ORIGIN } = process.env;

interface BrowserPersistenceSnapshot {
  cookies: Awaited<ReturnType<BrowserContext["cookies"]>>;
  local: [string, string | null][];
  session: [string, string | null][];
}

interface GlobalControlSnapshot {
  dialogs: number;
  forms: number;
  textInputs: number;
}

interface ChatContextSnapshot {
  anchor: {
    bottom: number;
    text: string;
    top: number;
  };
  draft: string;
  feedback: string[];
  messages: {
    role: string | null;
    text: string;
  }[];
  scrollTop: number;
  url: string;
}

interface CitationRequestRecord {
  cookie: string;
  method: string;
  postData: string;
  resourceType: string;
  url: string;
}

function collectAllRequests(page: Page) {
  const requests: string[] = [];
  page.context().on("request", (request) => requests.push(request.url()));
  return requests;
}

function collectChatRequests(page: Page) {
  const requests: string[] = [];
  page.context().on("request", (request) => {
    if (/\/api\/(auth\/guest|chat|messages|files)/.test(request.url())) {
      requests.push(request.url());
    }
  });
  return requests;
}

async function submitFollowUps(
  page: Page,
  count: number,
  turn = 0
): Promise<void> {
  if (turn === count) {
    return;
  }

  const input = page.getByTestId("multimodal-input");
  await input.fill(`Pertanyaan lanjutan ${turn + 1}`);
  await input.press("Enter");
  await expect(page.getByTestId("message-assistant")).toHaveCount(turn + 2);
  await submitFollowUps(page, count, turn + 1);
}

async function submitFailOnceFeedback(
  groups: Locator,
  composer: Locator,
  index = 0
): Promise<void> {
  if (index === 2) {
    return;
  }

  const group = groups.nth(index);
  const helpful = group.getByRole("button", { name: HELPFUL_NAME });
  const notHelpful = group.getByRole("button", { name: NOT_HELPFUL_NAME });
  await helpful.click();
  const errorStatus = group.getByRole("status");
  await expect(errorStatus).toContainText(/belum tersimpan|gagal|coba lagi/i);
  await expect(errorStatus).toHaveAttribute("data-status", "error");
  await expect(errorStatus).toHaveClass(/text-red-600/);
  await expect(errorStatus).toHaveClass(/dark:text-red-400/);
  await expect(helpful).toHaveAttribute("aria-pressed", "false");
  await expect(notHelpful).toHaveAttribute("aria-pressed", "false");
  await expect(helpful).toBeEnabled();
  await expect(notHelpful).toBeEnabled();
  await expect(composer).toBeEnabled();

  await helpful.click();
  await expect(helpful).toHaveAttribute("aria-pressed", "true");
  await expect(group).toContainText(/tersimpan|terima kasih/i);
  await submitFailOnceFeedback(groups, composer, index + 1);
}

async function installBrowserWriteSpies(page: Page): Promise<void> {
  await page.context().addInitScript(() => {
    const writeCalls: string[] = [];
    Object.defineProperty(window, "__feedbackWriteCalls", {
      configurable: false,
      value: writeCalls,
    });

    const spy = (prototype: object, method: string, label: string): void => {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, method);
      if (!descriptor || typeof descriptor.value !== "function") {
        return;
      }
      Object.defineProperty(prototype, method, {
        ...descriptor,
        value(...args: unknown[]) {
          const key = typeof args[0] === "string" ? `:${args[0]}` : "";
          writeCalls.push(`${label}${key}`);
          return Reflect.apply(descriptor.value, this, args);
        },
      });
    };

    for (const method of ["setItem", "removeItem", "clear"]) {
      spy(Storage.prototype, method, `Storage.${method}`);
    }
    for (const method of ["add", "put", "delete", "clear"]) {
      spy(IDBObjectStore.prototype, method, `IDBObjectStore.${method}`);
    }
    if (typeof Cache !== "undefined") {
      for (const method of ["put", "delete", "add", "addAll"]) {
        spy(Cache.prototype, method, `Cache.${method}`);
      }
    }
    if (typeof CacheStorage !== "undefined") {
      spy(CacheStorage.prototype, "open", "CacheStorage.open");
      spy(CacheStorage.prototype, "delete", "CacheStorage.delete");
    }
  });
}

async function getBrowserPersistenceSnapshot(
  page: Page
): Promise<BrowserPersistenceSnapshot> {
  const cookies = await page.context().cookies();
  const storage = await page.evaluate(() => {
    const entries = (target: Storage): [string, string | null][] =>
      Array.from({ length: target.length }, (_, index) => {
        const key = target.key(index) ?? "";
        return [key, target.getItem(key)] as [string, string | null];
      }).sort(([left], [right]) => left.localeCompare(right));

    return {
      local: entries(localStorage),
      session: entries(sessionStorage),
    };
  });
  return { cookies, ...storage };
}

function getGlobalControlSnapshot(page: Page): Promise<GlobalControlSnapshot> {
  return page.evaluate(() => ({
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    forms: document.forms.length,
    textInputs: document.querySelectorAll(
      'input:not([type]), input[type="text"], textarea, [contenteditable="true"]'
    ).length,
  }));
}

async function clearBrowserWriteCalls(page: Page): Promise<void> {
  await page.evaluate(() => {
    const calls = (
      window as typeof window & { __feedbackWriteCalls?: string[] }
    ).__feedbackWriteCalls;
    calls?.splice(0);
  });
}

function getBrowserWriteCalls(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      (window as typeof window & { __feedbackWriteCalls?: string[] })
        .__feedbackWriteCalls ?? []
  );
}

async function installCookieWriteSpies(page: Page): Promise<void> {
  await page.context().addInitScript(() => {
    const calls: string[] = [];
    Object.defineProperty(window, "__citationCookieWriteCalls", {
      configurable: false,
      value: calls,
    });

    const cookieDescriptor = Object.getOwnPropertyDescriptor(
      Document.prototype,
      "cookie"
    );
    if (cookieDescriptor?.get && cookieDescriptor.set) {
      Object.defineProperty(Document.prototype, "cookie", {
        configurable: cookieDescriptor.configurable,
        enumerable: cookieDescriptor.enumerable,
        get: cookieDescriptor.get,
        set(value: string) {
          calls.push("document.cookie");
          cookieDescriptor.set?.call(this, value);
        },
      });
    }

    const { cookieStore } = window as typeof window & {
      cookieStore?: {
        delete?: (...args: unknown[]) => Promise<void>;
        set?: (...args: unknown[]) => Promise<void>;
      };
    };
    if (cookieStore) {
      for (const method of ["set", "delete"] as const) {
        const original = cookieStore[method];
        if (typeof original === "function") {
          cookieStore[method] = (...args: unknown[]) => {
            calls.push(`cookieStore.${method}`);
            return original.apply(cookieStore, args);
          };
        }
      }
    }
  });
}

async function clearCitationInstrumentation(page: Page): Promise<void> {
  await clearBrowserWriteCalls(page);
  await page.evaluate(() => {
    const calls = (
      window as typeof window & { __citationCookieWriteCalls?: string[] }
    ).__citationCookieWriteCalls;
    calls?.splice(0);
  });
}

async function getCitationWriteCalls(page: Page): Promise<string[]> {
  const [browserWrites, cookieWrites] = await Promise.all([
    getBrowserWriteCalls(page),
    page.evaluate(
      () =>
        (
          window as typeof window & {
            __citationCookieWriteCalls?: string[];
          }
        ).__citationCookieWriteCalls ?? []
    ),
  ]);
  return [...browserWrites, ...cookieWrites].filter(
    (call) => !call.startsWith("Storage.setItem:__next_debug_channel:")
  );
}

function getChatContextSnapshot(
  page: Page,
  anchorText: string
): Promise<ChatContextSnapshot> {
  return page.evaluate((text) => {
    const anchor = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="message-content"]')
    ).find((element) => element.textContent?.includes(text));
    const container = document.querySelector<HTMLElement>(
      '[data-testid="messages-container"]'
    );
    const draft = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="multimodal-input"]'
    );
    if (!(anchor && container && draft)) {
      throw new Error("Chat context is incomplete");
    }
    const rect = anchor.getBoundingClientRect();

    return {
      anchor: {
        bottom: Math.round(rect.bottom),
        text: anchor.textContent?.trim() ?? "",
        top: Math.round(rect.top),
      },
      draft: draft.value,
      feedback: Array.from(
        document.querySelectorAll<HTMLElement>(
          '[aria-label="Penilaian jawaban"]'
        )
      ).map(
        (group) =>
          group
            .querySelector('[aria-pressed="true"]')
            ?.getAttribute("aria-label") ?? ""
      ),
      messages: Array.from(
        document.querySelectorAll<HTMLElement>("[data-role]")
      ).map((message) => ({
        role: message.getAttribute("data-role"),
        text: message.innerText.trim(),
      })),
      scrollTop: Math.round(container.scrollTop),
      url: window.location.href,
    };
  }, anchorText);
}

async function expectPopupPrivacy(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => document.referrer)).toBe("");
  expect(await page.evaluate(() => window.opener === null)).toBe(true);
}

function expectCitationRequestsSafe(
  records: CitationRequestRecord[],
  conversationContent: readonly string[]
): void {
  for (const record of records) {
    const url = new URL(record.url);
    const isReadOnlyAuthSession =
      record.method === "GET" && /\/api\/auth\/session$/.test(url.pathname);
    const isAllowedAsset =
      record.method === "GET" &&
      (/^\/documents\//.test(url.pathname) ||
        /^\/_next\//.test(url.pathname) ||
        /^\/__nextjs_font\//.test(url.pathname) ||
        url.pathname === "/favicon.ico");

    expect(
      isAllowedAsset || isReadOnlyAuthSession,
      JSON.stringify(record)
    ).toBe(true);
    expect(record.method).toBe("GET");
    expect(record.resourceType).not.toBe("websocket");
    expect(record.postData).toBe("");
    expect(/\/api\/(chat|messages|files|vote|history)/.test(url.pathname)).toBe(
      false
    );
    for (const content of conversationContent) {
      expect(decodeURIComponent(record.url)).not.toContain(content);
      expect(record.postData).not.toContain(content);
    }
  }
}

async function startMockConversation(page: Page): Promise<void> {
  await page.getByTestId("landing-prompt-input").fill(PROMPT);
  await page.getByTestId("landing-send-button").click();
  await expect(page).toHaveURL(CHAT_URL_REGEX);
  await expect(page.getByTestId("message-assistant")).toHaveCount(1);
}

async function expectDocumentPage(
  page: Page,
  expectedPage: number,
  pageCount = 12,
  pathname = "/documents/employee-benefits"
): Promise<void> {
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === pathname &&
      url.search === `?page=${expectedPage}` &&
      url.hash === ""
  );
  await expect(page.getByRole("status")).toHaveText(
    `Halaman ${expectedPage} dari ${pageCount}`
  );
  await expect(page.getByLabel("Buka halaman")).toHaveValue(
    String(expectedPage)
  );
  await expect(page.locator('object[type="application/pdf"]')).toHaveAttribute(
    "data",
    new RegExp(`#page=${expectedPage}(?:&|$)`)
  );
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
    await expect(page.getByTestId("message-assistant")).toHaveCount(1);
    await expect(page.getByTestId("message-assistant-loading")).toHaveCount(0);
    await expect(
      page.getByTestId("message-user").getByTestId("message-content")
    ).toHaveText(PROMPT);
    expect(
      await page
        .locator("[data-role]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-role"))
        )
    ).toEqual(["user", "assistant"]);
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

  test("opens active citations at their exact canonical PDF pages", async ({
    page,
  }) => {
    const requests = collectChatRequests(page);
    const expectedCitations = [
      {
        activation: "mouse",
        documentId: "employee-benefits",
        href: "/documents/employee-benefits?page=12",
        page: 12,
        pageCount: 12,
        pdfHref: "/documents/files/employee-benefits-v2026-1.pdf",
        title: "Kebijakan Benefit Karyawan",
        versionId: "employee-benefits-v2026-1",
        versionLabel: "2026.1",
      },
      {
        activation: "keyboard",
        documentId: "employee-mobility",
        href: "/documents/employee-mobility?page=8",
        page: 8,
        pageCount: 8,
        pdfHref: "/documents/files/employee-mobility-v2026-1.pdf",
        title: "Panduan Mobilitas Karyawan",
        versionId: "employee-mobility-v2026-1",
        versionLabel: "2026.1",
      },
    ] as const;

    await page.goto("/");
    await startMockConversation(page);

    const citations = page.getByRole("region", { name: "Sumber jawaban" });
    await expect(citations.getByRole("link")).toHaveCount(
      expectedCitations.length
    );
    await expect(citations.getByText(/Arsip Benefit/i)).toHaveCount(0);
    const originalUrl = page.url();

    const openCitation = async (index = 0): Promise<void> => {
      const expectedCitation = expectedCitations[index];
      if (!expectedCitation) {
        return;
      }
      const citation = citations.locator(
        `[data-document-id="${expectedCitation.documentId}"]`
      );
      await expect(citation).toContainText(expectedCitation.title);
      await expect(citation).toContainText(
        `Versi ${expectedCitation.versionLabel} · Halaman ${expectedCitation.page}`
      );
      await expect(citation).toHaveAttribute(
        "data-version-id",
        expectedCitation.versionId
      );
      await expect(citation).toHaveAttribute(
        "data-page",
        String(expectedCitation.page)
      );
      await expect
        .soft(citation)
        .toHaveAttribute("href", expectedCitation.href);
      await expect(citation).toHaveAttribute("target", "_blank");
      await expect(citation).toHaveAttribute("rel", "noopener noreferrer");

      if (expectedCitation.activation === "keyboard") {
        await citation.focus();
        await expect(citation).toBeFocused();
      }
      const [documentPage] = await Promise.all([
        page.waitForEvent("popup"),
        expectedCitation.activation === "keyboard"
          ? page.keyboard.press("Enter")
          : citation.click(),
      ]);
      const documentUrl = new URL(documentPage.url());
      expect
        .soft(documentUrl.pathname)
        .toBe(`/documents/${expectedCitation.documentId}`);
      expect.soft(documentUrl.search).toBe(`?page=${expectedCitation.page}`);
      expect.soft(documentUrl.hash).toBe("");
      await expect
        .soft(documentPage.getByRole("status"))
        .toHaveText(
          `Halaman ${expectedCitation.page} dari ${expectedCitation.pageCount}`
        );
      const pdfData = await documentPage
        .locator('object[type="application/pdf"]')
        .getAttribute("data");
      const pdfUrl = new URL(pdfData ?? "", documentPage.url());
      expect.soft(pdfUrl.pathname).toBe(expectedCitation.pdfHref);
      expect
        .soft(new URLSearchParams(pdfUrl.hash.slice(1)).get("page"))
        .toBe(String(expectedCitation.page));
      await documentPage.close();
      await expect(page).toHaveURL(originalUrl);
      await openCitation(index + 1);
    };

    await openCitation();
    expect(requests).toEqual([]);
  });

  test("preserves exact long-chat context when switching back from a popup", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 700, width: 900 });
    await page.goto("/");
    await startMockConversation(page);
    await submitFollowUps(page, 5);

    const feedback = page
      .getByRole("group", { name: FEEDBACK_GROUP_NAME })
      .first()
      .getByRole("button", { name: NOT_HELPFUL_NAME });
    await feedback.click();
    await expect(feedback).toHaveAttribute("aria-pressed", "true");
    await page
      .getByTestId("multimodal-input")
      .fill("Draf yang belum dikirim tetap utuh");

    const citation = page
      .locator('[data-document-id="employee-benefits"]')
      .first();
    await citation.scrollIntoViewIfNeeded();
    const anchorText = "Ajukan cuti tahunan melalui portal karyawan";
    const before = await getChatContextSnapshot(page, anchorText);
    expect(before.anchor.top).toBeGreaterThanOrEqual(0);
    expect(before.anchor.bottom).toBeLessThanOrEqual(700);

    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      citation.click(),
    ]);
    await expectDocumentPage(popup, 12);
    await popup.bringToFront();
    await page.bringToFront();
    await expect
      .poll(() => page.evaluate(() => document.hasFocus()))
      .toBe(true);
    expect(await getChatContextSnapshot(page, anchorText)).toEqual(before);

    await popup.close();
  });

  test("preserves exact long-chat context when the active popup closes", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 700, width: 900 });
    await page.goto("/");
    await startMockConversation(page);
    await submitFollowUps(page, 5);

    const feedback = page
      .getByRole("group", { name: FEEDBACK_GROUP_NAME })
      .first()
      .getByRole("button", { name: HELPFUL_NAME });
    await feedback.click();
    await expect(feedback).toHaveAttribute("aria-pressed", "true");
    await page
      .getByTestId("multimodal-input")
      .fill("Draf aktif sebelum tab dokumen ditutup");

    const citation = page
      .locator('[data-document-id="employee-mobility"]')
      .first();
    await citation.scrollIntoViewIfNeeded();
    const anchorText = "Ajukan cuti tahunan melalui portal karyawan";
    const before = await getChatContextSnapshot(page, anchorText);
    expect(before.anchor.top).toBeGreaterThanOrEqual(0);
    expect(before.anchor.bottom).toBeLessThanOrEqual(700);

    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      citation.click(),
    ]);
    await expectDocumentPage(popup, 8, 8, "/documents/employee-mobility");
    await popup.bringToFront();
    await expect
      .poll(() => popup.evaluate(() => document.hasFocus()))
      .toBe(true);
    await popup.close();
    await expect
      .poll(() => page.evaluate(() => document.hasFocus()))
      .toBe(true);
    expect(await getChatContextSnapshot(page, anchorText)).toEqual(before);
  });

  test("isolates keyboard and mouse citation tabs on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/");
    await startMockConversation(page);

    const citations = page.getByRole("region", { name: "Sumber jawaban" });
    const cases = [
      {
        activation: "mouse",
        documentId: "employee-benefits",
        page: 12,
        pageCount: 12,
        pathname: "/documents/employee-benefits",
      },
      {
        activation: "keyboard",
        documentId: "employee-mobility",
        page: 8,
        pageCount: 8,
        pathname: "/documents/employee-mobility",
      },
    ] as const;

    const assertCase = async (index = 0): Promise<void> => {
      const currentCase = cases[index];
      if (!currentCase) {
        return;
      }
      const citation = citations.locator(
        `[data-document-id="${currentCase.documentId}"]`
      );
      const box = await citation.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
      await expect(citation).toHaveAttribute("target", "_blank");
      await expect(citation).toHaveAttribute("rel", "noopener noreferrer");
      if (currentCase.activation === "keyboard") {
        await citation.focus();
      }

      const [popup] = await Promise.all([
        page.waitForEvent("popup"),
        currentCase.activation === "keyboard"
          ? page.keyboard.press("Enter")
          : citation.click(),
      ]);
      await expectDocumentPage(
        popup,
        currentCase.page,
        currentCase.pageCount,
        currentCase.pathname
      );
      await expectPopupPrivacy(popup);
      expect(
        await popup.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
      await popup.close();
      await assertCase(index + 1);
    };

    await assertCase();

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  test("keeps citation navigation context-private and persistence-free", async ({
    page,
  }) => {
    const requestRecords: CitationRequestRecord[] = [];
    const setCookieResponses: string[] = [];
    const instrumentationTasks: Promise<void>[] = [];
    await installBrowserWriteSpies(page);
    await installCookieWriteSpies(page);
    page.context().on("request", (request) => {
      if (
        new URL(request.url()).pathname === "/__nextjs_original-stack-frames"
      ) {
        return;
      }
      instrumentationTasks.push(
        request.allHeaders().then((headers) => {
          requestRecords.push({
            cookie: headers.cookie ?? "",
            method: request.method(),
            postData: request.postData() ?? "",
            resourceType: request.resourceType(),
            url: request.url(),
          });
        })
      );
    });
    page.context().on("response", (response) => {
      instrumentationTasks.push(
        response.allHeaders().then((headers) => {
          const setCookie = headers["set-cookie"];
          if (setCookie) {
            setCookieResponses.push(`${response.url()}: ${setCookie}`);
          }
        })
      );
    });

    await page.goto("/");
    await startMockConversation(page);
    await submitFollowUps(page, 2);
    await page
      .getByRole("group", { name: FEEDBACK_GROUP_NAME })
      .first()
      .getByRole("button", { name: HELPFUL_NAME })
      .click();
    const draft = "Draf privat yang tidak boleh bocor";
    await page.getByTestId("multimodal-input").fill(draft);
    await page.waitForLoadState("networkidle");
    await Promise.all(instrumentationTasks);
    instrumentationTasks.splice(0);
    requestRecords.splice(0);
    setCookieResponses.splice(0);
    await clearCitationInstrumentation(page);
    const persistenceBefore = await getBrowserPersistenceSnapshot(page);
    const conversationContent = [
      PROMPT,
      "Pertanyaan lanjutan 1",
      "Pertanyaan lanjutan 2",
      draft,
    ] as const;

    const citation = page
      .locator('[data-document-id="employee-benefits"]')
      .first();
    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      citation.click(),
    ]);
    await expectDocumentPage(popup, 12);
    await popup.waitForLoadState("networkidle");
    await Promise.all(instrumentationTasks);

    expectCitationRequestsSafe(requestRecords, conversationContent);
    expect(setCookieResponses).toEqual([]);
    expect(await getBrowserPersistenceSnapshot(page)).toEqual(
      persistenceBefore
    );
    expect(await getCitationWriteCalls(page)).toEqual([]);
    expect(await getCitationWriteCalls(popup)).toEqual([]);
    expect(await popup.evaluate(() => document.referrer)).toBe("");
    expect(await popup.evaluate(() => window.opener === null)).toBe(true);
    for (const record of requestRecords) {
      for (const content of conversationContent) {
        expect(record.cookie).not.toContain(content);
      }
    }

    await popup.close();
  });

  test("preserves Indonesian context across follow-up turns", async ({
    page,
  }) => {
    const requests = collectChatRequests(page);
    await page.goto("/");
    await page.getByTestId("landing-prompt-input").fill(PROMPT);
    await page.getByTestId("landing-send-button").click();
    await expect(page).toHaveURL(CHAT_URL_REGEX);

    await page
      .getByTestId("multimodal-input")
      .fill("Dokumen apa yang dibutuhkan?");
    await page.getByTestId("send-button").click();

    expect(
      await page
        .locator("[data-role]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-role"))
        )
    ).toEqual(["user", "assistant", "user", "assistant"]);
    await expect(page.getByText(PROMPT)).toBeVisible();
    await expect(page.getByText("Cantumkan tanggal cuti")).toBeVisible();
    await expect(page.getByTestId("attachments-button")).toHaveCount(0);
    await expect(page.getByTestId("model-selector")).toHaveCount(0);
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await page.getByTestId("multimodal-input").evaluate((element) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(
        new File(["image"], "pasted.png", { type: "image/png" })
      );
      element.dispatchEvent(
        new ClipboardEvent("paste", {
          bubbles: true,
          clipboardData: dataTransfer,
        })
      );
    });
    await page.waitForTimeout(100);
    expect(requests).toEqual([]);
  });

  test("provides a deterministic English follow-up conversation", async ({
    page,
  }) => {
    const requests = collectChatRequests(page);
    await page.goto("/");
    await page
      .getByTestId("landing-prompt-input")
      .fill("How do I submit annual leave?");
    await page.getByTestId("landing-send-button").click();
    await expect(page).toHaveURL(CHAT_URL_REGEX);

    await expect(
      page.getByText(
        "Submit annual leave through the employee portal, select the dates, and send it to your manager for approval."
      )
    ).toBeVisible();
    await page
      .getByTestId("multimodal-input")
      .fill("What information should I include?");
    await page.getByTestId("send-button").click();

    expect(
      await page
        .locator("[data-role]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-role"))
        )
    ).toEqual(["user", "assistant", "user", "assistant"]);
    await expect(
      page.getByText(
        "Include the leave dates and a short handover note for work that needs coverage."
      )
    ).toBeVisible();
    expect(requests).toEqual([]);
  });

  test("preserves writable non-mock answer voting", async ({ page }) => {
    const chatId = crypto.randomUUID();
    const voteRequests: { method: string; postData: string | null }[] = [];
    const createdAt = new Date().toISOString();
    await page.route("**/api/messages?*", (route) =>
      route.fulfill({
        body: JSON.stringify({
          isReadonly: false,
          messages: [
            {
              id: "user-fixture",
              metadata: { createdAt },
              parts: [{ text: PROMPT, type: "text" }],
              role: "user",
            },
            {
              id: "assistant-fixture",
              metadata: { createdAt },
              parts: [{ text: "Jawaban fixture non-mock.", type: "text" }],
              role: "assistant",
            },
          ],
          userId: "employee-fixture",
          visibility: "private",
        }),
        contentType: "application/json",
        status: 200,
      })
    );
    await page.route("**/api/vote**", (route) => {
      voteRequests.push({
        method: route.request().method(),
        postData: route.request().postData(),
      });
      return route.fulfill({
        body: route.request().method() === "GET" ? "[]" : "{}",
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto(`/chat/${chatId}`);
    const assistant = page.getByTestId("message-assistant");
    await expect(assistant).toContainText("Jawaban fixture non-mock.");
    await expect(
      assistant.getByRole("group", { name: FEEDBACK_GROUP_NAME })
    ).toHaveCount(0);
    await assistant.hover();
    await assistant.getByTestId("message-upvote").click();

    await expect
      .poll(
        () => voteRequests.filter(({ method }) => method === "PATCH").length
      )
      .toBe(1);
    expect(
      JSON.parse(
        voteRequests.find(({ method }) => method === "PATCH")?.postData ?? "{}"
      )
    ).toEqual({ chatId, messageId: "assistant-fixture", type: "up" });
  });

  test("supports anonymous answer feedback per completed answer", async ({
    page,
  }) => {
    await page.goto("/");
    await startMockConversation(page);

    const groups = page.getByRole("group", { name: FEEDBACK_GROUP_NAME });
    await expect(groups).toHaveCount(1);
    await expect(
      page
        .getByTestId("message-user")
        .getByRole("group", { name: FEEDBACK_GROUP_NAME })
    ).toHaveCount(0);

    const firstGroup = groups.first();
    await expect(firstGroup.getByRole("button")).toHaveCount(2);
    const helpful = firstGroup.getByRole("button", { name: HELPFUL_NAME });
    const notHelpful = firstGroup.getByRole("button", {
      name: NOT_HELPFUL_NAME,
    });
    await expect(
      firstGroup.getByText("Apakah jawaban ini membantu?")
    ).toBeVisible();
    await expect(helpful).toHaveAttribute("aria-pressed", "false");
    await expect(helpful).toHaveAttribute("data-state", "off");
    await expect(notHelpful).toHaveAttribute("aria-pressed", "false");
    await expect(notHelpful).toHaveAttribute("data-state", "off");
    const unselectedStyles = await helpful.evaluate((element) => {
      const styles = getComputedStyle(element);
      return { background: styles.backgroundColor, border: styles.borderColor };
    });

    await helpful.focus();
    await page.keyboard.press("Space");
    await expect(helpful).toHaveAttribute("aria-pressed", "true");
    await expect(helpful).toHaveAttribute("data-state", "on");
    await expect(firstGroup).toContainText(
      "Terima kasih. Masukan diterima untuk sesi ini."
    );
    const helpfulStyles = await helpful.evaluate((element) => {
      const styles = getComputedStyle(element);
      return { background: styles.backgroundColor, border: styles.borderColor };
    });
    expect(helpfulStyles).not.toEqual(unselectedStyles);

    await notHelpful.focus();
    await page.keyboard.press("Enter");
    await expect(helpful).toHaveAttribute("aria-pressed", "false");
    await expect(helpful).toHaveAttribute("data-state", "off");
    await expect(notHelpful).toHaveAttribute("aria-pressed", "true");
    await expect(notHelpful).toHaveAttribute("data-state", "on");
    await expect(helpful).toHaveCSS(
      "background-color",
      unselectedStyles.background
    );
    await expect(helpful).toHaveCSS("border-color", unselectedStyles.border);
    const switchedStyles = await notHelpful.evaluate((element) => {
      const styles = getComputedStyle(element);
      return { background: styles.backgroundColor, border: styles.borderColor };
    });
    expect(switchedStyles).not.toEqual(unselectedStyles);

    await page.getByTestId("multimodal-input").fill("Dokumen pendukungnya?");
    await page.getByTestId("send-button").click();
    await expect(groups).toHaveCount(2);
    const secondGroup = groups.nth(1);
    await expect(
      secondGroup.getByRole("button", { name: HELPFUL_NAME })
    ).toHaveAttribute("aria-pressed", "false");
    await expect(
      secondGroup.getByRole("button", { name: NOT_HELPFUL_NAME })
    ).toHaveAttribute("aria-pressed", "false");
    await expect(notHelpful).toHaveAttribute("aria-pressed", "true");
  });

  test("keeps fail-once anonymous answer feedback independent", async ({
    page,
  }) => {
    await page.goto("/?mock-feedback=fail-once");
    await startMockConversation(page);
    await page.getByTestId("multimodal-input").fill("Dokumen pendukungnya?");
    await page.getByTestId("send-button").click();

    const groups = page.getByRole("group", { name: FEEDBACK_GROUP_NAME });
    await expect(groups).toHaveCount(2);
    await submitFailOnceFeedback(groups, page.getByTestId("multimodal-input"));
  });

  test("keeps anonymous answer feedback private without browser writes", async ({
    page,
  }) => {
    const requests = collectAllRequests(page);
    await installBrowserWriteSpies(page);
    await page.goto("/");
    await startMockConversation(page);

    const group = page.getByRole("group", { name: FEEDBACK_GROUP_NAME });
    await expect(group).toHaveCount(1);
    await page.waitForLoadState("networkidle");
    requests.splice(0);
    await clearBrowserWriteCalls(page);
    const persistenceBefore = await getBrowserPersistenceSnapshot(page);
    const controlsBefore = await getGlobalControlSnapshot(page);
    expect(controlsBefore).toEqual({ dialogs: 0, forms: 1, textInputs: 1 });

    await group.getByRole("button", { name: HELPFUL_NAME }).click();
    await expect(group).toContainText(/tersimpan|terima kasih/i);

    expect(requests).toEqual([]);
    expect(await getBrowserWriteCalls(page)).toEqual([]);
    expect(await getBrowserPersistenceSnapshot(page)).toEqual(
      persistenceBefore
    );
    expect(await getGlobalControlSnapshot(page)).toEqual(controlsBefore);
  });

  test("resets fail-once anonymous answer feedback after returning home", async ({
    page,
  }) => {
    await page.goto("/?mock-feedback=fail-once");
    await startMockConversation(page);
    let group = page.getByRole("group", { name: FEEDBACK_GROUP_NAME });
    let helpful = group.getByRole("button", { name: HELPFUL_NAME });
    await helpful.click();
    await expect(group).toContainText(/belum tersimpan|gagal|coba lagi/i);
    await expect(helpful).toHaveAttribute("aria-pressed", "false");

    await page.goBack();
    await expect(page).toHaveURL(/\/?\?mock-feedback=fail-once$/);
    await startMockConversation(page);

    group = page.getByRole("group", { name: FEEDBACK_GROUP_NAME });
    helpful = group.getByRole("button", { name: HELPFUL_NAME });
    await expect(helpful).toHaveAttribute("aria-pressed", "false");
    await helpful.click();
    await expect(group).toContainText(/belum tersimpan|gagal|coba lagi/i);
    await expect(helpful).toHaveAttribute("aria-pressed", "false");
  });

  test("keeps mobile anonymous answer feedback usable and selected", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/");
    await startMockConversation(page);

    const group = page.getByRole("group", { name: FEEDBACK_GROUP_NAME });
    const helpful = group.getByRole("button", { name: HELPFUL_NAME });
    const notHelpful = group.getByRole("button", { name: NOT_HELPFUL_NAME });
    await expect(helpful.locator("svg")).toBeVisible();
    await expect(notHelpful.locator("svg")).toBeVisible();
    await expect(helpful).toHaveCSS("border-top-width", "1px");
    await expect(notHelpful).toHaveCSS("border-top-width", "1px");
    const boxes = await Promise.all([
      helpful.boundingBox(),
      notHelpful.boundingBox(),
    ]);
    for (const box of boxes) {
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }

    await helpful.click();
    await expect(helpful).toHaveAttribute("data-state", "on");
    await expect(helpful).toHaveCSS("border-top-width", "2px");
    await expect(notHelpful).toHaveCSS("border-top-width", "1px");
    await notHelpful.click();
    await expect(notHelpful).toHaveAttribute("data-state", "on");
    await expect(notHelpful).toHaveCSS("border-top-width", "2px");
    await expect(helpful).toHaveAttribute("data-state", "off");
    await expect(helpful).toHaveCSS("border-top-width", "1px");
    await expect(page.getByText(PROMPT)).toBeVisible();
    await expect(notHelpful).toHaveAttribute("data-state", "on");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  test("prevents duplicate submissions while loading", async ({ page }) => {
    const requests = collectChatRequests(page);
    await page.goto("/?mock-conversation=loading");
    await page.getByTestId("landing-prompt-input").fill(PROMPT);
    await page.getByTestId("landing-send-button").click();
    await expect(page).toHaveURL(CHAT_URL_REGEX);

    await expect(page.getByRole("status")).toHaveAccessibleName(
      "BPPedia sedang menyiapkan jawaban"
    );
    await expect(page.getByTestId("message-user")).toHaveCount(1);
    await expect(page.getByTestId("message-assistant")).toHaveCount(0);
    await expect(page.getByTestId("message-assistant-loading")).toHaveCount(1);
    await expect(
      page.getByRole("group", { name: FEEDBACK_GROUP_NAME })
    ).toHaveCount(0);
    await expect(page.getByTestId("multimodal-input")).toBeDisabled();
    await expect(page.getByTestId("send-button")).toBeDisabled();
    await page.getByTestId("multimodal-input").press("Enter");
    await expect(page.getByTestId("message-user")).toHaveCount(1);
    expect(requests).toEqual([]);
  });

  test("retries a retryable inference error without duplicating the user turn", async ({
    page,
  }) => {
    const requests = collectChatRequests(page);
    await page.goto("/?mock-conversation=retryable-error");
    await page.getByTestId("landing-prompt-input").fill(PROMPT);
    await page.getByTestId("landing-send-button").click();
    await expect(page).toHaveURL(CHAT_URL_REGEX);
    const input = page.getByTestId("multimodal-input");

    const errorAlert = page
      .getByRole("alert")
      .filter({ hasText: "Jawaban belum dapat dibuat. Silakan coba lagi." });
    await expect(errorAlert).toBeVisible();
    await expect(input).toHaveValue(PROMPT);
    await expect(page.getByTestId("message-user")).toHaveCount(1);
    await expect(page.getByTestId("message-assistant")).toHaveCount(0);
    await expect(
      page.getByRole("group", { name: FEEDBACK_GROUP_NAME })
    ).toHaveCount(0);
    await input.press("Enter");

    await expect(page.getByTestId("message-user")).toHaveCount(1);
    await expect(page.getByTestId("message-assistant")).toHaveCount(1);
    await expect(
      page.getByRole("group", { name: FEEDBACK_GROUP_NAME })
    ).toHaveCount(1);
    await expect(input).toHaveValue("");
    await expect(errorAlert).toHaveCount(0);
    expect(requests).toEqual([]);
  });

  test("retries an edited failed prompt without adding a user turn", async ({
    page,
  }) => {
    await page.goto("/?mock-conversation=retryable-error");
    await page.getByTestId("landing-prompt-input").fill(PROMPT);
    await page.getByTestId("landing-send-button").click();
    const input = page.getByTestId("multimodal-input");
    await expect(input).toHaveValue(PROMPT);

    await input.fill("Pertanyaan diperbarui");
    await input.press("Enter");

    await expect(page.getByTestId("message-user")).toHaveCount(1);
    await expect(
      page.getByTestId("message-user").getByTestId("message-content")
    ).toHaveText("Pertanyaan diperbarui");
    await expect(page.getByTestId("message-assistant")).toHaveCount(1);
  });

  test("recovers from a disconnected mock conversation", async ({ page }) => {
    const requests = collectChatRequests(page);
    await page.goto("/?mock-conversation=disconnected");
    await page.getByTestId("landing-prompt-input").fill(PROMPT);
    await page.getByTestId("landing-send-button").click();
    await expect(page).toHaveURL(CHAT_URL_REGEX);
    const input = page.getByTestId("multimodal-input");

    await expect(
      page.getByRole("alert").filter({
        hasText: "Koneksi terputus. Periksa koneksi Anda lalu coba lagi.",
      })
    ).toBeVisible();
    await expect(input).toBeEnabled();
    await page.getByRole("button", { name: "Coba lagi" }).click();
    await expect(page.getByTestId("message-user")).toHaveCount(1);
    await expect(page.getByTestId("message-assistant")).toHaveCount(1);
    expect(requests).toEqual([]);
  });

  test("shows an honest no-answer state and allows reformulation", async ({
    page,
  }) => {
    const requests = collectChatRequests(page);
    await page.goto("/?mock-conversation=no-answer");
    await page
      .getByTestId("landing-prompt-input")
      .fill("Apakah ada tunjangan relokasi antarkota?");
    await page.getByTestId("landing-send-button").click();
    await expect(page).toHaveURL(CHAT_URL_REGEX);

    await expect(
      page.getByRole("heading", { name: "Jawaban andal tidak ditemukan" })
    ).toBeVisible();
    await expect(page.getByText(/tidak akan menebak/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Kebijakan Benefit/ })
    ).toHaveAttribute("href", "/documents/employee-benefits");
    await expect(
      page.getByRole("link", { name: /Panduan Mobilitas/ })
    ).toHaveAttribute("href", "/documents/employee-mobility");
    await expect(page.getByTestId("message-user")).toHaveCount(1);
    await expect(page.getByTestId("message-assistant")).toHaveCount(1);
    await expect(page.getByTestId("message-assistant-loading")).toHaveCount(0);
    await expect(
      page.getByRole("group", { name: FEEDBACK_GROUP_NAME })
    ).toHaveCount(1);
    await expect(
      page.getByRole("region", { name: "Sumber jawaban" })
    ).toHaveCount(0);

    const originalUrl = page.url();
    const [documentPage] = await Promise.all([
      page.waitForEvent("popup"),
      page.getByRole("link", { name: /Kebijakan Benefit/ }).click(),
    ]);
    await expect(documentPage).toHaveURL(/\/documents\/employee-benefits$/);
    await expect(
      documentPage.getByRole("heading", { name: "Kebijakan Benefit Karyawan" })
    ).toBeVisible();
    await expect(page).toHaveURL(originalUrl);

    const input = page.getByTestId("multimodal-input");
    await expect(input).toBeEnabled();
    await input.fill("Benefit apa saja yang tersedia?");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("message-user")).toHaveCount(2);
    await expect(page.getByTestId("message-assistant")).toHaveCount(2);
    await expect(
      page.getByRole("heading", { name: "Jawaban andal tidak ditemukan" })
    ).toHaveCount(1);
    expect(
      await page
        .locator("[data-role]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-role"))
        )
    ).toEqual(["user", "assistant", "user", "assistant"]);
    expect(requests).toEqual([]);
  });

  test("restores a direct PDF page URL through reload", async ({
    page,
    request,
  }) => {
    const pdf = await request.get(
      "/documents/files/employee-benefits-v2026-1.pdf"
    );
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");

    await page.goto("/documents/employee-benefits?page=7");
    await expect(
      page.getByRole("heading", { name: "Kebijakan Benefit Karyawan" })
    ).toBeVisible();
    await expect(page.getByText("Versi 2026.1")).toBeVisible();
    await expectDocumentPage(page, 7);
    await page.reload();
    await expectDocumentPage(page, 7);
    await expect(
      page.getByRole("link", { name: "Ke beranda BPPedia" })
    ).toHaveAttribute("href", "/");
  });

  test("canonicalizes representative invalid PDF page URLs", async ({
    page,
  }) => {
    const cases = [
      ["page=2&page=3", 1],
      ["page=%202", 1],
      ["page=2.5", 1],
      ["page=2e1", 1],
      ["page=9007199254740992", 1],
      ["page=99", 12],
    ] as const;

    const assertCase = async (index = 0): Promise<void> => {
      const currentCase = cases[index];
      if (!currentCase) {
        return;
      }
      const [query, expectedPage] = currentCase;
      await page.goto(`/documents/employee-benefits?${query}#stale`);
      await expectDocumentPage(page, expectedPage);
      await assertCase(index + 1);
    };

    await assertCase();
  });

  test("keeps controls, popstate, and history URL-driven", async ({ page }) => {
    await page.goto("/ping");
    await page.goto("/documents/employee-benefits?page=1");
    await expectDocumentPage(page, 1);

    const previous = page.getByRole("button", { name: "Halaman sebelumnya" });
    const next = page.getByRole("button", { name: "Halaman berikutnya" });
    const pageInput = page.getByLabel("Buka halaman");
    await expect(previous).toBeDisabled();
    await next.click();
    await expectDocumentPage(page, 2);
    await previous.click();
    await expectDocumentPage(page, 1);

    await pageInput.fill("01");
    await pageInput.press("Enter");
    await expectDocumentPage(page, 1);
    await pageInput.fill("invalid");
    await pageInput.press("Enter");
    await expectDocumentPage(page, 1);

    await pageInput.fill("12");
    await pageInput.press("Enter");
    await expectDocumentPage(page, 12);
    await expect(next).toBeDisabled();
    await pageInput.fill("99");
    await pageInput.press("Enter");
    await expectDocumentPage(page, 12);

    await page.goBack();
    await expect(page).toHaveURL(/\/ping$/);

    await page.goto("/documents/employee-benefits?page=4");
    await expectDocumentPage(page, 4);
    await page.goto("/documents/employee-benefits?page=6");
    await expectDocumentPage(page, 6);
    await page.goBack();
    await expectDocumentPage(page, 4);
  });

  test("keeps the production demo PDF viewer under its base path", async ({
    browser,
    request,
  }) => {
    test.skip(!DEMO_ORIGIN, "Requires a started IS_DEMO=1 production build");
    if (!DEMO_ORIGIN) {
      return;
    }

    const context = await browser.newContext({ baseURL: DEMO_ORIGIN });
    const page = await context.newPage();
    const response = await page.goto(
      "/demo/documents/employee-benefits?page=7"
    );
    expect(response?.status()).toBe(200);
    expect(await response?.text()).toContain(
      '<p aria-live="polite" role="status">Memuat dokumen…</p>'
    );
    await expectDocumentPage(page, 7, 12, "/demo/documents/employee-benefits");

    const scripts = await page
      .locator("script[src]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("src") ?? "")
      );
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.every((src) => src.startsWith("/demo-assets/"))).toBe(true);
    const asset = await request.get(`${DEMO_ORIGIN}${scripts[0]}`);
    expect(asset.status()).toBe(200);

    const pdfData = await page
      .locator('object[type="application/pdf"]')
      .getAttribute("data");
    expect(pdfData).toMatch(
      /^\/demo\/documents\/files\/employee-benefits-v2026-1\.pdf#page=7&/
    );
    const pdf = await request.get(
      `${DEMO_ORIGIN}/demo/documents/files/employee-benefits-v2026-1.pdf`
    );
    expect(pdf.status()).toBe(200);
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");

    await page.getByRole("button", { name: "Halaman berikutnya" }).click();
    await expectDocumentPage(page, 8, 12, "/demo/documents/employee-benefits");
    await context.close();
  });

  test("keeps the mock PDF viewer usable on mobile", async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/documents/employee-mobility");
    await expect(page.getByRole("status")).toHaveText("Halaman 1 dari 8");
    const pageInput = page.getByLabel("Buka halaman");
    await pageInput.fill("8");
    await pageInput.press("Enter");
    await expect(page.getByRole("status")).toHaveText("Halaman 8 dari 8");
    await expect(page.locator('object[type="application/pdf"]')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  test("opens canonical mock document viewers", async ({ page }) => {
    const requests = collectChatRequests(page);
    await page.goto("/documents/employee-benefits");
    await expect(
      page.getByRole("heading", { name: "Kebijakan Benefit Karyawan" })
    ).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("Halaman 1 dari 12");

    await page.goto("/documents/employee-mobility");
    await expect(
      page.getByRole("heading", { name: "Panduan Mobilitas Karyawan" })
    ).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("Halaman 1 dari 8");

    const response = await page.goto("/documents/not-a-document");
    expect(response?.status()).toBe(404);
    expect(requests).toEqual([]);
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
    await expect(
      page.getByTestId("message-user").getByTestId("message-content")
    ).toHaveText(prompt ?? "");
    await expect(page.getByTestId("message-assistant")).toHaveCount(1);
    await expect(page.getByTestId("message-assistant-loading")).toHaveCount(0);
    expect(
      await page
        .locator("[data-role]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-role"))
        )
    ).toEqual(["user", "assistant"]);
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

  test("keeps the composer usable as the conversation grows", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 500, width: 390 });
    await page.goto("/");
    await page.getByTestId("landing-prompt-input").fill(PROMPT);
    await page.getByTestId("landing-send-button").click();
    await expect(page).toHaveURL(CHAT_URL_REGEX);

    const input = page.getByTestId("multimodal-input");
    await submitFollowUps(page, 5);

    await expect(input).toBeVisible();
    expect(
      await page
        .getByTestId("messages-container")
        .evaluate((element) => element.scrollHeight > element.clientHeight)
    ).toBe(true);

    await input.fill("Pertanyaan terakhir");
    await expect(page.getByTestId("send-button")).toBeEnabled();
    await input.press("Enter");
    await expect(page.getByTestId("message-assistant")).toHaveCount(7);
    expect(
      (
        await page
          .locator("[data-role]")
          .evaluateAll((nodes) =>
            nodes.map((node) => node.getAttribute("data-role"))
          )
      ).slice(-2)
    ).toEqual(["user", "assistant"]);
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
