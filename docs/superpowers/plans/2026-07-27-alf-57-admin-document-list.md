# ALF-57 Admin BPP Document List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the accessible mocked admin BPP document list at `/admin`, including populated, loading, and empty states plus stable document-detail and upload navigation.

**Architecture:** Extend the existing document mock boundary with a discriminated admin-list result while preserving employee document APIs. Render the result through a focused Server Component; use a semantic table on larger screens and labelled cards on small screens, with normal Next links for navigation.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, Tailwind CSS, existing shadcn-style Button, Lucide icons, Node test runner, React server rendering.

## Global Constraints

- Follow `/workspace/apps/bppedia/AGENTS.md` and `docs/lessons.md`.
- Reuse `lib/mocks/documents.ts`; do not create a global mock module.
- Use existing tokens/components; add no dependency, font, raw color, animation, backend call, or persistence.
- Keep search/filter, archive/restore, upload behavior, history, rollback, processing transitions, preview, and publish out of scope.
- Add tests only for mock behavior and render contracts that catch real regressions; never assert Tailwind classes.
- Do not add or run Playwright/E2E on the VPS.
- Keep Server Components by default; no client boundary is required.
- Commit only after RED → GREEN evidence.

---

### Task 1: Mocked admin document list

**Files:**
- Modify: `lib/mocks/documents.ts`
- Modify: `lib/mocks/index.ts`
- Test: `tests/unit/admin-document-list.test.ts`

**Interfaces:**
- Produces `AdminDocumentStatus = "active" | "processing" | "failed" | "archived"`.
- Produces `AdminDocumentListItem` with `slug`, `title`, `activeVersionLabel`, `status`, and `updatedAt`.
- Produces `AdminDocumentListScenario = "success" | "loading" | "empty"`.
- Produces `AdminDocumentListResult` as `{ status: "loading" } | { status: "empty" } | { status: "success"; data: { documents: AdminDocumentListItem[] } }`.
- Produces `getAdminDocumentListMock(scenario: AdminDocumentListScenario): AdminDocumentListResult`.
- Task 2 consumes all interfaces through `@/lib/mocks`.

- [ ] **Step 1: Write the failing mock-contract test**

Create `tests/unit/admin-document-list.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getAdminDocumentListMock } from "@/lib/mocks";

describe("admin document list mock", () => {
  test("selects populated, loading, and empty states", () => {
    const success = getAdminDocumentListMock("success");

    assert.equal(success.status, "success");
    if (success.status !== "success") {
      throw new Error("Expected populated admin documents");
    }

    assert.ok(success.data.documents.length >= 2);
    assert.ok(success.data.documents.some((document) => document.status === "active"));
    for (const document of success.data.documents) {
      assert.ok(document.slug.length > 0);
      assert.ok(document.title.length > 0);
      assert.match(document.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
    }
    assert.deepEqual(getAdminDocumentListMock("loading"), { status: "loading" });
    assert.deepEqual(getAdminDocumentListMock("empty"), { status: "empty" });
  });

  test("isolates populated fixtures from caller mutation", () => {
    const first = getAdminDocumentListMock("success");
    const second = getAdminDocumentListMock("success");

    assert.equal(first.status, "success");
    assert.equal(second.status, "success");
    if (first.status !== "success" || second.status !== "success") {
      throw new Error("Expected populated admin documents");
    }

    first.data.documents[0].title = "Changed by caller";
    assert.notEqual(second.data.documents[0].title, first.data.documents[0].title);
  });
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
pnpm exec tsx --test tests/unit/admin-document-list.test.ts
```

Expected: FAIL because `getAdminDocumentListMock` is not exported.

- [ ] **Step 3: Add the minimal typed fixtures and scenario getter**

Append the following domain to `lib/mocks/documents.ts`:

```ts
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
  return { data: { documents: structuredClone(ADMIN_DOCUMENT_LIST) }, status: "success" };
}
```

Update `lib/mocks/index.ts` to export the new types and getter:

```ts
export type {
  AdminDocumentListItem,
  AdminDocumentListResult,
  AdminDocumentListScenario,
  AdminDocumentStatus,
} from "./documents";
export { getAdminDocumentListMock } from "./documents";
```

Keep existing document overview exports unchanged.

- [ ] **Step 4: Run focused GREEN checks**

Run:

```bash
pnpm exec tsx --test tests/unit/admin-document-list.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check lib/mocks/documents.ts lib/mocks/index.ts tests/unit/admin-document-list.test.ts
```

Expected: 2 tests pass; TypeScript exits 0; Ultracite reports no fixes.

- [ ] **Step 5: Commit the mock boundary**

```bash
git add lib/mocks/documents.ts lib/mocks/index.ts tests/unit/admin-document-list.test.ts
git commit -m "feat: add admin document list mocks"
```

---

### Task 2: Responsive admin document list screen

**Files:**
- Create: `components/admin/admin-document-list.tsx`
- Modify: `app/(admin)/admin/page.tsx`
- Test: `tests/unit/admin-document-list-render.test.ts`

**Interfaces:**
- Consumes `AdminDocumentListResult` and `getAdminDocumentListMock` from `@/lib/mocks`.
- Produces `AdminDocumentList({ result }: { result: AdminDocumentListResult })` as a Server Component.
- Produces document detail links `/admin/documents/${document.slug}` and upload links `/admin/documents/upload`.

- [ ] **Step 1: Write the failing render-contract test**

Create `tests/unit/admin-document-list-render.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminDocumentList } from "@/components/admin/admin-document-list";
import { getAdminDocumentListMock } from "@/lib/mocks";

function renderScenario(scenario: "success" | "loading" | "empty") {
  return renderToStaticMarkup(
    createElement(AdminDocumentList, {
      result: getAdminDocumentListMock(scenario),
    })
  );
}

describe("admin document list render contract", () => {
  test("renders document metadata and stable navigation", () => {
    const markup = renderScenario("success");

    assert.match(markup, /Dokumen BPP/);
    assert.match(markup, /Versi aktif/);
    assert.match(markup, /Status/);
    assert.match(markup, /Terakhir diperbarui/);
    assert.match(markup, /Kebijakan Benefit Karyawan/);
    assert.match(markup, /2026\.1/);
    assert.match(markup, /Aktif/);
    assert.match(markup, /href="\/admin\/documents\/employee-benefits"/);
    assert.match(markup, /href="\/admin\/documents\/upload"/);
  });

  test("renders explicit loading and empty states", () => {
    const loading = renderScenario("loading");
    const empty = renderScenario("empty");

    assert.match(loading, /aria-busy="true"/);
    assert.match(loading, /Memuat dokumen BPP/);
    assert.match(empty, /Belum ada dokumen BPP/);
    assert.match(empty, /href="\/admin\/documents\/upload"/);
  });
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
pnpm exec tsx --test tests/unit/admin-document-list-render.test.ts
```

Expected: FAIL because `@/components/admin/admin-document-list` does not exist.

- [ ] **Step 3: Implement the minimal Server Component and route composition**

Create `components/admin/admin-document-list.tsx` with:

- Imports for `Link`, `Upload` from `lucide-react`, `Button`, and `AdminDocumentListResult`.
- A module-level `Intl.DateTimeFormat("id-ID", { dateStyle: "medium" })`.
- A status-label map: `active → Aktif`, `processing → Diproses`, `failed → Gagal`, `archived → Diarsipkan`.
- A shared internal document-link renderer targeting `/admin/documents/${slug}`.
- Loading output with `aria-busy="true"`, `role="status"`, text `Memuat dokumen BPP…`, and four neutral fixed-height placeholders.
- Empty output headed `Belum ada dokumen BPP`, explanatory copy, and a Button using `asChild` around a Link to `/admin/documents/upload`.
- Success output with:
  - a page header containing `Dokumen BPP`, supporting copy, and primary `Unggah BPP` Button/Link;
  - a semantic table hidden below the `md` breakpoint, with `<caption className="sr-only">Daftar dokumen BPP</caption>` and the four required headers;
  - a mobile `<ul>` hidden at `md` and above; each card uses visible labels for version, status, and updated date;
  - status text always visible and active version falling back to `Belum ada` when `null`.

Do not make `<tr>` clickable and do not add `"use client"`.

Replace `app/(admin)/admin/page.tsx` with:

```tsx
import { AdminDocumentList } from "@/components/admin/admin-document-list";
import { getAdminDocumentListMock } from "@/lib/mocks";

export default function AdminPage() {
  return <AdminDocumentList result={getAdminDocumentListMock("success")} />;
}
```

- [ ] **Step 4: Run focused GREEN checks**

Run:

```bash
pnpm exec tsx --test tests/unit/admin-document-list-render.test.ts tests/unit/admin-document-list.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check "app/(admin)/admin/page.tsx" components/admin/admin-document-list.tsx tests/unit/admin-document-list-render.test.ts
```

Expected: 4 tests pass; TypeScript exits 0; Ultracite reports no fixes.

- [ ] **Step 5: Update Graphify and commit the screen**

```bash
export PATH="/opt/data/bin:/opt/data/home/.local/bin:$PATH"
graphify update .
git diff --check
git add "app/(admin)/admin/page.tsx" components/admin/admin-document-list.tsx tests/unit/admin-document-list-render.test.ts
git commit -m "feat: build admin document list"
```

Expected: Graphify completes, diff check is clean, and commit succeeds.

---

## Final Verification and Handoff

After both tasks, run once from the controller session:

```bash
pnpm exec tsx --test tests/unit/admin-document-list.test.ts tests/unit/admin-document-list-render.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check lib/mocks/documents.ts lib/mocks/index.ts "app/(admin)/admin/page.tsx" components/admin/admin-document-list.tsx tests/unit/admin-document-list.test.ts tests/unit/admin-document-list-render.test.ts
pnpm exec next build
```

Expected: 4 focused tests pass, TypeScript and Ultracite exit 0, and direct Next production build succeeds. Do not run `pnpm build` when local PostgreSQL is unavailable because that wrapper runs migrations first. Never run Playwright/E2E on the VPS.

Request one proportional scoped review over the issue diff. Fix Critical/Important findings only; do not loop on style nits. Push the branch, attach exact evidence to ALF-57, and move it to Review. Because ALF-57 unblocks four dependent frontend issues, do not mark it Done before merge approval.