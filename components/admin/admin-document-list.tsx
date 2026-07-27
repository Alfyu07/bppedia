// biome-ignore-all lint/performance/noJsxPropsBind: local controls require document/status/event values.
"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type {
  AdminDocumentListItem,
  AdminDocumentListResult,
  AdminDocumentStatus,
} from "@/lib/mocks";

interface AdminDocumentListProps {
  result: AdminDocumentListResult;
}

type FocusDestination = "primary" | "archived" | null;
type DocumentActionProps = {
  document: AdminDocumentListItem;
  onArchive: (slug: string) => void;
  onRestore: (slug: string) => void;
};
type DocumentViewProps = {
  documents: readonly AdminDocumentListItem[];
  label: string;
  onArchive: (slug: string) => void;
  onRestore: (slug: string) => void;
};

export function AdminDocumentList({ result }: AdminDocumentListProps) {
  const [documents, setDocuments] = useState<AdminDocumentListItem[]>(() =>
    structuredClone(result.status === "success" ? result.data.documents : [])
  );
  const [archiveCandidateSlug, setArchiveCandidateSlug] = useState<
    string | null
  >(null);

  const [query, setQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<
    AdminDocumentStatus[]
  >([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const primaryHeadingRef = useRef<HTMLHeadingElement>(null);
  const archivedHeadingRef = useRef<HTMLHeadingElement>(null);
  const pendingFocusDestinationRef = useRef<FocusDestination>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: document commits trigger pending focus after destination sections render.
  useEffect(() => {
    const focusDestination = pendingFocusDestinationRef.current;
    if (!focusDestination) {
      return;
    }
    const destinationRef =
      focusDestination === "primary" ? primaryHeadingRef : archivedHeadingRef;
    (destinationRef.current ?? searchInputRef.current)?.focus();
    pendingFocusDestinationRef.current = null;
  }, [documents]);

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

  const filteredDocuments = filterAdminDocuments(
    documents,
    query,
    selectedStatuses
  );
  const visibleDocuments = filteredDocuments.filter(
    (document) => document.status !== "archived"
  );
  const visibleArchivedDocuments = filteredDocuments.filter(
    (document) => document.status === "archived"
  );
  const visibleTotal =
    visibleDocuments.length + visibleArchivedDocuments.length;
  const hasActiveFilters =
    query.trim().length > 0 || selectedStatuses.length > 0;
  const resultSummary =
    visibleTotal === 0
      ? "Tidak ada dokumen yang cocok"
      : `${visibleTotal} dokumen ditampilkan`;
  const archiveCandidate = documents.find(
    (document) => document.slug === archiveCandidateSlug
  );

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

  function archiveDocument() {
    setDocuments((current) => {
      const candidate = current.find(
        (document) => document.slug === archiveCandidateSlug
      );
      if (candidate?.status !== "active") {
        return current;
      }
      pendingFocusDestinationRef.current = "archived";
      return updateAdminDocumentStatus(current, candidate.slug, "archived");
    });
    setArchiveCandidateSlug(null);
  }

  function restoreDocument(slug: string) {
    setDocuments((current) => {
      const candidate = current.find((document) => document.slug === slug);
      if (candidate?.status !== "archived") {
        return current;
      }
      pendingFocusDestinationRef.current = "primary";
      return updateAdminDocumentStatus(current, candidate.slug, "active");
    });
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
                    onChange={() => toggleStatus(option.value)}
                    type="checkbox"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {hasActiveFilters && visibleTotal > 0 ? (
            <Button
              className="min-h-11"
              onClick={resetFilters}
              type="button"
              variant="outline"
            >
              Reset filter
            </Button>
          ) : null}
        </div>
      </section>

      <div className="space-y-8">
        <p aria-atomic="false" aria-live="polite" className="sr-only">
          {resultSummary}
        </p>
        {visibleTotal === 0 ? (
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
              onClick={resetFilters}
              type="button"
              variant="outline"
            >
              Reset filter
            </Button>
          </section>
        ) : null}
        {visibleDocuments.length > 0 ? (
          <section
            aria-labelledby="primary-documents-heading"
            className="space-y-4"
          >
            <h2
              className="text-xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="primary-documents-heading"
              ref={primaryHeadingRef}
              tabIndex={-1}
            >
              Dokumen BPP
            </h2>
            <DocumentTable
              documents={visibleDocuments}
              label="Daftar dokumen BPP"
              onArchive={setArchiveCandidateSlug}
              onRestore={restoreDocument}
            />
            <DocumentCards
              documents={visibleDocuments}
              label="Daftar dokumen BPP"
              onArchive={setArchiveCandidateSlug}
              onRestore={restoreDocument}
            />
          </section>
        ) : null}
        {visibleArchivedDocuments.length > 0 ? (
          <section
            aria-labelledby="archived-documents-heading"
            className="space-y-4 border-t border-border pt-8"
          >
            <div className="space-y-2">
              <h2
                className="text-xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
                id="archived-documents-heading"
                ref={archivedHeadingRef}
                tabIndex={-1}
              >
                Dokumen diarsipkan
              </h2>
              <p className="text-muted-foreground">
                Dokumen ini tidak digunakan dalam pencarian atau jawaban chat
                karyawan hingga dipulihkan.
              </p>
            </div>
            <DocumentTable
              documents={visibleArchivedDocuments}
              label="Daftar dokumen BPP diarsipkan"
              onArchive={setArchiveCandidateSlug}
              onRestore={restoreDocument}
            />
            <DocumentCards
              documents={visibleArchivedDocuments}
              label="Daftar dokumen BPP diarsipkan"
              onArchive={setArchiveCandidateSlug}
              onRestore={restoreDocument}
            />
          </section>
        ) : null}
      </div>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setArchiveCandidateSlug(null);
          }
        }}
        open={archiveCandidateSlug !== null}
      >
        {archiveCandidate ? (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Arsipkan BPP?</AlertDialogTitle>
              <AlertDialogDescription>
                “{archiveCandidate.title}” tidak akan digunakan dalam pencarian
                atau jawaban chat karyawan setelah diarsipkan. Dokumen tetap
                tersedia di bagian Dokumen diarsipkan dan dapat dipulihkan kapan
                saja.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={archiveDocument}
                variant="destructive"
              >
                Arsipkan BPP
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
    </section>
  );
}

function DocumentTable({
  documents,
  label,
  onArchive,
  onRestore,
}: DocumentViewProps) {
  return (
    <table className="hidden w-full border-collapse md:table">
      <caption className="sr-only">{label}</caption>
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
          <th className="px-4 py-3 text-right font-medium" scope="col">
            Aksi
          </th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <tr className="border-b border-border" key={document.slug}>
            <th className="px-4 py-4 text-left font-medium" scope="row">
              <DocumentLink document={document} />
            </th>
            <td className="px-4 py-4">
              {document.activeVersionLabel ?? "Belum ada"}
            </td>
            <td className="px-4 py-4">{STATUS_LABELS[document.status]}</td>
            <td className="px-4 py-4">{formatDate(document.updatedAt)}</td>
            <td className="px-4 py-4 text-right">
              <DocumentAction
                document={document}
                onArchive={onArchive}
                onRestore={onRestore}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DocumentCards({
  documents,
  label,
  onArchive,
  onRestore,
}: DocumentViewProps) {
  return (
    <ul aria-label={label} className="space-y-3 md:hidden">
      {documents.map((document) => (
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
              <dt className="text-muted-foreground">Terakhir diperbarui</dt>
              <dd>{formatDate(document.updatedAt)}</dd>
            </div>
            {document.status === "active" || document.status === "archived" ? (
              <div className="col-span-2 space-y-2">
                <dt className="text-muted-foreground">Aksi</dt>
                <dd>
                  <DocumentAction
                    document={document}
                    onArchive={onArchive}
                    onRestore={onRestore}
                  />
                </dd>
              </div>
            ) : null}
          </dl>
        </li>
      ))}
    </ul>
  );
}

function DocumentAction({
  document,
  onArchive,
  onRestore,
}: DocumentActionProps) {
  if (document.status !== "active" && document.status !== "archived") {
    return null;
  }
  const isActive = document.status === "active";
  return (
    <Button
      aria-label={`${isActive ? "Arsipkan" : "Pulihkan"} ${document.title}`}
      className="min-h-11"
      onClick={() =>
        isActive ? onArchive(document.slug) : onRestore(document.slug)
      }
      type="button"
      variant="outline"
    >
      {isActive ? "Arsipkan" : "Pulihkan"}
    </Button>
  );
}

function DocumentLink({ document }: { document: AdminDocumentListItem }) {
  return (
    <Link
      className="hover:underline"
      href={`/admin/documents/${document.slug}`}
      prefetch={false}
    >
      {document.title}
    </Link>
  );
}

function formatDate(value: string) {
  return DATE_FORMATTER.format(new Date(value));
}

export function updateAdminDocumentStatus(
  documents: readonly AdminDocumentListItem[],
  slug: string,
  status: "active" | "archived"
): AdminDocumentListItem[] {
  return documents.map((document) =>
    document.slug === slug ? { ...document, status } : document
  );
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
