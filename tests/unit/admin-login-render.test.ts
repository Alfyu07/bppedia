import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import {
  type AdminAuthMockScenario,
  mockAdminLogin,
} from "@/lib/mocks/admin-auth";

function render(scenario: AdminAuthMockScenario) {
  return renderToStaticMarkup(
    createElement(AdminLoginForm, {
      initialResult: mockAdminLogin(
        { identifier: "admin@bppedia.test", password: "mock-password" },
        scenario
      ),
    })
  );
}

describe("admin login render contract", () => {
  test("renders accessible fields and employee-chat link", () => {
    const markup = render("success");

    assert.match(markup, /<label[^>]*for="admin-identifier"/);
    assert.match(markup, /<input[^>]*id="admin-identifier"[^>]*required/);
    assert.match(markup, /<label[^>]*for="admin-password"/);
    assert.match(markup, /href="\/"/);
  });

  test("renders loading and error fixtures accessibly", () => {
    assert.match(render("loading"), /role="status"/);
    assert.match(render("loading"), /disabled/);
    assert.match(render("invalid-credentials"), /role="alert"/);
    assert.match(
      render("invalid-credentials"),
      /Email atau kata sandi tidak valid\./
    );
    assert.match(render("failure"), /Login admin belum dapat diproses\./);
  });
});
