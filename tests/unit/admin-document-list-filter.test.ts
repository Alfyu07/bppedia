import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { filterAdminDocuments } from "@/components/admin/admin-document-list";
import { getAdminDocumentListMock } from "@/lib/mocks";

const result = getAdminDocumentListMock("success");
if (result.status !== "success") {
  throw new Error("Expected populated documents");
}
const { documents } = result.data;

const slugs = (items: typeof documents) => items.map((item) => item.slug);

describe("admin document list filtering", () => {
  test("matches normalized case-insensitive title substrings", () => {
    assert.deepEqual(
      slugs(filterAdminDocuments(documents, "  bEnEfIt  ", [])),
      ["employee-benefits"]
    );
    assert.deepEqual(
      slugs(filterAdminDocuments(documents, "   ", [])),
      slugs(documents)
    );
  });

  test("uses OR within selected statuses and all for an empty selection", () => {
    assert.deepEqual(slugs(filterAdminDocuments(documents, "", ["failed"])), [
      "employee-travel",
    ]);
    assert.deepEqual(
      slugs(filterAdminDocuments(documents, "", ["active", "archived"])),
      ["employee-benefits", "employee-conduct"]
    );
    assert.deepEqual(
      slugs(filterAdminDocuments(documents, "", [])),
      slugs(documents)
    );
  });

  test("uses AND between search and statuses and returns no matches", () => {
    assert.deepEqual(
      slugs(
        filterAdminDocuments(documents, "karyawan", ["active", "archived"])
      ),
      ["employee-benefits", "employee-conduct"]
    );
    assert.deepEqual(
      filterAdminDocuments(documents, "mobilitas", ["failed"]),
      []
    );
  });

  test("preserves source order and does not mutate fixtures", () => {
    const before = structuredClone(documents);
    const filtered = filterAdminDocuments(documents, "", [
      "active",
      "processing",
      "failed",
      "archived",
    ]);
    assert.deepEqual(slugs(filtered), slugs(documents));
    assert.notStrictEqual(filtered, documents);
    assert.deepEqual(documents, before);
  });
});
