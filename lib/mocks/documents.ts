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
