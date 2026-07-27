import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminDocumentList } from "@/components/admin/admin-document-list";
import { getAdminDocumentListMock } from "@/lib/mocks";

function renderScenario(scenario: "success" | "loading" | "empty") {
  return renderToStaticMarkup(
    createElement(AdminDocumentList, {
      result: getAdminDocumentListMock(scenario),
    })
  );
}

describe("admin document list render contract", () => {
  test("renders document metadata and stable navigation", () => {
    const markup = renderScenario("success");

    assert.match(markup, /Dokumen BPP/);
    assert.match(markup, /Versi aktif/);
    assert.match(markup, /Status/);
    assert.match(markup, /Terakhir diperbarui/);
    assert.match(markup, /Kebijakan Benefit Karyawan/);
    assert.match(markup, /2026\.1/);
    assert.match(markup, /Aktif/);
    assert.match(markup, /href="\/admin\/documents\/employee-benefits"/);
    assert.match(markup, /href="\/admin\/documents\/upload"/);
  });

  test("renders explicit loading and empty states", () => {
    const loading = renderScenario("loading");
    const empty = renderScenario("empty");

    assert.match(loading, /aria-busy="true"/);
    assert.match(loading, /Memuat dokumen BPP/);
    assert.match(empty, /Belum ada dokumen BPP/);
    assert.match(empty, /href="\/admin\/documents\/upload"/);
  });
});
