import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { ReactElement } from "react";
import { AdminDocumentPreviewContent } from "@/app/(admin)/admin/documents/[slug]/preview/page";

describe("admin document canonical PDF preview route", () => {
  test("renders ready version metadata and preserves return context", async () => {
    const pages = await Promise.all(
      ["employee-benefits-v2026-1", "employee-benefits-v2026-3"].map(
        (version) =>
          AdminDocumentPreviewContent({
            params: Promise.resolve({ slug: "employee-benefits" }),
            searchParams: Promise.resolve({ version }),
          })
      )
    );
    const [inactiveViewer, activeViewer] = pages as ReactElement[];

    assert.equal(inactiveViewer.props.title, "Kebijakan Benefit Karyawan");
    assert.equal(inactiveViewer.props.versionLabel, "2026.1");
    assert.equal(inactiveViewer.props.originalFileType, "DOCX");
    assert.equal(inactiveViewer.props.generatedPdfStatus, "ready");
    assert.equal(
      inactiveViewer.props.versionReturnHref,
      "/admin/documents/employee-benefits?version=employee-benefits-v2026-1"
    );
    assert.equal(activeViewer.props.versionLabel, "2026.3");
    assert.equal(
      activeViewer.props.versionReturnHref,
      "/admin/documents/employee-benefits?version=employee-benefits-v2026-3"
    );
  });

  test("rejects non-ready and missing versions", async () => {
    await Promise.all(
      ["employee-benefits-v2026-4", "missing"].map((version) =>
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
