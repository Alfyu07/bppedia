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

    assert.ok(success.data.documents.length >= 2);
    assert.ok(
      success.data.documents.some((document) => document.status === "active")
    );
    for (const document of success.data.documents) {
      assert.ok(document.slug.length > 0);
      assert.ok(document.title.length > 0);
      assert.match(document.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
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
