# CODEX_TASKS

## Status

ChatGPT-approved tasks recorded for the 2026-05-30 and 2026-05-31 Claude review follow-up implementation passes, including the Issue #40 cache-policy follow-up and Issue #42 docs guardrail follow-ups.

Current closure state: Issue #40 approves CL-001 no runtime change and CL-002 degraded fallback short-TTL caching only. Issue #42 remains a human/ChatGPT decision item; the current Codex scope is limited to documentation verification guardrails, including Markdown local link checking. No additional runtime implementation task is approved. Do not implement additional Claude findings unless ChatGPT records a new approval in `docs/AI_REVIEW_TRIAGE.md`.

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

No active approved task is queued for Codex after the Issue #40 task recorded below.

CL-001 is closed as no runtime change and no KV physical TTL extension. CL-002 is approved only for degraded oEmbed fallback short-TTL caching. CL-011 quality gates are not adopted for MVP unless later approved. CL-012 is resolved by tracked governance docs without application code changes. CL-013 local server logger injection is rejected unless ChatGPT later approves a specific safe-logging design.

Decision backlog: `docs/post-claude-review-decision-backlog.md`.

## Historical approved task records

### Task CL-001-CL-002-issue-40

### Priority

P2

### Source finding

Issue #40 and ChatGPT-approved runtime cache policy.

### Goal

Record CL-001 as no runtime change and implement CL-002 degraded fallback short-TTL caching.

### Scope

`server/extractService.js`, `server/extractService.test.js`, and related cache-policy docs only.

### Files likely affected

- `server/extractService.js`
- `server/extractService.test.js`
- `docs/api.md`
- `docs/requirements.md`
- `docs/current-status.md`
- `docs/post-claude-review-decision-backlog.md`
- `docs/AI_REVIEW_TRIAGE.md`
- `docs/CODEX_TASKS.md`
- `docs/DECISION_LOG.md`

### Implementation plan

Add a 1-hour TTL for degraded oEmbed fallback results only when `X_BEARER_TOKEN` is configured, X API retrieval fails, no stale cache is returned, and oEmbed fallback succeeds. Preserve the default 30-day TTL for normal X API success results and token-missing oEmbed primary results. Record that CL-001 has no runtime change.

### Acceptance criteria

- CL-001 does not extend KV physical TTL and does not claim production KV stale-cache is guaranteed after physical expiration.
- CL-002 degraded fallback results are cached for 1 hour.
- X API success results continue to use the default 30-day TTL.
- Token-missing oEmbed primary results continue to use the default 30-day TTL.
- Cache key version, provider fallback flow, provider clients, rate limiter, web UI, Cloudflare config, dependencies, and deployment files are unchanged.
- No production smoke, production `/api/extract`, live X API, live oEmbed, Cloudflare write/deploy, secret/OAuth, or real-data access is performed.

### Validation commands

- `node --test server\extractService.test.js`
- `node --test`
- `npm.cmd run check:post-release-docs`
- `git diff --check`

### Out of scope

- KV physical TTL extension.
- Cache key version changes.
- Degraded fallback complete non-caching.
- Provider fallback rewrite.
- Issue #41 production HEAD verification.
- Issue #42 post-release operations decisions.
- Production smoke, live provider calls, Cloudflare write/deploy, secrets, OAuth, or real-data operations.

### Risks

Repeated X API failures can still cache degraded fallback data for up to 1 hour. This is the approved compromise between long-lived degraded cache entries and repeated provider calls.

### Completion notes

Implemented in the Issue #40 follow-up PR.

### Task CL-009-docs-only

### Priority

P3

### Source finding

CL-009, approved by ChatGPT for this docs-only pass after PR #36.

### Goal

Prevent stale production HEAD evidence from being misread as the currently verified production state.

### Scope

Documentation wording only.

### Files likely affected

- `README.md`
- `docs/current-status.md`
- `docs/deployment-plan.md`
- `docs/pre-release-checklist.md`
- `docs/pre-release-operations-runbook.md`
- `docs/privacy-policy-draft.md`
- `docs/support-page-draft.md`
- `docs/AI_REVIEW_TRIAGE.md`
- `docs/CODEX_TASKS.md`
- `docs/DECISION_LOG.md`

### Implementation plan

Search docs for stale current-production-HEAD wording. Preserve dated historical Cloudflare deployment evidence, but reword it as a past verification record. Add explicit notes that current production HEAD is unverified in this pass and requires separate Cloudflare/runbook verification.

### Acceptance criteria

- Docs do not describe old HEAD `2db0a89...` as the currently verified production HEAD.
- Dated 2026-05-18 production evidence remains traceable.
- Current production verification is explicitly marked as not performed in this pass.
- No code, tests, source behavior, cache behavior, provider behavior, CI config, dependencies, deployment config, Cloudflare write, deploy, production smoke, live X API, live oEmbed, secrets, OAuth, or real-data operation is changed.

### Validation commands

- `node --test`
- `npm.cmd run check:post-release-docs`
- `git diff --check`
- `git diff --name-only`
- `git diff --stat`

### Out of scope

- Updating docs to a new production HEAD.
- Cloudflare deployment verification.
- Production smoke or production `/api/extract`.
- Runtime code changes.
- CL-001/CL-002 cache behavior, CL-012, or CL-013.

### Risks

Historical production evidence may still be stale by design. Any current-production statement requires a separate verification pass.

### Completion notes

Completed by PR #37.

### Task CL-007-CL-008

### Priority

P2

### Source finding

CL-007 and CL-008, approved by ChatGPT for this bounded implementation pass after PR #35.

### Goal

Harden rate-limit housekeeping and Cloudflare Function client-IP key selection without changing API response shape.

### Scope

Rate limiter cleanup, IP key fallback normalization, and regression tests only.

### Files likely affected

- `server/rateLimiter.js`
- `server/rateLimiter.test.js`
- `functions/api/extract.js`
- `functions/api/extract.test.js`
- `docs/AI_REVIEW_TRIAGE.md`
- `docs/CODEX_TASKS.md`
- `docs/DECISION_LOG.md`

### Implementation plan

Add bounded check-time cleanup for expired per-IP rate limiter counters. Keep `cf-connecting-ip` as the preferred key and use only the first `x-forwarded-for` candidate when the Cloudflare header is absent. Add focused tests for expired counter cleanup and comma-separated forwarded header handling.

### Acceptance criteria

- Expired per-IP counters are removed during bounded housekeeping.
- No interval, watch loop, or unbounded cleanup loop is introduced.
- `cf-connecting-ip` remains preferred over `x-forwarded-for`.
- Comma-separated `x-forwarded-for` values use only the first candidate.
- IP values are not logged by application code.
- API response shape remains unchanged.
- No CL-001/CL-002 runtime cache behavior, CL-009 docs wording, CL-012 governance role integration, or CL-013 logging behavior is changed in this pass.

### Validation commands

- `node --test server\rateLimiter.test.js`
- `node --test functions\api\extract.test.js`
- `node --test`
- `npm.cmd run check:post-release-docs`
- `git diff --check`

### Out of scope

- KV TTL, fallback TTL, cache key, or provider fallback logic changes.
- CL-009 production HEAD wording.
- CL-012 AGENTS.md role integration.
- CL-013 local server logger injection.
- Production smoke, production `/api/extract`, live X API, live oEmbed, Cloudflare write, deploy, secrets, OAuth, or real-data operations.

### Risks

The `x-forwarded-for` value is still treated as a fallback only when the Cloudflare connecting IP header is absent. This does not make it a trusted production identity source.

### Completion notes

Completed by PR #36.

### Task CL-006

### Priority

P3

### Source finding

CL-006, approved by ChatGPT for this single-item implementation pass after PR #34.

### Goal

Show a minimal Japanese loading state while the extract request is pending.

### Scope

Web UI submit state and regression tests only.

### Files likely affected

- `apps/web/app.js`
- `apps/web/app.test.js`
- `docs/AI_REVIEW_TRIAGE.md`
- `docs/CODEX_TASKS.md`
- `docs/DECISION_LOG.md`

### Implementation plan

Add a small loading-state helper around the existing submit flow. Keep the current disabled-submit protection, switch the submit label to `取得中…` during the pending fetch, expose `aria-busy`, and restore the idle state in `finally`. Add a mock-fetch DOM test for the pending state.

### Acceptance criteria

- Submit button shows `取得中…` while `/api/extract` is pending.
- Submit button remains disabled during the pending request.
- Form has `aria-busy="true"` while pending and returns to idle afterward.
- Existing API error mapping and copy-text behavior remain unchanged.
- No cache behavior, rate limiter, XFF, production docs, CI gates, AGENTS.md role integration, local server logging, live X API, oEmbed, production smoke, Cloudflare write, deploy, secret, OAuth, or real-data operation is changed.

### Validation commands

- `node --test apps\web\app.test.js`
- `node --test`
- `npm.cmd run check:post-release-docs`
- `git diff --check`

### Out of scope

- CL-001 and CL-002 cache behavior.
- CL-007 and CL-008 rate limiter or XFF behavior.
- CL-009 production HEAD documentation update.
- CL-011 quality-gate changes beyond the already completed action-version update.
- CL-012 AGENTS.md role integration.
- CL-013 local server logger injection.
- New loading overlays, spinners, progress bars, or API behavior changes.

### Risks

The loading state is intentionally minimal and does not estimate network progress.

### Completion notes

Completed by PR #35.

### Task CL-001-CL-002-docs-only

### Priority

P2

### Source finding

CL-001 and CL-002, approved by ChatGPT for documentation-only clarification after PR #32.

### Goal

Clarify cache-policy limits and unresolved decisions without changing runtime behavior.

### Scope

Documentation only.

### Files likely affected

- `docs/AI_REVIEW_TRIAGE.md`
- `docs/CODEX_TASKS.md`
- `docs/DECISION_LOG.md`
- `docs/api.md`
- `docs/requirements.md`
- `docs/current-status.md`
- `docs/incident-and-kv-failure-runbook.md`

### Implementation plan

Document that production KV stale-cache is not guaranteed after KV physical expiration, that KV retention extension is a privacy/legal/retention decision, and that degraded oEmbed fallback caching remains a policy decision. Record current behavior where the existing implementation already makes it clear, without changing code.

### Acceptance criteria

- Docs state that current production KV should not be claimed to guarantee `stale-cache` after KV physical expiration.
- Docs state that extending KV physical TTL is undecided.
- Docs state that degraded oEmbed fallback behavior choices are non-cache, short TTL, or current behavior, and no runtime choice is made in this pass.
- No server, functions, web app, scripts, tests, configuration, dependencies, deploy files, cache TTL, cache key, or provider fallback logic is changed.

### Validation commands

- `node --test`
- `npm.cmd run check:post-release-docs`
- `git diff --check`

### Out of scope

- KV physical TTL extension.
- fallback result non-caching.
- fallback result short TTL.
- cache version changes.
- CL-006, CL-007, CL-008, CL-009, CL-011, CL-012, or CL-013.
- Live X API, oEmbed, production smoke, Cloudflare write, deploy, secret, OAuth, or real-data operations.

### Risks

Future implementation still requires a product/privacy/legal retention decision before changing physical retention or degraded fallback caching.

### Completion notes

Completed by PR #33.

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

Completed by PR #32.

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

Completed by PR #31.

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

Completed by PR #31.

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

Completed by PR #31 and subsequent review-management doc updates.

## Completed tasks

- PR #31: CL-003, CL-005, approved CL-010 regression coverage for those items, and review coordination docs.
- PR #32: CL-004 provider fetch redirect non-following.
- PR #33: CL-001/CL-002 documentation-only cache policy clarification; no runtime cache behavior change.
- PR #34: GitHub Actions runtime warning follow-up. This did not adopt lint/typecheck/build/`node --check` gates as MVP policy.
- PR #35: CL-006 minimal loading UI and regression coverage.
- PR #36: CL-007/CL-008 rate limiter and IP key hardening.
- PR #37: CL-009 documentation-only production HEAD wording cleanup.
- Issue #40 follow-up: CL-001 no runtime change and CL-002 degraded fallback short-TTL caching.
- Issue #41 follow-up: current Production HEAD verification recorded from read-only metadata and static page checks.
- Issue #42 follow-up: post-release operations decision packet recorded. Issue #42 remains a human/ChatGPT decision item, not an active Codex implementation task.
- Issue #42 guardrail follow-up: `check:post-release-docs` verifies that the decision packet preserves human/ChatGPT decision status, required decision areas, Codex prohibitions, production/live-provider/secret/Cloudflare stop boundaries, and the keep-open condition.
- Markdown local link guard follow-up: `node --test` and `check:post-release-docs` verify repo-local Markdown file links under `README.md`, `AGENTS.md`, `SECURITY.md`, and `docs/`; external URLs and fragment-only anchors are skipped, and anchor text is not validated.
- CL-012: Resolved by tracked governance docs; no application code change and no tracked `CLAUDE.md` required.
- CL-013: Rejected for implementation; no local server logger injection.
