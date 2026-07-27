# ALF-58 BPP Version History Frontend Design

## Goal

Add the mocked admin detail screen at `/admin/documents/[slug]` so an administrator can scan one BPP's version history, identify the active version without inference, notice processing failures without technical noise, and find rollback actions on eligible older versions. ALF-58 exposes the rollback entry point only; ALF-63 owns confirmation and mutation behavior.

## Source constraints

- Linear scope supplied for ALF-58 requires consistent version ordering/labels, an unambiguous active version, visible processing failures, and rollback access for successfully processed older versions.
- ALF-57 established document-title links to `/admin/documents/[slug]`, a Server Component presentation pattern, deterministic cloned mocks, Indonesian UI copy, desktop tables, and mobile cards.
- The repository has no current admin document-detail route or version-history model.
- Reuse existing semantic tokens, `Button`, `Badge`, and Lucide icons. Add no dependency, font, raw color, animation, backend call, or persistence.

## Approaches considered

### 1. Responsive table plus mobile cards — chosen

Render one semantic table from `md` upward and a labelled card list below `md`, matching ALF-57. Keep actions in a dedicated final column/section. This duplicates a small amount of markup but provides native table semantics on wide screens, readable mobile labels, no horizontal scrolling, and no client JavaScript.

### 2. One responsive card list at every width

Cards remove duplicate markup and are naturally responsive. They are less efficient for comparing many versions, weaken column alignment, and depart from the dense admin convention established by ALF-57.

### 3. Horizontally scrollable table at every width

One table minimizes markup. On a 375 px viewport it hides context/actions off-screen, makes scanning dependent on horizontal movement, and creates avoidable overflow risk.

Choose approach 1: it is the smallest convention-aligned design that remains usable at required viewports. Do not extract a generic responsive-list abstraction for two screens; revisit only if a third admin screen proves the same contract.

## Route and architecture

Create `app/(admin)/admin/documents/[slug]/page.tsx`. The async Server Component reads `params.slug`, requests the success fixture from the existing document mock boundary, and calls `notFound()` for an unknown slug. The route renders a focused `AdminDocumentVersionHistory` Server Component; no `"use client"`, hooks, browser fetch, or Server Action is required.

Extend `lib/mocks/documents.ts` rather than adding another mock module. Export the detail types and getter through `lib/mocks/index.ts`. The getter accepts the slug and explicit scenario, returns a discriminated result, and clones populated fixtures. The component can therefore render success, loading, and empty-history states directly in unit render tests while the route uses `success`.

Proposed contract:

```ts
type AdminVersionProcessingStatus = "processed" | "processing" | "failed";
type AdminDocumentHistoryScenario = "success" | "loading" | "empty";

interface AdminDocumentVersionItem {
  createdAt: string;
  id: string;
  isActive: boolean;
  label: string;
  processingStatus: AdminVersionProcessingStatus;
}

interface AdminDocumentVersionHistory {
  slug: string;
  title: string;
  versions: AdminDocumentVersionItem[];
}

type AdminDocumentHistoryResult =
  | { status: "loading" }
  | { status: "empty"; data: Pick<AdminDocumentVersionHistory, "slug" | "title"> }
  | { status: "success"; data: AdminDocumentVersionHistory };
```

`getAdminDocumentVersionHistoryMock(slug, scenario)` returns `undefined` for an unknown slug; otherwise it returns the selected cloned result. Keep version status separate from the ALF-57 document-level lifecycle status because one document can contain processed, processing, and failed versions simultaneously.

## Data invariants and ordering

The fixture and getter contract enforce these presentation invariants:

1. Versions are returned newest first by `createdAt` descending; equal timestamps use `id` ascending as a deterministic tie-breaker.
2. Every visible version uses the same label form: `Versi {label}` (for example, `Versi 2026.3`). Raw IDs are never displayed.
3. A populated history has exactly one active version.
4. The active version must have `processingStatus: "processed"`.
5. Rollback eligibility is derived, not stored: `processingStatus === "processed" && !isActive`.
6. Processing and failed versions are never rollback-eligible, even when older than the active version.

The success fixture must contain at least four rows: one active processed version, one currently processing version, one failed version, and one older processed version eligible for rollback. This makes all required states reviewable without query-string scenario controls.

## UI composition

### Page header

- Back link: `Kembali ke dokumen BPP` → `/admin`.
- `<h1>`: document title.
- Supporting copy: `Riwayat versi BPP`.
- No upload, filter, sort, kebab menu, or bulk action on this screen.

### Version history

Use a single visible heading `Riwayat versi`, followed by:

- Desktop/tablet (`md` and wider): semantic table with caption `Riwayat versi {title}` and columns `Versi`, `Status`, `Ditambahkan`, and `Tindakan`.
- Mobile: ordered visual cards in the identical newest-first array order. Each card uses a heading for the version label and a `<dl>` for status and date; the action occupies its own full-width final row.

Each representation communicates state with persistent text, not color alone:

- Active processed version: version label plus a `Aktif` success badge; status text `Selesai diproses`; no rollback control.
- Non-active processed version: status text `Selesai diproses`; outlined `Rollback ke versi ini` button.
- Processing version: status text `Sedang diproses`; no rollback control.
- Failed version: destructive/error badge `Pemrosesan gagal` plus quiet supporting text `Versi ini belum dapat digunakan.`; no error code, stack trace, provider name, retry instructions, or rollback control.

In the action cell/slot, ineligible versions show concise visible text (`Versi aktif` or `Tidak tersedia`) rather than a disabled button. This avoids implying that an action can become available through interaction and removes disabled controls from the tab order.

Dates use module-level `Intl.DateTimeFormat("id-ID", { dateStyle: "medium" })`. Do not display time because the requirement is ordering and lifecycle clarity, not audit-grade timestamps.

## Rollback boundary and ALF-63 ownership

ALF-58 renders the rollback affordance only. To avoid inventing destructive behavior before ALF-63:

- Render `Rollback ke versi ini` as an enabled `Button` with `type="button"` only for derived eligible rows.
- Do not add an event handler, form action, dialog, navigation target, toast, optimistic state, API request, or mutation.
- Add an accessible name containing the target label, e.g. `aria-label="Rollback ke Versi 2026.1"`, while retaining concise visible text.
- ALF-63 will own confirmation copy, focus management within confirmation, pending/error/success states, authorization and validation, mutation, active-version replacement, cache revalidation, and destructive-flow manual verification.

The inert button is intentional in the frontend mock phase: it makes action placement and eligibility reviewable while preventing an unconfirmed rollback. Implementation should keep the action boundary easy for ALF-63 to replace with its interactive controller, without creating a speculative interface now.

## Responsive and accessibility behavior

- Preserve source order: newest version first in both table and cards; CSS must not reverse or reorder items.
- At 375×812, cards fit the viewport without horizontal scrolling; labels wrap and the rollback button is full width with at least 44 px height.
- At tablet and desktop widths, table cells align for comparison; action labels may wrap but must not be clipped.
- Use native `<table>`, `<th scope="col">`, `<th scope="row">`, `<ul>`, headings, links, and buttons. Do not simulate controls on rows or generic containers.
- `Aktif`, processing, and failure remain explicit text. Badge color/icon is supplementary.
- Visible keyboard focus comes from existing `Link`/`Button` styles. Only eligible rollback actions enter tab order.
- Decorative icons, if used, have `aria-hidden="true"`; status does not depend on icons.
- Loading uses `role="status"`, `aria-busy="true"`, visible text `Memuat riwayat versi…`, and neutral fixed placeholders.
- Empty history retains the document header and shows `Belum ada riwayat versi` with `Versi akan muncul setelah dokumen BPP diunggah dan diproses.` It does not offer upload because ALF-61 owns upload behavior and `/admin` already exposes that entry point.
- Unknown slugs use the route's `notFound()` path rather than presenting an empty history for a nonexistent document.

## Error handling

Processing failure is row data, not a page transport error. It stays visible in chronological context with calm user-facing copy and does not prevent other versions or eligible rollback controls from rendering.

No generic transport-error scenario is introduced: this frontend phase has no remote call, and backend integration owns request failures. Invalid fixture dates and impossible active/status combinations are programmer errors covered by mock contract tests rather than silently rewritten in the component.

## Testing strategy

Add focused native Node tests only; do not add or run Playwright/E2E in this phase.

### Mock contract tests

Verify:

- known slug success/loading/empty selection and unknown slug behavior;
- cloned results are isolated from caller mutation;
- versions are sorted by timestamp descending with deterministic ID tie-break;
- labels and IDs are non-empty and timestamps are valid ISO strings;
- exactly one active, processed version in success data;
- the fixture includes processing, failed, and eligible older processed states;
- rollback eligibility follows `processed && !active` and excludes active/processing/failed rows.

### Server-render contract tests

Verify:

- document title, back link, history heading, version labels, dates, and all status copy render;
- `Aktif` is attached to only the active row/card;
- failure copy is visible and excludes technical diagnostics;
- rollback buttons render only for eligible older processed versions and expose target-specific accessible names;
- loading and empty-history states render explicit accessible copy;
- table caption/headers and mobile labelled structure exist.

### Route contract tests

Verify the page composes the known-slug success result and invokes the not-found path for an unknown slug using the project's existing Server Component test style. Do not assert Tailwind class strings or duplicate browser navigation coverage.

## Files expected in implementation

- Create `app/(admin)/admin/documents/[slug]/page.tsx`.
- Create `components/admin/admin-document-version-history.tsx`.
- Modify `lib/mocks/documents.ts`.
- Modify `lib/mocks/index.ts`.
- Create focused mock, render, and route unit tests under `tests/unit/`.

No production file is changed during this design phase.

## Out of scope and downstream ownership

- Rollback confirmation/mutation and all destructive-flow states: ALF-63.
- Upload UI/behavior: ALF-61.
- Processing lifecycle transitions, retry, polling, and backend diagnostics: ALF-62/backend integration.
- PDF preview/publish: ALF-64/ALF-65.
- Document search/status filters: ALF-59.
- Archive/restore: ALF-60.
- Backend persistence, API shape, authentication changes, pagination, user attribution, version comparison/download, release notes, bulk actions, and audit logs.

## Acceptance mapping

- Consistent order/labels → getter returns deterministic newest-first data; every row/card displays `Versi {label}`.
- Active version unambiguous → exactly one fixture invariant plus persistent `Aktif` badge and `Versi aktif` action text; no active rollback.
- Failures visible without technical noise → chronological failed row/card with `Pemrosesan gagal` and one plain-language sentence; diagnostics omitted.
- Older successful versions expose rollback → eligibility derived from `processed && !active`; each eligible row/card has a target-specific rollback button.
- Confirmation remains ALF-63 → no handler, dialog, form action, navigation, request, or state mutation in ALF-58.

## Delivery gate for later implementation

Implementation must use TDD and then run focused unit/render/route tests, TypeScript, scoped Ultracite, direct Next production build, `graphify update .`, and `git diff --check`. Rendered QA must cover desktop 1440×900, a representative tablet, and mobile 375×812 across success/loading/empty and all row lifecycle states. Playwright/E2E remains off the VPS.
