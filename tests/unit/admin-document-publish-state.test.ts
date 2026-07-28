import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { AdminDocumentPublishState } from "@/lib/mocks";
import {
  applyAdminDocumentPublishMock,
  applyAdminDocumentRollbackMock,
  getAdminDocumentPublishCandidateMock,
  getAdminDocumentRollbackCandidateMock,
  parseAdminDocumentPublishStateMock,
} from "@/lib/mocks";

const state: AdminDocumentPublishState = {
  document: {
    activeVersionLabel: "2026.3",
    slug: "employee-benefits",
    status: "active",
    title: "Kebijakan Benefit Karyawan",
    updatedAt: "2026-07-24T08:30:00.000Z",
  },
  versions: [
    {
      createdAt: "2026-07-25T08:30:00.000Z",
      id: "employee-benefits-v2026-3",
      isActive: true,
      label: "2026.3",
      processingStatus: "ready",
    },
    {
      createdAt: "2026-07-23T08:30:00.000Z",
      id: "employee-benefits-v2026-1",
      isActive: false,
      label: "2026.1",
      processingStatus: "ready",
    },
  ],
};

describe("admin publish state", () => {
  test("rolls back only to a ready inactive version older than the active version", () => {
    assert.equal(
      getAdminDocumentRollbackCandidateMock(state, "employee-benefits-v2026-1")
        ?.versionLabel,
      "2026.1"
    );
    assert.equal(
      getAdminDocumentRollbackCandidateMock(state, "employee-benefits-v2026-3"),
      undefined
    );
    const withNewerReady = {
      ...state,
      versions: [
        { ...state.versions[0], isActive: false },
        { ...state.versions[0], id: "newer", label: "2026.4" },
        state.versions[1],
      ],
    };
    assert.equal(
      getAdminDocumentRollbackCandidateMock(withNewerReady, "newer"),
      undefined
    );
    for (const processingStatus of [
      "queued",
      "converting",
      "extracting",
      "indexing",
      "failed",
    ] as const) {
      const ineligible = {
        ...state,
        versions: [
          state.versions[0],
          { ...state.versions[1], processingStatus },
        ],
      };
      assert.equal(
        getAdminDocumentRollbackCandidateMock(
          ineligible,
          "employee-benefits-v2026-1"
        ),
        undefined
      );
    }
  });

  test("atomically rolls document and history active markers back", () => {
    const next = applyAdminDocumentRollbackMock(
      state,
      "employee-benefits-v2026-1"
    );
    assert.ok(next);
    assert.equal(next.document.activeVersionLabel, "2026.1");
    assert.deepEqual(
      next.versions.filter(({ isActive }) => isActive).map(({ id }) => id),
      ["employee-benefits-v2026-1"]
    );
    assert.equal(state.document.activeVersionLabel, "2026.3");
  });

  test("does not offer publish for an older ready version", () => {
    assert.equal(
      getAdminDocumentPublishCandidateMock(
        state.document.slug,
        state.versions,
        "employee-benefits-v2026-1"
      ),
      undefined
    );
    assert.equal(
      applyAdminDocumentPublishMock(state, "employee-benefits-v2026-1"),
      undefined
    );
  });

  test("offers publish for the newer ready version after rollback", () => {
    const rolledBack = applyAdminDocumentRollbackMock(
      state,
      "employee-benefits-v2026-1"
    );
    assert.ok(rolledBack);
    assert.equal(
      getAdminDocumentPublishCandidateMock(
        rolledBack.document.slug,
        rolledBack.versions,
        "employee-benefits-v2026-3"
      )?.versionLabel,
      "2026.3"
    );
    const republished = applyAdminDocumentPublishMock(
      rolledBack,
      "employee-benefits-v2026-3"
    );
    assert.equal(republished?.document.activeVersionLabel, "2026.3");
  });

  test("validates persisted document and history as one coherent override", () => {
    const next = applyAdminDocumentRollbackMock(
      state,
      "employee-benefits-v2026-1"
    );
    assert.ok(next);
    assert.deepEqual(
      parseAdminDocumentPublishStateMock(JSON.stringify(next)),
      next
    );
    assert.equal(parseAdminDocumentPublishStateMock("not json"), undefined);
    assert.equal(
      parseAdminDocumentPublishStateMock(
        JSON.stringify({
          ...next,
          document: { ...next.document, activeVersionLabel: "bad" },
        })
      ),
      undefined
    );
  });
});
