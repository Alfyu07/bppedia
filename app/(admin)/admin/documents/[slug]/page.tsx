import { notFound } from "next/navigation";
import { AdminDocumentVersionHistory } from "@/components/admin/admin-document-version-history";
import { getAdminDocumentVersionHistoryMock } from "@/lib/mocks";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminDocumentHistoryPage({ params }: Props) {
  const { slug } = await params;
  const result = getAdminDocumentVersionHistoryMock(slug, "success");
  if (!result) {
    notFound();
  }
  return <AdminDocumentVersionHistory result={result} />;
}
