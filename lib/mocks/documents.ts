export interface MockDocumentOverview {
  pageCount: number;
  pdfHref: string;
  slug: string;
  summary: string;
  title: string;
  versionId: string;
  versionLabel: string;
}

const MOCK_DOCUMENT_OVERVIEWS: Record<string, MockDocumentOverview> = {
  "employee-benefits": {
    pageCount: 12,
    pdfHref: "/documents/files/employee-benefits-v2026-1.pdf",
    slug: "employee-benefits",
    summary:
      "Gambaran umum kategori benefit karyawan yang tersedia dalam dokumen perusahaan.",
    title: "Kebijakan Benefit Karyawan",
    versionId: "employee-benefits-v2026-1",
    versionLabel: "2026.1",
  },
  "employee-mobility": {
    pageCount: 8,
    pdfHref: "/documents/files/employee-mobility-v2026-1.pdf",
    slug: "employee-mobility",
    summary:
      "Gambaran umum kebijakan perpindahan lokasi dan mobilitas karyawan.",
    title: "Panduan Mobilitas Karyawan",
    versionId: "employee-mobility-v2026-1",
    versionLabel: "2026.1",
  },
};

export function normalizeMockDocumentPage(
  values: readonly string[],
  pageCount: number
): number {
  if (!Number.isSafeInteger(pageCount) || pageCount <= 0) {
    throw new RangeError("pageCount must be a positive safe integer");
  }
  if (values.length !== 1 || !/^\d+$/.test(values[0])) {
    return 1;
  }

  const page = Number(values[0]);
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, pageCount) : 1;
}

export function getMockDocumentOverview(
  slug: string
): MockDocumentOverview | undefined {
  const overview = MOCK_DOCUMENT_OVERVIEWS[slug];
  return overview ? structuredClone(overview) : undefined;
}

export function getMockDocumentSlugs(): string[] {
  return Object.keys(MOCK_DOCUMENT_OVERVIEWS);
}

export type AdminDocumentStatus =
  | "active"
  | "processing"
  | "failed"
  | "archived";

export interface AdminDocumentListItem {
  activeVersionLabel: string | null;
  slug: string;
  status: AdminDocumentStatus;
  title: string;
  updatedAt: string;
}

export type AdminDocumentListScenario = "success" | "loading" | "empty";

export type AdminDocumentListResult =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "success"; data: { documents: AdminDocumentListItem[] } };

const ADMIN_DOCUMENT_LIST: AdminDocumentListItem[] = [
  {
    activeVersionLabel: "2026.1",
    slug: "employee-benefits",
    status: "active",
    title: "Kebijakan Benefit Karyawan",
    updatedAt: "2026-07-24T08:30:00.000Z",
  },
  {
    activeVersionLabel: "2026.1",
    slug: "employee-mobility",
    status: "processing",
    title: "Panduan Mobilitas Karyawan",
    updatedAt: "2026-07-26T03:15:00.000Z",
  },
  {
    activeVersionLabel: null,
    slug: "employee-travel",
    status: "failed",
    title: "Pedoman Perjalanan Dinas",
    updatedAt: "2026-07-25T06:45:00.000Z",
  },
  {
    activeVersionLabel: "2025.3",
    slug: "employee-conduct",
    status: "archived",
    title: "Kode Etik Karyawan",
    updatedAt: "2026-07-22T02:00:00.000Z",
  },
];

export function getAdminDocumentListMock(
  scenario: AdminDocumentListScenario
): AdminDocumentListResult {
  if (scenario === "loading") {
    return { status: "loading" };
  }
  if (scenario === "empty") {
    return { status: "empty" };
  }
  return {
    data: { documents: structuredClone(ADMIN_DOCUMENT_LIST) },
    status: "success",
  };
}

export type AdminVersionProcessingStatus =
  | "queued"
  | "converting"
  | "extracting"
  | "indexing"
  | "ready"
  | "failed";

export type AdminDocumentHistoryScenario = "success" | "loading" | "empty";

export interface AdminDocumentVersionItem {
  createdAt: string;
  failureReason?: string;
  id: string;
  isActive: boolean;
  label: string;
  processingStatus: AdminVersionProcessingStatus;
}

export interface AdminDocumentVersionHistory {
  slug: string;
  title: string;
  versions: AdminDocumentVersionItem[];
}

export interface AdminDocumentVersionPreview {
  generatedPdfStatus: "ready";
  originalFileType: "DOCX" | "PDF";
  pageCount: number;
  pdfHref: string;
  slug: string;
  title: string;
  versionId: string;
  versionLabel: string;
}

export interface AdminDocumentPublishCandidate {
  slug: string;
  title: string;
  versionId: string;
  versionLabel: string;
}

export interface AdminDocumentPublishState {
  document: AdminDocumentListItem;
  versions: AdminDocumentVersionItem[];
}

export type AdminDocumentHistoryResult =
  | { status: "loading" }
  | {
      data: Pick<AdminDocumentVersionHistory, "slug" | "title">;
      status: "empty";
    }
  | { data: AdminDocumentVersionHistory; status: "success" };

const ADMIN_DOCUMENT_VERSION_HISTORIES: Record<
  string,
  AdminDocumentVersionHistory
> = {
  "employee-benefits": {
    slug: "employee-benefits",
    title: "Kebijakan Benefit Karyawan",
    versions: [
      {
        createdAt: "2026-07-26T08:30:00.000Z",
        id: "employee-benefits-v2026-4",
        isActive: false,
        label: "2026.4",
        processingStatus: "queued",
      },
      {
        createdAt: "2026-07-25T08:30:00.000Z",
        id: "employee-benefits-v2026-3",
        isActive: true,
        label: "2026.3",
        processingStatus: "ready",
      },
      {
        createdAt: "2026-07-24T08:30:00.000Z",
        failureReason:
          "Teks dokumen tidak dapat dibaca. Periksa file lalu coba lagi.",
        id: "employee-benefits-v2026-2",
        isActive: false,
        label: "2026.2",
        processingStatus: "failed",
      },
      {
        createdAt: "2026-07-23T08:30:00.000Z",
        id: "employee-benefits-v2026-1",
        isActive: false,
        label: "2026.1",
        processingStatus: "ready",
      },
      {
        createdAt: "2026-07-22T08:30:00.000Z",
        id: "employee-benefits-v2025-9",
        isActive: false,
        label: "2025.9",
        processingStatus: "converting",
      },
      {
        createdAt: "2026-07-21T08:30:00.000Z",
        id: "employee-benefits-v2025-8",
        isActive: false,
        label: "2025.8",
        processingStatus: "extracting",
      },
      {
        createdAt: "2026-07-20T08:30:00.000Z",
        id: "employee-benefits-v2025-7",
        isActive: false,
        label: "2025.7",
        processingStatus: "indexing",
      },
    ],
  },
  "employee-mobility": {
    slug: "employee-mobility",
    title: "Panduan Mobilitas Karyawan",
    versions: [
      {
        createdAt: "2026-07-26T08:30:00.000Z",
        id: "employee-mobility-v2026-2",
        isActive: false,
        label: "2026.2",
        processingStatus: "queued",
      },
      {
        createdAt: "2026-07-20T08:30:00.000Z",
        id: "employee-mobility-v2026-1",
        isActive: true,
        label: "2026.1",
        processingStatus: "ready",
      },
    ],
  },
  "employee-travel": {
    slug: "employee-travel",
    title: "Pedoman Perjalanan Dinas",
    versions: [
      {
        createdAt: "2026-07-26T08:30:00.000Z",
        id: "employee-travel-v2026-2",
        isActive: false,
        label: "2026.2",
        processingStatus: "queued",
      },
      {
        createdAt: "2026-07-20T08:30:00.000Z",
        id: "employee-travel-v2026-1",
        isActive: true,
        label: "2026.1",
        processingStatus: "ready",
      },
    ],
  },
};

export function getAdminDocumentVersionHistorySlugs(): string[] {
  return Object.keys(ADMIN_DOCUMENT_VERSION_HISTORIES);
}

export function getAdminDocumentVersionHistoryMock(
  slug: string,
  scenario: AdminDocumentHistoryScenario
): AdminDocumentHistoryResult | undefined {
  const history = ADMIN_DOCUMENT_VERSION_HISTORIES[slug];
  if (!history) {
    return;
  }
  if (scenario === "loading") {
    return { status: "loading" };
  }
  if (scenario === "empty") {
    return {
      data: structuredClone({ slug: history.slug, title: history.title }),
      status: "empty",
    };
  }

  const clonedHistory = structuredClone(history);
  clonedHistory.versions.sort(
    (a, b) =>
      Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
      a.id.localeCompare(b.id)
  );
  return { data: clonedHistory, status: "success" };
}

export function getAdminDocumentVersionPreviewMock(
  slug: string,
  versionId: string
): AdminDocumentVersionPreview | undefined {
  const history = ADMIN_DOCUMENT_VERSION_HISTORIES[slug];
  const version = history?.versions.find((item) => item.id === versionId);
  const canonicalDocument = MOCK_DOCUMENT_OVERVIEWS[slug];
  if (
    version?.processingStatus !== "ready" ||
    canonicalDocument?.versionId !== version.id
  ) {
    return;
  }

  return {
    generatedPdfStatus: "ready",
    originalFileType: "DOCX",
    pageCount: canonicalDocument.pageCount,
    pdfHref: canonicalDocument.pdfHref,
    slug,
    title: history.title,
    versionId: version.id,
    versionLabel: version.label,
  };
}

export function getAdminDocumentPublishCandidateMock(
  slug: string,
  versionsOrVersionId: AdminDocumentVersionItem[] | string,
  maybeVersionId?: string
): AdminDocumentPublishCandidate | undefined {
  const versions = Array.isArray(versionsOrVersionId)
    ? versionsOrVersionId
    : ADMIN_DOCUMENT_VERSION_HISTORIES[slug]?.versions;
  const versionId =
    maybeVersionId ??
    (typeof versionsOrVersionId === "string" ? versionsOrVersionId : "");
  const preview = getAdminDocumentVersionPreviewMock(slug, versionId);
  const version = versions?.find((item) => item.id === versionId);
  if (!preview || version?.isActive) {
    return;
  }
  return {
    slug,
    title: preview.title,
    versionId,
    versionLabel: preview.versionLabel,
  };
}

export function applyAdminDocumentPublishMock(
  state: AdminDocumentPublishState,
  versionId: string
): AdminDocumentPublishState | undefined {
  const candidate = state.versions.find((version) => version.id === versionId);
  if (
    candidate?.processingStatus !== "ready" ||
    candidate.isActive ||
    !getAdminDocumentPublishCandidateMock(
      state.document.slug,
      state.versions,
      versionId
    )
  ) {
    return;
  }
  return {
    document: {
      ...state.document,
      activeVersionLabel: candidate.label,
      status: "active",
    },
    versions: state.versions.map((version) => ({
      ...version,
      isActive: version.id === versionId,
    })),
  };
}

export function parseAdminDocumentPublishStateMock(
  value: string | null
): AdminDocumentPublishState | undefined {
  if (!value) {
    return;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") {
      return;
    }
    const state = parsed as Partial<AdminDocumentPublishState>;
    if (!state.document || !Array.isArray(state.versions)) {
      return;
    }
    const active = state.versions.filter((version) => version.isActive);
    if (
      active.length !== 1 ||
      active[0].label !== state.document.activeVersionLabel ||
      state.versions.some(
        (version) =>
          typeof version.id !== "string" ||
          typeof version.label !== "string" ||
          typeof version.isActive !== "boolean"
      )
    ) {
      return;
    }
    return structuredClone(state as AdminDocumentPublishState);
  } catch {
    // Invalid persisted mock data is ignored at the storage boundary.
  }
}
