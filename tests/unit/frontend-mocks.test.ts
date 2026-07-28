import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import {
  type AdminLoginCredentials,
  applyMockAnswerFeedback,
  beginMockChatHandoff,
  changeFailedMockChatPrompt,
  completeMockChatHandoff,
  failMockChatHandoff,
  getChatLandingMock,
  getMockAnswerFeedbackOutcome,
  getMockAnswerFeedbackScenario,
  getMockConversationOutcome,
  getMockConversationReply,
  getMockConversationScenario,
  type MockAnswerFeedbackEntry,
  type MockAnswerFeedbackValue,
  type MockChatHandoffState,
  mockAdminLogin,
} from "@/lib/mocks";
import {
  getMockDocumentOverview,
  normalizeMockDocumentPage,
} from "@/lib/mocks/documents";
import {
  type EmployeeJourneySnapshot,
  parseEmployeeJourneySnapshot,
} from "@/lib/mocks/employee-journey";

const FIRST_CHAT_ID = "00000000-0000-4000-8000-000000000001";
const SECOND_CHAT_ID = "00000000-0000-4000-8000-000000000002";
const ADMIN_CREDENTIALS: AdminLoginCredentials = {
  identifier: "admin@bppedia.local",
  password: "mock-password",
};

function createChatIdSequence() {
  const ids = [FIRST_CHAT_ID, SECOND_CHAT_ID];
  return () => ids.shift() ?? SECOND_CHAT_ID;
}

describe("frontend mock boundary", () => {
  test("selects deterministic employee chat states", () => {
    const success = getChatLandingMock("success");
    const loading = getChatLandingMock("loading");
    const empty = getChatLandingMock("empty");
    const failure = getChatLandingMock("failure");

    assert.deepEqual(success, getChatLandingMock("success"));
    assert.deepEqual(loading, { status: "loading" });
    assert.deepEqual(empty, getChatLandingMock("empty"));
    assert.deepEqual(failure, {
      error: {
        code: "unavailable",
        message: "BPPedia belum dapat memuat saran pertanyaan.",
      },
      status: "error",
    });

    if (success.status !== "success" || empty.status !== "empty") {
      throw new Error("Expected populated and empty chat fixtures");
    }

    assert.ok(success.data.suggestedQuestions.length > 0);
    assert.deepEqual(empty.data.suggestedQuestions, []);
  });

  test("returns deterministic bilingual employee conversation replies", () => {
    const indonesian = getMockConversationReply(
      "Bagaimana cara mengajukan cuti tahunan?",
      0
    );
    const english = getMockConversationReply(
      "How do I submit annual leave?",
      0
    );
    const followUp = getMockConversationReply(
      "Bagaimana cara mengajukan cuti tahunan?",
      1
    );

    assert.equal(indonesian.language, "id");
    assert.match(indonesian.text, /cuti/i);
    assert.equal(english.language, "en");
    assert.match(english.text, /leave/i);
    assert.notEqual(followUp.text, indonesian.text);
    assert.deepEqual(
      getMockConversationReply("How do I submit annual leave?", 0),
      english
    );
  });

  test("returns active citations with exact canonical document metadata", () => {
    const reply = getMockConversationReply(
      "Bagaimana cara mengajukan cuti tahunan?",
      0
    );

    assert.equal(reply.citations.length, 2);
    for (const citation of reply.citations) {
      const document = getMockDocumentOverview(citation.documentId);
      assert.ok(document);
      assert.equal(citation.isActive, true);
      assert.ok(Number.isSafeInteger(document.pageCount));
      assert.ok(document.pageCount > 0);
      assert.ok(Number.isSafeInteger(citation.page));
      assert.ok(citation.page > 0 && citation.page <= document.pageCount);
      assert.equal(citation.title, document.title);
      assert.equal(citation.versionId, document.versionId);
      assert.equal(citation.versionLabel, document.versionLabel);

      assert.ok(citation.href.startsWith("/"));
      assert.ok(!citation.href.startsWith("//"));
      const url = new URL(citation.href, "http://bppedia.local");
      assert.equal(url.origin, "http://bppedia.local");
      assert.equal(url.pathname, `/documents/${document.slug}`);
      assert.equal(url.hash, "");
      assert.deepEqual([...url.searchParams.keys()], ["page"]);
      assert.deepEqual(url.searchParams.getAll("page"), [
        String(citation.page),
      ]);
      assert.equal(url.search, `?page=${citation.page}`);
      assert.equal(
        citation.href,
        `/documents/${document.slug}?page=${citation.page}`
      );
    }
    assert.doesNotMatch(
      reply.citations.map((citation) => citation.title).join(" "),
      /arsip|inactive/i
    );

    reply.citations[0].title = "Changed by caller";
    assert.notEqual(
      getMockConversationReply("Bagaimana cara mengajukan cuti tahunan?", 0)
        .citations[0].title,
      reply.citations[0].title
    );
  });

  test("round-trips a validated employee citation journey snapshot", () => {
    const snapshot: EmployeeJourneySnapshot = {
      chatId: FIRST_CHAT_ID,
      draft: "What documents should I prepare?",
      feedback: {
        "assistant-1": { selection: "helpful", status: "saved" },
      },
      focus: "composer",
      messages: [
        {
          id: "assistant-1",
          metadata: { createdAt: "2026-07-28T00:00:00.000Z" },
          parts: [{ text: "Annual leave guidance", type: "text" }],
          role: "assistant",
        },
      ],
      pendingTurn: null,
      returnHref: `/chat/${FIRST_CHAT_ID}`,
      savedAt: Date.now(),
      scenario: "success",
      scroll: { atEnd: false, top: 123 },
      status: "ready",
      version: 1,
    };

    assert.deepEqual(
      parseEmployeeJourneySnapshot(JSON.stringify(snapshot)),
      snapshot
    );
  });

  test("rejects malformed, mismatched, and stale employee journey snapshots", () => {
    assert.equal(parseEmployeeJourneySnapshot("not-json"), null);
    assert.equal(
      parseEmployeeJourneySnapshot(JSON.stringify({ version: 1 })),
      null
    );

    const stale = {
      chatId: FIRST_CHAT_ID,
      draft: "",
      feedback: {},
      focus: "composer",
      messages: [],
      pendingTurn: null,
      returnHref: `/chat/${SECOND_CHAT_ID}`,
      savedAt: 0,
      scenario: "success",
      scroll: { atEnd: true, top: 0 },
      status: "ready",
      version: 1,
    };
    assert.equal(parseEmployeeJourneySnapshot(JSON.stringify(stale)), null);
  });

  test("strictly normalizes mock document page tokens", () => {
    const pageCount = 12;
    const cases: readonly [readonly string[], number][] = [
      [[], 1],
      [[""], 1],
      [["2", "3"], 1],
      [[" 2"], 1],
      [["2 "], 1],
      [["page"], 1],
      [["2.5"], 1],
      [["2e1"], 1],
      [["9007199254740992"], 1],
      [["0"], 1],
      [["-1"], 1],
      [["02"], 2],
      [["7"], 7],
      [["13"], 12],
    ];

    for (const [values, expected] of cases) {
      assert.equal(normalizeMockDocumentPage(values, pageCount), expected);
    }
    for (const invalidPageCount of [
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      assert.throws(
        () => normalizeMockDocumentPage(["1"], invalidPageCount),
        /pageCount/
      );
    }
  });

  test("normalizes turn indexes and isolates conversation replies", () => {
    const first = getMockConversationReply(
      "Bagaimana cara mengajukan cuti tahunan?",
      0
    );
    const negative = getMockConversationReply(
      "Bagaimana cara mengajukan cuti tahunan?",
      -1
    );
    const fallback = getMockConversationReply(
      "Bagaimana cara mengajukan cuti tahunan?",
      99
    );

    assert.deepEqual(negative, first);
    assert.deepEqual(
      fallback,
      getMockConversationReply("Bagaimana cara mengajukan cuti tahunan?", 100)
    );

    first.text = "Changed by caller";
    assert.notEqual(
      getMockConversationReply("Bagaimana cara mengajukan cuti tahunan?", 0)
        .text,
      first.text
    );
  });

  test("selects validated employee conversation scenarios", () => {
    assert.equal(getMockConversationScenario(null), "success");
    assert.equal(getMockConversationScenario("unknown"), "success");
    assert.equal(getMockConversationScenario("loading"), "loading");
    assert.equal(
      getMockConversationScenario("retryable-error"),
      "retryable-error"
    );
    assert.equal(getMockConversationScenario("disconnected"), "disconnected");
    assert.equal(getMockConversationScenario("no-answer"), "no-answer");
  });

  test("returns deterministic loading and retry outcomes", () => {
    const prompt = "Bagaimana cara mengajukan cuti tahunan?";

    assert.deepEqual(getMockConversationOutcome(prompt, 1, "loading", 0), {
      status: "loading",
    });
    assert.deepEqual(
      getMockConversationOutcome(prompt, 1, "retryable-error", 0),
      {
        message: "Jawaban belum dapat dibuat. Silakan coba lagi.",
        status: "error",
      }
    );
    assert.deepEqual(getMockConversationOutcome(prompt, 1, "disconnected", 0), {
      message: "Koneksi terputus. Periksa koneksi Anda lalu coba lagi.",
      status: "error",
    });
    assert.deepEqual(
      getMockConversationOutcome(prompt, 1, "retryable-error", 1),
      {
        reply: getMockConversationReply(prompt, 1),
        status: "success",
      }
    );
    assert.deepEqual(getMockConversationOutcome(prompt, 1, "disconnected", 1), {
      reply: getMockConversationReply(prompt, 1),
      status: "success",
    });
  });

  test("returns an honest no-answer outcome before reformulation", () => {
    const prompt = "Apakah ada tunjangan relokasi antarkota?";
    const outcome = getMockConversationOutcome(prompt, 0, "no-answer", 0);

    assert.equal(outcome.status, "no-answer");
    if (outcome.status !== "no-answer") {
      throw new Error("Expected no-answer outcome");
    }
    assert.equal(outcome.data.title, "Jawaban andal tidak ditemukan");
    assert.match(outcome.data.message, /tidak akan menebak/i);
    assert.equal(outcome.data.relevantDocuments.length, 2);
    for (const document of outcome.data.relevantDocuments) {
      assert.match(document.href, /^\/documents\//);
      assert.doesNotMatch(document.href, /\/api\/|\.pdf|#/);
    }
    assert.deepEqual(getMockConversationOutcome(prompt, 1, "no-answer", 0), {
      reply: getMockConversationReply(prompt, 1),
      status: "success",
    });

    outcome.data.title = "Changed by caller";
    const fresh = getMockConversationOutcome(prompt, 0, "no-answer", 0);
    assert.equal(fresh.status, "no-answer");
    if (fresh.status === "no-answer") {
      assert.equal(fresh.data.title, "Jawaban andal tidak ditemukan");
    }
  });

  test("selects deterministic mock answer feedback scenarios and outcomes", () => {
    assert.equal(getMockAnswerFeedbackScenario(null), "success");
    assert.equal(getMockAnswerFeedbackScenario("unknown"), "success");
    assert.equal(getMockAnswerFeedbackScenario("fail-once"), "fail-once");
    assert.deepEqual(getMockAnswerFeedbackOutcome("fail-once", 0), {
      status: "error",
    });
    assert.deepEqual(getMockAnswerFeedbackOutcome("fail-once", 1), {
      status: "success",
    });
    assert.deepEqual(getMockAnswerFeedbackOutcome("success", 0), {
      status: "success",
    });
  });

  test("stores only anonymous feedback selection and status per message", () => {
    const helpful: MockAnswerFeedbackValue = "helpful";
    const notHelpful: MockAnswerFeedbackValue = "not-helpful";
    const firstFailure = applyMockAnswerFeedback({}, "assistant-1", helpful, {
      status: "error",
    });
    const firstSaved = applyMockAnswerFeedback(
      firstFailure,
      "assistant-1",
      helpful,
      { status: "success" }
    );
    const firstChanged = applyMockAnswerFeedback(
      firstSaved,
      "assistant-1",
      notHelpful,
      { status: "success" }
    );
    const independent = applyMockAnswerFeedback(
      firstChanged,
      "assistant-2",
      helpful,
      { status: "success" }
    );
    const expected: Record<string, MockAnswerFeedbackEntry> = {
      "assistant-1": { selection: notHelpful, status: "saved" },
      "assistant-2": { selection: helpful, status: "saved" },
    };

    assert.deepEqual(firstFailure, {
      "assistant-1": { selection: null, status: "error" },
    });
    assert.deepEqual(firstSaved, {
      "assistant-1": { selection: helpful, status: "saved" },
    });
    assert.deepEqual(firstChanged, {
      "assistant-1": { selection: notHelpful, status: "saved" },
    });
    assert.deepEqual(independent, expected);
    assert.deepEqual(Object.keys(independent["assistant-1"]).sort(), [
      "selection",
      "status",
    ]);
  });

  test("keeps mock answer feedback hook inside its anonymous source boundary", () => {
    const source = readFileSync(
      join(process.cwd(), "hooks", "use-mock-answer-feedback.ts"),
      "utf8"
    );

    assert.doesNotMatch(
      source,
      /ChatMessage|auth|lib(?:\/|-)db|swr|\bfetch\b|\bstorage\b|localStorage|sessionStorage|indexedDB|CacheStorage|\bcaches\b|use server|Server Actions?|api(?:\/|-)vote/i
    );
  });

  test("keeps anonymous feedback isolated from authenticated message actions", () => {
    const messageSource = readFileSync(
      join(process.cwd(), "components", "chat", "message.tsx"),
      "utf8"
    );
    const anonymousFeedbackSource = readFileSync(
      join(
        process.cwd(),
        "components",
        "chat",
        "anonymous-answer-feedback.tsx"
      ),
      "utf8"
    );

    assert.match(messageSource, /import \{ MessageActions \}/);
    assert.match(messageSource, /<MessageActions/);
    assert.match(messageSource, /<AnonymousAnswerFeedback/);
    assert.doesNotMatch(
      anonymousFeedbackSource,
      /api(?:\/|-)vote|\bfetch\b|swr|localStorage|sessionStorage|indexedDB|CacheStorage|\bcaches\b/i
    );
  });

  test("keeps one chat ID through failure and retry", () => {
    const createChatId = createChatIdSequence();
    const idle: MockChatHandoffState = { status: "idle" };
    const submitting = beginMockChatHandoff(
      idle,
      "  Bagaimana cara mengajukan cuti?  ",
      createChatId
    );
    const duplicate = beginMockChatHandoff(
      submitting,
      "Bagaimana cara mengajukan cuti?",
      createChatId
    );
    const failed = failMockChatHandoff(
      submitting,
      "Percakapan belum dapat dibuka."
    );
    const retrying = beginMockChatHandoff(
      failed,
      "Bagaimana cara mengajukan cuti?",
      createChatId
    );
    const succeeded = completeMockChatHandoff(retrying);

    assert.deepEqual(submitting, {
      chatId: FIRST_CHAT_ID,
      prompt: "Bagaimana cara mengajukan cuti?",
      status: "submitting",
    });
    assert.strictEqual(duplicate, submitting);
    assert.deepEqual(failed, {
      chatId: FIRST_CHAT_ID,
      error: "Percakapan belum dapat dibuka.",
      prompt: "Bagaimana cara mengajukan cuti?",
      status: "failed",
    });
    assert.deepEqual(retrying, {
      chatId: FIRST_CHAT_ID,
      prompt: "Bagaimana cara mengajukan cuti?",
      status: "submitting",
    });
    assert.deepEqual(succeeded, {
      chatId: FIRST_CHAT_ID,
      prompt: "Bagaimana cara mengajukan cuti?",
      status: "succeeded",
    });
  });

  test("creates a new chat only after a failed prompt is edited", () => {
    const createChatId = createChatIdSequence();
    const firstAttempt = beginMockChatHandoff(
      { status: "idle" },
      "Pertanyaan pertama",
      createChatId
    );
    const failed = failMockChatHandoff(firstAttempt, "Gagal");
    const reset = changeFailedMockChatPrompt(failed, "Pertanyaan kedua");
    const secondAttempt = beginMockChatHandoff(
      reset,
      "Pertanyaan kedua",
      createChatId
    );

    assert.deepEqual(reset, { status: "idle" });
    assert.deepEqual(secondAttempt, {
      chatId: SECOND_CHAT_ID,
      prompt: "Pertanyaan kedua",
      status: "submitting",
    });
  });

  test("rejects blank mock handoffs", () => {
    const idle: MockChatHandoffState = { status: "idle" };
    assert.strictEqual(
      beginMockChatHandoff(idle, "   ", createChatIdSequence()),
      idle
    );
  });

  test("isolates successful chat fixtures from caller mutation", () => {
    const success = getChatLandingMock("success");

    if (success.status !== "success") {
      throw new Error("Expected populated chat fixture");
    }

    success.data.title = "Changed by caller";
    const freshSuccess = getChatLandingMock("success");

    if (freshSuccess.status !== "success") {
      throw new Error("Expected fresh populated chat fixture");
    }

    assert.equal(freshSuccess.data.title, "Tanyakan kebijakan perusahaan");
  });

  test("serves canonical mock PDF metadata and assets", () => {
    const benefits = getMockDocumentOverview("employee-benefits");
    const mobility = getMockDocumentOverview("employee-mobility");
    assert.ok(benefits);
    assert.ok(mobility);
    assert.equal(benefits.pageCount, 12);
    assert.equal(mobility.pageCount, 8);
    assert.equal(benefits.versionLabel, "2026.1");
    assert.equal(mobility.versionLabel, "2026.1");
    assert.notEqual(benefits.pdfHref, mobility.pdfHref);

    for (const document of [benefits, mobility]) {
      assert.match(document.pdfHref, /^\/documents\/files\/[^?#]+\.pdf$/);
      const assetPath = join(process.cwd(), "public", document.pdfHref);
      assert.equal(existsSync(assetPath), true);
      const pdf = readFileSync(assetPath);
      assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
      assert.deepEqual(pdf.toString("latin1").match(/D:\d{14}\+00'00'/g), [
        "D:20260101000000+00'00'",
        "D:20260101000000+00'00'",
      ]);
    }

    benefits.title = "Changed by caller";
    assert.notEqual(
      getMockDocumentOverview("employee-benefits")?.title,
      benefits.title
    );
  });

  test("selects deterministic admin authentication states", () => {
    const success = mockAdminLogin(ADMIN_CREDENTIALS, "success");
    const loading = mockAdminLogin(ADMIN_CREDENTIALS, "loading");
    const invalidCredentials = mockAdminLogin(
      ADMIN_CREDENTIALS,
      "invalid-credentials"
    );
    const failure = mockAdminLogin(ADMIN_CREDENTIALS, "failure");

    assert.deepEqual(success, mockAdminLogin(ADMIN_CREDENTIALS, "success"));
    assert.deepEqual(loading, { status: "loading" });
    assert.deepEqual(
      invalidCredentials,
      mockAdminLogin(ADMIN_CREDENTIALS, "invalid-credentials")
    );
    assert.deepEqual(failure, mockAdminLogin(ADMIN_CREDENTIALS, "failure"));
    assert.deepEqual(success, {
      data: {
        admin: {
          displayName: "Admin BPPedia",
          id: "admin-local",
          identifier: "admin@bppedia.local",
        },
      },
      status: "success",
    });
    assert.deepEqual(invalidCredentials, {
      error: {
        code: "invalid_credentials",
        message: "Email atau kata sandi tidak valid.",
      },
      status: "error",
    });
    assert.deepEqual(failure, {
      error: {
        code: "unavailable",
        message: "Login admin belum dapat diproses.",
      },
      status: "error",
    });
  });

  test("isolates admin authentication fixtures from caller mutation", () => {
    const invalidCredentials = mockAdminLogin(
      ADMIN_CREDENTIALS,
      "invalid-credentials"
    );

    if (invalidCredentials.status !== "error") {
      throw new Error("Expected invalid credentials fixture");
    }

    invalidCredentials.error.message = "Changed by caller";
    const freshInvalidCredentials = mockAdminLogin(
      ADMIN_CREDENTIALS,
      "invalid-credentials"
    );

    if (freshInvalidCredentials.status !== "error") {
      throw new Error("Expected fresh invalid credentials fixture");
    }

    assert.equal(
      freshInvalidCredentials.error.message,
      "Email atau kata sandi tidak valid."
    );
  });
});
