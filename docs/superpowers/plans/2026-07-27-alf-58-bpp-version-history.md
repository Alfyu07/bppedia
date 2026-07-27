# ALF-58 BPP Version History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mocked `/admin/documents/[slug]` version history with explicit active/failure states and inert rollback entry points for eligible older versions.

**Architecture:** Extend the cloned document mock boundary with a discriminated history result. An async dynamic Server Component resolves the slug and renders one responsive Server Component: semantic table from `md`, labelled cards below `md`; loading/empty remain directly renderable for tests/QA. Eligibility is derived; ALF-63 interaction is excluded.

**Tech Stack:** Next.js 16 App Router, React 19 RSC, TypeScript, Tailwind, existing `Button`/`Badge`, native `node:test` via `tsx`, React server rendering.

## Global Constraints

- Follow `AGENTS.md`, `docs/WORKFLOW.md`, `docs/lessons.md`, committed ALF-58 spec.
- No dependency/font/raw color/animation/client JS/hooks/handlers/Server Action/API/backend/persistence/query scenario control/generic abstraction.
- Rollback only when `processingStatus === "processed" && !isActive`: enabled inert `type="button"`; no form/dialog/link/toast/request/mutation/confirmation (ALF-63).
- Reuse `lib/mocks/documents.ts`, barrel exports, tokens, `Button`, `Badge`; Indonesian exact copy; module-level `Intl.DateTimeFormat("id-ID", { dateStyle: "medium" })`.
- Native unit/render/route tests only. No Playwright/E2E addition/run on VPS.
- Valid RED: intended test count >0, nonzero exit caused by missing behavior—not syntax/env/unrelated failure. Record command, failure, exit. GREEN must rerun focused behavior.
- Run Next/browser/TypeScript serially (`.next` generated-type concurrency). Task-scoped commits only.

## File Map

- Modify `lib/mocks/documents.ts`: history types/fixtures/getter/sort/clone.
- Modify `lib/mocks/index.ts`: history exports.
- Create `tests/unit/admin-document-version-history.test.ts`: mock invariants.
- Create `components/admin/admin-document-version-history.tsx`: responsive states/presentation.
- Create `tests/unit/admin-document-version-history-render.test.ts`: SSR contract.
- Create `app/(admin)/admin/documents/[slug]/page.tsx`: success + `notFound()`.
- Create `tests/unit/admin-document-version-history-route.test.ts`: route contract.

---

### Task 1: Deterministic mock boundary

**Files:** modify `lib/mocks/documents.ts`, `lib/mocks/index.ts`; create `tests/unit/admin-document-version-history.test.ts`.

**Interfaces:** produce exact spec types `AdminVersionProcessingStatus`, `AdminDocumentHistoryScenario`, `AdminDocumentVersionItem`, `AdminDocumentVersionHistory`, `AdminDocumentHistoryResult`; export `getAdminDocumentVersionHistoryMock(slug, scenario): AdminDocumentHistoryResult | undefined` through `@/lib/mocks`.

- [ ] **Step 1: Write failing contract tests**

Create the test using `node:assert/strict` + `node:test`. Use known slug `employee-benefits`. Exact assertions:

```ts
const success = getAdminDocumentVersionHistoryMock("employee-benefits", "success");
assert.equal(success?.status, "success");
if (success?.status !== "success") throw new Error("Expected history");
assert.equal(success.data.slug, "employee-benefits");
assert.ok(success.data.title.length > 0);
assert.ok(success.data.versions.length >= 4);
assert.deepEqual(getAdminDocumentVersionHistoryMock("employee-benefits", "loading"), { status: "loading" });
assert.deepEqual(getAdminDocumentVersionHistoryMock("employee-benefits", "empty"), {
  data: { slug: "employee-benefits", title: "Kebijakan Benefit Karyawan" }, status: "empty",
});
assert.equal(getAdminDocumentVersionHistoryMock("unknown", "success"), undefined);
```

Add separate tests that:

```ts
const expected = [...success.data.versions].sort((a, b) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
assert.deepEqual(success.data.versions, expected);
for (const v of success.data.versions) {
  assert.ok(v.id.length && v.label.length);
  assert.ok(Number.isFinite(Date.parse(v.createdAt)));
}
const active = success.data.versions.filter((v) => v.isActive);
assert.equal(active.length, 1);
assert.equal(active[0].processingStatus, "processed");
assert.ok(success.data.versions.some((v) => v.processingStatus === "processing"));
assert.ok(success.data.versions.some((v) => v.processingStatus === "failed"));
const eligible = success.data.versions.filter((v) => v.processingStatus === "processed" && !v.isActive);
assert.ok(eligible.length > 0);
```

Fetch success twice, mutate first version label, assert second unchanged. Fetch empty twice, mutate first title, assert second unchanged.

- [ ] **Step 2: RED**

```bash
pnpm exec tsx --test tests/unit/admin-document-version-history.test.ts
```

Expected: tests >0; FAIL because getter is not exported. Reject unrelated failure.

- [ ] **Step 3: Minimal implementation**

Add exact spec types. Add `ADMIN_DOCUMENT_VERSION_HISTORIES` keyed by `employee-benefits`, title `Kebijakan Benefit Karyawan`, with four rows:

```ts
[
 { createdAt: "2026-07-26T08:30:00.000Z", id: "employee-benefits-v2026-4", isActive: false, label: "2026.4", processingStatus: "processing" },
 { createdAt: "2026-07-25T08:30:00.000Z", id: "employee-benefits-v2026-3", isActive: true, label: "2026.3", processingStatus: "processed" },
 { createdAt: "2026-07-24T08:30:00.000Z", id: "employee-benefits-v2026-2", isActive: false, label: "2026.2", processingStatus: "failed" },
 { createdAt: "2026-07-23T08:30:00.000Z", id: "employee-benefits-v2026-1", isActive: false, label: "2026.1", processingStatus: "processed" },
]
```

Getter: unknown → `undefined`; loading → `{status:"loading"}`; empty → cloned `{slug,title}`; success → `structuredClone(history)`, sort dates descending then ID ascending, return success. Export all types/getter from existing `lib/mocks/index.ts` blocks without removing exports.

- [ ] **Step 4: GREEN**

```bash
pnpm exec tsx --test tests/unit/admin-document-version-history.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check lib/mocks/documents.ts lib/mocks/index.ts tests/unit/admin-document-version-history.test.ts
```

Expected: 4 tests pass; all exits 0.

- [ ] **Step 5: Review + commit**

Review Task 1 only: invariants, cloning, deterministic sort, exports, no backend. Fix Critical/Important; cheap in-scope Minor; rerun GREEN.

```bash
git diff --check -- lib/mocks/documents.ts lib/mocks/index.ts tests/unit/admin-document-version-history.test.ts
git add lib/mocks/documents.ts lib/mocks/index.ts tests/unit/admin-document-version-history.test.ts
git commit -m "feat: add admin version history mocks"
```

---

### Task 2: Responsive accessible presentation

**Files:** create `components/admin/admin-document-version-history.tsx`, `tests/unit/admin-document-version-history-render.test.ts`.

**Interface:** named RSC `AdminDocumentVersionHistory({ result }: { result: AdminDocumentHistoryResult })`.

- [ ] **Step 1: Write failing SSR tests**

Helper gets each scenario, throws if undefined, then `renderToStaticMarkup(createElement(AdminDocumentVersionHistory,{result}))`. Assert success markup:

```ts
assert.match(markup, /href="\/admin"/);
for (const copy of ["Kembali ke dokumen BPP", "Kebijakan Benefit Karyawan", "Riwayat versi BPP", "Riwayat versi", "Selesai diproses", "Sedang diproses", "Pemrosesan gagal", "Versi ini belum dapat digunakan."]) assert.match(markup, new RegExp(copy));
assert.match(markup, /<caption[^>]*>Riwayat versi Kebijakan Benefit Karyawan<\/caption>/);
for (const h of ["Versi", "Status", "Ditambahkan", "Tindakan"]) assert.match(markup, new RegExp(`<th[^>]*scope="col"[^>]*>${h}</th>`));
assert.match(markup, /<ul/); assert.match(markup, /<dl/);
assert.ok(markup.indexOf("Versi 2026.4") < markup.indexOf("Versi 2026.3"));
assert.ok(markup.indexOf("Versi 2026.3") < markup.indexOf("Versi 2026.2"));
assert.ok(markup.indexOf("Versi 2026.2") < markup.indexOf("Versi 2026.1"));
assert.match(markup, /26 Jul 2026/);
```

Because table+mobile markup coexist, assert 2 occurrences each of `>Aktif<`, `>Versi aktif<`, visible rollback text, `aria-label="Rollback ke Versi 2026.1"`, `type="button"`; none for 2026.2/.3/.4; no `disabled`, `<form`, rollback href, `onClick`. Assert no `/stack|trace|provider|error code|retry/i`.

Loading: `role="status"`, `aria-busy="true"`, `Memuat riwayat versi…`. Empty: retained title, `Belum ada riwayat versi`, exact supporting sentence, no `Unggah BPP`.

- [ ] **Step 2: RED**

```bash
pnpm exec tsx --test tests/unit/admin-document-version-history-render.test.ts
```

Expected tests >0; missing component module failure.

- [ ] **Step 3: Minimal component**

Implement exported component → subcomponents → helpers → types/constants. Loading section: role/status, busy, exact copy, four neutral fixed placeholders. Non-loading header: link `/admin`, exact back copy, `<h1>{title}</h1>`, `Riwayat versi BPP`; one `<h2>Riwayat versi</h2>`. Empty bordered panel exact heading/support copy, no upload.

Success desktop/tablet: `hidden ... md:table`, caption `Riwayat versi {title}`, native table, `scope="col"` four headers and `scope="row"` version. Mobile: `<ul className="... md:hidden">`; each card heading `Versi {label}`, `<dl>` labels Status/Ditambahkan/Tindakan. Both map same array without reorder.

Shared renderers:
- label always `Versi {label}`; active adds `<Badge variant="success">Aktif</Badge>`;
- processed → `Selesai diproses`; processing → `Sedang diproses`; failed → `<Badge variant="error">Pemrosesan gagal</Badge>` plus block `Versi ini belum dapat digunakan.`;
- eligible → existing outlined `Button`, `type="button"`, `aria-label={`Rollback ke Versi ${label}`}`, visible text; mobile `min-h-11 w-full whitespace-normal`, desktop `min-h-11 whitespace-normal`;
- active ineligible → `Versi aktif`; other ineligible → `Tidak tersedia`.

Use module-level formatter/placeholder/header constants. No icons needed; no client directive/handler.

- [ ] **Step 4: GREEN**

```bash
pnpm exec tsx --test tests/unit/admin-document-version-history.test.ts tests/unit/admin-document-version-history-render.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check components/admin/admin-document-version-history.tsx tests/unit/admin-document-version-history-render.test.ts
```

Expected 8 tests pass; all exits 0. If locale differs, inspect actual `id-ID` output; keep exact date coverage.

- [ ] **Step 5: Review + commit**

Review Task 2 only: semantics/copy/parity/order/eligibility/accessible names/44px/no class assertions/no client or ALF-63. Fix/rerun.

```bash
git diff --check -- components/admin/admin-document-version-history.tsx tests/unit/admin-document-version-history-render.test.ts
git add components/admin/admin-document-version-history.tsx tests/unit/admin-document-version-history-render.test.ts
git commit -m "feat: render admin version history"
```

---

### Task 3: Dynamic route + 404

**Files:** create `app/(admin)/admin/documents/[slug]/page.tsx`, `tests/unit/admin-document-version-history-route.test.ts`.

**Interface:** default async page `{ params: Promise<{slug:string}> }`; known slug composes success; unknown invokes `notFound()`.

- [ ] **Step 1: Write failing route tests**

```ts
const page = await AdminDocumentHistoryPage({ params: Promise.resolve({ slug: "employee-benefits" }) });
const markup = renderToStaticMarkup(page);
assert.match(markup, /Kebijakan Benefit Karyawan/);
assert.match(markup, /Versi 2026\.3/);
assert.match(markup, /Pemrosesan gagal/);
await assert.rejects(
  AdminDocumentHistoryPage({ params: Promise.resolve({ slug: "unknown-document" }) }),
  (error: unknown) => {
    assert.ok(error instanceof Error);
    return "digest" in error && error.digest === "NEXT_HTTP_ERROR_FALLBACK;404";
  }
);
```

- [ ] **Step 2: RED**

```bash
pnpm exec tsx --test tests/unit/admin-document-version-history-route.test.ts
```

Expected tests >0; missing route module failure.

- [ ] **Step 3: Minimal route**

```tsx
import { notFound } from "next/navigation";
import { AdminDocumentVersionHistory } from "@/components/admin/admin-document-version-history";
import { getAdminDocumentVersionHistoryMock } from "@/lib/mocks";

interface Props { params: Promise<{ slug: string }> }
export default async function AdminDocumentHistoryPage({ params }: Props) {
  const { slug } = await params;
  const result = getAdminDocumentVersionHistoryMock(slug, "success");
  if (!result) notFound();
  return <AdminDocumentVersionHistory result={result} />;
}
```

No loading/error/metadata/scenario route/auth/backend additions.

- [ ] **Step 4: GREEN**

```bash
pnpm exec tsx --test tests/unit/admin-document-version-history-route.test.ts
pnpm exec tsx --test tests/unit/admin-document-version-history.test.ts tests/unit/admin-document-version-history-render.test.ts tests/unit/admin-document-version-history-route.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check "app/(admin)/admin/documents/[slug]/page.tsx" tests/unit/admin-document-version-history-route.test.ts
```

Expected route 2 pass; total 10 pass; all exits 0.

- [ ] **Step 5: Review + commit**

Review Task 3 only: params contract, success composition, real `notFound`, no unrelated work. Fix/rerun.

```bash
git diff --check -- "app/(admin)/admin/documents/[slug]/page.tsx" tests/unit/admin-document-version-history-route.test.ts
git add "app/(admin)/admin/documents/[slug]/page.tsx" tests/unit/admin-document-version-history-route.test.ts
git commit -m "feat: add admin version history route"
```

## Acceptance Mapping

| Requirement | Implementation/evidence |
|---|---|
| Ordered/consistent labels | Task 1 deterministic sort; Task 2 same ordered array + `Versi {label}`; mock/render/viewport evidence |
| Active unambiguous | one processed active invariant; persistent badge/text; no rollback; exact-count tests |
| Calm visible failure | chronological badge + plain sentence; diagnostics exclusion test + QA |
| Older successful rollback | derived `processed && !active`; target-specific inert buttons; mock/render/keyboard evidence |
| ALF-63 excluded | no handler/form/dialog/link/request/state; test + diff review |
| Unknown → 404 | Task 3 rejection + production smoke |
| Loading/empty accessible | explicit SSR contracts + temporary rendered QA |

## Final Verification

- [ ] One proportional review of `git diff origin/dev...HEAD`; fix Critical/Important, cheap in-scope Minor; no review loops.
- [ ] Fresh serial gates:

```bash
pnpm exec tsx --test tests/unit/admin-document-version-history.test.ts tests/unit/admin-document-version-history-render.test.ts tests/unit/admin-document-version-history-route.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check lib/mocks/documents.ts lib/mocks/index.ts components/admin/admin-document-version-history.tsx "app/(admin)/admin/documents/[slug]/page.tsx" tests/unit/admin-document-version-history.test.ts tests/unit/admin-document-version-history-render.test.ts tests/unit/admin-document-version-history-route.test.ts
pnpm exec next build
/opt/data/bin/graphify update .
git diff --check origin/dev...HEAD
```

Expected 10 focused passes; all exits 0. Direct Next build avoids package migration wrapper. Record exact counts/exits.

- [ ] Rendered QA: start verified production artifact on unused port `PORT=3108 pnpm exec next start`; browser inspection only, not E2E. `/admin/documents/employee-benefits` at 1440×900, tablet 768×1024, mobile 375×812. Require HTTP 200, no console/runtime errors or horizontal overflow; newest-first; no raw IDs; explicit statuses; readable wraps; aligned table desktop/tablet; labelled mobile cards; unclipped/full-width ≥44px action; contrast/focus. Tab: only back link + eligible buttons; inert click causes no URL/DOM/dialog/request/console change.
- [ ] Loading/empty QA without product controls: temporarily change route scenario success→loading, capture three viewports; then empty; restore success. Never commit harness. Verify `git diff -- "app/(admin)/admin/documents/[slug]/page.tsx"` empty. Check exact accessible copy/placeholders/header/no upload. Request unknown slug → rendered 404. Stop server; verify port free. Fix findings, rerun affected gates/screenshots.
- [ ] Scope check:

```bash
git diff --name-only origin/dev...HEAD
git diff --check origin/dev...HEAD
git status --short --branch
```

Allowed: seven mapped impl/test paths, committed spec/plan, Graphify updates. Reject package/lock, deps, client directive, backend/API/auth, ALF-63, temp QA, screenshots, unrelated formatting.

## PR → `dev` + Auto-Merge Gate

- [ ] Fetch; verify based on current `origin/dev`; integrate drift safely then rerun gates.
- [ ] Push issue branch; PR base `dev` (never `main`) with scope/acceptance/evidence.
- [ ] Verify base/head, issue-only diff, checks, mergeability, remote SHA.
- [ ] Auto-merge only if committed spec/plan; all acceptance; valid RED→GREEN; no Critical/Important; focused tests/TS/Ultracite/direct build/Graphify/diff check; desktop/tablet/mobile success/loading/empty + unknown QA; no runtime/overflow/severe a11y; no dependency/client/backend/ALF-63/security/destructive/scope expansion.
- [ ] Failed gate → no merge; fix/rerun or report true workflow blocker.
- [ ] Post-merge fetch; verify commit in `origin/dev`; then Linear `In Progress → Review → Done` with evidence/read-back. Never promote `dev`→`main`.

## Self-Review

- Commands executable: quoted metacharacter paths; existing scripts/tools; absolute Graphify; direct Next build; serial shared `.next` operations.
- Files: every modified file/component API inspected; every create declared; no missing helper/interface.
- RED→GREEN: each RED targets missing export/module/route and requires tests>0; each GREEN reruns behavior/static gates.
- Coverage: ordering/labels/active/processing/failure/eligibility/loading/empty/unknown/semantics/responsive/a11y/ALF-63 mapped.
- Placeholder scan: no TBD/TODO/implement-later/undefined instruction.
- Type consistency: exact names/signatures across tasks; route params Promise shape; shared ordered array.
- Scope: no dependency/client/backend/auth/upload/query/persistence/mutation/confirmation.
- Contradictions resolved: no E2E yet rendered browser QA; inert enabled button; temporary scenarios restored/uncommitted; PR targets `dev`, never `main`.
