"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  AdminDocumentListItem,
  AdminDocumentListResult,
  AdminDocumentStatus,
} from "@/lib/mocks";

interface AdminDocumentListProps {
  result: AdminDocumentListResult;
}

export function AdminDocumentList({ result }: AdminDocumentListProps) {
  const [query, setQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<
    AdminDocumentStatus[]
  >([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  if (result.status === "loading") {
    return (
      <section aria-busy="true" className="space-y-4" role="status">
        <p className="text-sm text-muted-foreground">Memuat dokumen BPP…</p>
        <div className="space-y-3">
          {LOADING_PLACEHOLDERS.map((placeholder) => (
            <div className="h-16 rounded-lg bg-muted" key={placeholder} />
          ))}
        </div>
      </section>
    );
  }

  if (result.status === "empty") {
    return (
      <section className="space-y-4 rounded-lg border border-border p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Belum ada dokumen BPP</h1>
          <p className="text-muted-foreground">
            Unggah dokumen BPP pertama untuk mulai mengelola versinya.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/documents/upload">
            <Upload aria-hidden="true" />
            Unggah BPP
          </Link>
        </Button>
      </section>
    );
  }

  const visibleDocuments = filterAdminDocuments(
    result.data.documents,
    query,
    selectedStatuses
  );
  const hasActiveFilters =
    query.trim().length > 0 || selectedStatuses.length > 0;
  const resultSummary =
    visibleDocuments.length === 0
      ? "Tidak ada dokumen yang cocok"
      : `${visibleDocuments.length} dokumen ditampilkan`;

  function toggleStatus(status: AdminDocumentStatus) {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status]
    );
  }

  function resetFilters() {
    setQuery("");
    setSelectedStatuses([]);
    searchInputRef.current?.focus();
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Dokumen BPP</h1>
          <p className="text-muted-foreground">
            Kelola dokumen, versi aktif, dan status pemrosesan BPP.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/documents/upload">
            <Upload aria-hidden="true" />
            Unggah BPP
          </Link>
        </Button>
      </header>

      <section
        aria-labelledby="document-filters-heading"
        className="space-y-4 rounded-lg border border-border p-4"
      >
        <h2 className="font-semibold" id="document-filters-heading">
          Filter dokumen
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label
            className="flex min-w-0 flex-1 flex-col gap-2"
            htmlFor="document-search"
          >
            <span className="text-sm font-medium">Cari judul BPP</span>
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="document-search"
              // biome-ignore lint/performance/noJsxPropsBind: controlled input requires the event value.
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari berdasarkan judul…"
              ref={searchInputRef}
              type="search"
              value={query}
            />
          </label>
          <fieldset className="min-w-0 space-y-2">
            <legend className="text-sm font-medium">Status dokumen</legend>
            <p className="text-sm text-muted-foreground">
              Pilih satu atau beberapa status.
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <label
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2"
                  key={option.value}
                >
                  <input
                    checked={selectedStatuses.includes(option.value)}
                    // biome-ignore lint/performance/noJsxPropsBind: checkbox closes over its typed status.
                    onChange={() => toggleStatus(option.value)}
                    type="checkbox"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {hasActiveFilters && visibleDocuments.length > 0 ? (
            <Button
              className="min-h-11"
              // biome-ignore lint/performance/noJsxPropsBind: local handler resets state and focus.
              onClick={resetFilters}
              type="button"
              variant="outline"
            >
              Reset filter
            </Button>
          ) : null}
        </div>
      </section>

      <div>
        <p aria-atomic="false" aria-live="polite" className="sr-only">
          {resultSummary}
        </p>
        {visibleDocuments.length === 0 ? (
          <section className="space-y-4 rounded-lg border border-border p-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">
                Tidak ada dokumen yang cocok
              </h2>
              <p className="text-muted-foreground">
                Ubah kata pencarian atau pilihan status, lalu coba lagi.
              </p>
            </div>
            <Button
              className="min-h-11"
              // biome-ignore lint/performance/noJsxPropsBind: local handler resets state and focus.
              onClick={resetFilters}
              type="button"
              variant="outline"
            >
              Reset filter
            </Button>
          </section>
        ) : (
          <>
            <table className="hidden w-full border-collapse md:table">
              <caption className="sr-only">Daftar dokumen BPP</caption>
              <thead>
                <tr className="border-b border-border text-left text-sm">
                  <th className="px-4 py-3 font-medium" scope="col">
                    Dokumen BPP
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Versi aktif
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Terakhir diperbarui
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleDocuments.map((document) => (
                  <tr className="border-b border-border" key={document.slug}>
                    <th className="px-4 py-4 text-left font-medium" scope="row">
                      <DocumentLink document={document} />
                    </th>
                    <td className="px-4 py-4">
                      {document.activeVersionLabel ?? "Belum ada"}
                    </td>
                    <td className="px-4 py-4">
                      {STATUS_LABELS[document.status]}
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(document.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="space-y-3 md:hidden">
              {visibleDocuments.map((document) => (
                <li
                  className="space-y-4 rounded-lg border border-border p-4"
                  key={document.slug}
                >
                  <DocumentLink document={document} />
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Versi aktif</dt>
                      <dd>{document.activeVersionLabel ?? "Belum ada"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd>{STATUS_LABELS[document.status]}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">
                        Terakhir diperbarui
                      </dt>
                      <dd>{formatDate(document.updatedAt)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function DocumentLink({ document }: { document: AdminDocumentListItem }) {
  return (
    <Link
      className="hover:underline"
      href={`/admin/documents/${document.slug}`}
    >
      {document.title}
    </Link>
  );
}

function formatDate(value: string) {
  return DATE_FORMATTER.format(new Date(value));
}

export function filterAdminDocuments(
  documents: readonly AdminDocumentListItem[],
  query: string,
  selectedStatuses: readonly AdminDocumentStatus[]
): AdminDocumentListItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  return documents.filter(
    (document) =>
      document.title.toLocaleLowerCase("id-ID").includes(normalizedQuery) &&
      (selectedStatuses.length === 0 ||
        selectedStatuses.includes(document.status))
  );
}

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});
const LOADING_PLACEHOLDERS = ["first", "second", "third", "fourth"] as const;
const STATUS_OPTIONS: readonly { label: string; value: AdminDocumentStatus }[] =
  [
    { label: "Aktif", value: "active" },
    { label: "Diproses", value: "processing" },
    { label: "Gagal", value: "failed" },
    { label: "Diarsipkan", value: "archived" },
  ];
const STATUS_LABELS = {
  active: "Aktif",
  archived: "Diarsipkan",
  failed: "Gagal",
  processing: "Diproses",
} as const;
