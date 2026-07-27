# ALF-59 Admin BPP Search and Status Filter Design

## Goal

Extend the mocked `/admin` BPP list from ALF-57 with immediate client-side title search and lifecycle-status filtering for `active`, `processing`, `failed`, and `archived`. Search and status constraints compose with logical AND; when no documents match, the screen explains why and provides one reset action.

## Dependencies and scope

- ALF-57 is the only prerequisite and is present at the branch baseline: its typed list fixtures, responsive table/cards, and render tests are the foundation.
- Preserve ALF-57 loading and source-empty states. Filtering applies only to a successful, populated result.
- Keep the mock boundary, document detail links, upload link, list ordering, date formatting, desktop table, and mobile cards intact.
- Add no dependency, backend request, persistence, pagination, sorting, autocomplete, debounce, fuzzy search, result counts, bulk actions, or saved views.
- Do not implement archive/restore (ALF-60), upload (ALF-61), processing transitions (ALF-62), rollback (ALF-63), preview/publish (ALF-64/65), or backend integration.

## Evidence from the existing system

- `AdminDocumentList` is currently a Server Component receiving `AdminDocumentListResult`; successful documents are rendered twice, as a `md` table and mobile cards.
- `AdminDocumentListItem.status` already has the exact four-value union required by ALF-59.
- Existing success fixtures cover only `active` and `processing`; deterministic `failed` and `archived` fixtures are required to exercise every filter.
- Existing tests use native `node:test`, `tsx`, and static server rendering. React Testing Library is not installed.
- Graphify places the page, mock getter, list component, and both list tests in the same admin-list community, supporting a narrow change at those boundaries.
- UI research recommends a card alternative for mobile tables and a no-results state with actionable suggestions rather than a blank or bare zero-result message. ALF-57 already supplies the card layout.

## Approaches considered

### 1. Recommended: one focused Client Component with local state

Convert `AdminDocumentList` into a Client Component, retain the existing result prop, and hold `query` plus `selectedStatuses` in local React state. Compute visible documents from the immutable prop on every render.

**Benefits:** smallest coherent change; immediate filtering; no route plumbing; one rendering owner; native controls; existing stack only. **Cost:** the whole list becomes a client boundary, although the data remains server-provided.

### 2. Server-owned URL query parameters

Have `page.tsx` parse `q` and `status` search parameters and filter before rendering, with controls navigating through Next routing.

**Benefits:** shareable/back-button state and a Server Component list. **Costs:** every edit navigates/re-renders; multi-select URL serialization and form synchronization add complexity; mocked local filtering gains no backend benefit. This is disproportionate to ALF-59.

### 3. Hybrid server shell plus nested filter controller

Keep the page/list shell server-rendered and introduce a Client Component that owns controls and both responsive result representations.

**Benefits:** preserves a nominal server shell. **Costs:** splits one cohesive screen, duplicates or moves most successful-list markup anyway, and complicates loading/source-empty branches. No practical gain over approach 1.

## Decision

Use approach 1. ALF-59 explicitly asks for client-side filtering, the dataset is a small mock list, and immediate local state is the YAGNI fit. Keep the server route responsible only for obtaining the mock result. Do not create a generic filtering hook, context, reducer, form library, or reusable data-grid abstraction.

## Component and data design

`app/(admin)/admin/page.tsx` remains a Server Component and continues to call `getAdminDocumentListMock("success")`. `components/admin/admin-document-list.tsx` becomes the client boundary because it owns input/change/click handlers and React state.

For a successful result:

- `query: string` stores the visible input value.
- `selectedStatuses: AdminDocumentStatus[]` stores zero or more selected lifecycle values. An empty array means all statuses.
- `normalizedQuery = query.trim().toLocaleLowerCase("id-ID")`.
- A document matches search when its title, normalized with the same locale, includes `normalizedQuery`. Empty or whitespace-only search matches every title.
- A document matches status when no statuses are selected or `selectedStatuses.includes(document.status)`.
- A document is visible only when both predicates are true: `matchesSearch && matchesStatus`.
- Preserve fixture order; filtering must not sort or mutate `result.data.documents`.
- `hasActiveFilters` is true when the trimmed query is non-empty or at least one status is selected.

Add one focused pure export, `filterAdminDocuments(documents, query, selectedStatuses)`, in the component module so native tests can verify composition without a DOM library. It returns a new filtered array, preserves input order, and never mutates input. This is a feature-specific seam, not a generic search API.

Loading and source-empty results return before filter state is presented, as today. Hooks must still be called unconditionally at the component top level to satisfy React rules; their values are simply unused for non-success results.

## Controls and interaction

Place a labelled filter region between the existing page header and results:

- Search uses native `<input type="search">` with a persistent visible label `Cari judul BPP` and placeholder `Cari berdasarkan judul…`. Filtering updates on every `onChange`; Enter submission is not required.
- Status uses a `<fieldset>` with `<legend>Status dokumen</legend>` and four native checkboxes labelled `Aktif`, `Diproses`, `Gagal`, and `Diarsipkan`.
- Multiple statuses may be selected. They compose as OR within status (`active OR failed`) and AND with title search. This rule is visible in helper copy: `Pilih satu atau beberapa status.`
- A `Reset filter` button clears both query and selected statuses. Show it whenever `hasActiveFilters` is true, including above a non-empty filtered list and inside the no-results guidance. The no-results placement may reuse the same reset handler but must not create two simultaneously visible reset buttons.
- Reset returns focus to the search input so keyboard and screen-reader users receive a predictable continuation point. Use a ref; no timeout or effect is needed.
- Checkbox changes toggle only that value. Selecting the last unchecked status narrows to it; unchecking the final selected status restores all statuses.

Do not add a separate `Semua` checkbox: zero selected statuses already represents all, avoiding two sources of truth. Do not add a clear icon inside the search field; the single explicit reset covers the acceptance requirement without an icon-only control.

## Result and empty-state behavior

Three states remain distinct:

1. **Loading source:** existing `aria-busy` loading presentation; no controls.
2. **Empty source:** existing `Belum ada dokumen BPP` upload guidance; no controls because there is nothing to search.
3. **Zero filtered matches:** controls remain visible and populated; replace both table and card list with a single semantic section headed `Tidak ada dokumen yang cocok`. Supporting copy says `Ubah kata pencarian atau pilihan status, lalu coba lagi.` and provides `Reset filter`.

The filtered-empty state must never suggest upload, because documents exist but current constraints hide them. Reset restores the full successful list in original order.

## Responsive layout

- Preserve ALF-57's `md` breakpoint: table at `md` and above, cards below `md`.
- Controls use one column on small screens. At `sm` and above, search may take the available width while the status group and reset wrap naturally beneath or alongside it; no fixed width may force horizontal scrolling.
- Checkbox labels remain individually tappable with at least a 44×44 CSS-pixel interaction area and at least 8 px separation.
- The filter region and no-results state occupy normal document flow; no sticky bar, popover, drawer, or horizontal checkbox scroller.
- Use existing spacing, border, focus, typography, and semantic color tokens. Add no animation or raw color.

## Accessibility

- Use native search input, checkbox, fieldset/legend, and button semantics; no ARIA recreation of native behavior.
- Give the filter region an accessible name, e.g. `<section aria-labelledby="document-filters-heading">`, with a visually available heading `Filter dokumen` or an `sr-only` heading if visual hierarchy remains clear.
- Keep visible labels; placeholder text is supplementary, not the input label.
- Preserve standard keyboard order: search → four statuses → reset when present → document links.
- Preserve browser focus indicators. Search and checkbox labels need adequate contrast; status is conveyed in text, not color alone.
- Mark the result container `aria-live="polite"` with `aria-atomic="false"`, and include a concise visually hidden result summary such as `3 dokumen ditampilkan` or `Tidak ada dokumen yang cocok`. This announces filtering without moving focus or announcing the entire table.
- Reset focus behavior applies only after an explicit reset click; typing and checkbox changes do not move focus.
- Continue using normal title links rather than clickable rows/cards.

## URL-state decision

Filter state is intentionally not written to the URL, history, local storage, cookies, or server state. Reload, direct navigation, and returning after leaving `/admin` start with unfiltered defaults. Rationale: ALF-59 specifies client-side behavior only; persistence/shareability is neither accepted nor needed for the mocked list. If later backend pagination or shareable admin views require URL state, introduce canonical `q` and repeated `status` parameters in that owning issue rather than pre-building them here.

## Fixture changes

Extend `ADMIN_DOCUMENT_LIST` in `lib/mocks/documents.ts` to include at least one deterministic item for every lifecycle status:

- retain `employee-benefits` as `active`;
- retain `employee-mobility` as `processing`;
- add one uniquely titled `failed` item;
- add one uniquely titled `archived` item.

Each new item needs a unique stable slug, Indonesian title, valid ISO `updatedAt`, and an `activeVersionLabel` consistent with its lifecycle (`null` is acceptable where no active version exists). No new mock scenario or filtering argument belongs in `getAdminDocumentListMock`; filtering is presentation state, not source behavior. The getter must continue returning cloned fixture data.

## Test strategy

Keep tests browser-independent and proportional. Do not add or run Playwright/E2E for this issue.

### Mock contract

Extend `tests/unit/admin-document-list.test.ts` to assert the successful fixture set covers exactly the supported lifecycle values at least once, retains valid metadata/unique slugs, and remains isolated from caller mutation.

### Filtering logic

Add `tests/unit/admin-document-list-filter.test.ts` using native `node:test` against the focused `filterAdminDocuments` export. Cover:

- case-insensitive title substring matching;
- leading/trailing whitespace normalization;
- whitespace-only query behaving as no search;
- one selected status;
- multiple selected statuses using OR;
- search plus statuses using AND;
- no matches;
- empty status selection restoring all;
- original input order and fixture immutability.

If interaction behavior cannot be tested with installed browser-independent tools without introducing a dependency, test the pure predicate plus static render contract and defer event-level confidence to required rendered manual QA. Do not add React Testing Library solely for ALF-59.

### Render contract

Update `tests/unit/admin-document-list-render.test.ts` to verify static default output includes the visible search label, status fieldset/labels, all four fixture statuses, table/card navigation, and no reset button at default state. Static server rendering cannot prove state transitions; do not pretend it does.

### Implementation verification downstream

The implementation issue must run focused unit/render tests, `pnpm exec tsc --noEmit`, scoped Ultracite, `git diff --check`, Graphify update, and direct `pnpm exec next build`. Rendered QA must inspect 1440×900 desktop, representative tablet, and 375×812 mobile for default, combined filters, zero matches, reset, keyboard focus, announcements, touch targets, wrapping, truncation, and horizontal overflow. Per instruction, ALF-59 design work itself performs no browser/E2E.

## Error handling

Filtering is synchronous over fixture-controlled strings and statuses, so there is no loading, transport, or recoverable filter error state. Unknown lifecycle values are prevented by the TypeScript union. Invalid dates remain outside ALF-59 and under the existing fixture contract. Do not catch or mask programming errors.

## Downstream scope and migration ceiling

- ALF-60 archive/restore may change a document's lifecycle status; after that mutation, this same predicate should naturally include/exclude the item based on current filters.
- ALF-61 upload may add list items; filtering should consume the resulting list without API changes.
- ALF-62 processing transitions may change `processing` to `active` or `failed`; status labels/filter values remain the shared lifecycle vocabulary.
- Backend integration may move filtering server-side when list size, pagination, or remote querying demands it. At that point preserve the visible control and composition contract while replacing the local predicate.
- No speculative API, query schema, cache layer, debounce, pagination boundary, or URL convention is introduced now.

## Acceptance mapping

- **Search title:** labelled native search input; trimmed, locale-aware, case-insensitive title substring.
- **Filter active/processing/failed/archived:** four native multi-select checkboxes backed by the existing status union and complete fixtures.
- **Compose predictably:** OR across selected statuses; AND between status and title; zero statuses means all; original order preserved.
- **No-results explains reset:** dedicated filtered-empty state keeps constraints visible, recommends changing them, and offers one focus-restoring reset.
- **Responsive/a11y:** existing table/cards preserved; wrapping controls, 44 px targets, semantic grouping, keyboard order, live result summary, text statuses.
- **URL state:** explicitly local and ephemeral for this mocked client-side issue.

## Delivery boundary

This document is the complete ALF-59 design. Production code, tests, implementation plan, browser/E2E, commits, pushes, branch changes, and Linear mutations are not part of this design-only task.