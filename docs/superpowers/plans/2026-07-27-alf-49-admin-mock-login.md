# ALF-49 Admin Mock Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the accessible mocked BPPedia admin login flow required by ALF-49.

**Architecture:** Keep the route page server-rendered and isolate interaction in one client form component. The form consumes the existing typed admin-auth mock boundary and deterministically renders loading/error states or navigates to `/admin` on success.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, existing shadcn-style UI components, native `node:test` via `tsx`.

## Global Constraints

- Reuse `lib/mocks/admin-auth.ts`; do not add dependencies, backend auth, persistence, API routes, or unrelated fixtures.
- Use existing BPPedia design tokens and shared `Input`, `Button`, and `Label` components.
- Keep static layout in a Server Component; use a Client Component only for form interaction.
- Test only acceptance-critical UI semantics; do not add or run Playwright/E2E on the VPS.
- E2E for this critical auth flow is deferred to Wahyu's laptop at the mocked-frontend milestone review gate.
- Never move Linear directly from `In Progress` to `Done`.

---

### Task 1: Accessible mocked admin login

**Files:**
- Create: `components/admin/admin-login-form.tsx`
- Modify: `app/(admin)/admin/login/page.tsx`
- Create: `tests/unit/admin-login-render.test.ts`

**Interfaces:**
- Consumes: `mockAdminLogin(credentials: AdminLoginCredentials, scenario: AdminAuthMockScenario): AdminAuthMockResult` from `lib/mocks/admin-auth.ts`.
- Produces: named `AdminLoginForm` component with optional `initialResult?: AdminAuthMockResult` only for deterministic server-render testing.

- [ ] **Step 1: Write the failing render-contract test**

Create `tests/unit/admin-login-render.test.ts` using `node:test`, `react-dom/server`, and `mockAdminLogin`. Assert:

```ts
assert.match(markup, /<label[^>]*for="admin-identifier"/);
assert.match(markup, /<input[^>]*id="admin-identifier"[^>]*required/);
assert.match(markup, /<label[^>]*for="admin-password"/);
assert.match(markup, /href="\/"/);
assert.match(render("loading"), /role="status"/);
assert.match(render("loading"), /disabled/);
assert.match(render("invalid-credentials"), /role="alert"/);
assert.match(render("invalid-credentials"), /Email atau kata sandi tidak valid\./);
assert.match(render("failure"), /Login admin belum dapat diproses\./);
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm exec tsx --test tests/unit/admin-login-render.test.ts
```

Expected: FAIL because `@/components/admin/admin-login-form` does not exist.

- [ ] **Step 3: Implement the minimal client form**

Create `components/admin/admin-login-form.tsx` with:

- `"use client"`.
- Existing `Button`, `Input`, and `Label` components.
- Visible labels and `autocomplete="username"` / `autocomplete="current-password"`.
- Submit handler that reads `FormData`, sets the typed loading fixture, then resolves after 500 ms.
- Scenario precedence: identifier containing `unavailable` → `failure`; otherwise password `mock-password` → `success`; otherwise `invalid-credentials`.
- Success uses `window.location.assign("/admin")`.
- Loading disables both inputs and submit button and renders `role="status"`.
- Error renders fixture message with `role="alert"`.
- Link to `/` labelled `Kembali ke chat employee`.
- No storage, fetch, API, auth library, extra state machine, animation, or new abstraction.

Modify `app/(admin)/admin/login/page.tsx` to import and render `AdminLoginForm` beneath concise admin-login copy in a responsive `max-w-md` container.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
pnpm exec tsx --test tests/unit/admin-login-render.test.ts
pnpm exec tsc --noEmit
pnpm exec ultracite check app/'(admin)'/admin/login/page.tsx components/admin/admin-login-form.tsx tests/unit/admin-login-render.test.ts
```

Expected: render test passes with 0 failures; TypeScript and Ultracite exit 0.

- [ ] **Step 5: Update graph and inspect diff**

Run:

```bash
export PATH="/opt/data/bin:/opt/data/home/.local/bin:$PATH"
graphify update .
git diff --check
git diff --stat
```

If `graphify update .` cannot run because the repository has no initialized graph, record that as a non-blocking tooling limitation; do not fabricate graph output or expand scope by running LLM extraction.

- [ ] **Step 6: Commit focused implementation**

```bash
git add app/'(admin)'/admin/login/page.tsx components/admin/admin-login-form.tsx tests/unit/admin-login-render.test.ts docs/superpowers/specs/2026-07-27-alf-49-admin-mock-login-design.md docs/superpowers/plans/2026-07-27-alf-49-admin-mock-login.md
git commit -m "feat: add mocked admin login"
```

Do not push or mutate Linear from the implementer.

---

## Review and Handoff

- Run one task-scoped review against ALF-49 acceptance criteria and this plan; no repeated reviewer loop unless it finds a Critical/Important defect.
- Controller runs fresh focused unit, TypeScript, Ultracite, and production build if required env permits. Controller does not run Playwright/E2E on VPS.
- Append exact verification evidence to Linear, move `In Progress → Review`, verify via `get_issue`, then move ordinary issue `Review → Done` only after automated non-E2E gate passes.
- Push the focused commit after local verification succeeds.
