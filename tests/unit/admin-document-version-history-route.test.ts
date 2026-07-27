import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AdminDocumentHistoryContent,
  generateStaticParams,
} from "@/app/(admin)/admin/documents/[slug]/page";

describe("admin document version history route", () => {
  test("pre-renders every mocked history slug", () => {
    assert.deepEqual(generateStaticParams(), [
      { slug: "employee-benefits" },
      { slug: "employee-mobility" },
      { slug: "employee-travel" },
    ]);
  });

  test("composes the known document success history", async () => {
    const page = await AdminDocumentHistoryContent({
      params: Promise.resolve({ slug: "employee-benefits" }),
      searchParams: Promise.resolve({ version: "employee-benefits-v2026-1" }),
    });
    const markup = renderToStaticMarkup(page);

    assert.match(markup, /Kebijakan Benefit Karyawan/);
    assert.match(markup, /Versi 2026\.3/);
    assert.match(markup, /Pemrosesan gagal/);
    assert.match(markup, /aria-current="true"/);
    assert.match(markup, /Konteks pratinjau dipulihkan untuk versi 2026\.1/);
  });

  test("ignores invalid, repeated, and cross-document version context", async () => {
    const pages = await Promise.all(
      [
        "missing",
        "employee-mobility-v2026-1",
        ["employee-benefits-v2026-1", "employee-benefits-v2026-3"],
      ].map((version) =>
        AdminDocumentHistoryContent({
          params: Promise.resolve({ slug: "employee-benefits" }),
          searchParams: Promise.resolve({ version }),
        })
      )
    );
    for (const page of pages) {
      assert.doesNotMatch(renderToStaticMarkup(page), /aria-current="true"/);
    }
  });

  test("uses the Next.js not-found path for an unknown document", async () => {
    await assert.rejects(
      AdminDocumentHistoryContent({
        params: Promise.resolve({ slug: "unknown-document" }),
        searchParams: Promise.resolve({}),
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
