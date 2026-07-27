# ALF-49 Admin Mock Login Design

## Goal

Replace the `/admin/login` placeholder with a reviewable local-admin login experience backed by the existing typed mock auth boundary.

## Scope

- Accessible identifier and password inputs.
- Submit/loading, invalid-credential, generic-error, and success states.
- Successful mock login enters `/admin`.
- Employee chat remains reachable without authentication.
- No real authentication, persistence, authorization, new dependencies, or unrelated admin fixtures.

## Approach

Use a small interactive `AdminLoginForm` client component inside the existing server-rendered page. Keep static page structure server-rendered. The form calls `mockAdminLogin` from `lib/mocks/admin-auth.ts`; no API route or Server Action is appropriate because this milestone intentionally uses mocks.

The UI is a centered, single-column form using existing BPPedia tokens and shared `Input`, `Button`, and `Label` components. It has visible labels, visible focus styles inherited from the design foundation, one primary action, inline accessible feedback, and the existing employee-chat escape route. No animation or decorative redesign is added.

## Mock Interaction

The form derives deterministic review scenarios from submitted mock credentials:

- Password `mock-password` → success.
- Any other password → invalid credentials.
- Identifier containing `unavailable` → generic failure.

Submission immediately exposes loading state, disables controls, then resolves to the selected fixture. Success navigates to `/admin`. Errors remain visible with recovery through editing and resubmitting the form.

These triggers are mock-only review controls, not production credential rules.

## Accessibility and Responsive Behavior

- Every input has a persistent associated label.
- Inputs use appropriate autocomplete values.
- Loading uses `role="status"`; errors use `role="alert"`.
- Disabled state prevents duplicate submission.
- Existing global focus-visible treatment remains intact.
- Single-column width fits mobile and desktop without horizontal scrolling.
- Employee chat link remains keyboard reachable.

## Testing Strategy

Add one browser-independent server-render test file that verifies the UI contract: labels/required fields, employee link, loading status/disabled controls, and both error messages. This test is relevant because removing labels, status semantics, or mock-state rendering would break review acceptance criteria.

Do not add or run E2E for this issue. Authentication is a critical flow, but the full mocked frontend milestone gate owns browser E2E and Wahyu will run it on the laptop. Run focused unit checks, TypeScript, formatter/linter, and a production build if environment permits.

## Acceptance Mapping

- Accessible username/email and password inputs → labelled required fields with autocomplete.
- Loading, invalid credential, generic error → typed fixture rendering.
- Successful mock login enters admin → deterministic success navigation.
- Employee chat accessible without login → `/` remains unchanged and linked from admin layout/form.

## Non-Goals

Real sessions, password security, rate limiting, route protection, persistent login, backend APIs, and admin document screens belong to later Linear issues.
