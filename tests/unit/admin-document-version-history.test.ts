import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  applyAdminDocumentPublishMock,
  getAdminDocumentListMock,
  getAdminDocumentPublishCandidateMock,
  getAdminDocumentVersionHistoryMock,
  getAdminDocumentVersionPreviewMock,
} from "@/lib/mocks";

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
  test("resolves only ready versions with their own canonical PDF artifact", () => {
    assert.deepEqual(
      getAdminDocumentVersionPreviewMock(
        "employee-benefits",
        "employee-benefits-v2026-1"
      ),
      {
        generatedPdfStatus: "ready",
        originalFileType: "DOCX",
        pageCount: 12,
        pdfHref: "/documents/files/employee-benefits-v2026-1.pdf",
        slug: "employee-benefits",
        title: "Kebijakan Benefit Karyawan",
        versionId: "employee-benefits-v2026-1",
        versionLabel: "2026.1",
      }
    );
    assert.deepEqual(
      getAdminDocumentVersionPreviewMock(
        "employee-mobility",
        "employee-mobility-v2026-1"
      ),
      {
        generatedPdfStatus: "ready",
        originalFileType: "DOCX",
        pageCount: 8,
        pdfHref: "/documents/files/employee-mobility-v2026-1.pdf",
        slug: "employee-mobility",
        title: "Panduan Mobilitas Karyawan",
        versionId: "employee-mobility-v2026-1",
        versionLabel: "2026.1",
      }
    );
    for (const [slug, versionId] of [
      ["employee-benefits", "employee-benefits-v2026-3"],
      ["employee-travel", "employee-travel-v2026-1"],
      ["employee-benefits", "employee-benefits-v2026-4"],
      ["employee-benefits", "missing"],
    ]) {
      assert.equal(
        getAdminDocumentVersionPreviewMock(slug, versionId),
        undefined
      );
    }
  });
  test("publishes only a ready inactive version with its canonical artifact", () => {
    assert.deepEqual(
      getAdminDocumentPublishCandidateMock(
        "employee-benefits",
        "employee-benefits-v2026-1"
      ),
      {
        slug: "employee-benefits",
        title: "Kebijakan Benefit Karyawan",
        versionId: "employee-benefits-v2026-1",
        versionLabel: "2026.1",
      }
    );
    for (const versionId of [
      "employee-benefits-v2026-3",
      "employee-benefits-v2026-4",
      "employee-benefits-v2026-2",
      "missing",
    ]) {
      assert.equal(
        getAdminDocumentPublishCandidateMock("employee-benefits", versionId),
        undefined
      );
    }
  });

  test("atomically updates document-list and version-history mock state", () => {
    const list = getAdminDocumentListMock("success");
    const history = getSuccessHistory();
    assert.equal(list.status, "success");
    if (list.status !== "success") {
      throw new Error("Expected list");
    }

    const next = applyAdminDocumentPublishMock(
      { document: list.data.documents[0], versions: history.data.versions },
      "employee-benefits-v2026-1"
    );

    assert.notEqual(next, undefined);
    assert.equal(next?.document.activeVersionLabel, "2026.1");
    assert.equal(next?.document.status, "active");
    assert.deepEqual(
      next?.versions.filter((version) => version.isActive).map(({ id }) => id),
      ["employee-benefits-v2026-1"]
    );
    assert.equal(list.data.documents[0].activeVersionLabel, "2026.1");
    assert.equal(
      history.data.versions.find(
        (version) => version.id === "employee-benefits-v2026-3"
      )?.isActive,
      true
    );
    assert.equal(
      applyAdminDocumentPublishMock(
        { document: list.data.documents[0], versions: history.data.versions },
        "employee-benefits-v2026-4"
      ),
      undefined
    );
  });

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
