// biome-ignore-all lint/performance/noJsxPropsBind: local retry controls require version ids.
"use client";

import Link from "next/link";
import { useState } from "react";
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
  const [versions, setVersions] = useState(() =>
    result.status === "success" ? structuredClone(result.data.versions) : []
  );
  const [announcement, setAnnouncement] = useState("");
  if (result.status === "loading") {
    return (
      <section aria-busy="true" className="space-y-4" role="status">
        <p>Memuat riwayat versi…</p>
      </section>
    );
  }
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <Link
          className="inline-flex min-h-11 items-center text-sm hover:underline"
          href="/admin"
        >
          ← Kembali ke dokumen BPP
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{result.data.title}</h1>
          <p className="text-muted-foreground">Riwayat versi BPP</p>
        </div>
      </header>
      <h2 className="text-xl font-semibold">Riwayat versi</h2>
      {result.status === "success" ? (
        <p className="rounded-lg border border-blue-600/30 bg-blue-500/5 p-4 text-sm">
          Versi aktif tetap digunakan selama versi baru diproses atau jika
          pemrosesan gagal.
        </p>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {result.status === "empty" ? (
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">Belum ada riwayat versi</h3>
          <p>Versi akan muncul setelah dokumen BPP diunggah dan diproses.</p>
        </div>
      ) : (
        <VersionList
          onRetry={(id) => {
            setVersions((current) =>
              current.map((version) =>
                version.id === id
                  ? {
                      ...version,
                      failureReason: undefined,
                      processingStatus: "queued",
                    }
                  : version
              )
            );
            setAnnouncement("Pemrosesan dicoba lagi dan masuk antrean.");
          }}
          slug={result.data.slug}
          title={result.data.title}
          versions={versions}
        />
      )}
    </section>
  );
}

function VersionList({
  onRetry,
  slug,
  title,
  versions,
}: {
  onRetry: (id: string) => void;
  slug: string;
  title: string;
  versions: AdminDocumentVersionItem[];
}) {
  return (
    <>
      <table className="hidden w-full border-collapse md:table">
        <caption className="sr-only">Riwayat versi {title}</caption>
        <thead>
          <tr>
            {TABLE_HEADERS.map((header) => (
              <th className="px-4 py-3 text-left" key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {versions.map((version) => (
            <tr className="border-t align-top" key={version.id}>
              <th className="px-4 py-4 text-left" scope="row">
                <VersionLabel version={version} />
              </th>
              <td className="px-4 py-4">
                <VersionStatus version={version} />
              </td>
              <td className="px-4 py-4">{formatDate(version.createdAt)}</td>
              <td className="px-4 py-4">
                <VersionAction
                  onRetry={onRetry}
                  slug={slug}
                  version={version}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="space-y-3 md:hidden">
        {versions.map((version) => (
          <li className="space-y-3 rounded-lg border p-4" key={version.id}>
            <VersionLabel version={version} />
            <dl className="space-y-3 text-sm">
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
              <div>
                <dt className="text-muted-foreground">Tindakan</dt>
                <dd>
                  <VersionAction
                    isMobile
                    onRetry={onRetry}
                    slug={slug}
                    version={version}
                  />
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
    <span className="flex flex-wrap gap-2">
      Versi {version.label}
      {version.isActive ? <Badge variant="success">Aktif</Badge> : null}
    </span>
  );
}
function VersionStatus({ version }: { version: AdminDocumentVersionItem }) {
  const copy = STATUS_COPY[version.processingStatus];
  return (
    <span className="space-y-1">
      <Badge
        variant={version.processingStatus === "failed" ? "error" : "secondary"}
      >
        {copy.label}
      </Badge>
      <span className="block text-sm text-muted-foreground">
        {version.failureReason ?? copy.description}
      </span>
    </span>
  );
}
function VersionAction({
  isMobile = false,
  onRetry,
  slug,
  version,
}: {
  isMobile?: boolean;
  onRetry: (id: string) => void;
  slug: string;
  version: AdminDocumentVersionItem;
}) {
  const width = isMobile ? " w-full" : "";
  if (version.processingStatus === "failed") {
    return (
      <Button
        className={`min-h-11${width}`}
        onClick={() => onRetry(version.id)}
        type="button"
        variant="outline"
      >
        Coba lagi
      </Button>
    );
  }
  if (version.processingStatus === "ready") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button asChild className={`min-h-11${width}`} variant="outline">
          <Link href={`/documents/${slug}`}>Pratinjau</Link>
        </Button>
        {version.isActive ? (
          <span>Versi aktif</span>
        ) : (
          <Button
            className={`min-h-11${width}`}
            type="button"
            variant="outline"
          >
            Rollback ke versi ini
          </Button>
        )}
      </div>
    );
  }
  return "Tersedia setelah pemrosesan selesai";
}
function formatDate(value: string) {
  return DATE_FORMATTER.format(new Date(value));
}

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});
const TABLE_HEADERS = ["Versi", "Status", "Ditambahkan", "Tindakan"] as const;
const STATUS_COPY = {
  converting: {
    description: "File sedang diubah ke format yang dapat dibaca.",
    label: "Menyiapkan file",
  },
  extracting: {
    description: "Teks dan informasi penting sedang dibaca.",
    label: "Membaca isi",
  },
  failed: {
    description: "Versi ini belum dapat digunakan.",
    label: "Pemrosesan gagal",
  },
  indexing: {
    description: "Isi dokumen sedang disiapkan agar dapat dicari.",
    label: "Menyiapkan pencarian",
  },
  queued: {
    description: "File sudah diterima dan akan segera diproses.",
    label: "Menunggu giliran",
  },
  ready: {
    description: "Versi selesai diproses dan dapat ditinjau.",
    label: "Siap digunakan",
  },
} as const;
