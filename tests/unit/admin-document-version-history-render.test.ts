import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminDocumentVersionHistory } from "@/components/admin/admin-document-version-history";
import {
  type AdminDocumentHistoryScenario,
  getAdminDocumentVersionHistoryMock,
} from "@/lib/mocks";

function renderScenario(scenario: AdminDocumentHistoryScenario) {
  const result = getAdminDocumentVersionHistoryMock(
    "employee-benefits",
    scenario
  );
  if (!result) {
    throw new Error("Expected known document history");
  }
  return renderToStaticMarkup(
    createElement(AdminDocumentVersionHistory, { result })
  );
}

function occurrences(markup: string, value: string) {
  return markup.split(value).length - 1;
}

describe("admin document version history presentation", () => {
  test("renders responsive semantic history in newest-first order", () => {
    const markup = renderScenario("success");

    assert.match(markup, /href="\/admin"/);
    for (const copy of [
      "Kembali ke dokumen BPP",
      "Kebijakan Benefit Karyawan",
      "Riwayat versi BPP",
      "Riwayat versi",
      "Selesai diproses",
      "Sedang diproses",
      "Pemrosesan gagal",
      "Versi ini belum dapat digunakan.",
    ]) {
      assert.match(markup, new RegExp(copy));
    }
    assert.match(
      markup,
      /<caption[^>]*>Riwayat versi Kebijakan Benefit Karyawan<\/caption>/
    );
    for (const heading of ["Versi", "Status", "Ditambahkan", "Tindakan"]) {
      assert.match(
        markup,
        new RegExp(`<th[^>]*scope="col"[^>]*>${heading}</th>`)
      );
    }
    assert.match(markup, /<th[^>]*scope="row"/);
    assert.match(markup, /<ul/);
    assert.match(markup, /<dl/);
    assert.ok(markup.indexOf("Versi 2026.4") < markup.indexOf("Versi 2026.3"));
    assert.ok(markup.indexOf("Versi 2026.3") < markup.indexOf("Versi 2026.2"));
    assert.ok(markup.indexOf("Versi 2026.2") < markup.indexOf("Versi 2026.1"));
    assert.match(markup, /26 Jul 2026/);
  });

  test("renders active and rollback controls only where eligible", () => {
    const markup = renderScenario("success");

    assert.equal(occurrences(markup, ">Aktif<"), 2);
    assert.equal(occurrences(markup, ">Versi aktif<"), 2);
    assert.equal(occurrences(markup, ">Rollback ke versi ini<"), 2);
    assert.equal(
      occurrences(markup, 'aria-label="Rollback ke Versi 2026.1"'),
      2
    );
    assert.equal(occurrences(markup, 'type="button"'), 2);
    for (const label of ["2026.2", "2026.3", "2026.4"]) {
      assert.doesNotMatch(
        markup,
        new RegExp(`aria-label="Rollback ke Versi ${label}"`)
      );
    }
    assert.doesNotMatch(
      markup,
      / disabled(?:=|\s)|<form|href="[^"]*rollback|onClick/i
    );
    assert.doesNotMatch(markup, /stack|trace|provider|error code|retry/i);
  });

  test("renders an accessible loading state", () => {
    const markup = renderScenario("loading");

    assert.match(markup, /role="status"/);
    assert.match(markup, /aria-busy="true"/);
    assert.match(markup, /Memuat riwayat versi…/);
  });

  test("retains document context in the empty state without upload", () => {
    const markup = renderScenario("empty");

    assert.match(markup, /Kebijakan Benefit Karyawan/);
    assert.match(markup, /Belum ada riwayat versi/);
    assert.match(
      markup,
      /Versi akan muncul setelah dokumen BPP diunggah dan diproses\./
    );
    assert.doesNotMatch(markup, /Unggah BPP/);
  });
});
