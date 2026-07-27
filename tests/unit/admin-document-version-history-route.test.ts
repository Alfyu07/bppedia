import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import AdminDocumentHistoryPage, {
  generateStaticParams,
} from "@/app/(admin)/admin/documents/[slug]/page";

describe("admin document version history route", () => {
  test("pre-renders every mocked history slug", () => {
    assert.deepEqual(generateStaticParams(), [{ slug: "employee-benefits" }]);
  });

  test("composes the known document success history", async () => {
    const page = await AdminDocumentHistoryPage({
      params: Promise.resolve({ slug: "employee-benefits" }),
    });
    const markup = renderToStaticMarkup(page);

    assert.match(markup, /Kebijakan Benefit Karyawan/);
    assert.match(markup, /Versi 2026\.3/);
    assert.match(markup, /Pemrosesan gagal/);
  });

  test("uses the Next.js not-found path for an unknown document", async () => {
    await assert.rejects(
      AdminDocumentHistoryPage({
        params: Promise.resolve({ slug: "unknown-document" }),
      }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        return (
          "digest" in error && error.digest === "NEXT_HTTP_ERROR_FALLBACK;404"
        );
      }
    );
  });
});
