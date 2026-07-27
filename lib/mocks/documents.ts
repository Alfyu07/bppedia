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
