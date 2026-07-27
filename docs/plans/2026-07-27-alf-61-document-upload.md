# ALF-61 Document Upload — Combined Design/Plan

**Goal:** Add a local-only admin flow for selecting or dropping a PDF/Word file, reviewing its metadata and target BPP, then queuing a mocked version.

**Approach:** A client upload form owns browser interaction. Small pure helpers validate extension, MIME, and the 10 MB ceiling and create the queued mock result; native file input/drag events and semantic form controls keep the surface dependency-free and accessible.

**Constraints:** `.pdf`, `.doc`, `.docx`; MIME + extension validation; 10 MB max; no backend/persistence; no dependencies; no Playwright/E2E.

## Acceptance map
- Choose/drag → labeled native file input plus keyboard/clickable drop zone and drag handlers.
- Review → filename, normalized type, formatted size, required target BPP selector.
- Invalid → explicit unsupported and oversized alerts; invalid files cannot queue.
- Submit → local queued-version status tied to the selected target.
- Responsive/a11y → one-column mobile, two-column review at `sm`, semantic labels, alert/status live regions, ≥44 px controls.

## File map
- `lib/admin-document-upload.ts`: pure validation/format/queue model.
- `components/admin/admin-document-upload.tsx`: interactive mocked upload UI.
- `app/(admin)/admin/documents/upload/page.tsx`: route wiring.
- `tests/unit/admin-document-upload.test.ts`: focused helper behavior.
- `tests/unit/admin-document-upload-render.test.ts`: initial rendered contract and interaction-source contract.

## TDD steps
1. Add helper tests for PDF/DOC/DOCX acceptance, extension/MIME mismatch, unsupported and >10 MB rejection, size formatting, queued-version result. Run focused test → RED (module absent).
2. Implement minimum pure upload model. Run focused test → GREEN.
3. Add render test for route copy, file accept contract, target options, semantic controls, responsive review classes, live regions, drag handlers, queued state wiring. Run focused test → RED (component absent).
4. Implement route and client form with existing Button/Input conventions. Run both focused tests → GREEN.
5. Run focused tests and `pnpm exec tsc --noEmit`; inspect diff and `git diff --check`. Do not run E2E or mutate Git history/remotes.
