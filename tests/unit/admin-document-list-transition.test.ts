import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { updateAdminDocumentStatus } from "@/components/admin/admin-document-list";
import { getAdminDocumentListMock } from "@/lib/mocks";

function getDocuments() {
  const result = getAdminDocumentListMock("success");
  if (result.status !== "success") {
    throw new Error("Expected populated documents");
  }
  return result.data.documents;
}

describe("admin document status transition", () => {
  test("archives an active document", () => {
    const documents = getDocuments();
    const before = documents.find(
      (document) => document.slug === "employee-benefits"
    );
    assert.ok(before);

    const updated = updateAdminDocumentStatus(
      documents,
      "employee-benefits",
      "archived"
    );

    assert.notStrictEqual(updated, documents);
    assert.deepEqual(
      updated.find((document) => document.slug === "employee-benefits"),
      { ...before, status: "archived" }
    );
  });

  test("restores an archived document", () => {
    const documents = getDocuments();
    const before = documents.find(
      (document) => document.slug === "employee-conduct"
    );
    assert.ok(before);

    const updated = updateAdminDocumentStatus(
      documents,
      "employee-conduct",
      "active"
    );

    assert.notStrictEqual(updated, documents);
    assert.deepEqual(
      updated.find((document) => document.slug === "employee-conduct"),
      { ...before, status: "active" }
    );
  });

  test("preserves metadata, order, input, and unaffected identities", () => {
    const documents = getDocuments();
    const sourceBefore = structuredClone(documents);
    const updated = updateAdminDocumentStatus(
      documents,
      "employee-benefits",
      "archived"
    );

    assert.deepEqual(
      updated.map((document) => document.slug),
      documents.map((document) => document.slug)
    );
    for (const [index, document] of documents.entries()) {
      if (document.slug !== "employee-benefits") {
        assert.strictEqual(updated[index], document);
      }
    }
    assert.deepEqual(documents, sourceBefore);
  });

  test("returns a distinct value-equivalent array for an unknown slug", () => {
    const documents = getDocuments();
    const updated = updateAdminDocumentStatus(documents, "unknown", "archived");

    assert.notStrictEqual(updated, documents);
    assert.deepEqual(updated, documents);
  });
});
