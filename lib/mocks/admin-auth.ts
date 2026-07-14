export const mockAdminLogin = (
  credentials: AdminLoginCredentials,
  scenario: AdminAuthMockScenario
): AdminAuthMockResult => {
  if (scenario !== "success") {
    return structuredClone(ADMIN_AUTH_MOCK_FIXTURES[scenario]);
  }

  return {
    data: {
      admin: {
        ...MOCK_ADMIN,
        identifier: credentials.identifier,
      },
    },
    status: "success",
  };
};

export interface AdminLoginCredentials {
  identifier: string;
  password: string;
}

export interface MockAdmin {
  displayName: string;
  id: string;
  identifier: string;
}

interface AdminAuthSuccessResult {
  data: {
    admin: MockAdmin;
  };
  status: "success";
}

interface AdminAuthLoadingResult {
  status: "loading";
}

interface AdminAuthErrorResult {
  error: {
    code: "invalid_credentials" | "unavailable";
    message: string;
  };
  status: "error";
}

export type AdminAuthMockScenario =
  | "success"
  | "loading"
  | "invalid-credentials"
  | "failure";

export type AdminAuthMockResult =
  | AdminAuthSuccessResult
  | AdminAuthLoadingResult
  | AdminAuthErrorResult;

const MOCK_ADMIN = {
  displayName: "Admin BPPedia",
  id: "admin-local",
} as const;

const ADMIN_AUTH_MOCK_FIXTURES = {
  failure: {
    error: {
      code: "unavailable",
      message: "Login admin belum dapat diproses.",
    },
    status: "error",
  },
  "invalid-credentials": {
    error: {
      code: "invalid_credentials",
      message: "Email atau kata sandi tidak valid.",
    },
    status: "error",
  },
  loading: {
    status: "loading",
  },
} as const satisfies Record<
  Exclude<AdminAuthMockScenario, "success">,
  AdminAuthMockResult
>;
