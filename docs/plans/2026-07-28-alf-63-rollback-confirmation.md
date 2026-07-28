# ALF-63 Rollback Confirmation Plan

**Goal:** Safely activate an older successfully processed BPP version through an accessible confirmation flow.

**Approach:** Reuse the existing shared publish-state object, validator, localStorage key, and atomic active-marker update. Add only rollback eligibility (ready, inactive, older than current), dialog UI, focus restoration, and live status copy; no backend/persistence/dependencies.

## Acceptance map

- Eligible control: only `ready` inactive versions older than the active version.
- Dialog: names current and target labels; cancel leaves state untouched.
- Confirm: one shared-state transition updates document-list label plus exactly one history active marker, then stores once.
- Accessibility: AlertDialog semantics/focus trap from existing primitive; explicit trigger focus restoration; polite atomic status announcement.

## TDD steps

1. Extend focused mock-state tests with eligible/ineligible rollback candidates and atomic update assertions; extend render/source checks for dialog copy, trigger wiring, restoration, announcement.
2. Run focused tests; verify expected RED from missing rollback API/UI.
3. Implement minimum rollback candidate/apply helpers by reusing publish-state conventions; wire one controlled dialog into version history.
4. Run focused tests, TypeScript, scoped Ultracite, Graphify update if available, and `git diff --check`; audit diff/acceptance and Git metadata.
