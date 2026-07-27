# ALF-60 Admin BPP Archive and Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let administrators confirm archival of active BPP documents, see archived documents separately, and immediately restore them in the mounted mock list while preserving ALF-59 filters.

**Architecture:** Keep one lazily cloned working document array and one archive-candidate slug in `AdminDocumentList`. A pure immutable status transition feeds the existing filter, then focused responsive helpers render non-archived and archived partitions; the installed controlled Alert Dialog owns confirmation/dismiss semantics.

**Tech Stack:** Next.js Client Component, React state/refs/effect, TypeScript, Tailwind CSS, installed Radix Alert Dialog, native `node:test` via `tsx`.

## Global Constraints

- Baseline: `f76edd2c7a8103e666f8c555085be8565519a435`; work only on the existing ALF-60 issue branch.
- Frontend mock only: no dependency/package, backend/API/DB/auth, URL, storage, persistence, server-action, fixture, route, or employee-retrieval changes.
- Do not implement ALF-61+ behavior: no upload, processing lifecycle, rollback/version activation, publish, bulk actions, undo, latency/error simulation, analytics, or generic state layer.
- Preserve `ADMIN_DOCUMENT_LIST`, clone-on-get behavior, metadata, source order, filter values/semantics, loading/source-empty states, and `md` table/card breakpoint.
- Archive only `active`; restore only `archived`; stale slug/source-status events no-op. Archive requires confirmation; restore never does.
- Use installed `components/ui/alert-dialog.tsx`; no new modal or dependency. Native labelled buttons, visible text status, safe cancel focus, visible focus, ≥44 px touch targets, no horizontal overflow.
- Implementation scope is exactly `components/admin/admin-document-list.tsx`, `tests/unit/admin-document-list-transition.test.ts`, `tests/unit/admin-document-list-filter.test.ts`, and `tests/unit/admin-document-list-render.test.ts`.
- Do not add Playwright/E2E tests. Browser work below is manual rendered QA only.
- Keep verification serial where Next/`.next` is involved. Do not run `tsc` concurrently with a dev server/build.

## File Map

- Create `tests/unit/admin-document-list-transition.test.ts`: pure immutable transition contract.
- Modify `tests/unit/admin-document-list-filter.test.ts`: changed statuses compose with existing ALF-59 predicate.
- Modify `tests/unit/admin-document-list-render.test.ts`: default static section/action/responsive contract; no false interaction claims.
- Modify `components/admin/admin-document-list.tsx`: local working state, guarded transitions, two responsive sections/helpers, controlled confirmation, successful-mutation focus.
- Reuse unchanged `components/ui/alert-dialog.tsx`; do not edit it.

---

### Task 1: Pure archive/restore transition

**Files:**
- Create: `tests/unit/admin-document-list-transition.test.ts`
- Modify: `components/admin/admin-document-list.tsx` (export helper near existing helpers)

**Interfaces:**
- Produces: `updateAdminDocumentStatus(documents: readonly AdminDocumentListItem[], slug: string, status: "active" | "archived"): AdminDocumentListItem[]`.
- Contract: always returns a new array; matching item alone is cloned with changed status; order/metadata/input remain unchanged; unknown slug is value-equivalent.

- [ ] **Step 1: Write the focused failing test**

Create the test with four cases using `getAdminDocumentListMock("success")`: active `employee-benefits` → archived; archived `employee-conduct` → active; metadata/order/input preserved; unknown slug returns a distinct, deep-equal array. Compare each changed item with `{ ...before, status: target }`, assert every unaffected item keeps strict object identity, and assert the source deep-equals a pre-call `structuredClone`.

- [ ] **Step 2: Prove RED**

Run:

```bash
pnpm exec tsx --test tests/unit/admin-document-list-transition.test.ts
```

Expected: FAIL because `updateAdminDocumentStatus` is not exported/defined. A syntax, fixture, or runner failure is not valid RED; fix the test until failure names the missing behavior.

- [ ] **Step 3: Add the minimum pure implementation**

In `components/admin/admin-document-list.tsx` add exactly:

```ts
export function updateAdminDocumentStatus(
  documents: readonly AdminDocumentListItem[],
  slug: string,
  status: "active" | "archived"
): AdminDocumentListItem[] {
  return documents.map((document) =>
    document.slug === slug ? { ...document, status } : document
  );
}
```

Do not put source-status policy in this generic transition; handlers in Task 3 own that guard.

- [ ] **Step 4: Prove GREEN and review the boundary**

```bash
pnpm exec tsx --test tests/unit/admin-document-list-transition.test.ts
pnpm exec tsc --noEmit
```

Expected: PASS. Review checkpoint: only one helper/test added; no mutation, reducer, model/fixture change, or arbitrary status target.

- [ ] **Step 5: Commit checkpoint**

```bash
git add components/admin/admin-document-list.tsx tests/unit/admin-document-list-transition.test.ts
git diff --cached --check
git commit -m "test: define admin document status transition"
```

### Task 2: Changed status/filter composition

**Files:**
- Modify: `tests/unit/admin-document-list-filter.test.ts`
- Uses unchanged: `components/admin/admin-document-list.tsx`

**Interfaces:**
- Consumes: `updateAdminDocumentStatus` and existing `filterAdminDocuments`.
- Produces: regression evidence that mutable statuses flow through ALF-59 without exceptions.

- [ ] **Step 1: Write the failing composition test**

Import `updateAdminDocumentStatus`. Add one test that archives `employee-benefits`, then asserts: `active` excludes it; `archived` returns `employee-benefits` before seeded `employee-conduct`; title `benefit` + archived returns it. Restore the transitioned item and assert the inverse active/archived outcomes. Preserve the existing exhaustive normalization/OR/AND tests unchanged.

- [ ] **Step 2: Prove the test is meaningful before GREEN**

Temporarily make the test call the helper with the opposite target for its first transition, run:

```bash
pnpm exec tsx --test tests/unit/admin-document-list-filter.test.ts
```

Expected: FAIL on the first archive/filter assertion. Restore the intended `"archived"` target immediately; verify `git diff` contains no temporary sabotage.

- [ ] **Step 3: Prove GREEN**

```bash
pnpm exec tsx --test tests/unit/admin-document-list-transition.test.ts tests/unit/admin-document-list-filter.test.ts
```

Expected: PASS without production changes; the pure transition from Task 1 is sufficient.

- [ ] **Step 4: Review and commit**

Review checkpoint: no duplicated ALF-59 matrix, no special filter branch, filter input/order unchanged.

```bash
git add tests/unit/admin-document-list-filter.test.ts
git diff --cached --check
git commit -m "test: cover archive status filter composition"
```

### Task 3: Local lifecycle state, separated responsive views, and Alert Dialog

**Files:**
- Modify: `tests/unit/admin-document-list-render.test.ts`
- Modify: `components/admin/admin-document-list.tsx`
- Reuse unchanged: `components/ui/alert-dialog.tsx`

**Interfaces:**
- Consumes: pure transition, existing `filterAdminDocuments`, `AdminDocumentListItem`, installed Alert Dialog exports.
- Produces: one mounted-session working list; non-archived/archived partitions; active-only archive and archived-only restore controls in desktop/mobile; controlled archive confirmation.

- [ ] **Step 1: Expand the static render contract**

In the success render test assert:

- headings `Dokumen BPP` and `Dokumen diarsipkan`, plus archived retrieval-exclusion copy;
- visible `Arsipkan` for the active seed and `Pulihkan` for archived seed, each occurring twice (desktop + mobile);
- accessible names include their document titles;
- processing/failed titles are not paired with lifecycle buttons (use bounded row/card markup assertions, not global absence);
- two desktop `Aksi` headers and mobile `Aksi` labels;
- both sections retain `md:table` and `md:hidden` representations;
- loading/empty markup still contains no `Arsipkan`, `Pulihkan`, or archived section.

Do not assert closed portal dialog markup: Radix does not statically emit it. Do not claim static rendering proves clicks, Escape, focus, or state transitions.

- [ ] **Step 2: Prove RED**

```bash
pnpm exec tsx --test tests/unit/admin-document-list-render.test.ts
```

Expected: FAIL because the archived section/actions/action columns do not exist.

- [ ] **Step 3: Add local state and derived partitions**

In `AdminDocumentList`, lazily initialize:

```ts
const [documents, setDocuments] = useState<AdminDocumentListItem[]>(() =>
  structuredClone(result.status === "success" ? result.data.documents : [])
);
const [archiveCandidateSlug, setArchiveCandidateSlug] = useState<string | null>(null);
```

Filter `documents`, then partition filtered results into `visibleDocuments` (`status !== "archived"`) and `visibleArchivedDocuments` (`status === "archived"`). Base the total summary and filtered-empty state on both lengths. Do not synchronize props with an effect; state intentionally resets only on remount.

- [ ] **Step 4: Extract only responsive duplication that now has two sections**

Add focused internal helpers in the same file—`DocumentTable`, `DocumentCards`, and `DocumentAction`—typed with exact document arrays/callbacks, not a generic grid abstraction. Render title/version/status/date plus an `Aksi` column/definition row. `DocumentAction` renders:

- `Arsipkan` only for `active`, `variant="outline"`, `min-h-11`, accessible name `Arsipkan {title}`;
- `Pulihkan` only for `archived`, `variant="outline"`, `min-h-11`, accessible name `Pulihkan {title}`;
- nothing for `processing`/`failed`.

Render the primary section only when non-archived matches exist. Render a normal-flow sibling section only when archived matches exist, with `Dokumen diarsipkan` heading and retrieval-exclusion copy. Keep tables at `md+`, cards below `md`, no horizontal scroller.

- [ ] **Step 5: Add guarded archive/restore handlers**

Archive trigger sets only the candidate slug. Confirm re-resolves candidate from current `documents`; only `active` may transition to `archived`; stale/missing/invalid candidates no-op; always clear candidate. Restore re-resolves by slug; only `archived` transitions to `active`; no dialog. Keep query/status state untouched.

- [ ] **Step 6: Wire the controlled installed Alert Dialog**

Import the installed primitives. Render one controlled dialog with `open={archiveCandidateSlug !== null}` and `onOpenChange={(open) => { if (!open) setArchiveCandidateSlug(null); }}`. When a current candidate exists, render:

- title `Arsipkan BPP?`;
- description `“{title}” tidak akan digunakan dalam pencarian atau jawaban chat karyawan setelah diarsipkan. Dokumen tetap tersedia di bagian Dokumen diarsipkan dan dapat dipulihkan kapan saja.`;
- `AlertDialogCancel` labelled `Batal` as safe action;
- `AlertDialogAction variant="destructive"` labelled `Arsipkan BPP`, invoking confirm.

Do not use `AlertDialogTrigger`; row/card buttons control the selected slug. Do not add restore confirmation, toast, pending/error state, or custom dismissal behavior.

- [ ] **Step 7: Implement successful-mutation focus destinations**

Add refs to both section headings and one pending destination state (`"primary" | "archived" | null`). After a valid transition, set destination along with documents. A narrowly scoped effect runs after commit, focuses the destination heading (`tabIndex={-1}`), then clears the marker. Cancel/Escape/outside dismissal never sets it, allowing Radix to return focus to the archive trigger. Ensure `Batal` remains the safe initially focused action; confirm must not receive `autoFocus`.

- [ ] **Step 8: Prove GREEN**

```bash
pnpm exec tsx --test tests/unit/admin-document-list-transition.test.ts tests/unit/admin-document-list-filter.test.ts tests/unit/admin-document-list-render.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check components/admin/admin-document-list.tsx tests/unit/admin-document-list-transition.test.ts tests/unit/admin-document-list-filter.test.ts tests/unit/admin-document-list-render.test.ts
```

Expected: all PASS/clean. Fix only in-scope findings. Review checkpoint: pure transition remains pure; handlers enforce source status; dialog candidate is slug-only; one dialog; one working array; filters unchanged; loading/empty unchanged; no route/mock/dependency edits.

- [ ] **Step 9: Commit checkpoint**

```bash
git add components/admin/admin-document-list.tsx tests/unit/admin-document-list-render.test.ts
git diff --cached --check
git commit -m "feat: add local BPP archive and restore"
```

### Task 4: Scoped review and fresh automated gate

**Files:**
- Review only the four scoped files and committed spec.
- Modify scoped files only for confirmed ALF-60 findings.

- [ ] **Step 1: Spec review checkpoint**

Compare the diff against `docs/superpowers/specs/2026-07-27-alf-60-archive-restore-design.md`. Record each acceptance row as pass/fail. Inspect specifically: exact Indonesian copy; both responsive paths; stale guards; immutable metadata/order; total zero-match logic; filter persistence; focus after success/cancel; no ALF-61+ or persistence.

- [ ] **Step 2: Code-quality review checkpoint**

Run:

```bash
git diff origin/dev...HEAD -- components/admin/admin-document-list.tsx tests/unit/admin-document-list-transition.test.ts tests/unit/admin-document-list-filter.test.ts tests/unit/admin-document-list-render.test.ts
```

Fix Critical/Important findings; fix Minor only if cheap/in scope. Re-run affected focused tests after every fix. One proportional reviewer retry maximum; if unavailable, perform this controller audit and continue.

- [ ] **Step 3: Run fresh serial verification from clean generated state**

```bash
rm -rf .next
pnpm exec tsx --test tests/unit/admin-document-list-transition.test.ts tests/unit/admin-document-list-filter.test.ts tests/unit/admin-document-list-render.test.ts
pnpm test:unit
pnpm exec tsc --noEmit
pnpm exec ultracite check components/admin/admin-document-list.tsx tests/unit/admin-document-list-transition.test.ts tests/unit/admin-document-list-filter.test.ts tests/unit/admin-document-list-render.test.ts
pnpm exec next build
graphify update .
git diff --check
```

Expected: all tests pass, TypeScript/Ultracite/build clean, Graphify update succeeds, no whitespace errors. Do not run commands concurrently. `graphify-out/` changes are generated verification output; include them only if repository convention/workflow requires the update.

- [ ] **Step 4: Commit any review fixes/Graphify output**

```bash
git add components/admin/admin-document-list.tsx tests/unit/admin-document-list-transition.test.ts tests/unit/admin-document-list-filter.test.ts tests/unit/admin-document-list-render.test.ts graphify-out
git diff --cached --check
git commit -m "chore: verify ALF-60 archive restore"
```

Skip this commit when nothing changed.

### Task 5: Rendered UI/interaction QA (manual browser, not E2E)

**Files:**
- Modify scoped production/test files only for confirmed defects.
- Save evidence outside source or in the issue/PR; do not add an automated browser test.

- [ ] **Step 1: Start a QA server and verify readiness**

Use a free port and one server only:

```bash
PORT=3100 pnpm dev
```

In another shell verify `/admin` responds before inspection. If startup stalls, inspect port/process per `docs/lessons.md`; do not blindly restart. Keep `tsc`/build stopped while server owns `.next`.

- [ ] **Step 2: Render default layouts at all required widths**

Inspect `/admin` at **1440×900**, **768×1024**, and **375×812**. Capture default screenshots. Verify semantic separate sections, archived explanatory copy, desktop tables at 1440/768, mobile cards at 375, action alignment/wrapping, visible statuses, ≥44 px mobile targets, no clipping/horizontal overflow, logical keyboard order, contrast/focus visibility.

- [ ] **Step 3: Exercise dialog cancellation and accessibility**

At each width open `Arsipkan` and capture dialog. Verify exact title/document consequence copy, background inert, focus trapped, `Batal` safe initial focus, confirm not auto-focused, stacked mobile actions/no viewport overflow. Test `Batal`, Escape, and supported dismiss behavior separately: dialog closes, status/sections/summary unchanged, focus returns to invoking trigger. Capture dialog + cancellation evidence.

- [ ] **Step 4: Exercise archive/restore/filter transitions**

At each width:

1. Archive active seed → it leaves primary and enters archived without reload; summary updates; archived heading receives focus.
2. Restore it → it returns active immediately with no dialog; primary heading receives focus.
3. Under `Aktif`, archive visible active item → item disappears; selected filter remains.
4. Under `Diarsipkan`, restore item → item disappears; selected filter remains.
5. Select archived + another status → both sections can render.
6. Combine title + status → both sections obey title AND status.
7. Produce zero matches → one filtered-empty panel and one reset action; reset restores data and focuses search.

Capture archive, restore, filtered, and zero-match states. Verify source order/metadata remain unchanged and processing/failed never show lifecycle actions.

- [ ] **Step 5: Verify preserved non-success states and runtime health**

Render loading and source-empty scenarios using the existing local scenario mechanism/dev inspection method without committing route/query/fixture switches. Capture each at representative width; verify no archive section/actions. Throughout all states inspect browser console and network/runtime overlay: zero uncaught errors/warnings caused by ALF-60. Record focus destination and console findings honestly.

- [ ] **Step 6: Fix and rerun proportionally**

Fix only reproducible ALF-60 defects. Repeat affected screenshot/interaction at 1440/768/375, then stop the server and rerun Task 4’s serial tests, TypeScript, scoped Ultracite, build, Graphify update, and `git diff --check` fresh.

### Task 6: Acceptance evidence, PR to `dev`, and autonomous merge

- [ ] **Step 1: Acceptance map**

| Acceptance requirement | Implementation evidence | Verification evidence |
|---|---|---|
| Active archive requires explicit consequence confirmation | guarded active action + controlled Alert Dialog + exact named retrieval copy | transition/render tests; dialog/archive QA at 1440/768/375 |
| Cancel/Escape/dismiss never mutate | close clears candidate only | cancellation QA + trigger focus return |
| Archived documents are separate/restorable | partitioned sibling table/cards + immediate guarded restore | render/filter tests; restore QA |
| Mounted mock list updates without persistence | lazy cloned component state; no prop sync/storage/backend | transition tests; reload/remount resets fixture during QA |
| ALF-59 remains compatible | existing predicate consumes working list; filter state untouched; total spans partitions | filter tests; active/archived/combined/title/zero QA |
| Responsive/a11y/focus | `md` table/card helpers; native labelled ≥44 px buttons; installed dialog; heading focus effect | 1440/768/375 screenshots, keyboard/focus/overflow/console QA |
| Loading/source-empty preserved | unchanged early branches | render test + rendered state QA |

- [ ] **Step 2: Final repository/scope check**

```bash
git status --short
git diff --check
git diff --name-only origin/dev...HEAD
git log --oneline origin/dev..HEAD
```

Expected source scope: plan/spec, four implementation/test files, and Graphify generated output only. Confirm no package, lockfile, route, backend, mock fixture, URL/storage, E2E, or ALF-61+ change; no unresolved Critical/Important finding.

- [ ] **Step 3: Push and open the issue PR to `dev`**

```bash
git push -u origin HEAD
gh pr create --base dev --head walfa433/alf-60-add-bpp-archive-and-restore-frontend --title "ALF-60: add BPP archive and restore frontend" --body-file <prepared-acceptance-evidence.md>
```

PR body must include the acceptance map, RED→GREEN commands/results, fresh test/tsc/Ultracite/build/Graphify results, 1440/768/375 QA evidence, focus/console findings, and explicit ephemeral/no-backend limitation.

- [ ] **Step 4: Verify PR gate, then auto-merge to `dev`**

```bash
gh pr view --json number,baseRefName,headRefName,headRefOid,mergeable,statusCheckRollup,url
gh pr diff --name-only
gh pr checks --watch
gh pr merge --merge --delete-branch
```

Merge only if base=`dev`, head/SHA/diff match, mergeable, required checks/equivalent fresh local gates pass, rendered QA passes, and no destructive/security/scope expansion exists. Never merge `dev` to `main`.

- [ ] **Step 5: Verify integration**

```bash
git fetch origin
git branch -r --contains <ALF-60-merge-or-head-sha>
git log --oneline -1 origin/dev
```

Confirm ALF-60 exists in `origin/dev`; then follow workflow evidence/status updates. This execution plan itself performs no branch, push, PR, merge, Linear, browser, or E2E action.

## Self-Review Checklist

- [ ] Every acceptance-contract item maps to an implementation and verification step.
- [ ] RED failures are behavior-specific; GREEN commands exercise the same test.
- [ ] Helper signature/types/copy exactly match the committed design.
- [ ] Responsive helpers remain local/focused; no generic abstraction or dependency.
- [ ] Dialog candidate/local documents/filter/focus interactions cover cancel, Escape, success, stale events, and removed triggers.
- [ ] Fresh gates include focused + full unit tests, serial `tsc`, scoped Ultracite, direct Next build, Graphify, and diff check.
- [ ] Rendered QA includes 1440/768/375 default/dialog/cancel/Escape/archive/restore/filter/zero/loading/empty/focus/console.
- [ ] Scope excludes backend/API/DB/auth, URL/storage/persistence, fixtures, E2E tests, and ALF-61+.
- [ ] PR targets and auto-merges only to `dev` after all gates; `main` remains untouched.
- [ ] Placeholder scan is clean: no deferred markers, cross-task shorthand, or undefined interface.
