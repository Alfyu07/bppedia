// biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: the labeled native file input also accepts standard file-drop events.
// biome-ignore-all lint/performance/noJsxPropsBind: local form handlers require current file, target, and event values.
"use client";

import { FileUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ADMIN_UPLOAD_ACCEPT,
  createQueuedUpload,
  formatUploadSize,
  type QueuedUpload,
  type UploadValidation,
  validateUploadFile,
} from "@/lib/admin-document-upload";

export function AdminDocumentUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<UploadValidation | null>(null);
  const [targetSlug, setTargetSlug] = useState<string>(TARGETS[0].slug);
  const [queuedUpload, setQueuedUpload] = useState<QueuedUpload | null>(null);

  function selectFile(file?: File) {
    setQueuedUpload(null);
    if (!file) {
      return;
    }
    const result = validateUploadFile(file);
    setValidation(result);
    setSelectedFile(result.status === "valid" ? file : null);
  }

  function queueVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedFile && validation?.status === "valid") {
      setQueuedUpload(createQueuedUpload(targetSlug, selectedFile.name));
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <Link
          className="inline-flex min-h-11 items-center text-sm hover:underline"
          href="/admin"
        >
          ← Kembali ke dokumen BPP
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Unggah dokumen BPP</h1>
          <p className="text-muted-foreground">
            Tambahkan file sebagai versi baru. Pemrosesan hanya disimulasikan di
            halaman ini.
          </p>
        </div>
      </header>

      <form className="space-y-6" onSubmit={queueVersion}>
        <label
          className="block rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors focus-within:border-foreground sm:p-10"
          htmlFor="bpp-upload"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            selectFile(event.dataTransfer.files[0]);
          }}
        >
          <FileUp
            aria-hidden="true"
            className="mx-auto mb-3 size-8 text-muted-foreground"
          />
          <span className="inline-flex min-h-11 cursor-pointer items-center font-medium underline">
            Pilih atau tarik file ke sini
          </span>
          <input
            accept={ADMIN_UPLOAD_ACCEPT}
            className="sr-only"
            id="bpp-upload"
            onChange={(event) => selectFile(event.currentTarget.files?.[0])}
            type="file"
          />
          <span className="mt-1 block text-sm text-muted-foreground">
            PDF, DOC, atau DOCX hingga 10 MB
          </span>
        </label>

        {validation && validation.status !== "valid" ? (
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
            role="alert"
          >
            <p className="font-medium">
              {validation.status === "oversized"
                ? "File terlalu besar"
                : "File tidak didukung"}
            </p>
            <p>{validation.message}</p>
          </div>
        ) : null}

        {selectedFile ? (
          <section
            aria-labelledby="review-heading"
            className="space-y-4 rounded-xl border p-5"
          >
            <h2 className="text-lg font-semibold" id="review-heading">
              Tinjau unggahan
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Metadata label="Nama file" value={selectedFile.name} />
              <Metadata
                label="Jenis file"
                value={fileTypeLabel(selectedFile.name)}
              />
              <Metadata
                label="Ukuran"
                value={formatUploadSize(selectedFile.size)}
              />
            </dl>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="target-bpp">
                Target BPP
              </label>
              <select
                className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="target-bpp"
                onChange={(event) => {
                  setTargetSlug(event.currentTarget.value);
                  setQueuedUpload(null);
                }}
                value={targetSlug}
              >
                {TARGETS.map((target) => (
                  <option key={target.slug} value={target.slug}>
                    {target.title}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                File akan menjadi versi baru untuk BPP yang dipilih.
              </p>
            </div>
          </section>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button asChild className="min-h-11" variant="outline">
            <Link href="/admin">Batal</Link>
          </Button>
          <Button
            className="min-h-11"
            disabled={!selectedFile || queuedUpload !== null}
            type="submit"
          >
            Antrekan versi
          </Button>
        </div>
      </form>

      <div aria-atomic="true" aria-live="polite">
        {queuedUpload ? (
          <div
            className="rounded-lg border border-blue-600/40 bg-blue-500/5 p-4"
            role="status"
          >
            <p className="font-medium">
              Versi masuk antrean · Menunggu pemrosesan
            </p>
            <p className="text-sm text-muted-foreground">
              {queuedUpload.fileName} sedang menunggu pemrosesan untuk{" "}
              {targetTitle(queuedUpload.targetSlug)}.
            </p>
            <Link
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium underline"
              href={`/admin/documents/${queuedUpload.targetSlug}`}
            >
              Lihat status versi
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words font-medium">{value}</dd>
    </div>
  );
}

function fileTypeLabel(name: string) {
  return name.split(".").at(-1)?.toUpperCase() ?? "—";
}

function targetTitle(slug: string) {
  return TARGETS.find((target) => target.slug === slug)?.title ?? slug;
}

const TARGETS = [
  { slug: "employee-benefits", title: "Kebijakan Benefit Karyawan" },
  { slug: "employee-mobility", title: "Panduan Mobilitas Karyawan" },
  { slug: "employee-travel", title: "Pedoman Perjalanan Dinas" },
] as const;
