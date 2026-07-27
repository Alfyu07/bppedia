import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminDocumentVersionHistory } from "@/components/admin/admin-document-version-history";
import {
  getAdminDocumentVersionHistoryMock,
  getAdminDocumentVersionHistorySlugs,
} from "@/lib/mocks";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ version?: string | string[] }>;
}

export function generateStaticParams() {
  return getAdminDocumentVersionHistorySlugs().map((slug) => ({ slug }));
}

export default function AdminDocumentHistoryPage(props: Props) {
  return (
    <Suspense fallback={<p role="status">Memuat riwayat versi…</p>}>
      <AdminDocumentHistoryContent {...props} />
    </Suspense>
  );
}

export async function AdminDocumentHistoryContent({
  params,
  searchParams,
}: Props) {
  const [{ slug }, { version }] = await Promise.all([params, searchParams]);
  const result = getAdminDocumentVersionHistoryMock(slug, "success");
  if (!result) {
    notFound();
  }
  const restoredVersionId =
    typeof version === "string" &&
    result.status === "success" &&
    result.data.versions.some((item) => item.id === version)
      ? version
      : undefined;
  return (
    <AdminDocumentVersionHistory
      restoredVersionId={restoredVersionId}
      result={result}
    />
  );
}
