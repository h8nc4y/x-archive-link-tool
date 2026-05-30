# CODEX_TASKS

## Status

ChatGPT-approved tasks recorded for the 2026-05-30 Codex implementation passes.

Current pass: implement CL-004 only. Previous completed tasks remain recorded below for traceability. Do not implement any non-approved Claude findings.

## Source of truth

This file should be generated from approved items in `docs/AI_REVIEW_TRIAGE.md` only.

Claude suggestions in `docs/CLAUDE_REVIEW.md` are not implementation instructions until ChatGPT approves them in `docs/AI_REVIEW_TRIAGE.md`.

## Rules for Codex

- Implement only approved tasks.
- Do not implement unapproved Claude suggestions.
- Do not change product requirements unless explicitly instructed.
- Do not expose secrets.
- Do not read, display, modify, or commit `.env`, `data/`, secrets, credentials, tokens, OAuth values, or real data.
- Do not run interactive commands.
- Use non-interactive commands with timeouts or bounded execution.
- Do not run foreground development servers, watch commands, `tail -f`, infinite loops, or sleep loops.
- Do not invent validation results.
- Report changed files and commands run.
- Keep changes scoped to the approved task.
- Respect `AGENTS.md`, project prohibitions, and current user instructions.
- If a task requires spending money, using a paid API/model, exposing secrets, OAuth/login, real user data, production infrastructure changes, or live X API/oEmbed calls, stop and report the blocker.

## Task template

For each task:

### Task ID

### Priority

P0 / P1 / P2 / P3

### Source finding

Claude finding ID or ChatGPT decision reference.

### Goal

### Scope

### Files likely affected

### Implementation plan

### Acceptance criteria

### Validation commands

### Out of scope

### Risks

### Completion notes

## Approved task queue

### Task CL-004

### Priority

P3

### Source finding

CL-004, approved by ChatGPT for this follow-up implementation pass.

### Goal

Prevent provider fetch calls from automatically following redirects.

### Scope

Provider client fetch options and mock-fetch regression tests only.

### Files likely affected

- `server/oEmbedClient.js`
- `server/xApiV2Client.js`
- `server/oEmbedClient.test.js`
- `server/xApiV2Client.test.js`
- `docs/AI_REVIEW_TRIAGE.md`
- `docs/CODEX_TASKS.md`
- `docs/DECISION_LOG.md`

### Implementation plan

Add `redirect: "error"` or equivalent non-following behavior to the oEmbed and X API provider fetch calls, then assert the option in mock-fetch tests.

### Acceptance criteria

- oEmbed provider fetch passes `redirect: "error"`.
- X API v2 provider fetch passes `redirect: "error"`.
- Existing API error mapping and response shapes remain unchanged.
- No live X API, oEmbed, production, Cloudflare write, secret, OAuth, or real-data operation is used for validation.

### Validation commands

- `node --test server\oEmbedClient.test.js`
- `node --test server\xApiV2Client.test.js`
- `node --test`
- `npm.cmd run check:post-release-docs`
- `git diff --check`

### Out of scope

- CL-001 and CL-002 cache behavior.
- CL-006 loading UI.
- CL-007 and CL-008 rate limiter or XFF behavior.
- CL-009 production HEAD documentation update.
- CL-011 CI warning or quality-gate changes.
- CL-012 AGENTS.md role integration.
- CL-013 local server logger injection.

### Risks

Real provider redirect behavior is not verified in this pass because live X API and oEmbed calls are out of scope. This is a conservative hardening change aligned with repository policy.

### Completion notes

To be reported by Codex final report for this pass.

### Task CL-003

### Priority

P2

### Source finding

CL-003, approved by ChatGPT for this implementation pass.

### Goal

Show a generic Japanese error message for unexpected Web UI failures such as network failure, JSON parse failure, or unknown client-side errors.

### Scope

`apps/web/app.js` error-message fallback and associated tests.

### Files likely affected

- `apps/web/app.js`
- `apps/web/app.test.js`

### Implementation plan

Add a user-facing error fallback path that preserves existing known API error-code mappings but prevents English technical exception messages from being displayed.

### Acceptance criteria

- Known API codes still map to existing Japanese messages.
- Unexpected client errors show `取得に失敗しました。時間を置いて再試行してください。`.
- No raw URL, post ID, username, post text, media URL, token, or Authorization header is logged or written to docs.

### Validation commands

- `node --test apps\web\app.test.js`
- `node --test`

### Out of scope

- Loading UI.
- Provider redirect behavior.
- External API calls.
- Production checks.

### Risks

Over-broad fallback could hide known API messages if implementation is not careful.

### Completion notes

To be reported by Codex final report for this pass.

### Task CL-005

### Priority

P3

### Source finding

CL-005, approved by ChatGPT for this implementation pass.

### Goal

Avoid rendering `@未取得` in copy text when username is unavailable.

### Scope

Copy-text formatting only.

### Files likely affected

- `apps/web/app.js`
- `apps/web/app.test.js`

### Implementation plan

Treat empty username and exact `未取得` username as unavailable, while keeping normal usernames formatted as `@username`.

### Acceptance criteria

- Empty username renders `アカウントID：未取得`.
- `username: "未取得"` renders `アカウントID：未取得`.
- Normal username renders `アカウントID：@username`.

### Validation commands

- `node --test apps\web\app.test.js`
- `node --test`

### Out of scope

- URL validator behavior changes.
- API response shape changes.

### Risks

Only the exact unavailable sentinel should be suppressed; valid usernames must remain unchanged.

### Completion notes

To be reported by Codex final report for this pass.

### Task CL-010-approved-tests

### Priority

P2

### Source finding

CL-010, approved only for CL-003 and CL-005 regression coverage in this pass.

### Goal

Add regression tests for the approved UI fallback and copy formatting behavior.

### Scope

Tests only for CL-003 and CL-005.

### Files likely affected

- `apps/web/app.test.js`

### Implementation plan

Add tests before implementation, verify the focused test fails, then implement the minimal code and rerun tests.

### Acceptance criteria

- Focused app tests cover unexpected error fallback.
- Focused app tests cover `username: "未取得"`.
- Full `node --test` passes.

### Validation commands

- `node --test apps\web\app.test.js`
- `node --test`

### Out of scope

- Tests for CL-001, CL-002, CL-006, CL-007, CL-008, CL-009, CL-011, CL-012, or CL-013.

### Risks

Tests should assert behavior, not implementation details.

### Completion notes

Focused TDD validation and full test result are reported by Codex final report.

### Task review-docs

### Priority

P2

### Source finding

ChatGPT review-governance decision.

### Goal

Record ChatGPT triage and the approved Codex task scope.

### Scope

Review-management docs only.

### Files likely affected

- `docs/AI_REVIEW_TRIAGE.md`
- `docs/CODEX_TASKS.md`
- `docs/CLAUDE_REVIEW.md`

### Implementation plan

Update triage status, approved/non-approved items, Codex task queue, and Claude review status if needed.

### Acceptance criteria

- Docs show CL-003, CL-005, and CL-010-approved tests as the only implementation tasks.
- Docs explicitly prevent implementation of non-approved CL items.
- `docs/CLAUDE_REVIEW.md` status does not contradict the recorded Claude review output.

### Validation commands

- File inspection.
- `git status --short`.

### Out of scope

- Product behavior beyond CL-003 and CL-005.
- Git commit, push, PR, deploy.

### Risks

Do not fabricate ChatGPT decisions beyond the provided prompt.

### Completion notes

To be reported by Codex final report for this pass.

## Completed tasks

Completion, commit, push, PR, and CI/check status are reported in the Codex final report for the 2026-05-30 follow-up.
