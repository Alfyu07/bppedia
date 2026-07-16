import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmployeeLanding } from "@/components/chat/employee-landing";
import { getChatLandingMock } from "@/lib/mocks";

const noop = () => undefined;

function renderLanding(scenario: "success" | "loading" | "empty" | "failure") {
  return renderToStaticMarkup(
    createElement(EmployeeLanding, {
      handoffError: undefined,
      input: "",
      landing: getChatLandingMock(scenario),
      mockChatStatus: "idle",
      onInputChange: noop,
      onRetry: noop,
      onSubmit: noop,
    })
  );
}

describe("employee landing render states", () => {
  test("renders an accessible loading state", () => {
    const markup = renderLanding("loading");
    assert.match(markup, /role="status"/);
    assert.match(markup, /Memuat BPPedia/);
  });

  test("renders an accessible fixture failure", () => {
    const markup = renderLanding("failure");
    assert.match(markup, /role="alert"/);
    assert.match(markup, /BPPedia belum dapat memuat saran pertanyaan\./);
    assert.match(markup, /Coba lagi/);
  });

  test("keeps the composer and omits suggestions for empty data", () => {
    const markup = renderLanding("empty");
    assert.match(markup, /data-testid="landing-prompt-input"/);
    assert.doesNotMatch(markup, /data-testid="suggested-actions"/);
  });

  test("renders a centered full-width composer without a product preview", () => {
    const markup = renderLanding("success");
    assert.match(markup, /Setiap jawaban akan menyertakan sumber/);
    assert.match(
      markup,
      /<section class="[^"]*max-w-3xl[^"]*" data-testid="landing-primary"/
    );
    assert.doesNotMatch(markup, /data-testid="landing-product-preview"/);
  });
});
