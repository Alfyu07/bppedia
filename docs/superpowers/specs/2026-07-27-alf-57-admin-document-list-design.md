# ALF-57 Admin BPP Document List Design

## Goal

Replace the `/admin` placeholder with the mocked primary document-management screen required by ALF-57, giving administrators a fast, accessible overview of each BPP's active version and lifecycle state.

## Scope

- Show document title, active-version label, lifecycle status, and last-update date.
- Represent deterministic success, loading, and empty list states through the frontend mock boundary.
- Make each populated document entry navigate to `/admin/documents/[slug]` so later version-history work has a stable detail context.
- Keep a primary `Unggah BPP` action visible and route it to `/admin/documents/upload` for ALF-61.
- Keep employee chat accessible through the existing admin header.
- Do not implement search, filters, archive/restore, version history, upload behavior, or backend persistence.

## Architecture

Extend `lib/mocks/documents.ts` with an admin-list domain while preserving the existing employee citation/PDF overview API. The mock getter accepts an explicit scenario (`success`, `loading`, or `empty`) and returns a discriminated union with cloned data so callers cannot mutate fixtures.

Keep `/admin` and its document-list presentation as Server Components. The route requests the success scenario and passes the result to a focused `AdminDocumentList` component. Static loading and empty states are renderable by tests without URL-only testing hooks or client state.

## Data model

Each admin list item contains:

- `slug`: stable route segment.
- `title`: Indonesian display title.
- `activeVersionLabel`: the currently active version or `null` when none is active.
- `status`: `active`, `processing`, `failed`, or `archived` to support later ALF-59 filters without adding filter behavior now.
- `updatedAt`: ISO timestamp, formatted in Indonesian at the presentation boundary.

The fixture set must include at least one active item and one non-active lifecycle item so status treatment is reviewable. No inactive historical versions belong in this list contract; ALF-58 owns version history.

## UI and interaction

- Header row: `Dokumen BPP`, concise supporting copy, and prominent `Unggah BPP` button.
- Desktop/tablet: semantic table with columns `Dokumen`, `Versi aktif`, `Status`, and `Terakhir diperbarui`.
- Small screens: the same data is presented as stacked cards to avoid table overflow and preserve readable labels.
- Document title is a normal `next/link` target. The table row itself is not made into a custom clickable control, preventing invalid nested interaction and preserving predictable keyboard navigation.
- Lifecycle badge always includes text; color is supplementary.
- Loading state uses fixed skeleton-like blocks with `aria-busy="true"` and a status message.
- Empty state explains that no BPP exists yet and repeats the upload action.
- Use existing semantic tokens, typography, Button, and Lucide icons. Add no font, raw color, animation, or dependency.

## Error handling

ALF-57 requires only success, loading, and empty states. A generic error state is not added because neither the Linear acceptance criteria nor the existing mock source requires remote failure behavior. Future backend integration owns transport errors.

Dates are fixture-controlled valid ISO timestamps. Formatting uses `Intl.DateTimeFormat("id-ID", { dateStyle: "medium" })` without introducing a date dependency.

## Testing

Add only two focused boundaries:

1. Mock contract tests prove deterministic success/loading/empty selection, expected lifecycle metadata, and cloned success data.
2. Server-render tests prove the populated accessibility/content contract plus loading and empty output.

Do not test Tailwind classes or duplicate browser navigation behavior. Add no E2E case for this isolated list screen; milestone-level critical admin journeys remain deferred to Wahyu's laptop and Playwright is not run on the VPS.

## Out of scope

- Authentication persistence or route guards.
- Search/status filtering (ALF-59).
- Archive/restore mutation (ALF-60).
- Upload behavior (ALF-61); only the navigation affordance is reserved.
- Version history and rollback (ALF-58/63).
- Processing lifecycle transitions (ALF-62).
- PDF preview/publish (ALF-64/65).
- Pagination, sorting, bulk actions, virtualized tables, or responsive visual polish beyond the required usable layouts.

## Acceptance mapping

- Title, active version, status, last update: mock list item + desktop table/mobile cards.
- Empty/loading: explicit discriminated mock states + rendered components.
- Row selection opens detail context: title link to `/admin/documents/[slug]` in each representation.
- Primary upload action visible: page header button to `/admin/documents/upload`, repeated in empty state.
- Employee chat remains accessible: existing admin layout header remains unchanged.

## Delivery gate

Focused unit/render tests, TypeScript, scoped Ultracite, Graphify update, and direct Next production build run on the VPS. E2E/Playwright does not run on the VPS. After a proportional scoped review, the branch is pushed and ALF-57 moves to Review with evidence.