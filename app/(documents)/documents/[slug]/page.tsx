import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getMockDocumentOverview,
  getMockDocumentSlugs,
} from "@/lib/mocks/documents";
import { MockPdfViewer } from "./mock-pdf-viewer";

export function generateStaticParams() {
  return getMockDocumentSlugs().map((slug) => ({ slug }));
}

export default async function DocumentOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const document = getMockDocumentOverview(slug);
  if (!document) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-background">
          <p aria-live="polite" role="status">
            Memuat dokumen…
          </p>
        </main>
      }
    >
      <MockPdfViewer
        pageCount={document.pageCount}
        pdfHref={document.pdfHref}
        slug={document.slug}
        title={document.title}
        versionLabel={document.versionLabel}
      />
    </Suspense>
  );
}
