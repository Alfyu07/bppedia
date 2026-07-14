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
- Never move directly to `Done`; manual review confirmation remains required.

### Verification

After every Linear mutation, call `linear_get_issue` and confirm the expected description content and status exist. Tool success output, an empty subagent response, or intent is not verification.

## Graphify codebase exploration

### Failure

A codebase graph search used a hand-written NetworkX traversal instead of Graphify's native query command, bypassing Graphify's matching and answer persistence workflow.

### Prevention

- Use `graphify query "<question>"` for graph-based codebase exploration; do not recreate traversal logic in ad hoc scripts.
- Ask narrowly scoped questions so node matching targets domain concepts rather than generic terms such as `test`.
- Use file reads only to validate exact details surfaced by the graph.

### Verification

Confirm command output starts with Graphify's traversal summary and includes source files, locations, and confidence-tagged edges.
