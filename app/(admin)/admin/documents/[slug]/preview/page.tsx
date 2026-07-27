import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MockPdfViewer } from "@/app/(documents)/documents/[slug]/mock-pdf-viewer";
import { getAdminDocumentVersionPreviewMock } from "@/lib/mocks";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ version?: string | string[] }>;
}

export default function AdminDocumentPreviewPage(props: Props) {
  return (
    <Suspense fallback={<p role="status">Memuat pratinjau…</p>}>
      <AdminDocumentPreviewContent {...props} />
    </Suspense>
  );
}

export async function AdminDocumentPreviewContent({
  params,
  searchParams,
}: Props) {
  const [{ slug }, { version }] = await Promise.all([params, searchParams]);
  if (typeof version !== "string") {
    notFound();
  }
  const preview = getAdminDocumentVersionPreviewMock(slug, version);
  if (!preview) {
    notFound();
  }

  return (
    <MockPdfViewer
      generatedPdfStatus={preview.generatedPdfStatus}
      originalFileType={preview.originalFileType}
      pageCount={preview.pageCount}
      pdfHref={preview.pdfHref}
      slug={preview.slug}
      title={preview.title}
      versionLabel={preview.versionLabel}
      versionReturnHref={`/admin/documents/${preview.slug}?version=${encodeURIComponent(preview.versionId)}`}
    />
  );
}
