# BPPedia Delivery Workflow

This document is the canonical execution workflow for autonomous milestone delivery. Improve it through reviewed commits whenever the workflow changes.

## Operating mode

Hermes owns issue execution and integration until a milestone gate. Do not request routine user approval, per-issue review, or per-issue merge. Ask the user only for a true blocker or the milestone review gate.

## Branch model

- `main`: stable milestone output. Do not merge milestone work here before user approval at the milestone gate.
- `dev`: agent-owned milestone integration branch.
- `<issue-branch>`: isolated branch created from current `origin/dev` for one Linear issue.

Issue flow:

```text
origin/dev → issue branch → verified PR → agent merge to dev
...
origin/dev → milestone gate PR to main → user review/approval
```

Never auto-merge `dev` into `main`.

## Issue selection

1. Read Linear scope, acceptance criteria, milestone, and relations.
2. Select only dependency-valid issues.
3. Prefer the issue that establishes a shared foundation or unlocks the next dependency.
4. Use serial integration unless two branches are genuinely independent and have low conflict risk.
5. Move `Backlog → In Progress` before implementation.

## Per-issue autonomous loop

### Risk tier and execution budget

Classify the issue before planning. Use the lowest tier that safely covers its trust boundaries:

| Tier | Typical scope | Planning | Review budget | Target active time |
|---|---|---|---|---|
| S — Small | copy, styling, deterministic local mock UI | one concise design/plan note | controller self-review | 30–60 minutes |
| M — Medium | stateful UI, forms, accessibility interactions | one combined design/plan, normally ≤150 lines | one whole-diff independent review | 60–120 minutes |
| L — Large/Risky | auth, permissions, API/DB, upload, persistence, destructive/data-loss behavior | separate design spec and executable plan when useful | scoped risky-boundary reviews plus final review | estimate explicitly |

Escalate the tier when implementation reveals a higher-risk boundary. Never downgrade validation, security, accessibility, or data-loss protection merely to fit a time target. Time targets expose workflow waste; they are not merge deadlines.

1. Fetch `origin`; verify `dev` clean and current.
2. Create the Linear issue branch from `origin/dev`.
3. Read `AGENTS.md`, `docs/lessons.md`, Graphify context, relevant source/tests, and owning Linear issues.
4. For creative/product behavior, run brainstorming internally:
   - compare 2–3 scoped approaches;
   - choose the safest YAGNI option supported by Linear and existing conventions;
   - do not ask for routine approval.
5. For UI work, perform only the UI/UX research needed to resolve the issue's actual decisions.
6. Plan proportionally:
   - S/M: one combined design/plan note, normally ≤150 lines, with acceptance map, decisions, file map, and executable TDD steps;
   - L: separate design spec and executable plan when complexity warrants it.
7. Self-review planning once for placeholders, contradictions, ambiguity, and scope; commit the planning artifact(s) together.
8. Implement with TDD in behavior slices: capture valid RED evidence across the affected behavior, write minimum GREEN code, then refactor only if useful. Do not create worker/review/commit checkpoints for every helper or test seam.
9. Use at most one implementation worker for S/M unless independent work is genuinely parallel. The controller handles clear fixes of roughly ≤50 lines; do not dispatch a worker merely to apply a known patch.
10. Review proportionally:
    - S: one controller acceptance/diff audit;
    - M: one whole-diff independent review;
    - L: scoped reviews for risky boundaries plus one final review.
    Fix Critical/Important findings; fix Minor findings only when cheap and in scope. Re-review only a material Critical/Important fix, with at most one delta review. If one reviewer retry fails or times out, perform the controller audit and continue; do not loop reviewers.
11. Use staged verification rather than repeating the full gate:
    - inner loop: affected tests; TypeScript only when the type boundary changes;
    - pre-QA: affected/full unit tests, TypeScript, scoped Ultracite, and one direct production build;
    - final source: rerun only checks affected by QA fixes, then one final build if production source changed and one Graphify update after source is final.
12. Run fresh final automated verification as applicable:
    - affected unit/render tests;
    - TypeScript;
    - scoped Ultracite;
    - direct Next production build;
    - `graphify update .`;
    - `git diff --check`.
13. For any rendered UI change, perform one consolidated rendered UI/UX QA session before handoff:
    - desktop 1440×900;
    - representative tablet viewport;
    - mobile 375×812;
    - relevant success/loading/empty/error states;
    - runtime/console errors;
    - hierarchy, scannability, navigation affordance, keyboard focus, contrast, ≥44 px touch targets, overflow, truncation, and responsive behavior.
    Use the reusable harness when available: viewport screenshots for fixed dialogs, exact failed request URLs, animation-settled focus assertions, and guaranteed browser/server teardown. Do not mistake full-page fixed-overlay artifacts for viewport defects.
14. Fix real in-scope findings directly when clear, then rerun only affected interactions/checks. Route deferred behavior to its owning Linear issue.
   - QA harness retry budget: preflight one desktop journey first and wait for the final hydrated interaction control, not static PPR/Suspense copy. Only after preflight passes, run the viewport matrix. After two harness-only failures, stop rewriting the ad-hoc script; switch to a previously proven selector/browser path and record the harness defect separately. Never rerun source/build gates for a harness-only change.
15. Push the issue branch and create a PR targeting `dev`.
16. Verify PR base/head, diff, checks, mergeability, and remote SHA.
17. Merge the verified issue PR to `dev` without user interruption.
18. Fetch and verify the issue commit exists in `origin/dev`.
19. Update Linear with acceptance evidence: `In Progress → Review → Done`. Read back after each mutation.
20. Delete the merged issue branch when safe.
21. Continue immediately to the next dependency-valid issue.

### Default S/M guardrails

- one combined planning artifact, normally ≤150 lines;
- one implementation batch and normally one implementation commit;
- one primary review; one delta review maximum only for a material fix;
- one production build on final source unless a production QA fix requires one rerun;
- one Graphify update after source is final;
- one consolidated rendered-QA session;
- no repeated identical gate without a source/environment change or a concrete failed assertion;
- approval/tool timeout is a visible blocker: report it immediately and retry only after user consent.

## Auto-merge gate for issue PRs

Hermes may merge an issue PR to `dev` only when all applicable checks pass:

- acceptance criteria implemented;
- committed spec and plan;
- valid TDD evidence;
- no unresolved Critical/Important review findings;
- focused tests pass;
- TypeScript passes;
- scoped Ultracite is clean;
- direct Next build passes;
- rendered desktop/tablet/mobile QA passes for UI changes;
- no runtime blocker, horizontal overflow, or severe accessibility regression;
- PR targets `dev`, is up to date, and is mergeable;
- no unapproved security, destructive, data-loss, or product-scope expansion.

A missing external CI check is not automatically fatal when equivalent fresh local evidence exists and repository rules do not require it. Record the evidence honestly.

## User interruption policy

Interrupt the user only for:

- contradictory requirements with no safe reversible default;
- a new high-impact product decision not resolved by Linear/spec/conventions;
- authentication, authorization, security, privacy, or credential architecture decisions;
- destructive/data-loss behavior;
- unavailable access, credential, service, or dependency that blocks every reasonable path;
- a Git conflict where resolution risks losing another person's changes;
- repeated verified failures indicating an architectural problem;
- the milestone review gate.

Do not interrupt for ordinary implementation choices, spec/plan approval, reviewer Minor findings, issue PR creation, or issue PR merge to `dev`.

## Milestone gate

After all milestone issues are integrated into `dev`:

1. Run the complete relevant automated suite serially.
2. Run final rendered journey QA on desktop/tablet/mobile.
3. Prepare critical E2E flows for the user's MacBook; never run milestone Playwright E2E on the VPS.
4. Produce one gate packet:
   - issue/PR/commit matrix;
   - acceptance summary;
   - verification evidence;
   - representative screenshots;
   - known limitations/deferred issues;
   - concise MacBook manual/E2E checklist;
   - PR from `dev` to `main`.
5. Stop and request one user review/approval.
6. Merge `dev → main` only after explicit milestone approval.
7. Verify `origin/main`, close the milestone gate issue, and record the outcome.

## Status communication

- Send occasional concise progress heartbeats so autonomous work stays visible without requesting a response.
- Send a heartbeat when starting an issue, after merging it to `dev`, when moving to the next issue or a major phase, and occasionally during long-running work.
- Use: `ℹ️ Sekarang mengerjakan <issue/phase> — hanya info, tidak perlu respons.`
- Do not turn heartbeats into approval requests or routine chatter.
- `🔄` means a real task/process/subagent is active.
- `⏸` means a true blocker or milestone gate is waiting on the user.
- `✅` means the requested handoff/gate is complete.
- A dev server alone is not progress.
- Never claim autonomous work is running when no task/process is active.

## Current pilot

M3 uses this workflow. Issue PRs merge to `dev`; only the completed M3 gate may promote `dev` to `main` after user approval.
