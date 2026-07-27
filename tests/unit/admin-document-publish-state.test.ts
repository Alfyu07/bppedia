import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { AdminDocumentPublishState } from "@/lib/mocks";
import {
  applyAdminDocumentPublishMock,
  getAdminDocumentPublishCandidateMock,
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
  test("uses current local state while still requiring the exact canonical artifact", () => {
    assert.equal(
      getAdminDocumentPublishCandidateMock(
        state.document.slug,
        state.versions,
        "employee-benefits-v2026-1"
      )?.versionLabel,
      "2026.1"
    );
    const first = applyAdminDocumentPublishMock(
      state,
      "employee-benefits-v2026-1"
    );
    assert.ok(first);
    assert.equal(
      getAdminDocumentPublishCandidateMock(
        first.document.slug,
        first.versions,
        "employee-benefits-v2026-3"
      ),
      undefined
    );
  });

  test("validates persisted document and history as one coherent override", () => {
    const next = applyAdminDocumentPublishMock(
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
