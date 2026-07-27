export interface UploadFileMetadata {
  name: string;
  size: number;
  type: string;
}

export type UploadValidation =
  | { status: "valid" }
  | { status: "unsupported"; message: string }
  | { status: "oversized"; message: string };

export interface QueuedUpload {
  fileName: string;
  processingStatus: "queued";
  targetSlug: string;
  targetTitle: string;
  uploadMode: UploadMode;
}

export type UploadMode = "new-document" | "new-version";

export const ADMIN_UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const MAX_ADMIN_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateUploadFile(file: UploadFileMetadata): UploadValidation {
  if (file.size > MAX_ADMIN_UPLOAD_BYTES) {
    return {
      message: "Ukuran file melebihi batas 10 MB.",
      status: "oversized",
    };
  }

  const extension = file.name.toLowerCase().match(/\.(pdf|docx?)$/)?.[1];
  if (!extension || MIME_BY_EXTENSION[extension] !== file.type.toLowerCase()) {
    return {
      message: "Format tidak didukung. Pilih file PDF, DOC, atau DOCX.",
      status: "unsupported",
    };
  }
  return { status: "valid" };
}

export function formatUploadSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 1,
    }).format(bytes / 1024)} KB`;
  }
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(
    bytes / (1024 * 1024)
  )} MB`;
}

export function createQueuedUpload(
  targetSlug: string,
  fileName: string,
  targetTitle = targetSlug,
  uploadMode: UploadMode = "new-version"
): QueuedUpload {
  return {
    fileName,
    processingStatus: "queued",
    targetSlug,
    targetTitle,
    uploadMode,
  };
}

export function normalizeNewDocumentTitle(
  value: string
):
  | { status: "valid"; slug: string; title: string }
  | { status: "invalid"; message: string } {
  const title = value.trim().replace(/\s+/g, " ");
  if (!title) {
    return { message: "Judul BPP wajib diisi.", status: "invalid" };
  }
  if (title.length > 120) {
    return { message: "Judul BPP maksimal 120 karakter.", status: "invalid" };
  }
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) {
    return {
      message: "Judul BPP harus memuat huruf atau angka.",
      status: "invalid",
    };
  }
  return { slug, status: "valid", title };
}

const MIME_BY_EXTENSION: Record<string, string> = {
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};
