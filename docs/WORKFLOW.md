# BPPedia Delivery Workflow

This document is the canonical execution workflow for autonomous delivery. It uses an outcome-first balanced model: each Linear issue delivers one verifiable user outcome, while planning, review, and full verification run once for that outcome rather than once per component or technical layer.

## Operating principles

- Linear is the approved source for outcome, scope, acceptance criteria, dependencies, and product decisions.
- One issue should be a thin but complete vertical slice across every layer needed for its user outcome.
- Technical steps such as schema, API, UI, worker, tests, and deployment are implementation checkpoints inside the outcome issue, not separate issues by default.
- Reframe or merge a horizontal issue before implementation when it cannot be demonstrated independently to a user or operator.
- Reuse completed behavior. Do not rebuild a feature merely because its original issue was more granular.
- Run one planning cycle, one primary review cycle, one final verification gate, and one PR per vertical outcome.
- Security, privacy, accessibility, validation, concurrency, and data-loss protection remain mandatory wherever applicable.
- Hermes owns routine execution and integration. Interrupt the user only for a true blocker, an unresolved high-impact decision, or an explicit product/milestone gate.

## Relationship to agent skills

Repository instructions override generic skill defaults when they would duplicate approved work.

- Always load relevant skills before acting.
- Treat an approved, sufficiently detailed Linear vertical issue as the design source. Do not create a duplicate spec or request another design approval.
- Use brainstorming internally to resolve implementation choices within the approved outcome. Ask the user only when the choice meets the interruption policy.
- Maintain one concise execution map for the issue in the working session or PR description.
- Create and commit a formal design or implementation-plan document only when the issue leaves a material cross-outcome architecture decision unresolved, explicitly requires the document, or involves security/destructive behavior that cannot be made clear in Linear.
- Apply TDD to behavior slices, but do not create separate planning artifacts, workers, reviews, PRs, or approval checkpoints for every test seam or helper.

## Branch model

- `main`: stable milestone output. Never merge milestone work here without user approval at the milestone gate.
- `dev`: agent-owned integration branch for the active milestone.
- `<issue-branch>`: isolated branch created from current `origin/dev` for one vertical outcome issue.

```text
origin/dev → vertical outcome branch → verified PR → agent merge to dev
...
origin/dev → milestone gate PR to main → user review/approval
```

Never auto-merge `dev` into `main`.

## Issue readiness and selection

Before implementation:

1. Read the Linear outcome, acceptance criteria, milestone, and relations.
2. Confirm the issue is dependency-valid and independently demoable or verifiable.
3. Confirm its acceptance criteria cover the end-to-end state transitions, trust boundaries, failure/recovery behavior, and relevant responsive/accessibility behavior.
4. If the issue is only a component or technical layer, reframe or merge it in Linear before writing code.
5. Prefer the smallest dependency-valid outcome that unlocks the next product journey.
6. Use serial integration unless outcomes are genuinely independent and have low conflict risk.
7. Move `Backlog → In Progress` immediately before implementation begins.

## Vertical outcome loop

### 1. Prepare once

1. Fetch `origin`; verify the checkout is clean and `dev` is current.
2. Create the issue branch from `origin/dev`.
3. Read `AGENTS.md`, `docs/lessons.md`, relevant Graphify context, owning Linear issue, source, and existing tests.
4. Map each acceptance criterion to the behavior and trust boundary that proves it.
5. Record one concise execution map: decisions, behavior slices, likely files, test strategy, and final journey check.
6. Do not commit a standalone spec/plan unless the skill-override conditions above require one.

### 2. Implement in internal behavior slices

For each meaningful behavior slice:

1. Write or identify the smallest check that proves the behavior.
2. Capture valid RED evidence when changing non-trivial behavior.
3. Implement the minimum GREEN path.
4. Run only the affected check.
5. Refactor only when it reduces current complexity.
6. Continue within the same issue branch without creating a new approval, review, PR, or Linear issue.

Use the controller for clear local changes. Dispatch workers only for genuinely independent work; do not dispatch a worker merely to apply a known patch.

### 3. Integrate the outcome

Before final review:

- exercise the complete issue journey across all touched layers;
- verify shared state and contracts across routes/processes rather than only component-local behavior;
- verify refresh, deep-link, back/retry, and partial-failure behavior when relevant;
- remove contradictory fixtures, dead affordances, and stale paths encountered inside the approved outcome;
- defer only unrelated product outcomes, with a clear owning Linear issue.

### 4. Review once

- Run one whole-outcome acceptance/diff review after the journey works.
- Add one focused risky-boundary review only for authentication, authorization, privacy, concurrency, destructive/data-loss behavior, or deployment rollback.
- Fix Critical/Important findings. Fix Minor findings only when cheap and in scope.
- Run at most one delta review after a material Critical/Important fix.
- If one reviewer retry fails or times out, perform the controller audit, record the limitation, and continue. Never loop reviewers.

### 5. Verify proportionally

Use staged checks without repeating identical gates:

- Inner loop: affected unit/render/integration test only; TypeScript only when a type boundary changes.
- Outcome integration: the narrowest end-to-end journey proving the issue acceptance criteria.
- Final source gate, once after source is stable:
  - affected or relevant full unit/render/integration tests;
  - TypeScript;
  - scoped Ultracite;
  - direct Next production build when production code/config changed;
  - `git diff --check`;
  - `graphify update .` once after source is final.
- Run the complete repository suite at milestone/CI gates, or earlier only when the outcome changes broad shared infrastructure.
- Never rerun an unchanged full gate without a source/environment change or a concrete failed assertion.

### 6. Perform consolidated rendered QA

For a frontend outcome, perform one rendered UI/UX QA session after the complete journey is integrated:

- desktop 1440×900;
- representative tablet viewport;
- mobile 375×812;
- relevant success/loading/empty/error/recovery states;
- runtime and console errors;
- hierarchy, scannability, navigation, keyboard focus, contrast, at least 44 px touch targets, overflow, truncation, and responsive behavior.

Preflight one complete desktop journey before running the viewport matrix. Reuse proven selectors/harnesses. After two harness-only failures, stop rewriting the ad-hoc harness; use a proven browser path and record the harness limitation. A harness-only fix does not trigger source/build gates.

Fix clear in-scope product findings, then rerun only affected interactions/checks.

### 7. Integrate once

1. Push the outcome branch and create one PR targeting `dev`.
2. Verify base/head, diff, checks, mergeability, and remote SHA.
3. Merge to `dev` without routine user interruption when the auto-merge gate passes.
4. Fetch and verify the outcome commit exists in `origin/dev`.
5. Update Linear with concise acceptance and verification evidence: `In Progress → Review → Done`; read back each mutation.
6. Delete the merged branch when safe.
7. Continue to the next dependency-valid outcome.

## Auto-merge gate for outcome PRs

Hermes may merge an outcome PR to `dev` when all applicable checks pass:

- every acceptance criterion is implemented and demonstrated by the integrated outcome;
- required design decisions are captured in Linear or a necessary committed design artifact;
- valid behavior-level RED/GREEN evidence exists for non-trivial changes;
- no unresolved Critical/Important review finding remains;
- relevant tests, TypeScript, scoped Ultracite, and required production build pass;
- frontend outcomes pass one consolidated desktop/tablet/mobile journey QA;
- no runtime blocker, dead-end journey, contradictory shared state, horizontal overflow, or severe accessibility regression remains;
- PR targets current `dev`, is mergeable, and introduces no unapproved security, destructive, data-loss, or product-scope expansion.

A committed spec/plan is not mandatory when the approved Linear issue already resolves the design. Missing external CI is not automatically fatal when equivalent fresh local evidence exists and repository rules do not require it; record evidence honestly.

## User interruption policy

Interrupt the user only for:

- contradictory requirements with no safe reversible default;
- a new high-impact product decision not resolved by Linear, existing design, or conventions;
- unresolved authentication, authorization, security, privacy, credential, destructive, or data-loss architecture choices;
- unavailable access, credentials, services, or dependencies blocking every reasonable path;
- a Git conflict where resolution risks losing another person's work;
- repeated verified failures indicating an architectural problem;
- an explicit Linear product gate or milestone promotion gate.

Do not interrupt for ordinary implementation choices, duplicate spec/plan approval, subtask completion, Minor review findings, outcome PR creation, or outcome PR merge to `dev`.

## Milestone gate

After all milestone outcome issues are integrated into `dev`:

1. Run the complete relevant automated suite serially.
2. Run final rendered end-to-end journey QA on desktop/tablet/mobile.
3. Prepare critical E2E flows for the user's MacBook; never run milestone Playwright E2E on the VPS.
4. Produce one gate packet with:
   - outcome issue/PR/commit matrix;
   - acceptance summary;
   - verification evidence;
   - representative screenshots;
   - known limitations/deferred outcomes;
   - concise MacBook manual/E2E checklist;
   - PR from `dev` to `main`.
5. Request one user review/approval.
6. Merge `dev → main` only after explicit milestone approval.
7. Verify `origin/main` and record the milestone outcome in Linear.

`ALF-67` is the current explicit product gate for the complete mocked employee and admin journeys. Future milestone promotion remains a user gate even when no separate gate issue exists.

## Status communication

- Send concise progress updates when starting an outcome, after merging it to `dev`, when moving to the next major phase, and occasionally during long-running work.
- Progress updates are informational, not routine approval requests.
- Never claim autonomous work is active when no implementation, verification, or delegated task is running.
- A dev server alone is not progress.

## Current roadmap

- M4: `ALF-98` admin mocked journey and `ALF-99` employee mocked journey → `ALF-67` product approval.
- M5: `ALF-100` persisted admin catalog → `ALF-101` PDF ingestion/preview → `ALF-103` active-knowledge control; `ALF-102` Word conversion follows `ALF-101` independently.
- M6: `ALF-104` exact cited answer → `ALF-105` semantic/bilingual safe answer.
- M7: `ALF-106` measured readiness → `ALF-107` production deployment verification.
