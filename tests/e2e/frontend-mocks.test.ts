import { expect, test } from "@playwright/test";
import {
  type AdminLoginCredentials,
  getChatLandingMock,
  mockAdminLogin,
} from "@/lib/mocks";

const ADMIN_CREDENTIALS: AdminLoginCredentials = {
  identifier: "admin@bppedia.local",
  password: "mock-password",
};

test.describe("frontend mock boundary", () => {
  test("selects deterministic employee chat states", () => {
    const success = getChatLandingMock("success");
    const loading = getChatLandingMock("loading");
    const empty = getChatLandingMock("empty");
    const failure = getChatLandingMock("failure");

    expect(success).toEqual(getChatLandingMock("success"));
    expect(loading).toEqual(getChatLandingMock("loading"));
    expect(empty).toEqual(getChatLandingMock("empty"));
    expect(failure).toEqual(getChatLandingMock("failure"));
    expect(success.status).toBe("success");
    expect(loading).toEqual({ status: "loading" });
    expect(empty.status).toBe("empty");
    expect(failure).toEqual({
      error: {
        code: "unavailable",
        message: "BPPedia belum dapat memuat saran pertanyaan.",
      },
      status: "error",
    });

    if (success.status !== "success" || empty.status !== "empty") {
      throw new Error("Expected populated and empty chat fixtures");
    }

    expect(success.data.suggestedQuestions.length).toBeGreaterThan(0);
    expect(empty.data.suggestedQuestions).toEqual([]);
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

    expect(freshSuccess.data.title).toBe("Tanyakan kebijakan perusahaan");
  });

  test("selects deterministic admin authentication states", () => {
    const success = mockAdminLogin(ADMIN_CREDENTIALS, "success");
    const loading = mockAdminLogin(ADMIN_CREDENTIALS, "loading");
    const invalidCredentials = mockAdminLogin(
      ADMIN_CREDENTIALS,
      "invalid-credentials"
    );
    const failure = mockAdminLogin(ADMIN_CREDENTIALS, "failure");

    expect(success).toEqual(mockAdminLogin(ADMIN_CREDENTIALS, "success"));
    expect(loading).toEqual(mockAdminLogin(ADMIN_CREDENTIALS, "loading"));
    expect(invalidCredentials).toEqual(
      mockAdminLogin(ADMIN_CREDENTIALS, "invalid-credentials")
    );
    expect(failure).toEqual(mockAdminLogin(ADMIN_CREDENTIALS, "failure"));
    expect(success).toEqual({
      data: {
        admin: {
          displayName: "Admin BPPedia",
          id: "admin-local",
          identifier: "admin@bppedia.local",
        },
      },
      status: "success",
    });
    expect(loading).toEqual({ status: "loading" });
    expect(invalidCredentials).toEqual({
      error: {
        code: "invalid_credentials",
        message: "Email atau kata sandi tidak valid.",
      },
      status: "error",
    });
    expect(failure).toEqual({
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

    expect(freshInvalidCredentials.error.message).toBe(
      "Email atau kata sandi tidak valid."
    );
  });
});
