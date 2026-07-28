# Next.js + TypeScript Agent Rules

## Project Context

You are building a Next.js 15 App Router application with TypeScript. React Server Components (RSC) are the default. Client Components are an opt-in escape hatch for interactivity, browser APIs, and event handlers. Server Actions handle all mutations.

Read `docs/lessons.md` before starting work and before retrying a failed tool call. Append reusable lessons after mistakes.

## Autonomous Delivery Workflow

- `docs/WORKFLOW.md` is the canonical executable delivery workflow. Read it before selecting, starting, reviewing, merging, or handing off work.
- Use the outcome-first balanced model: one planning cycle, one primary review, one final verification gate, and one PR per vertical outcome issue—not per component, helper, technical layer, or test seam.
- An approved, sufficiently detailed Linear vertical issue is the design source. Do not create a duplicate spec/plan or request duplicate approval unless the issue leaves a material cross-outcome architecture decision unresolved, explicitly requires the artifact, or involves an unresolved security/destructive decision.
- Use behavior subtasks as internal TDD checkpoints inside the outcome branch; they do not receive separate branches, planning artifacts, reviews, PRs, or Linear workflow transitions.
- During an active milestone, use `dev` as the agent-owned integration branch and create outcome branches from current `origin/dev`.
- After all applicable gates pass, Hermes may create and merge outcome PRs into `dev` without routine user approval.
- Never merge `dev` into `main` before the user approves the milestone gate.
- Interrupt the user only for true blockers defined in `docs/WORKFLOW.md`, an unresolved security/destructive decision, or an explicit product/milestone gate.
- Run one consolidated rendered desktop/tablet/mobile UI/UX QA session for each complete frontend outcome before handoff—not once per subcomponent.
- Do not claim autonomous work is active unless a real implementation, verification, or delegated task is running.

## Linear Workflow

- Linear workspace and team: `Alfy`.
- Linear project: `bppedia`.
- Linear is the source of truth for outcome scope, acceptance criteria, dependencies, product decisions, and status.
- Each implementation issue must deliver one independently demoable or verifiable user/operator outcome across all required layers. Keep schema/API/UI/worker/test steps inside that issue unless they deliver an independent outcome.
- Reframe or merge horizontal component/layer issues before implementation; do not compensate for poor issue slicing with repeated planning and review loops.
- Use the workflow `Backlog → In Progress → Review → Done`; never move directly from `In Progress` to `Done`.
- Move an issue to `In Progress` immediately before implementation begins.
- Complete and approve the mocked employee/admin product through `ALF-98`, `ALF-99`, and gate `ALF-67` before starting dependent real-backend work.
- After one outcome-level automated/review/QA gate passes, add concise verification evidence, move `In Progress → Review`, then move ordinary issues to `Done` without manual approval.
- Require explicit user approval for `ALF-67`, `dev → main` milestone promotion, and unresolved authentication/security/privacy or destructive/data-loss architecture choices. Security-sensitive implementation with decisions already approved in Linear may otherwise proceed autonomously with focused risky-boundary review and evidence.
- Current roadmap: `ALF-98/99 → ALF-67 → ALF-100 → ALF-101 → ALF-103 → ALF-104 → ALF-105 → ALF-106 → ALF-107`; `ALF-102` follows `ALF-101` independently.

## Code Style & Structure

- Enable `"strict": true` in `tsconfig.json`. Never use `any`; use `unknown` with type guards.
- Use `interface` for component props and object shapes. Use `type` for unions, mapped types, and conditional types.
- Use named exports for all components and utilities. Default exports only for `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`.
- Structure component files: exported component → subcomponents → helpers → type definitions → constants.
- Use descriptive auxiliary-verb names for boolean state: `isLoading`, `hasError`, `canSubmit`.

## App Router Conventions

- Use `app/` for all routes. Use route groups `(group)/` for layout sharing without URL segments.
- Co-locate `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx` per route segment.
- Use `template.tsx` instead of `layout.tsx` when you need fresh state on each navigation.
- Use parallel routes (`@slot`) for independent page sections with their own loading/error states.
- Use intercepting routes (`(.)`, `(..)`) for modal patterns that retain the background page URL.

## React Server Components

- Default every component to a Server Component. Add `'use client'` only when unavoidable.
- Reasons to use `'use client'`: event handlers (`onClick`), React hooks (`useState`, `useEffect`), browser APIs (`localStorage`, `ResizeObserver`).
- Never import server-only modules (Prisma, DB clients, `'server-only'`) in Client Components.
- Compose RSC and Client Components by passing RSC output as `children` to a Client Component wrapper.
- Use `React.Suspense` boundaries to stream parts of the page. Provide meaningful `fallback` skeletons.

## Data Fetching

- Fetch data in `async` Server Components directly. No `useEffect`, no client-side `fetch` to internal APIs.
- Deduplicate identical fetch calls with `React.cache()`: `const getUser = cache(async (id: string) => prisma.user.findUnique(...))`.
- Use `unstable_cache(fn, ['cache-key'], { revalidate: 60, tags: ['users'] })` for long-lived cached data.
- Apply `unstable_noStore()` inside functions that must always return fresh data.
- Waterfall fetches are blocked during SSR — parallelize with `Promise.all([fetchUser(id), fetchPosts(id)])`.

## Server Actions

- Declare Server Actions with `'use server'` at the top of a server-only file or inline in RSC.
- Validate all inputs with Zod at the start of every Server Action. Return early with error details on failure.
- Return typed results: `{ success: true, data: T } | { success: false, error: string }`. Never throw from Server Actions.
- Call `revalidatePath('/path')` or `revalidateTag('tag')` after successful mutations.
- Bind Server Actions to forms with the `action` prop: `<form action={createPostAction}>`.
- Use `useActionState` (React 19) for progressive enhancement with pending, error, and result state.

## Routing & Navigation

- Use `next/link` for all internal navigation. Use `router.push()` from `useRouter` only for programmatic navigation.
- Use `next/navigation`'s `useSearchParams`, `usePathname`, `useParams` in Client Components. Read them server-side from page props.
- Implement dynamic routes with `[param]` for single segments and `[...params]` for catch-all segments.
- Prefetch links automatically with `next/link`. Use `prefetch={false}` for links the user is unlikely to follow.

## Error Handling

- Add `error.tsx` at each route segment that may fail. Accept `error: Error` and `reset: () => void` props.
- Add `not-found.tsx` for 404 states. Call `notFound()` from `next/navigation` to trigger it.
- Log errors in `error.tsx` to an external service (Sentry, Axiom) before rendering the fallback UI.
- Validate all user inputs with Zod on the server in Server Actions. Return structured field errors.

## Performance

- Use `next/image` for all raster images. Set `sizes` to match the rendered layout.
- Use `next/font` with `display: 'swap'` for web fonts. Use CSS variable mode for Tailwind integration.
- Lazy-load Client Components with `dynamic(() => import(...), { loading: () => <Skeleton /> })`.
- Set cache policies with `export const revalidate = 3600` at the route segment level.
- Use `export const dynamic = 'force-static'` on pages that have no dynamic data.

## Security

- Validate and sanitize all data in Server Actions and Route Handlers before processing.
- Add Content Security Policy headers in `next.config.ts` via `headers()`.
- Use `NEXT_PUBLIC_` prefix only for env vars that are safe to expose to the browser.
- Never perform authorization checks only on the client — always verify on the server.
- Protect Server Actions with auth checks: read the session and verify the user owns the resource.

## Testing

- Test Server Components with `vitest` by rendering them as async functions: `const result = await MyPage({ params })`.
- Test Client Components with React Testing Library. Mock `next/navigation` hooks with `vi.mock`.
- Write Playwright end-to-end tests for critical user flows: auth, checkout, form submission.
- Test Server Actions directly: call the function with typed inputs, assert returned results and side effects.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
