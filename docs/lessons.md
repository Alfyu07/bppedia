# Lessons

Read this file before starting work and before retrying a failed tool call. Add reusable lessons after mistakes; record the root cause, prevention rule, and verification step.

## Linear tool payloads

### Failure

`linear_save_comment` failed because this session's tool schema required unrelated parent fields. Calls therefore included empty placeholders plus `statusUpdateType` without `statusUpdateId`, which Linear rejected. The same visible payload was then repeated while incorrectly described as "minimal."

### Prevention

- Inspect the actual serialized tool call, not the intended payload. Never claim fields were omitted when they remain visible in the call.
- After one reproducible validation error, stop retrying an unchanged payload.
- If a tool schema forces an invalid field combination, treat that tool as unavailable for the operation; switch tools instead of retrying.
- For ALF issue review handoff, use `linear_save_issue` to append evidence/checklists to the description and set `state: "Review"` when `linear_save_comment` cannot produce a valid payload.
- Preserve the existing issue description when using this workaround; append rather than replace scope or acceptance criteria.
- Never move directly from `In Progress` to `Done`; follow the manual-gate exceptions in `AGENTS.md`.

### Verification

After every Linear mutation, call `linear_get_issue` and confirm the expected description content and status exist. Tool success output, an empty subagent response, or intent is not verification.

## Worktree command targeting

### Failure

A chained setup command created a worktree but continued running dependency installation and baseline tests in the original checkout because the shell working directory does not change after `git worktree add`.

### Prevention

- Create the worktree in one command, then run setup and tests in a separate tool call whose `workdir` is the new worktree path.
- Do not infer command location from preceding commands in the chain.

### Verification

Run `git rev-parse --show-toplevel` with setup commands and confirm it equals the intended worktree before relying on their results.

## Server-rendered React tests

### Failure

Playwright 1.61 transforms JSX in imported `.tsx` files into component-test descriptors (`__pw_type`) even under `@playwright/test`, so `react-dom/server` rejects the result as an invalid React child.

### Prevention

Keep server-render checks outside Playwright. Run them directly with native `node:test` through the installed `tsx` runtime.

### Verification

Run `pnpm test:unit` and confirm server-render checks pass without starting Next.js or a browser.

## Test execution tiers

### Decision

Keep browser-independent mock and server-render checks out of Playwright so routine feedback does not pay for Next.js and browser startup.

### Commands

- Run `frontend-mocks` and `employee-landing-render` under native `node:test` through the installed `tsx` runtime.
- Provide `test:unit`, `test:e2e`, and `test:landing` scripts; keep `pnpm test` as the complete final/CI gate.
- During implementation, run only the affected tier or test file. Run the full suite once at review handoff.

### Verification

Compare test counts before and after migration, confirm unit tests run without a web server, then run the complete gate once to ensure no coverage was lost.

## Playwright web server health

### Failure

An orphaned Next/Turbopack process held the configured test port for almost an hour at high CPU while `/ping` timed out. Playwright waited for `webServer.url` and appeared stuck before printing the test count.

### Prevention

Before retrying a Playwright run that stalls after environment loading, inspect the configured port and `/ping`. Stop only the orphaned process; do not rerun the suite blindly.

### Verification

Confirm the port is free before the run, then verify Playwright prints `Running N tests` and releases the port afterward.

## File edit payloads

### Failure

An `edit` call was sent with an empty payload while correcting a planning document, so the tool aborted without changing the file.

### Prevention

- Build and inspect all required edit fields before calling the tool: absolute `filePath`, exact non-empty `oldString`, distinct `newString`, and explicit `replaceAll`.
- After an aborted edit, read the target section again before retrying; never infer its current content.

### Verification

After each edit, search for the obsolete text and read the changed section before claiming the correction applied.

## Linear read batching

### Failure

A parallel audit sent eight Linear reads at once, causing timeouts and closed socket connections. A subsequent single read confirmed the MCP connection remained unavailable.

### Prevention

- Audit Linear sequentially or in batches of at most two requests.
- After a batch causes transport errors, probe once with a single read; if it fails, stop and report the audit as blocked.

### Verification

Confirm each read returns data before starting the next batch; never infer Linear state from a failed audit.
