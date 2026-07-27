import { Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type {
  AdminDocumentListItem,
  AdminDocumentListResult,
} from "@/lib/mocks";

interface AdminDocumentListProps {
  result: AdminDocumentListResult;
}

export function AdminDocumentList({ result }: AdminDocumentListProps) {
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
          {result.data.documents.map((document) => (
            <tr className="border-b border-border" key={document.slug}>
              <th className="px-4 py-4 text-left font-medium" scope="row">
                <DocumentLink document={document} />
              </th>
              <td className="px-4 py-4">
                {document.activeVersionLabel ?? "Belum ada"}
              </td>
              <td className="px-4 py-4">{STATUS_LABELS[document.status]}</td>
              <td className="px-4 py-4">{formatDate(document.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="space-y-3 md:hidden">
        {result.data.documents.map((document) => (
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
            </dl>
          </li>
        ))}
      </ul>
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

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});

const LOADING_PLACEHOLDERS = ["first", "second", "third", "fourth"] as const;

const STATUS_LABELS = {
  active: "Aktif",
  archived: "Diarsipkan",
  failed: "Gagal",
  processing: "Diproses",
} as const;
