# ALF-62 Document Processing States — Combined Design/Plan

**Goal:** Show a local mocked ingestion lifecycle in admin version history, with clear phases, preview when ready, useful failure/retry, and explicit protection of the active version.

**Approach:** Extend the existing version fixture with six narrow statuses (`queued`, `converting`, `extracting`, `indexing`, `ready`, `failed`). Keep the history component client-local only so retry can move a failed row back to queued without persistence. Reuse the employee document preview route for ready versions; preserve existing rollback behavior for non-active ready versions.

**Constraints:** Tier M; local mock only; no backend, persistence, new dependencies, or Playwright/E2E. Responsive table/cards, semantic live status, ≥44 px actions.

## Acceptance map
- Lifecycle → deterministic fixtures cover queued/converting/extracting/indexing/ready/failed.
- Plain language → each phase explains what the system is doing and what the admin should expect.
- Ready → “Pratinjau” links to `/documents/<slug>`.
- Failed → human-useful reason plus retry button; retry locally changes the row to queued and announces it.
- Active safety → active ready version remains marked and a visible note says it stays in use while newer versions process/fail.
- Upload integration → queued upload confirmation links directly to target version history.

## File map
- `lib/mocks/documents.ts`: lifecycle type, reason field, deterministic fixtures.
- `components/admin/admin-document-version-history.tsx`: lifecycle copy, active-safety notice, preview/retry UI.
- `components/admin/admin-document-upload.tsx`: history link after queueing.
- `tests/unit/admin-document-version-history.test.ts`: model lifecycle contract.
- `tests/unit/admin-document-version-history-render.test.ts`: render/a11y/action contract.
- `tests/unit/admin-document-upload-render.test.ts`: upload-to-history integration contract.

## TDD steps
1. Update focused model/render/upload tests for all phases, plain-language copy, active safety, preview, failure reason, retry wiring, live region, and queued-history link. Run focused files → RED on missing lifecycle/UI.
2. Implement minimum fixture/type/UI changes. Retry only mutates component-local status; no timers or persistence. Run focused files → GREEN.
3. Inspect whole diff against acceptance map; run focused tests, `tsc --noEmit`, scoped Ultracite, production build if feasible, `graphify update .` if CLI exists, and `git diff --check`.
