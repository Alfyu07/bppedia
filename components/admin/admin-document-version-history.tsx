// biome-ignore-all lint/performance/noJsxPropsBind: local retry controls require version ids.
"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type AdminDocumentHistoryResult,
  type AdminDocumentVersionItem,
  applyAdminDocumentPublishMock,
  applyAdminDocumentRollbackMock,
  getAdminDocumentPublishCandidateMock,
  getAdminDocumentRollbackCandidateMock,
  parseAdminDocumentPublishStateMock,
} from "@/lib/mocks";

interface AdminDocumentVersionHistoryProps {
  restoredVersionId?: string;
  result: AdminDocumentHistoryResult;
}

export function AdminDocumentVersionHistory({
  restoredVersionId,
  result,
}: AdminDocumentVersionHistoryProps) {
  const [versions, setVersions] = useState(() =>
    result.status === "success" ? structuredClone(result.data.versions) : []
  );
  const [announcement, setAnnouncement] = useState("");
  const [isClientReady, setIsClientReady] = useState(false);
  const [publishVersionId, setPublishVersionId] = useState<string | null>(null);
  const [rollbackVersionId, setRollbackVersionId] = useState<string | null>(
    null
  );
  const rollbackTriggerRef = useRef<HTMLButtonElement | null>(null);
  const historyHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const documentSlug = result.status === "loading" ? null : result.data.slug;
  useEffect(() => {
    if (!documentSlug) {
      setIsClientReady(false);
      return;
    }
    const stored = parseAdminDocumentPublishStateMock(
      localStorage.getItem(PUBLISH_STATE_KEY)
    );
    if (stored?.document.slug === documentSlug) {
      setVersions(stored.versions);
    }
    const readyFrame = requestAnimationFrame(() => setIsClientReady(true));
    return () => cancelAnimationFrame(readyFrame);
  }, [documentSlug]);
  if (result.status === "loading") {
    return (
      <section aria-busy="true" className="space-y-4" role="status">
        <p>Memuat riwayat versi…</p>
      </section>
    );
  }
  return (
    <section
      className="space-y-6"
      data-client-ready={isClientReady ? "true" : "false"}
      data-testid="admin-version-history"
    >
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
      <h2
        className="text-xl font-semibold"
        ref={historyHeadingRef}
        tabIndex={-1}
      >
        Riwayat versi
      </h2>
      {result.status === "success" ? (
        <div className="space-y-2 rounded-lg border border-blue-600/30 bg-blue-500/5 p-4 text-sm">
          <p>
            Versi aktif tetap digunakan selama versi baru diproses atau jika
            pemrosesan gagal.
          </p>
          <p>
            Versi aktif pada daftar dokumen:{" "}
            {versions.find((version) => version.isActive)?.label ?? "—"}
          </p>
        </div>
      ) : null}
      <p aria-atomic="true" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {restoredVersionId && result.status === "success" ? (
        <p className="sr-only" role="status">
          Konteks pratinjau dipulihkan untuk versi{" "}
          {
            result.data.versions.find(
              (version) => version.id === restoredVersionId
            )?.label
          }
        </p>
      ) : null}
      {result.status === "empty" ? (
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">Belum ada riwayat versi</h3>
          <p>Versi akan muncul setelah dokumen BPP diunggah dan diproses.</p>
        </div>
      ) : (
        <VersionList
          onPublish={setPublishVersionId}
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
          onRollback={(id, trigger) => {
            rollbackTriggerRef.current = trigger;
            setRollbackVersionId(id);
          }}
          restoredVersionId={restoredVersionId}
          slug={result.data.slug}
          title={result.data.title}
          versions={versions}
        />
      )}
      {result.status === "success" ? (
        <PublishDialog
          onConfirm={() => {
            if (!publishVersionId) {
              return;
            }
            const next = applyAdminDocumentPublishMock(
              {
                document: {
                  activeVersionLabel:
                    versions.find((version) => version.isActive)?.label ?? null,
                  slug: result.data.slug,
                  status: "active",
                  title: result.data.title,
                  updatedAt: "2026-07-27T00:00:00.000Z",
                },
                versions,
              },
              publishVersionId
            );
            if (next) {
              setVersions(next.versions);
              localStorage.setItem(PUBLISH_STATE_KEY, JSON.stringify(next));
              setAnnouncement(
                `Versi ${next.document.activeVersionLabel} kini aktif pada daftar dokumen dan riwayat versi.`
              );
            }
            setPublishVersionId(null);
          }}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setPublishVersionId(null);
            }
          }}
          versionLabel={
            versions.find(({ id }) => id === publishVersionId)?.label
          }
        />
      ) : null}
      {result.status === "success" ? (
        <RollbackDialog
          currentLabel={versions.find(({ isActive }) => isActive)?.label}
          fallbackFocusRef={historyHeadingRef}
          onConfirm={() => {
            if (!rollbackVersionId) {
              return;
            }
            const next = applyAdminDocumentRollbackMock(
              createPublishState(result.data, versions),
              rollbackVersionId
            );
            if (next) {
              setVersions(next.versions);
              localStorage.setItem(PUBLISH_STATE_KEY, JSON.stringify(next));
              setAnnouncement(
                `Versi ${next.document.activeVersionLabel} kini aktif pada daftar dokumen dan riwayat versi.`
              );
            }
            setRollbackVersionId(null);
          }}
          onOpenChange={(open) => {
            if (!open) {
              setRollbackVersionId(null);
            }
          }}
          targetLabel={
            versions.find(({ id }) => id === rollbackVersionId)?.label
          }
          triggerRef={rollbackTriggerRef}
        />
      ) : null}
    </section>
  );
}

function VersionList({
  onPublish,
  onRollback,
  onRetry,
  restoredVersionId,
  slug,
  title,
  versions,
}: {
  onPublish: (id: string) => void;
  onRollback: (id: string, trigger: HTMLButtonElement) => void;
  onRetry: (id: string) => void;
  restoredVersionId?: string;
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
              <th
                aria-current={version.id === restoredVersionId || undefined}
                className="px-4 py-4 text-left"
                scope="row"
              >
                <VersionLabel version={version} />
              </th>
              <td className="px-4 py-4">
                <VersionStatus version={version} />
              </td>
              <td className="px-4 py-4">{formatDate(version.createdAt)}</td>
              <td className="px-4 py-4">
                <VersionAction
                  onPublish={onPublish}
                  onRetry={onRetry}
                  onRollback={onRollback}
                  slug={slug}
                  version={version}
                  versions={versions}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="space-y-3 md:hidden">
        {versions.map((version) => (
          <li
            aria-current={version.id === restoredVersionId || undefined}
            className="space-y-3 rounded-lg border p-4"
            key={version.id}
          >
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
                    onPublish={onPublish}
                    onRetry={onRetry}
                    onRollback={onRollback}
                    slug={slug}
                    version={version}
                    versions={versions}
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
  onPublish,
  onRollback,
  onRetry,
  slug,
  version,
  versions,
}: {
  isMobile?: boolean;
  onPublish: (id: string) => void;
  onRollback: (id: string, trigger: HTMLButtonElement) => void;
  onRetry: (id: string) => void;
  slug: string;
  version: AdminDocumentVersionItem;
  versions: AdminDocumentVersionItem[];
}) {
  const width = isMobile ? " w-full" : "";
  const canPublish = Boolean(
    getAdminDocumentPublishCandidateMock(slug, [version], version.id)
  );
  const canRollback = Boolean(
    getAdminDocumentRollbackCandidateMock(
      createPublishState({ slug, title: "" }, versions),
      version.id
    )
  );
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
          <Link
            href={`/admin/documents/${slug}/preview?version=${encodeURIComponent(version.id)}`}
          >
            Pratinjau
          </Link>
        </Button>
        {version.isActive ? (
          <span>Versi aktif</span>
        ) : (
          <>
            {canPublish ? (
              <Button
                aria-label={`Publikasikan versi ${version.label}`}
                className={`min-h-11${width}`}
                onClick={() => onPublish(version.id)}
                type="button"
              >
                Publikasikan
              </Button>
            ) : null}
            {canRollback ? (
              <Button
                aria-label={`Rollback ke versi ${version.label}`}
                className={`min-h-11${width}`}
                onClick={(event) => onRollback(version.id, event.currentTarget)}
                type="button"
                variant="outline"
              >
                Rollback ke versi ini
              </Button>
            ) : null}
          </>
        )}
      </div>
    );
  }
  return "Tersedia setelah pemrosesan selesai";
}

function RollbackDialog({
  currentLabel,
  fallbackFocusRef,
  onConfirm,
  onOpenChange,
  targetLabel,
  triggerRef,
}: {
  currentLabel?: string;
  fallbackFocusRef: { current: HTMLHeadingElement | null };
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  targetLabel?: string;
  triggerRef: { current: HTMLButtonElement | null };
}) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={Boolean(targetLabel)}>
      <AlertDialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const focusTarget = triggerRef.current?.isConnected
            ? triggerRef.current
            : fallbackFocusRef.current;
          focusTarget?.focus();
          triggerRef.current = null;
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            Rollback ke versi {targetLabel ?? ""}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Rollback dari versi {currentLabel ?? ""} ke versi{" "}
            {targetLabel ?? ""}. Versi target akan menjadi versi aktif pada
            daftar dokumen dan riwayat versi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">Batal</AlertDialogCancel>
          <AlertDialogAction className="min-h-11" onClick={onConfirm}>
            Konfirmasi rollback
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
function createPublishState(
  document: { slug: string; title: string },
  versions: AdminDocumentVersionItem[]
) {
  return {
    document: {
      activeVersionLabel:
        versions.find(({ isActive }) => isActive)?.label ?? null,
      slug: document.slug,
      status: "active" as const,
      title: document.title,
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    versions,
  };
}

function PublishDialog({
  onConfirm,
  onOpenChange,
  versionLabel,
}: {
  onConfirm: () => void;
  onOpenChange: (isOpen: boolean) => void;
  versionLabel?: string;
}) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={Boolean(versionLabel)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Publikasikan versi {versionLabel ?? ""}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Versi {versionLabel ?? ""} akan menjadi versi aktif pada daftar
            dokumen dan riwayat versi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Konfirmasi publikasi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
function formatDate(value: string) {
  return DATE_FORMATTER.format(new Date(value));
}

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});
const TABLE_HEADERS = ["Versi", "Status", "Ditambahkan", "Tindakan"] as const;
const PUBLISH_STATE_KEY = "bppedia:admin-publish-state";
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
