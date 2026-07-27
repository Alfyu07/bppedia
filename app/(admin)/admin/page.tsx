import { AdminDocumentList } from "@/components/admin/admin-document-list";
import { getAdminDocumentListMock } from "@/lib/mocks";

export default function AdminPage() {
  return <AdminDocumentList result={getAdminDocumentListMock("success")} />;
}
