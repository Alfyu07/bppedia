import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { ReactElement } from "react";
import { AdminDocumentPreviewContent } from "@/app/(admin)/admin/documents/[slug]/preview/page";

describe("admin document canonical PDF preview route", () => {
  test("renders ready version metadata and preserves return context", async () => {
    const page = await AdminDocumentPreviewContent({
      params: Promise.resolve({ slug: "employee-benefits" }),
      searchParams: Promise.resolve({ version: "employee-benefits-v2026-1" }),
    });
    const viewer = page as ReactElement;

    assert.equal(viewer.props.title, "Kebijakan Benefit Karyawan");
    assert.equal(viewer.props.versionLabel, "2026.1");
    assert.equal(viewer.props.originalFileType, "DOCX");
    assert.equal(viewer.props.generatedPdfStatus, "ready");
    assert.equal(
      viewer.props.versionReturnHref,
      "/admin/documents/employee-benefits?version=employee-benefits-v2026-1"
    );
  });

  test("rejects ready versions without their own artifact, non-ready, and missing versions", async () => {
    await Promise.all(
      ["employee-benefits-v2026-3", "employee-benefits-v2026-4", "missing"].map(
        (version) =>
          assert.rejects(
            AdminDocumentPreviewContent({
              params: Promise.resolve({ slug: "employee-benefits" }),
              searchParams: Promise.resolve({ version }),
            }),
            (error: unknown) =>
              error instanceof Error &&
              "digest" in error &&
              error.digest === "NEXT_HTTP_ERROR_FALLBACK;404"
          )
      )
    );
  });
});
