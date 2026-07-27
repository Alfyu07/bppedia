# ALF-64 Admin Canonical PDF Preview Plan

**Goal:** Let admins preview only ready mocked canonical PDF versions, navigate pages, inspect source/generated-file metadata, then return to the same version history context.

**Decision:** Reuse `MockPdfViewer`; add optional admin return/metadata props. Resolve preview data server-side from ALF-62 histories so direct URLs cannot bypass the ready gate. Mock ready versions point to existing canonical PDFs; no backend/dependency/E2E work.

**Acceptance map / files**
- `lib/mocks/documents.ts`, `lib/mocks/index.ts`: version source type, generated PDF metadata, ready-only preview resolver.
- `components/admin/admin-document-version-history.tsx`: preview URL carries `version`.
- `app/(admin)/admin/documents/[slug]/preview/page.tsx`: validated admin preview route; unknown/non-ready → 404.
- `app/(documents)/documents/[slug]/mock-pdf-viewer.tsx`: shared admin return link + source/PDF status display; existing page controls unchanged.
- Unit render/route/mock tests: ready resolution, real non-ready gate, version-context links, viewer metadata.

**TDD batch**
1. Add focused tests for ready/non-ready lookup, version-specific links, route render/gate, metadata/return context.
2. Run tests → confirm RED from missing API/route/behavior.
3. Implement minimum model fields, resolver, route, shared-viewer props/link changes.
4. Run focused tests, `tsc --noEmit`, scoped Ultracite; inspect diff/check whitespace.

**Constraints:** Tier M; one batch; no deps/backend/E2E; no Git mutation; no Graphify.
