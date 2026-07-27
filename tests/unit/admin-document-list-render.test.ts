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
    for (const copy of [
      "Filter dokumen",
      "Cari judul BPP",
      "Status dokumen",
      "Pilih satu atau beberapa status.",
      "Aktif",
      "Diproses",
      "Gagal",
      "Diarsipkan",
      "Kebijakan Benefit Karyawan",
      "Panduan Mobilitas Karyawan",
      "Pedoman Perjalanan Dinas",
      "Kode Etik Karyawan",
    ]) {
      assert.match(markup, new RegExp(copy));
    }
    assert.match(markup, /type="search"/);
    assert.match(markup, /placeholder="Cari berdasarkan judul…"/);
    assert.equal((markup.match(/type="checkbox"/g) ?? []).length, 4);
    assert.match(markup, /aria-live="polite"/);
    assert.match(markup, /4 dokumen ditampilkan/);
    assert.doesNotMatch(markup, />Reset filter/);
    assert.ok(
      markup.indexOf("Kebijakan Benefit Karyawan") <
        markup.indexOf("Panduan Mobilitas Karyawan")
    );
    assert.match(markup, /class="[^"]*md:table[^"]*"/);
    assert.match(markup, /class="[^"]*md:hidden[^"]*"/);
  });

  test("renders explicit loading and empty states", () => {
    const loading = renderScenario("loading");
    const empty = renderScenario("empty");

    assert.match(loading, /aria-busy="true"/);
    assert.match(loading, /Memuat dokumen BPP/);
    assert.match(empty, /Belum ada dokumen BPP/);
    assert.match(empty, /href="\/admin\/documents\/upload"/);
    for (const markup of [loading, empty]) {
      assert.doesNotMatch(markup, /Cari judul BPP/);
      assert.doesNotMatch(markup, /Status dokumen/);
    }
  });
});
