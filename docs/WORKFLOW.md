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

1. Fetch `origin`; verify `dev` clean and current.
2. Create the Linear issue branch from `origin/dev`.
3. Read `AGENTS.md`, `docs/lessons.md`, Graphify context, relevant source/tests, and owning Linear issues.
4. For creative/product behavior, run brainstorming internally:
   - compare 2–3 scoped approaches;
   - choose the safest YAGNI option supported by Linear and existing conventions;
   - do not ask for routine approval.
5. For UI work, run UI/UX research before writing the spec.
6. Write and commit a design spec under `docs/superpowers/specs/`.
7. Self-review the spec for placeholders, contradictions, ambiguity, and scope.
8. Write and commit an executable plan under `docs/superpowers/plans/`.
9. Implement with TDD: capture valid RED evidence, write minimum GREEN code, then refactor only if useful.
10. Use fresh task implementers/reviewers only where reasoning complexity warrants them. Avoid agent/review loops.
11. Run one proportional scoped review. Fix Critical/Important findings; fix Minor findings only when cheap and in scope.
12. Run fresh automated verification:
    - affected unit/render tests;
    - TypeScript;
    - scoped Ultracite;
    - direct Next production build;
    - `graphify update .`;
    - `git diff --check`.
13. For any rendered UI change, perform rendered UI/UX QA before handoff:
    - desktop 1440×900;
    - representative tablet viewport;
    - mobile 375×812;
    - relevant success/loading/empty/error states;
    - runtime/console errors;
    - hierarchy, scannability, navigation affordance, keyboard focus, contrast, ≥44 px touch targets, overflow, truncation, and responsive behavior.
14. Fix real in-scope findings and rerun screenshots/verification. Route deferred behavior to its owning Linear issue.
15. Push the issue branch and create a PR targeting `dev`.
16. Verify PR base/head, diff, checks, mergeability, and remote SHA.
17. Merge the verified issue PR to `dev` without user interruption.
18. Fetch and verify the issue commit exists in `origin/dev`.
19. Update Linear with acceptance evidence: `In Progress → Review → Done`. Read back after each mutation.
20. Delete the merged issue branch when safe.
21. Continue immediately to the next dependency-valid issue.

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

- No routine progress chatter during autonomous milestone execution.
- `🔄` means a real task/process/subagent is active.
- `⏸` means a true blocker or milestone gate is waiting on the user.
- `✅` means the requested handoff/gate is complete.
- A dev server alone is not progress.
- Never claim autonomous work is running when no task/process is active.

## Current pilot

M3 uses this workflow. Issue PRs merge to `dev`; only the completed M3 gate may promote `dev` to `main` after user approval.
