import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AdminDocumentHistoryResult,
  AdminDocumentVersionItem,
} from "@/lib/mocks";

interface AdminDocumentVersionHistoryProps {
  result: AdminDocumentHistoryResult;
}

export function AdminDocumentVersionHistory({
  result,
}: AdminDocumentVersionHistoryProps) {
  if (result.status === "loading") {
    return (
      <section aria-busy="true" className="space-y-4" role="status">
        <p className="text-sm text-muted-foreground">Memuat riwayat versi…</p>
        <div className="space-y-3">
          {LOADING_PLACEHOLDERS.map((placeholder) => (
            <div className="h-16 rounded-lg bg-muted" key={placeholder} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <Link className="text-sm hover:underline" href="/admin">
          Kembali ke dokumen BPP
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{result.data.title}</h1>
          <p className="text-muted-foreground">Riwayat versi BPP</p>
        </div>
      </header>
      <h2 className="text-xl font-semibold">Riwayat versi</h2>

      {result.status === "empty" ? (
        <div className="space-y-2 rounded-lg border border-border p-6">
          <h3 className="font-semibold">Belum ada riwayat versi</h3>
          <p className="text-muted-foreground">
            Versi akan muncul setelah dokumen BPP diunggah dan diproses.
          </p>
        </div>
      ) : (
        <VersionList
          title={result.data.title}
          versions={result.data.versions}
        />
      )}
    </section>
  );
}

function VersionList({
  title,
  versions,
}: {
  title: string;
  versions: AdminDocumentVersionItem[];
}) {
  return (
    <>
      <table className="hidden w-full border-collapse md:table">
        <caption className="sr-only">Riwayat versi {title}</caption>
        <thead>
          <tr className="border-b border-border text-left text-sm">
            {TABLE_HEADERS.map((header) => (
              <th className="px-4 py-3 font-medium" key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {versions.map((version) => (
            <tr className="border-b border-border align-top" key={version.id}>
              <th className="px-4 py-4 text-left font-medium" scope="row">
                <VersionLabel version={version} />
              </th>
              <td className="px-4 py-4">
                <VersionStatus version={version} />
              </td>
              <td className="px-4 py-4">{formatDate(version.createdAt)}</td>
              <td className="px-4 py-4">
                <VersionAction version={version} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="space-y-3 md:hidden">
        {versions.map((version) => (
          <li
            className="space-y-4 rounded-lg border border-border p-4"
            key={version.id}
          >
            <h3 className="font-medium">
              <VersionLabel version={version} />
            </h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <VersionStatus version={version} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ditambahkan</dt>
                <dd>{formatDate(version.createdAt)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Tindakan</dt>
                <dd className="mt-1">
                  <VersionAction isMobile version={version} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

function VersionLabel({ version }: { version: AdminDocumentVersionItem }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      Versi {version.label}
      {version.isActive ? <Badge variant="success">Aktif</Badge> : null}
    </span>
  );
}

function VersionStatus({ version }: { version: AdminDocumentVersionItem }) {
  if (version.processingStatus === "failed") {
    return (
      <span className="space-y-1">
        <Badge variant="error">Pemrosesan gagal</Badge>
        <span className="block text-sm text-muted-foreground">
          Versi ini belum dapat digunakan.
        </span>
      </span>
    );
  }
  return version.processingStatus === "processed"
    ? "Selesai diproses"
    : "Sedang diproses";
}

function VersionAction({
  isMobile = false,
  version,
}: {
  isMobile?: boolean;
  version: AdminDocumentVersionItem;
}) {
  if (version.processingStatus === "processed" && !version.isActive) {
    return (
      <Button
        aria-label={`Rollback ke Versi ${version.label}`}
        className={`min-h-11 whitespace-normal${isMobile ? " w-full" : ""}`}
        type="button"
        variant="outline"
      >
        Rollback ke versi ini
      </Button>
    );
  }
  return version.isActive ? "Versi aktif" : "Tidak tersedia";
}

function formatDate(value: string) {
  return DATE_FORMATTER.format(new Date(value));
}

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});
const LOADING_PLACEHOLDERS = ["first", "second", "third", "fourth"] as const;
const TABLE_HEADERS = ["Versi", "Status", "Ditambahkan", "Tindakan"] as const;
