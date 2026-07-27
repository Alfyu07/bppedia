"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeMockDocumentPage } from "@/lib/mocks/documents";

export interface MockPdfViewerProps {
  generatedPdfStatus?: "ready";
  originalFileType?: string;
  pageCount: number;
  pdfHref: string;
  slug: string;
  title: string;
  versionLabel: string;
  versionReturnHref?: string;
}

export function MockPdfViewer({
  generatedPdfStatus,
  originalFileType,
  pageCount,
  pdfHref,
  slug,
  title,
  versionLabel,
  versionReturnHref,
}: MockPdfViewerProps) {
  const searchParams = useSearchParams();
  const currentPage = normalizeMockDocumentPage(
    searchParams.getAll("page"),
    pageCount
  );
  const [pageInput, setPageInput] = useState(String(currentPage));
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const pdfUrl = `${basePath}${pdfHref}`;
  const objectUrl = `${pdfUrl}#page=${currentPage}&view=FitH&toolbar=0&navpanes=0`;

  const openPage = useCallback((page: number) => {
    window.history.replaceState(null, "", `?page=${page}`);
  }, []);

  useEffect(() => {
    setPageInput(String(currentPage));
    if (
      window.location.search !== `?page=${currentPage}` ||
      window.location.hash
    ) {
      openPage(currentPage);
    }
  }, [currentPage, openPage]);

  const handleDirectPage = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextPage = normalizeMockDocumentPage([pageInput], pageCount);
      openPage(nextPage);
      setPageInput(String(nextPage));
    },
    [openPage, pageCount, pageInput]
  );
  const handleNextPage = useCallback(
    () => openPage(currentPage + 1),
    [currentPage, openPage]
  );
  const handlePageInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setPageInput(event.target.value);
    },
    []
  );
  const handlePreviousPage = useCallback(
    () => openPage(currentPage - 1),
    [currentPage, openPage]
  );

  return (
    <main className="flex min-h-dvh w-full flex-col overflow-x-hidden bg-background">
      <header className="border-border/50 border-b bg-card/80 px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3">
          <Button asChild variant="outline">
            <Link href={versionReturnHref ?? "/"}>
              {versionReturnHref
                ? "Kembali ke riwayat versi"
                : "Ke beranda BPPedia"}
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold text-foreground text-lg">
              {title}
            </h1>
            <p className="text-muted-foreground text-xs">
              Versi {versionLabel}
            </p>
          </div>
          {originalFileType && generatedPdfStatus ? (
            <dl className="flex gap-4 text-xs">
              <div>
                <dt className="text-muted-foreground">File asli</dt>
                <dd className="font-medium">{originalFileType}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">PDF hasil</dt>
                <dd className="font-medium">Siap ditinjau</dd>
              </div>
            </dl>
          ) : null}
          <output aria-live="polite" className="text-foreground text-sm">
            Halaman {currentPage} dari {pageCount}
          </output>
        </div>
      </header>

      <div className="border-border/50 border-b px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2">
          <Button
            aria-label="Halaman sebelumnya"
            disabled={currentPage === 1}
            onClick={handlePreviousPage}
            type="button"
            variant="outline"
          >
            Sebelumnya
          </Button>
          <Button
            aria-label="Halaman berikutnya"
            disabled={currentPage === pageCount}
            onClick={handleNextPage}
            type="button"
            variant="outline"
          >
            Berikutnya
          </Button>
          <form
            className="flex min-w-0 items-center gap-2"
            noValidate
            onSubmit={handleDirectPage}
          >
            <label
              className="whitespace-nowrap text-muted-foreground text-sm"
              htmlFor="pdf-page-input"
            >
              Buka halaman
            </label>
            <Input
              className="w-20"
              id="pdf-page-input"
              inputMode="numeric"
              onChange={handlePageInput}
              type="text"
              value={pageInput}
            />
            <Button type="submit">Buka</Button>
          </form>
        </div>
      </div>

      <div className="mx-auto flex min-h-[65vh] w-full max-w-6xl flex-1 p-2 sm:p-4">
        <object
          aria-label={`PDF ${title}`}
          className="min-h-[65vh] w-full rounded-xl border border-border/50 bg-card"
          data={objectUrl}
          key={`${slug}-${currentPage}`}
          type="application/pdf"
        >
          <p className="p-4 text-sm">
            Pratinjau PDF tidak didukung. <a href={pdfUrl}>Buka PDF</a>
          </p>
        </object>
      </div>
    </main>
  );
}
