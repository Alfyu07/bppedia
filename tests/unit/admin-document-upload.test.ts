import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createQueuedUpload,
  formatUploadSize,
  normalizeNewDocumentTitle,
  validateUploadFile,
} from "@/lib/admin-document-upload";

const MB = 1024 * 1024;

describe("admin document upload model", () => {
  test("accepts supported extensions with matching MIME types", () => {
    for (const file of [
      { name: "policy.pdf", size: MB, type: "application/pdf" },
      { name: "policy.doc", size: MB, type: "application/msword" },
      {
        name: "policy.docx",
        size: MB,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    ]) {
      assert.deepEqual(validateUploadFile(file), { status: "valid" });
    }
  });

  test("rejects unsupported, mismatched, and oversized files", () => {
    assert.equal(
      validateUploadFile({ name: "policy.txt", size: 20, type: "text/plain" })
        .status,
      "unsupported"
    );
    assert.equal(
      validateUploadFile({
        name: "policy.pdf",
        size: 20,
        type: "application/msword",
      }).status,
      "unsupported"
    );
    assert.equal(
      validateUploadFile({
        name: "policy.pdf",
        size: 10 * MB + 1,
        type: "application/pdf",
      }).status,
      "oversized"
    );
  });

  test("formats review size and creates a queued mock version", () => {
    assert.equal(formatUploadSize(1.5 * MB), "1,5 MB");
    assert.equal(formatUploadSize(512 * 1024), "512 KB");
    assert.deepEqual(createQueuedUpload("employee-benefits", "policy.pdf"), {
      fileName: "policy.pdf",
      processingStatus: "queued",
      targetSlug: "employee-benefits",
      targetTitle: "employee-benefits",
      uploadMode: "new-version",
    });
  });

  test("normalizes a required new BPP title into a safe stable slug", () => {
    assert.deepEqual(normalizeNewDocumentTitle("  Kebijakan   Cuti 2027  "), {
      slug: "kebijakan-cuti-2027",
      status: "valid",
      title: "Kebijakan Cuti 2027",
    });
    assert.equal(normalizeNewDocumentTitle("   ").status, "invalid");
    assert.equal(normalizeNewDocumentTitle("🔥").status, "invalid");
    assert.equal(normalizeNewDocumentTitle("a".repeat(121)).status, "invalid");
  });

  test("queues a new BPP with its chosen title and mode", () => {
    assert.deepEqual(
      createQueuedUpload(
        "kebijakan-cuti-2027",
        "cuti.docx",
        "Kebijakan Cuti 2027",
        "new-document"
      ),
      {
        fileName: "cuti.docx",
        processingStatus: "queued",
        targetSlug: "kebijakan-cuti-2027",
        targetTitle: "Kebijakan Cuti 2027",
        uploadMode: "new-document",
      }
    );
  });
});
