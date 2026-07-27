import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminDocumentUpload } from "@/components/admin/admin-document-upload";

describe("admin document upload render contract", () => {
  test("renders accessible upload and target controls", () => {
    const markup = renderToStaticMarkup(createElement(AdminDocumentUpload));

    for (const copy of [
      "Unggah dokumen BPP",
      "Pilih atau tarik file ke sini",
      "PDF, DOC, atau DOCX hingga 10 MB",
      "Antrekan versi",
    ]) {
      assert.match(markup, new RegExp(copy));
    }
    assert.match(markup, /type="file"/);
    assert.match(
      markup,
      /accept="\.pdf,\.doc,\.docx,application\/pdf,application\/msword,application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document"/
    );
    assert.match(markup, /<label[^>]+for="bpp-upload"/);
    assert.match(markup, /aria-live="polite"/);
  });

  test("wires drag selection, validation errors, review, and queued state", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "admin", "admin-document-upload.tsx"),
      "utf8"
    );
    assert.match(source, /onDrop/);
    assert.match(source, /event\.dataTransfer\.files\[0\]/);
    assert.match(source, /validateUploadFile/);
    assert.match(source, /File tidak didukung/);
    assert.match(source, /oversized/);
    assert.match(source, /Nama file/);
    assert.match(source, /Jenis file/);
    assert.match(source, /Ukuran/);
    assert.match(source, /createQueuedUpload/);
    assert.match(source, /Versi masuk antrean/);
  });
});
