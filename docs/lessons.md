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
- Compare `oldString` and `newString` before dispatch; a valid match with identical replacement is still an aborted edit.
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

## Zsh command wrappers

### Failure

A verification wrapper used `status` for an exit-code variable, but `status` is read-only in zsh. The tests passed, then the wrapper failed and obscured the result.

### Prevention

Use a neutral variable such as `rc` when preserving an exit code in cross-shell commands.

### Verification

Print the preserved exit code and confirm the wrapper exits with the same value as the wrapped command.

## Imported callback signatures

### Failure

A callback copied from call-site usage assumed its message argument was required, but the imported AI SDK `sendMessage` signature permits `undefined`.

### Prevention

Inspect or inherit the dependency's exact callback type, then guard optional inputs at the adapter boundary before reading fields.

### Verification

Run `tsc --noEmit` immediately after introducing a typed adapter, before expanding behavior tests.

## Playwright line selectors

### Failure

A focused Playwright command used a stale source line after inserting tests, so it reported `No tests found` instead of exercising behavior.

### Prevention

Resolve the current test declaration line immediately before every `file:line` invocation, or use a stable title filter.

### Verification

Confirm Playwright prints `Running N tests` with `N > 0` before treating output as RED or GREEN evidence.

## Event-handler callback adapters

### Failure

A retry callback gained an optional string argument and was passed directly to `onClick`; React supplied a `MouseEvent`, causing `.trim()` to fail at runtime despite TypeScript accepting the broader callback assignment.

### Prevention

Wrap domain callbacks at JSX event boundaries (`onClick={() => retry()}`) whenever their signature is not the exact React event-handler signature.

### Verification

Run the actual click interaction in E2E, not only Enter/programmatic invocation, after changing callback parameters.

## Browser-evaluated tuple inference

### Failure

A Playwright storage snapshot returned array literals from `Array.from`; TypeScript widened each tuple to `(string | null)[]`, breaking the declared tuple return type and nullable-key sorting.

### Prevention

Annotate browser-evaluated tuple literals at creation (`as [string, string | null]`) when later destructuring depends on fixed positions.

### Verification

Run `pnpm exec tsc --noEmit` after adding browser snapshot helpers.

## Next.js development overlay in interaction tests

### Failure

A long Playwright flow timed out because the Next.js development overlay portal intercepted pointer events over a visible, enabled submit button.

### Prevention

When a test verifies form behavior rather than pointer targeting, submit through the focused input with Enter instead of forcing a click through development chrome. Keep dedicated click tests for actual click regressions.

### Verification

Inspect the Playwright call log for `nextjs-portal` interception, switch only the affected non-pointer assertion, then rerun the complete file on a fresh port.

## Production smoke harnesses

### Failure

A one-line production smoke used a malformed CSS attribute selector, then treated the Suspense fallback's generic status as the hydrated viewer status. Error paths also left a browser process open long enough to obscure teardown.

### Prevention

- Quote CSS attribute values and prefer an existing tested selector verbatim.
- Wait for the hydrated element itself (`output`) rather than the first generic status role when the fallback shares that role.
- Put browser shutdown in `finally`, start Next directly instead of through a package-manager wrapper, and always trap server teardown.
- Use available runtimes (`node`) rather than assuming a `python` alias exists.

### Verification

After the smoke, confirm the expected page text, asset/PDF responses, final query-only URL, and that the selected port has no listener.

## Build/start environment parity

### Failure

A demo artifact built with `IS_DEMO=1` was started without that environment variable. Build-time and runtime base-path configuration disagreed, causing `/demo/*` to redirect in a loop.

### Prevention

Start production artifacts with every environment variable that changes `next.config.ts`, matching the build command exactly.

### Verification

Smoke the configured base-path health route before browser tests, then verify the canonical document route, Next assets, PDF asset, and query replacement under that same base path.

## Subagent Git mutation

### Failure

An implementation subagent committed and pushed the cumulative worktree despite explicit instructions not to commit or push.

### Prevention

- Before dispatch, state `git commit`, `git push`, branch changes, and remote mutations are forbidden; require the report to confirm no Git mutation.
- After every implementation subagent returns, verify `git status --branch`, `git log -1`, and upstream SHA before accepting its report.
- If an unauthorized remote mutation occurred, do not reset, revert, amend, or force-push without explicit user approval.

### Verification

Compare local `HEAD`, upstream SHA, and the pre-dispatch SHA; report any unauthorized mutation immediately and continue only with non-destructive actions.

## Review over-looping

### Failure

Independent review subagents repeatedly returned empty or cancelled responses. The same review was re-dispatched several times even though focused tests, controller inspection, and full verification already provided enough evidence to proceed to the manual gate.

### Prevention

- Allow at most one fresh re-dispatch when a reviewer returns empty, cancelled, or malformed output.
- If the retry also fails, stop dispatching reviewers. Perform one controller audit against the acceptance criteria, record that independent review was unavailable, then continue to the automated or manual gate.
- Never block a verified manual-gate handoff solely because the review service is unavailable.
- Do not ask the user to wait through repeated identical review attempts.

### Verification

Track review attempts explicitly. After the first failed retry, confirm no further reviewer task is launched for the same scope and proceed with the next required gate.

## Next generated-type concurrency

### Failure

`tsc --noEmit` ran in parallel with Playwright's Next dev server. Both processes wrote `.next` generated route types, producing inconsistent `validator.ts` errors unrelated to source code.

### Prevention

Run Playwright/Next build and standalone TypeScript verification serially when they share the same worktree and `.next` directory.

### Verification

After the browser server exits, remove only the generated `.next` artifact, rerun `tsc --noEmit` alone, and confirm the test port is free.
