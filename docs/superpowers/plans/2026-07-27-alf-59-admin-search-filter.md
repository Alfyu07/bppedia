# ALF-59 Admin BPP Search and Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add immediate, accessible client-side title search and composable lifecycle-status filtering to the populated mocked `/admin` BPP list.

**Architecture:** Keep `app/(admin)/admin/page.tsx` server-owned and its mock call unchanged. Convert the focused list component to a Client Component with native controls/local state; one exported pure predicate filters the immutable fixture array, then the existing desktop table/mobile cards render the same ordered result.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind, native HTML controls, existing `Button`, native `node:test` via `tsx`, static React rendering.

## Global Constraints

- Follow `AGENTS.md`, `docs/WORKFLOW.md`, `docs/lessons.md`, and committed `docs/superpowers/specs/2026-07-27-alf-59-admin-search-filter-design.md`.
- ALF-57 only prerequisite. Preserve route mock boundary, upload/detail links, loading/source-empty states, fixture order, date formatting, `md` table/cards split.
- No dependency/package/lock change; no backend/API/request, Server Action, URL/history/storage/cookie persistence, debounce, fuzzy search, count UI, pagination, sorting, autocomplete, bulk action, saved view, generic hook/context/reducer/data-grid abstraction.
- No ALF-60+ archive/restore/upload/transition/rollback/preview/publish behavior.
- Use one Client Component only where local handlers/hooks require it; native search input, checkboxes, fieldset/legend, button. No browser/E2E test addition or run.
- Valid RED means intended tests execute (`tests > 0`) and fail solely for the missing contract, never syntax/environment/unrelated behavior. Record command, assertion/error, count, exit. GREEN reruns the same focused behavior.
- Run Next/browser/TypeScript serially because `.next` generated types are shared. Task commits are implementation-time steps only.

## File Map

- Modify `lib/mocks/documents.ts`: add deterministic failed/archived list fixtures only.
- Modify `tests/unit/admin-document-list.test.ts`: enforce complete lifecycle fixture contract, metadata, unique slugs, clone isolation.
- Create `tests/unit/admin-document-list-filter.test.ts`: pure title/status composition, order, immutability.
- Modify `components/admin/admin-document-list.tsx`: client state, pure filter export, native controls, live result summary, filtered-empty/reset, shared filtered rendering.
- Modify `tests/unit/admin-document-list-render.test.ts`: static default controls/status/responsive navigation contract and unchanged source states.
- No change: `app/(admin)/admin/page.tsx`, `lib/mocks/index.ts`, package files, E2E files.

---

### Task 1: Complete deterministic lifecycle fixtures

**Files:** modify `lib/mocks/documents.ts`, `tests/unit/admin-document-list.test.ts`.

**Interfaces:** preserve `getAdminDocumentListMock(scenario): AdminDocumentListResult`; success produces cloned `AdminDocumentListItem[]` containing all exact `AdminDocumentStatus` values. No getter filtering argument.

- [ ] **Step 1: Tighten the fixture contract test**

In the populated-state test, replace the loose count/status assertions with:

```ts
const statuses = new Set(success.data.documents.map((document) => document.status));
assert.deepEqual(
  [...statuses].sort(),
  ["active", "archived", "failed", "processing"]
);
assert.equal(
  new Set(success.data.documents.map((document) => document.slug)).size,
  success.data.documents.length
);
for (const document of success.data.documents) {
  assert.ok(document.slug.length > 0);
  assert.ok(document.title.length > 0);
  assert.ok(Number.isFinite(Date.parse(document.updatedAt)));
}
```

Retain loading/empty assertions and the separate caller-mutation test.

- [ ] **Step 2: RED**

```bash
pnpm exec tsx --test tests/unit/admin-document-list.test.ts
```

Expected: 2 tests execute; lifecycle contract FAIL because current success fixtures omit `archived` and `failed`. Reject module/syntax/environment failures.

- [ ] **Step 3: Add the minimum fixtures**

Append to `ADMIN_DOCUMENT_LIST`, preserving the two current rows and their order:

```ts
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
```

Do not add these slugs to detail overview/history fixtures: ALF-59 needs list/filter fixtures, not new detail pages. Keep `structuredClone` and getter signature unchanged.

- [ ] **Step 4: GREEN**

```bash
pnpm exec tsx --test tests/unit/admin-document-list.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check lib/mocks/documents.ts tests/unit/admin-document-list.test.ts
```

Expected: 2 tests pass; all exits 0.

- [ ] **Step 5: Scoped review + commit**

Review Task 1 only: exactly four lifecycle values represented, unique stable slugs/titles, parseable ISO dates, plausible active labels, preserved original order/getter clone, no detail/backend scope. Fix Critical/Important and cheap in-scope Minor; rerun GREEN.

```bash
git diff --check -- lib/mocks/documents.ts tests/unit/admin-document-list.test.ts
git add lib/mocks/documents.ts tests/unit/admin-document-list.test.ts
git commit -m "test: complete admin document status fixtures"
```

---

### Task 2: Pure composable filter seam

**Files:** create `tests/unit/admin-document-list-filter.test.ts`; modify `components/admin/admin-document-list.tsx` only enough to export the pure function.

**Interfaces:** produce `filterAdminDocuments(documents: readonly AdminDocumentListItem[], query: string, selectedStatuses: readonly AdminDocumentStatus[]): AdminDocumentListItem[]`. Normalize query/title with `trim().toLocaleLowerCase("id-ID")`; status OR, search/status AND; return new ordered array without mutation.

- [ ] **Step 1: Write focused failing tests**

Create the native test file. Obtain success documents once, guard the discriminant, snapshot with `structuredClone`, then cover exact behavior:

```ts
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { filterAdminDocuments } from "@/components/admin/admin-document-list";
import { getAdminDocumentListMock } from "@/lib/mocks";

const result = getAdminDocumentListMock("success");
if (result.status !== "success") throw new Error("Expected populated documents");
const documents = result.data.documents;

const slugs = (items: typeof documents) => items.map((item) => item.slug);

describe("admin document list filtering", () => {
  test("matches normalized case-insensitive title substrings", () => {
    assert.deepEqual(slugs(filterAdminDocuments(documents, "  bEnEfIt  ", [])), ["employee-benefits"]);
    assert.deepEqual(slugs(filterAdminDocuments(documents, "   ", [])), slugs(documents));
  });

  test("uses OR within selected statuses and all for an empty selection", () => {
    assert.deepEqual(slugs(filterAdminDocuments(documents, "", ["failed"])), ["employee-travel"]);
    assert.deepEqual(slugs(filterAdminDocuments(documents, "", ["active", "archived"])), ["employee-benefits", "employee-conduct"]);
    assert.deepEqual(slugs(filterAdminDocuments(documents, "", [])), slugs(documents));
  });

  test("uses AND between search and statuses and returns no matches", () => {
    assert.deepEqual(slugs(filterAdminDocuments(documents, "karyawan", ["active", "archived"])), ["employee-benefits", "employee-conduct"]);
    assert.deepEqual(filterAdminDocuments(documents, "mobilitas", ["failed"]), []);
  });

  test("preserves source order and does not mutate fixtures", () => {
    const before = structuredClone(documents);
    const filtered = filterAdminDocuments(documents, "", ["active", "processing", "failed", "archived"]);
    assert.deepEqual(slugs(filtered), slugs(documents));
    assert.notStrictEqual(filtered, documents);
    assert.deepEqual(documents, before);
  });
});
```

- [ ] **Step 2: RED**

```bash
pnpm exec tsx --test tests/unit/admin-document-list-filter.test.ts
```

Expected: tests >0 and FAIL because `filterAdminDocuments` is not exported. If module evaluation works but the missing export prevents test registration, use this valid missing-contract RED only after confirming the error names that export; do not treat an unrelated transform failure as RED.

- [ ] **Step 3: Add the minimum pure function**

Import `AdminDocumentStatus` as a type. Add after the component helpers:

```ts
export function filterAdminDocuments(
  documents: readonly AdminDocumentListItem[],
  query: string,
  selectedStatuses: readonly AdminDocumentStatus[]
): AdminDocumentListItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  return documents.filter((document) => {
    const matchesSearch = document.title
      .toLocaleLowerCase("id-ID")
      .includes(normalizedQuery);
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(document.status);
    return matchesSearch && matchesStatus;
  });
}
```

No memoization/generic utility. `filter` already returns a new ordered array and does not mutate input.

- [ ] **Step 4: GREEN**

```bash
pnpm exec tsx --test tests/unit/admin-document-list-filter.test.ts
pnpm exec tsx --test tests/unit/admin-document-list.test.ts tests/unit/admin-document-list-filter.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check components/admin/admin-document-list.tsx tests/unit/admin-document-list-filter.test.ts
```

Expected: filter 4 pass; fixture+filter 6 pass; all exits 0.

- [ ] **Step 5: Scoped review + commit**

Review Task 2 only: locale/case/trim, substring, empty statuses, OR/AND, empty result, stable order, readonly inputs/new array, no speculative abstraction. Fix/rerun.

```bash
git diff --check -- components/admin/admin-document-list.tsx tests/unit/admin-document-list-filter.test.ts
git add components/admin/admin-document-list.tsx tests/unit/admin-document-list-filter.test.ts
git commit -m "feat: add admin document filter predicate"
```

---

### Task 3: Accessible client controls and filtered rendering

**Files:** modify `tests/unit/admin-document-list-render.test.ts`, `components/admin/admin-document-list.tsx`.

**Interfaces:** `AdminDocumentList({ result })` remains the named public component. Internal state: `query: string`, `selectedStatuses: AdminDocumentStatus[]`; zero statuses means all. One reset clears both and focuses `HTMLInputElement`; filtered rows/cards use one `visibleDocuments` array.

- [ ] **Step 1: Expand the static default render contract**

In the success render test, retain current header/navigation assertions and add:

```ts
for (const copy of [
  "Filter dokumen",
  "Cari judul BPP",
  "Status dokumen",
  "Pilih satu atau beberapa status.",
  "Aktif",
  "Diproses",
  "Gagal",
  "Diarsipkan",
  "Kebijakan Benefit Karyawan",
  "Panduan Mobilitas Karyawan",
  "Pedoman Perjalanan Dinas",
  "Kode Etik Karyawan",
]) assert.match(markup, new RegExp(copy));
assert.match(markup, /type="search"/);
assert.match(markup, /placeholder="Cari berdasarkan judul…"/);
assert.equal((markup.match(/type="checkbox"/g) ?? []).length, 4);
assert.match(markup, /aria-live="polite"/);
assert.match(markup, /4 dokumen ditampilkan/);
assert.doesNotMatch(markup, />Reset filter</);
assert.ok(markup.indexOf("Kebijakan Benefit Karyawan") < markup.indexOf("Panduan Mobilitas Karyawan"));
assert.match(markup, /class="[^"]*md:table[^"]*"/);
assert.match(markup, /class="[^"]*md:hidden[^"]*"/);
```

Strengthen source-state test: loading and empty markup must not contain `Cari judul BPP` or `Status dokumen`; preserve existing source-state copy/upload behavior.

Static SSR proves default markup only; interaction transitions remain manual rendered QA.

- [ ] **Step 2: RED**

```bash
pnpm exec tsx --test tests/unit/admin-document-list-render.test.ts
```

Expected: 2 tests execute; success contract FAIL on missing `Filter dokumen`/search controls. Existing state test remains green. Reject failures caused only by malformed regex/test syntax.

- [ ] **Step 3: Add local state without changing source states**

Add `"use client";`, then import `useRef`, `useState`, `ChangeEvent` type and `AdminDocumentStatus` type. At the top of `AdminDocumentList`, before either early return, initialize:

```ts
const [query, setQuery] = useState("");
const [selectedStatuses, setSelectedStatuses] = useState<AdminDocumentStatus[]>([]);
const searchInputRef = useRef<HTMLInputElement>(null);
```

After source-state early returns, derive:

```ts
const visibleDocuments = filterAdminDocuments(
  result.data.documents,
  query,
  selectedStatuses
);
const hasActiveFilters = query.trim().length > 0 || selectedStatuses.length > 0;
const resultSummary = visibleDocuments.length === 0
  ? "Tidak ada dokumen yang cocok"
  : `${visibleDocuments.length} dokumen ditampilkan`;
```

Handlers:

```ts
function toggleStatus(status: AdminDocumentStatus) {
  setSelectedStatuses((current) =>
    current.includes(status)
      ? current.filter((value) => value !== status)
      : [...current, status]
  );
}

function resetFilters() {
  setQuery("");
  setSelectedStatuses([]);
  searchInputRef.current?.focus();
}
```

No effect/timeout/URL/router/form submit.

- [ ] **Step 4: Render semantic controls and one reset**

Between existing success header and results, render a normal-flow section labelled by a visible heading:

```tsx
<section
  aria-labelledby="document-filters-heading"
  className="space-y-4 rounded-lg border border-border p-4"
>
  <h2 className="font-semibold" id="document-filters-heading">Filter dokumen</h2>
  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
    <label className="flex min-w-0 flex-1 flex-col gap-2" htmlFor="document-search">
      <span className="text-sm font-medium">Cari judul BPP</span>
      <input
        className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        id="document-search"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cari berdasarkan judul…"
        ref={searchInputRef}
        type="search"
        value={query}
      />
    </label>
    <fieldset className="min-w-0 space-y-2">
      <legend className="text-sm font-medium">Status dokumen</legend>
      <p className="text-sm text-muted-foreground">Pilih satu atau beberapa status.</p>
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => (
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2" key={option.value}>
            <input
              checked={selectedStatuses.includes(option.value)}
              onChange={() => toggleStatus(option.value)}
              type="checkbox"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
    {hasActiveFilters && visibleDocuments.length > 0 ? (
      <Button className="min-h-11" onClick={resetFilters} type="button" variant="outline">Reset filter</Button>
    ) : null}
  </div>
</section>
```

Use a typed constant:

```ts
const STATUS_OPTIONS: readonly { label: string; value: AdminDocumentStatus }[] = [
  { label: "Aktif", value: "active" },
  { label: "Diproses", value: "processing" },
  { label: "Gagal", value: "failed" },
  { label: "Diarsipkan", value: "archived" },
];
```

Keep ≥44px labels, 8px gap, wrapping/no fixed width/raw colors.

- [ ] **Step 5: Share the filtered collection and filtered-empty state**

Wrap the result area in:

```tsx
<div aria-atomic="false" aria-live="polite">
  <p className="sr-only">{resultSummary}</p>
  {visibleDocuments.length === 0 ? (
    <section className="space-y-4 rounded-lg border border-border p-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Tidak ada dokumen yang cocok</h2>
        <p className="text-muted-foreground">Ubah kata pencarian atau pilihan status, lalu coba lagi.</p>
      </div>
      <Button className="min-h-11" onClick={resetFilters} type="button" variant="outline">Reset filter</Button>
    </section>
  ) : (
    <>{/* existing table and mobile list */}</>
  )}
</div>
```

Change both existing maps from `result.data.documents` to `visibleDocuments`. This conditional guarantees exactly one visible reset: controls when filtered results remain; empty guidance when zero. Do not show upload guidance in filtered-empty. Preserve title links/table/card markup/date/status labels.

- [ ] **Step 6: GREEN**

```bash
pnpm exec tsx --test tests/unit/admin-document-list-render.test.ts
pnpm exec tsx --test tests/unit/admin-document-list.test.ts tests/unit/admin-document-list-filter.test.ts tests/unit/admin-document-list-render.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check components/admin/admin-document-list.tsx tests/unit/admin-document-list-render.test.ts
```

Expected: render 2 pass; focused total 8 pass; all exits 0. If Ultracite requests ordering/style, apply only behavior-neutral formatting and rerun all Task 3 commands.

- [ ] **Step 7: Scoped review + commit**

Review Task 3 only: unconditional hooks; early source states/no controls; native labels/grouping/order; immediate local state; exact OR/AND predicate; one reset; focus restoration; live concise summary; same filtered array table/cards; `md` split; 44px/wrap/no overflow; no URL/backend/dependency/ALF-60+. Fix/rerun.

```bash
git diff --check -- components/admin/admin-document-list.tsx tests/unit/admin-document-list-render.test.ts
git add components/admin/admin-document-list.tsx tests/unit/admin-document-list-render.test.ts
git commit -m "feat: filter admin documents client-side"
```

## Acceptance Mapping

| Requirement | Implementation/evidence |
|---|---|
| Search title | Task 2 locale-aware trimmed case-insensitive substring tests; Task 3 labelled native immediate search + QA |
| Four statuses | Task 1 complete typed fixtures; Task 3 four native checkboxes/labels; render + interaction QA |
| Composition | Task 2 OR statuses, AND search, zero means all, no-match/order/immutability tests |
| Filtered-empty/reset | Task 3 exact explanation, constraints retained, exactly one reset, reset restores all/focus; interaction QA |
| Loading/source-empty preserved | Task 3 early returns + negative control assertions + rendered temporary-state QA |
| Responsive/a11y | Existing `md` table/cards fed one array; semantic section/input/fieldset/checkbox/button/live region; viewport/focus/touch/overflow QA |
| Local ephemeral state | No route change/router/URL/storage/backend; reload/navigation smoke confirms defaults |
| ALF-60+ excluded | Scoped reviews/diff audit reject mutation/actions/API/product expansion |

## Final Review and Fresh Verification

- [ ] Run one proportional review of `git diff origin/dev...HEAD`. Check acceptance/security/a11y/client boundary/tests; fix Critical/Important, cheap in-scope Minor. One fresh reviewer retry maximum; then controller audit per `docs/lessons.md`. Rerun affected GREEN commands.

- [ ] Run fresh gates serially:

```bash
pnpm exec tsx --test tests/unit/admin-document-list.test.ts tests/unit/admin-document-list-filter.test.ts tests/unit/admin-document-list-render.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check lib/mocks/documents.ts components/admin/admin-document-list.tsx tests/unit/admin-document-list.test.ts tests/unit/admin-document-list-filter.test.ts tests/unit/admin-document-list-render.test.ts
pnpm exec next build
/opt/data/bin/graphify update .
git diff --check origin/dev...HEAD
```

Expected: 8 focused tests pass; every exit 0. Use direct `next build` to avoid the package migration wrapper. Record counts/exits and Graphify result. Do not run these concurrently with a Next/browser process.

- [ ] Rendered UI/interaction QA—not automated E2E: start the verified production artifact on an unused port, e.g. `PORT=3109 pnpm exec next start`; use browser inspection only. Visit `/admin` at desktop 1440×900, tablet 768×1024, mobile 375×812. Require HTTP 200, no console/runtime errors, horizontal overflow, clipping, raw colors, or severe contrast issue; table from `md`, cards below; readable labels/wrapping/truncation; ≥44px search/status/reset targets and ≥8px status separation.

- [ ] At every viewport inspect default → search `benefit` → statuses `active` + `archived` (OR) → query `karyawan` with both (AND) → query `mobilitas` + `failed` (zero match) → reset. Verify immediate updates, exact original-order rows/cards, controls retain values, filtered-empty exact copy/no upload, exactly one reset, reset restores four documents and focuses search, no URL/history/storage/request mutation.

- [ ] Keyboard/a11y interaction: Tab order search → Aktif → Diproses → Gagal → Diarsipkan → reset when present → visible document links; Space toggles focused checkboxes; browser focus ring remains visible; typing/toggling never moves focus; reset alone returns focus; inspect live-region text for `N dokumen ditampilkan`/zero summary without duplicate table announcement.

- [ ] Preserve source states with a temporary uncommitted QA harness: in `app/(admin)/admin/page.tsx`, change only `"success"` to `"loading"`, inspect desktop/tablet/mobile and confirm loading copy/busy/no controls; then `"empty"`, inspect three viewports and confirm source-empty upload guidance/no controls/no filtered-empty copy. Restore `"success"`; require:

```bash
git diff -- "app/(admin)/admin/page.tsx"
```

Expected: empty. Never commit harness/screenshots. Stop server; confirm chosen port has no listener. Fix findings, rerun affected gates and screenshots.

- [ ] Scope audit:

```bash
git diff --name-only origin/dev...HEAD
git diff --check origin/dev...HEAD
git status --short --branch
```

Allowed: five mapped implementation/test paths, committed ALF-59 spec/plan, Graphify outputs. Reject package/lock/dependency, route, E2E/browser-test, backend/API/auth, URL/storage, temporary harness/screenshots, unrelated formatting, ALF-60+ behavior.

## PR → `dev` and Auto-Merge

- [ ] Fetch and verify issue branch remains based on current `origin/dev`; integrate safe drift, then rerun fresh gates/QA if changed.
- [ ] Push issue branch; open PR with base `dev` (never `main`), issue-only scope, acceptance map, RED→GREEN and fresh verification/render evidence.
- [ ] Verify PR base/head, remote SHA, diff, checks, mergeability, unresolved comments.
- [ ] Auto-merge to `dev` only when spec+plan committed; acceptance complete; valid RED→GREEN; no unresolved Critical/Important; focused tests/TypeScript/scoped Ultracite/direct build/Graphify/diff check pass; desktop/tablet/mobile default/combined/zero/reset/loading/source-empty + keyboard/live-region QA pass; no runtime/overflow/severe a11y/dependency/backend/URL/ALF-60+/security/destructive/scope expansion.
- [ ] Failed gate → do not merge; fix/rerun or report a true workflow blocker.
- [ ] Post-merge: fetch; verify issue commit in `origin/dev`; then Linear `In Progress → Review → Done` with evidence and read-back after each mutation. Never promote `dev` to `main`.

## Self-Review

- Commands: repository-local `pnpm`; quoted/explicit paths; direct Next build; absolute Graphify; shared `.next` operations serial; no Playwright/E2E.
- Files/interfaces: every changed path mapped; pure function signature/status types consistent; page/barrel unchanged; hooks unconditional.
- RED→GREEN: Task 1 misses lifecycle fixtures; Task 2 misses export; Task 3 misses controls; each focused test count >0, expected failure named, same test rerun GREEN.
- Coverage: fixture clone/metadata/statuses; normalization/OR/AND/no-match/order/immutability; default/source-state render; client controls/reset/live region/table/cards; viewport/interactions.
- Placeholder scan: no `TBD`, `TODO`, `implement later`, undefined helper, omitted code step, or fake static interaction claim.
- Scope: no deps/browser/E2E test, backend/URL/storage, generic abstraction, sorting/count UI, or ALF-60+ behavior.
- Delivery: one proportional review, fresh gates/Graphify/render QA, PR targets and auto-merges only to `dev`; `main` remains gated.
