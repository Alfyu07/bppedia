# ALF-65 Admin Publish Confirmation Plan

**Goal:** After canonical preview, let an admin explicitly publish an eligible mocked version and immediately see one coherent active-version state.

**Decision:** Keep one local client state containing the admin-list item plus version history. Offer publish only when a version is ready, inactive, and resolves to that version's canonical artifact. Confirm in an accessible alert dialog naming the target version; one reducer-like transition updates both presentations. No persistence, backend, answer-quality/test-question gate, deps, or E2E.

**Acceptance / files**
- `lib/mocks/documents.ts`, `lib/mocks/index.ts`: eligible publish lookup + immutable atomic list/history transition.
- `components/admin/admin-document-version-history.tsx`: active-version summary, eligible publish trigger, named confirmation, success announcement.
- Focused mock/render tests: eligibility; both state views update together; controls/dialog copy; no quality gate.

**TDD**
1. Add focused eligibility/transition/render contract tests; run → expected RED.
2. Implement minimum pure mock transition + local dialog UI.
3. Run focused tests, TypeScript, scoped Ultracite, `git diff --check`; inspect diff against scope.

**Manual milestone gate:** Verify preview → return → publish confirmation/cancel/confirm at desktop/tablet/mobile, keyboard/focus, announcements, list/history active label consistency; stop for approval, do not mark Done.
