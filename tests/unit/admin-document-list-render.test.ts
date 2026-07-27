import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
    assert.match(
      markup,
      /<p aria-atomic="false" aria-live="polite" class="sr-only">4 dokumen ditampilkan<\/p>/
    );
    assert.doesNotMatch(markup, /<div[^>]+aria-live="polite"/);
    assert.doesNotMatch(markup, />Reset filter/);
    assert.ok(
      markup.indexOf("Kebijakan Benefit Karyawan") <
        markup.indexOf("Panduan Mobilitas Karyawan")
    );
    assert.match(markup, /Dokumen diarsipkan/);
    assert.match(
      markup,
      /<h2 class="[^"]*text-xl[^"]*focus-visible:ring-2[^"]*" id="primary-documents-heading" tabindex="-1">Dokumen BPP<\/h2>/
    );
    assert.match(
      markup,
      /<h2 class="[^"]*focus-visible:ring-2[^"]*" id="archived-documents-heading" tabindex="-1">Dokumen diarsipkan<\/h2>/
    );
    assert.match(
      markup,
      /tidak digunakan dalam pencarian atau jawaban chat karyawan hingga dipulihkan/
    );
    assert.equal((markup.match(/>Arsipkan<\/button>/g) ?? []).length, 2);
    assert.equal((markup.match(/>Pulihkan<\/button>/g) ?? []).length, 2);
    assert.equal(
      (markup.match(/aria-label="Arsipkan Kebijakan Benefit Karyawan"/g) ?? [])
        .length,
      2
    );
    assert.equal(
      (markup.match(/aria-label="Pulihkan Kode Etik Karyawan"/g) ?? []).length,
      2
    );
    const desktopRows = markup.match(/<tr[^>]*>.*?<\/tr>/g) ?? [];
    for (const title of [
      "Panduan Mobilitas Karyawan",
      "Pedoman Perjalanan Dinas",
    ]) {
      const row = desktopRows.find((candidate) => candidate.includes(title));
      assert.ok(row);
      assert.doesNotMatch(row, /Arsipkan|Pulihkan/);
    }
    assert.equal((markup.match(/<th[^>]*>Aksi<\/th>/g) ?? []).length, 2);
    assert.equal((markup.match(/<dt[^>]*>Aksi<\/dt>/g) ?? []).length, 2);
    assert.equal((markup.match(/class="[^"]*md:table[^"]*"/g) ?? []).length, 2);
    assert.equal(
      (markup.match(/class="[^"]*md:hidden[^"]*"/g) ?? []).length,
      2
    );
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
      assert.doesNotMatch(markup, /Arsipkan|Pulihkan|Dokumen diarsipkan/);
    }
  });

  test("guards transitions in current state and defines focus fallback", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "admin", "admin-document-list.tsx"),
      "utf8"
    );

    assert.match(
      source,
      /setDocuments\(\(current\) => \{[\s\S]*?current\.find/
    );
    assert.match(source, /candidate\?\.status !== "active"/);
    assert.match(source, /candidate\?\.status !== "archived"/);
    assert.match(source, /pendingFocusDestinationRef\.current = "archived"/);
    assert.match(source, /pendingFocusDestinationRef\.current = "primary"/);
    assert.match(
      source,
      /destinationRef\.current \?\? searchInputRef\.current/
    );
    assert.doesNotMatch(source, /setFocusDestination/);
    assert.match(source, /archiveTriggerRef\.current = trigger/);
    assert.match(source, /event\.currentTarget/);
    assert.doesNotMatch(source, /document\.activeElement/);
    assert.match(source, /onCloseAutoFocus/);
    assert.match(source, /archiveTriggerRef\.current\?\.isConnected/);
  });
});
