import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createQueuedUpload,
  formatUploadSize,
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
    });
  });
});
