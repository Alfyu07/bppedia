# ALF-95 Mock Admin Route Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep mocked `/admin` routes usable without guest database authentication while preserving existing auth behavior elsewhere.

**Architecture:** Export one pure route-policy predicate from `proxy.ts` and use it for the existing early public-route return. Cover the exact mock-admin namespace and protected-route boundary with one focused Node test.

**Tech Stack:** Next.js proxy, TypeScript, Node test runner, tsx.

## Global Constraints

- Treat the entire `/admin` namespace as frontend-only mock routes.
- Do not implement real admin sessions, roles, backend auth, or database fallback.
- Preserve auth behavior for `/login`, `/register`, and protected APIs.
- Do not include ALF-96 UI polish.
- Do not run Playwright/E2E suite on VPS; screenshot automation is visual QA only.

---

### Task 1: Public admin mock route policy

**Files:**
- Modify: `proxy.ts`
- Create: `tests/unit/admin-route-access.test.ts`

**Interfaces:**
- Produces: `isPublicFrontendPath(pathname: string): boolean`
- Consumed by: `proxy(request: NextRequest)` before token lookup

- [x] **Step 1: Write the failing regression test**

Assert that `/admin`, `/admin/login`, `/admin/documents/employee-benefits`, and `/admin/documents/upload` are public, while `/api/chat` and `/login` remain protected.

- [x] **Step 2: Run RED**

Run: `pnpm exec tsx --test tests/unit/admin-route-access.test.ts`

Expected: FAIL because `isPublicFrontendPath` does not exist.

- [x] **Step 3: Implement minimum route policy**

Export `isPublicFrontendPath`, preserve existing public employee routes, add `/admin` plus `/admin/`, and have `proxy` call the predicate before token lookup. Remove `/admin/login` from authenticated-user redirect handling because the namespace now returns earlier.

- [x] **Step 4: Run focused GREEN**

Run: `pnpm exec tsx --test tests/unit/admin-route-access.test.ts`

Expected: 1 pass, 0 fail.

- [ ] **Step 5: Run verification**

```bash
pnpm exec tsc --noEmit
pnpm exec ultracite check proxy.ts tests/unit/admin-route-access.test.ts
pnpm exec next build
```

Then run desktop/mobile screenshot automation against `/admin`; require HTTP 200 and no horizontal overflow.

- [ ] **Step 6: Review, commit, and push**

Review only `origin/main..HEAD`; fix Critical/Important findings, commit focused files, push branch, create PR, and move ALF-95 to Review.

## Self-review

- Spec coverage: all four acceptance criteria map to Task 1.
- Placeholder scan: none.
- Type consistency: `isPublicFrontendPath(pathname: string): boolean` matches the test and proxy call.
- Scope: two production/test files plus spec/plan; no UI changes.
