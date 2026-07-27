# ALF-60 Admin BPP Archive and Restore Design

## Goal

Extend the mocked `/admin` BPP list so an administrator can archive an active document only after an explicit consequence-aware confirmation, see archived documents in a visibly separate section, and restore an archived document immediately. Every accepted action updates the in-memory list and ALF-59 filtering in the current page session.

## Acceptance contract

- An `active` document exposes an `Arsipkan` action in both desktop and mobile representations.
- Activating `Arsipkan` opens a modal confirmation; no state changes before confirmation.
- Confirmation identifies the document and explains retrieval impact: after archival, employees will no longer receive this BPP in search/chat retrieval; the document remains available to administrators in the archived section and can be restored.
- `Batal`, Escape, or the modal's supported dismiss behavior closes confirmation without changing the list.
- Confirming changes that item's status from `active` to `archived`; the active list loses it and the archived section gains it without reload.
- Archived documents are visibly and semantically separated from non-archived documents and expose `Pulihkan` in desktop and mobile layouts.
- Restoring changes that item's status from `archived` to `active` immediately; no restore confirmation is required because restore reverses the archival consequence and is not destructive.
- Mock data is session-local and ephemeral: mutation survives only while `AdminDocumentList` remains mounted; reload/navigation recreates fixtures.

## Dependencies and current evidence

- Branch baseline is `origin/dev` commit `ff2feb6`, containing ALF-57 list and ALF-59 filters.
- `AdminDocumentList` is already the sole Client Component owner of query/status state and renders one filtered collection into a `md` table or mobile cards.
- `AdminDocumentStatus` already includes `active`, `processing`, `failed`, and `archived`; fixtures include one of each. No model expansion is needed.
- `getAdminDocumentListMock("success")` returns a cloned list. The route remains a Server Component and passes that result once.
- ALF-59 applies title search AND selected status filtering, with OR inside selected statuses. Filter state is intentionally local and non-persistent.
- Installed `components/ui/alert-dialog.tsx` wraps Radix Alert Dialog and already provides focus trapping, accessible title/description relationships, Escape/cancel handling, portal/overlay, responsive stacked actions, and focus return. It is a better semantic fit than the general `Dialog` for a consequential archive decision.
- Graphify groups the route, list, mock getter, filter tests, render tests, and Alert Dialog primitives around the admin-list surface; this supports a narrow change rather than a new feature layer.
- The design system reserves red for destructive actions, requires visible text status, ≥44 px touch targets, normal-flow responsive layouts, and visible focus.
- No route-level `error.tsx` currently exists. This synchronous fixture-only mutation adds no expected recoverable runtime failure.

## Approaches considered

### 1. Recommended: local working copy in the existing Client Component

Initialize `documents` state once from successful cloned props, update one item immutably by `slug`, then run the existing ALF-59 predicate over that working copy. Keep one selected archive candidate for the controlled Alert Dialog.

**Benefits:** fewest boundaries; mock list updates immediately; filter behavior naturally consumes the new status; no dependency, route, context, reducer, API, or persistence. **Costs:** mutation resets when the component remounts and the existing list component grows modestly.

### 2. Feature-specific local reducer

Store documents, candidate, and modal state in `useReducer` with archive/restore/cancel actions.

**Benefits:** transitions are centralized and easy to enumerate. **Costs:** unnecessary action types/dispatch ceremony for two deterministic field updates and one candidate; no concurrency or multi-step state machine justifies it.

### 3. Mock repository/context or browser storage

Move mutable fixtures behind a provider/module store, optionally persisting to `sessionStorage` or `localStorage`.

**Benefits:** state could survive remounts or be shared by future screens. **Costs:** creates ownership, hydration, reset, synchronization, and test concerns absent from acceptance; risks leaking state across tests and pre-designing backend semantics.

## Decision

Use approach 1. ALF-60 is a frontend mock and the list already owns local ALF-59 state. Add the minimum working-copy and archive-candidate state to `AdminDocumentList`; do not introduce a reducer, hook, context, store, storage, server action, endpoint, optimistic cache, or dependency.

## State and mutation design

For successful data, the component owns:

- `documents: AdminDocumentListItem[]`, initialized lazily as `() => structuredClone(result.status === "success" ? result.data.documents : [])` so later updates never mutate props or module fixtures.
- `archiveCandidateSlug: string | null`; `null` means the confirmation is closed. Resolve the candidate from `documents` at render time rather than duplicating the whole item in state.
- Existing `query`, `selectedStatuses`, and search ref remain unchanged.

The successful prop is fixture-controlled and does not change after mount. Do not add an effect to synchronize later prop changes: the route supplies one deterministic result, and synchronization would risk overwriting user actions. Loading/empty branches remain unchanged; their initialized empty working copy is unused.

Add one feature-specific pure transition:

```ts
updateAdminDocumentStatus(
  documents: readonly AdminDocumentListItem[],
  slug: string,
  status: "active" | "archived"
): AdminDocumentListItem[]
```

It returns a new array in original order, clones only the matching item, preserves all metadata, and leaves the collection value-equivalent when no slug matches. It does not validate remote authorization or simulate latency. Archive and restore handlers additionally guard the current source status (`active` for archive, `archived` for restore) before calling it, preventing stale/invalid UI events from changing `processing` or `failed` items.

Archive flow:

1. `Arsipkan` sets `archiveCandidateSlug` only.
2. Alert Dialog opens from `archiveCandidateSlug !== null`.
3. `Batal`, Escape, or `onOpenChange(false)` clears only the candidate.
4. `Arsipkan BPP` re-resolves the candidate, verifies `active`, applies status `archived`, then clears the candidate.

Restore flow:

1. `Pulihkan` verifies the item is currently `archived`.
2. Apply status `active` immediately.
3. Keep current search/status filters unchanged.

Do not change `activeVersionLabel`, `updatedAt`, slug, title, fixture order, version history, or employee document-overview mocks. ALF-60 models list lifecycle only; inventing timestamps or retrieval data would imply backend behavior.

## List organization and ALF-59 interaction

Derive before rendering:

1. `filteredDocuments = filterAdminDocuments(documents, query, selectedStatuses)` using the existing predicate.
2. `visibleDocuments = filteredDocuments.filter(status !== "archived")`.
3. `visibleArchivedDocuments = filteredDocuments.filter(status === "archived")`.

The existing non-archived table/cards remain the primary `Dokumen BPP` result section. Add a sibling section headed `Dokumen diarsipkan`, with concise copy that these documents are excluded from employee retrieval until restored. Render its own desktop table and mobile cards, reusing focused internal row/card helpers where that removes real markup duplication without creating a generic data-grid abstraction.

Interaction with ALF-59 is explicit:

- Title search filters both sections.
- With no selected status, both non-archived and archived matching documents appear in their respective sections.
- Selecting `Diarsipkan` yields only the archived section; the primary section has zero matching items.
- Selecting any non-archived status hides the archived section.
- Selecting archived plus another status can show both sections; status OR and title/status AND remain unchanged.
- Archiving under no status filter moves the item between sections immediately.
- Under `Aktif`, archiving removes the item because it no longer matches; under `Diarsipkan`, an active item cannot be visible/actionable to archive.
- Restoring under no status filter moves the item to the primary section. Under `Diarsipkan`, it disappears after restore; under `Aktif`, archived items are not visible/actionable to restore.
- Existing filter values never auto-change. Mutation consequences are reflected by the same predicate, not by special filter exceptions.
- `resultSummary` reports the total after filters across both sections. The filtered-empty state appears only when both derived sections are empty. It retains the existing single `Reset filter` action and never suggests upload.

If one section is empty while the other has matches, omit the empty section's table/cards rather than showing a second no-results panel. Keep the archived heading available when archived matches exist; no permanent empty archived shell is required.

## UI and copy

### Primary/non-archived documents

Preserve title, active version, status, and updated date. Add an `Aksi` column at `md` and an `Aksi` row in mobile cards. Only `active` entries render a secondary/destructive-text `Arsipkan` button; `processing` and `failed` show no lifecycle action in ALF-60.

### Archived documents

Use a clearly separated sibling section with a top divider or bordered region and heading `Dokumen diarsipkan`. Archived rows/cards preserve the same metadata and title detail link, always show text status `Diarsipkan`, and expose a secondary `Pulihkan` button. Separation must rely on heading, grouping, whitespace/divider, and status text—not muted color alone.

### Archive confirmation

Use existing Alert Dialog primitives with controlled `open` state:

- Title: `Arsipkan BPP?`
- Description: `“{title}” tidak akan digunakan dalam pencarian atau jawaban chat karyawan setelah diarsipkan. Dokumen tetap tersedia di bagian Dokumen diarsipkan dan dapat dipulihkan kapan saja.`
- Cancel: `Batal`
- Confirm: `Arsipkan BPP`

Style confirm with the existing destructive button variant; archive changes retrieval availability and therefore requires deliberate visual consequence. Do not use `window.confirm`, a custom modal, toast-only confirmation, checkbox acknowledgment, typed title, second dialog, or restore confirmation.

## Accessibility and focus

- Every action is a native button with the visible document row/card providing context. If repeated action names are ambiguous to assistive technology, add an accessible name such as `Arsipkan Kebijakan Benefit Karyawan` while retaining visible `Arsipkan` text.
- Desktop table headers include `Aksi`; mobile cards use visible definition labels. Do not make rows/cards clickable and do not nest action buttons inside title links.
- Alert Dialog always renders a title and description. Radix traps focus while open, makes background content inert, focuses an available safe action, supports Escape, and returns focus to the trigger on ordinary cancellation.
- `Batal` is the safe initial dialog action. Confirm is not auto-focused.
- After successful archive, the trigger is removed. Explicitly focus the archived section heading (`tabIndex={-1}`) after state commit, using a ref and a narrowly scoped pending-focus marker/effect; this gives a stable destination and exposes where the item moved. After successful restore, focus the primary section heading similarly. Do not focus a removed trigger or rely on Radix's default return in successful mutations.
- Cancellation does not run mutation focus logic; Radix returns focus to the invoking trigger.
- Keep the existing polite result summary. Update its text after archive/restore through normal state rendering; do not add a competing assertive live region or toast.
- Status and section membership use text, not color alone. Preserve visible focus rings, logical DOM/tab order, Escape semantics, and ≥44×44 px action targets on touch layouts.
- Dialog animations come from the installed primitive and must continue to respect the app's reduced-motion treatment; add no new motion.

## Responsive behavior

- Preserve the existing breakpoint: semantic tables at `md` and above; stacked cards below `md`.
- Desktop/tablet tables add a compact right-aligned action column without converting the table to horizontal scrolling. Long titles may wrap; action text must not truncate into ambiguity.
- Mobile cards remain single-column. Put the action after metadata, full-width or naturally sized with at least 44 px height; do not use icon-only archive/restore controls.
- Alert Dialog uses the installed responsive content/footer: constrained width, mobile-safe gutters, stacked cancel/confirm controls on narrow screens, no viewport overflow.
- Both sections remain in normal flow. No tabs, accordion, sticky toolbar, popover action menu, swipe action, or horizontal card/table scroller.

## Consequence, cancellation, and failure decisions

- Archive is reversible but removes a document from employee retrieval, so confirmation is mandatory.
- Restore increases availability and is immediately reversible by archiving again, so confirmation would add friction without reducing material risk.
- Cancel/Escape/outside behavior supported by Alert Dialog must never mutate state. Candidate cleanup is idempotent.
- Synchronous local updates have no pending, network, retry, or partial-failure state. Do not fake latency or errors.
- Missing/stale slug or invalid source status is a programming/stale-event boundary: handlers perform a no-op and close archive confirmation. The pure helper does not throw or mutate data.
- No new route `error.tsx` or React Error Boundary is warranted for deterministic local array updates. Existing application boundaries handle unexpected render faults; backend integration must define recoverable mutation errors, pending controls, retry, and telemetry when real I/O exists.

## Mock boundary

Keep `ADMIN_DOCUMENT_LIST`, `getAdminDocumentListMock`, and its structured clone behavior unchanged. The archived seed proves restore at first render; active seed proves archive. The working list updates per action inside the component only. Do not add `archiveDocumentMock`, `restoreDocumentMock`, scenario flags, module-global mutation, local/session storage, or route query controls.

A fresh getter call, reload, remount, or navigation begins from the original four fixture statuses. This is intentional and must be stated during review; persistence belongs to backend integration, not ALF-60.

## Test strategy for downstream implementation

No tests are implemented by this design task. The implementation plan should keep browser-independent coverage proportional and use installed `node:test`/`tsx`; add no testing dependency and no Playwright/E2E for ALF-60.

### Pure transition tests

Add a focused unit test for `updateAdminDocumentStatus`:

- active → archived updates exactly one matching item;
- archived → active updates exactly one matching item;
- source order and all non-status fields remain unchanged;
- input and fixtures are not mutated;
- unknown slug returns a new value-equivalent array;
- processing/failed safety is enforced by handler/transition contract rather than allowing arbitrary target updates.

### Filter composition tests

Extend focused tests only where needed to prove current mutable statuses feed the existing predicate:

- archiving an active fixture then filtering `active` excludes it;
- filtering `archived` includes it in source order;
- restoring reverses those outcomes;
- title search still composes with changed status.

Do not duplicate ALF-59's exhaustive normalization/OR/AND tests.

### Static render contract

Update server-render coverage for default successful markup:

- primary and `Dokumen diarsipkan` section headings;
- active archive action and archived restore action;
- no archive/restore action for processing/failed;
- desktop action headers and mobile action labels;
- Alert Dialog title, consequence copy, cancel, and confirm markup if the controlled closed primitive is not emitted by static rendering only where technically observable.

Static rendering cannot prove open/cancel/confirm/focus transitions; do not claim it does. Interaction confidence belongs to rendered implementation QA with the installed browser tooling at implementation time, although this design-only task performs none.

### Required implementation QA

At 1440×900, representative tablet, and 375×812 inspect default, open confirmation, cancel/Escape, confirm, restore, relevant filters, combined title/status, and zero matches. Verify exact movement between sections, unchanged filters, one reset, dialog consequence copy, focus trap/safe initial focus/focus destination, keyboard order, live summary, 44 px targets, wrapping, contrast, no overflow, and no console/runtime errors. Preserve ALF-57 loading/source-empty states with no archive UI. Per task instruction, ALF-60 design work itself runs no browser or E2E.

## Downstream scope and migration ceiling

- ALF-59 remains the owner of search/filter semantics. ALF-60 only changes the array consumed by its existing predicate and separates archived output.
- ALF-61 upload may add documents; it must not be pre-built here.
- ALF-62 owns processing lifecycle transitions. ALF-60 must not archive `processing` or `failed` items.
- ALF-63+ rollback/version activation, preview, publish, and later milestone behavior are untouched.
- Backend integration must replace local transitions with authenticated/authorized server mutations, validation, pending/error/retry behavior, revalidation/cache handling, durable timestamps, and true retrieval/index effects. Preserve the present confirmation copy and section/filter behavior unless product semantics change.
- Employee retrieval is not modified in ALF-60. The dialog describes the intended consequence; actual retrieval exclusion is downstream backend/indexing scope. Do not alter employee mock overviews, chat, search, embeddings, or document files to simulate it.
- No bulk archive, undo toast, archive reason, retention policy, deletion, pagination, sorting, permissions, audit log, analytics, URL/storage persistence, generic state abstraction, new dependency, API, DB, or auth work.

## Acceptance mapping

| Requirement | Design/evidence boundary |
|---|---|
| Active documents archive after confirmation | Active-only action → controlled Alert Dialog → guarded immutable status transition |
| Confirmation explains retrieval impact | Named document + explicit employee search/chat exclusion + admin availability + restore consequence copy |
| Archived visibly separated and restorable | Semantic `Dokumen diarsipkan` sibling section; archived table/cards; immediate `Pulihkan` |
| Mock list updates per action | Component-owned cloned working list; active/archived transitions; both responsive views derive from same state |
| ALF-59 compatibility | Existing predicate runs over current working list; filters remain unchanged; two sections partition filtered output |
| Cancel/focus/a11y | Existing Radix Alert Dialog, safe cancel, no mutation on dismiss, trigger focus on cancel, section-heading focus after successful movement, native labelled controls |
| Responsive | Existing `md` table/card split, action column/card row, installed responsive dialog, no horizontal overflow |
| Error boundary | Guarded deterministic no-op for stale events; no fake error UI/new boundary; real mutation failures deferred to backend integration |

## Delivery boundary

This file is the complete ALF-60 design only. No implementation, tests, implementation plan, dependency/package change, browser/E2E, commit, push, branch operation, Linear mutation, API, backend, persistence, or Graphify update is included.