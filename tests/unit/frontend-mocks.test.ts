import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  type AdminLoginCredentials,
  beginMockChatHandoff,
  changeFailedMockChatPrompt,
  completeMockChatHandoff,
  failMockChatHandoff,
  getChatLandingMock,
  type MockChatHandoffState,
  mockAdminLogin,
} from "@/lib/mocks";

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
