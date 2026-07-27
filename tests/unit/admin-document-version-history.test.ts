import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getAdminDocumentVersionHistoryMock } from "@/lib/mocks";

function getSuccessHistory() {
  const success = getAdminDocumentVersionHistoryMock(
    "employee-benefits",
    "success"
  );
  assert.equal(success?.status, "success");
  if (success?.status !== "success") {
    throw new Error("Expected history");
  }
  return success;
}

describe("admin document version history mock", () => {
  test("selects success, loading, and empty states for known documents", () => {
    const success = getSuccessHistory();

    assert.equal(success.data.slug, "employee-benefits");
    assert.ok(success.data.title.length > 0);
    assert.ok(success.data.versions.length >= 4);
    assert.deepEqual(
      getAdminDocumentVersionHistoryMock("employee-benefits", "loading"),
      { status: "loading" }
    );
    assert.deepEqual(
      getAdminDocumentVersionHistoryMock("employee-benefits", "empty"),
      {
        data: {
          slug: "employee-benefits",
          title: "Kebijakan Benefit Karyawan",
        },
        status: "empty",
      }
    );
    assert.equal(
      getAdminDocumentVersionHistoryMock("unknown", "success"),
      undefined
    );
  });

  test("returns deterministic newest-first versions with valid fields", () => {
    const success = getSuccessHistory();
    const expected = [...success.data.versions].sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
        a.id.localeCompare(b.id)
    );

    assert.deepEqual(success.data.versions, expected);
    for (const version of success.data.versions) {
      assert.ok(version.id.length && version.label.length);
      assert.ok(Number.isFinite(Date.parse(version.createdAt)));
    }
  });

  test("contains one processed active version and all required lifecycle states", () => {
    const success = getSuccessHistory();
    const active = success.data.versions.filter((version) => version.isActive);

    assert.equal(active.length, 1);
    assert.equal(active[0].processingStatus, "ready");
    assert.deepEqual(
      new Set(success.data.versions.map((version) => version.processingStatus)),
      new Set([
        "queued",
        "converting",
        "extracting",
        "indexing",
        "ready",
        "failed",
      ])
    );
    assert.ok(
      success.data.versions.some(
        (version) => version.processingStatus === "queued"
      )
    );
    assert.ok(
      success.data.versions.some(
        (version) => version.processingStatus === "failed"
      )
    );
    const eligible = success.data.versions.filter(
      (version) => version.processingStatus === "ready" && !version.isActive
    );
    assert.ok(eligible.length > 0);
  });

  test("isolates success and empty fixtures from caller mutation", () => {
    const firstSuccess = getSuccessHistory();
    const secondSuccess = getSuccessHistory();
    firstSuccess.data.versions[0].label = "Changed by caller";
    assert.notEqual(
      secondSuccess.data.versions[0].label,
      firstSuccess.data.versions[0].label
    );

    const firstEmpty = getAdminDocumentVersionHistoryMock(
      "employee-benefits",
      "empty"
    );
    const secondEmpty = getAdminDocumentVersionHistoryMock(
      "employee-benefits",
      "empty"
    );
    assert.equal(firstEmpty?.status, "empty");
    assert.equal(secondEmpty?.status, "empty");
    if (firstEmpty?.status !== "empty" || secondEmpty?.status !== "empty") {
      throw new Error("Expected empty history");
    }
    firstEmpty.data.title = "Changed by caller";
    assert.notEqual(secondEmpty.data.title, firstEmpty.data.title);
  });
});
