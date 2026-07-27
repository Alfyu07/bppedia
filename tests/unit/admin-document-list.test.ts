import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getAdminDocumentListMock } from "@/lib/mocks";

describe("admin document list mock", () => {
  test("selects populated, loading, and empty states", () => {
    const success = getAdminDocumentListMock("success");

    assert.equal(success.status, "success");
    if (success.status !== "success") {
      throw new Error("Expected populated admin documents");
    }

    const statuses = new Set(
      success.data.documents.map((document) => document.status)
    );
    assert.deepEqual([...statuses].sort(), [
      "active",
      "archived",
      "failed",
      "processing",
    ]);
    assert.equal(
      new Set(success.data.documents.map((document) => document.slug)).size,
      success.data.documents.length
    );
    for (const document of success.data.documents) {
      assert.ok(document.slug.length > 0);
      assert.ok(document.title.length > 0);
      assert.ok(Number.isFinite(Date.parse(document.updatedAt)));
    }
    assert.deepEqual(getAdminDocumentListMock("loading"), {
      status: "loading",
    });
    assert.deepEqual(getAdminDocumentListMock("empty"), { status: "empty" });
  });

  test("isolates populated fixtures from caller mutation", () => {
    const first = getAdminDocumentListMock("success");
    const second = getAdminDocumentListMock("success");

    assert.equal(first.status, "success");
    assert.equal(second.status, "success");
    if (first.status !== "success" || second.status !== "success") {
      throw new Error("Expected populated admin documents");
    }

    first.data.documents[0].title = "Changed by caller";
    assert.notEqual(
      second.data.documents[0].title,
      first.data.documents[0].title
    );
  });
});
