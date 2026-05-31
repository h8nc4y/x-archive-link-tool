# AI_REVIEW_TRIAGE

## Status

ChatGPT triage and Claude review follow-up closure recorded for the 2026-05-30 and 2026-05-31 Codex implementation passes.

Claude Code review output is recorded in `docs/CLAUDE_REVIEW.md`. ChatGPT approved only the limited items listed below for Codex implementation.

Current closure update: PR #31 through PR #39 are merged. Issue #40 records the next ChatGPT approval: CL-001 receives no runtime change and no KV physical TTL extension; CL-002 adopts short-TTL caching for degraded oEmbed fallback results only. CL-012 is resolved as tracked-document governance with no application code change. CL-013 remains rejected for implementation; local server logger injection is not approved. The current decision packet is `docs/post-claude-review-decision-backlog.md`.

## Final disposition summary

- CL-001: Documentation-only clarification completed in PR #33. Issue #40 closes the runtime decision as no runtime change and no KV physical TTL extension.
- CL-002: Documentation-only clarification completed in PR #33. Issue #40 approves degraded oEmbed fallback short-TTL caching only.
- CL-003: Completed in PR #31.
- CL-004: Completed in PR #32.
- CL-005: Completed in PR #31.
- CL-006: Completed in PR #35.
- CL-007: Completed in PR #36.
- CL-008: Completed in PR #36.
- CL-009: Completed in PR #37 as docs-only production HEAD wording cleanup.
- CL-010: Approved regression-test coverage was completed with the corresponding approved implementation PRs.
- CL-011: GitHub Actions runtime warning follow-up was completed in PR #34. Adding lint/typecheck/build/`node --check` gates remains not adopted for MVP unless ChatGPT later approves it.
- CL-012: Resolved without application code changes. Role separation is recorded in tracked docs: ChatGPT is commander, Claude Code is advisory read-only reviewer, and Codex implements only ChatGPT-approved tasks. Local ignored `CLAUDE.md` remains a convenience pointer to `AGENTS.md`, not a source of truth.
- CL-013: Rejected for implementation. Local server logger injection remains intentionally not approved.

## Triage rules

- Claude findings are advisory.
- ChatGPT is the decision-maker for review triage.
- Codex must implement only ChatGPT-approved tasks.
- Deferred items must not be implemented unless ChatGPT later approves them.
- Rejected items must not be implemented unless ChatGPT later changes the decision.
- ChatGPT should require concrete evidence for each accepted finding.
- ChatGPT should separate product decisions from code-quality fixes.
- ChatGPT should not approve work that requires spending money, exposing secrets, OAuth/login, real user data, production infrastructure changes, or live X API/oEmbed calls without explicit handling of those constraints.
- ChatGPT should preserve repository policy: no invented results, no fake review findings, no fake validation, and no raw sensitive data in docs or chat.

## Approved findings

### CL-003

- Finding ID: CL-003
- Reason for approval: Network failure, JSON parse failure, and unexpected client-side failures can expose English technical text to Japanese non-programmer users.
- Scope: Web UI error-message fallback only.
- Implementation task: Keep existing Japanese mappings for known API error codes, but show a generic Japanese fallback for unexpected client-side errors.
- Acceptance criteria: Network/parse/unknown client errors display `取得に失敗しました。時間を置いて再試行してください。`; known API-code mappings continue to display their existing Japanese messages.
- Validation: Add or update `apps/web/app.test.js`; run `node --test`.
- Priority: P2

### CL-005

- Finding ID: CL-005
- Reason for approval: Copy text currently risks rendering `@未取得` when username is unavailable.
- Scope: Copy-text formatting only.
- Implementation task: Do not prefix `@` when `username` is empty or exactly `未取得`.
- Acceptance criteria: Empty or `未取得` username renders `アカウントID：未取得`; normal usernames still render as `@username`.
- Validation: Add or update `apps/web/app.test.js`; run `node --test`.
- Priority: P3

### CL-010

- Finding ID: CL-010
- Reason for approval: Regression tests should cover ChatGPT-approved behavior changes.
- Scope: Tests only for CL-003 and CL-005 in this pass.
- Implementation task: Add or update tests for generic Japanese client-error fallback and unavailable-username copy formatting.
- Acceptance criteria: Tests fail before implementation and pass after the minimal approved changes.
- Validation: Run `node --test`.
- Priority: P2

### CL-004

- Finding ID: CL-004
- Reason for approval: Repository security guidance says provider redirects should not be followed, but the oEmbed and X API provider fetch calls did not explicitly disable automatic redirects.
- Scope: Provider client fetch options and mock-fetch regression tests only.
- Implementation task: Add `redirect: "error"` or equivalent non-following behavior to provider fetch calls in `server/oEmbedClient.js` and `server/xApiV2Client.js`.
- Acceptance criteria: Both provider fetch calls pass a non-following redirect option; existing API error mapping and response shapes remain unchanged.
- Validation: Add or update mock-fetch tests in `server/oEmbedClient.test.js` and `server/xApiV2Client.test.js`; run `node --test`.
- Priority: P3

### CL-001 / CL-002 docs-only clarification

- Finding ID: CL-001 / CL-002
- Reason for approval: The current docs should not overstate production KV stale-cache guarantees or leave degraded oEmbed fallback cache behavior ambiguous.
- Scope: Documentation only. No cache behavior, TTL, key version, provider fallback, KV retention, or runtime logic changes.
- Implementation task: Clarify that production KV stale-cache is not guaranteed after KV physical expiration, that KV retention extension is undecided, and that degraded oEmbed fallback cache policy remains a product/privacy decision.
- Acceptance criteria: Docs distinguish current behavior, production limitation, and unresolved policy decisions without changing application behavior.
- Validation: Run `node --test`, `npm.cmd run check:post-release-docs`, and `git diff --check`.
- Priority: P2

### CL-001 / CL-002 Issue #40 runtime policy

- Finding ID: CL-001 / CL-002
- Reason for approval: ChatGPT selected the remaining runtime policy for Issue #40 after the decision backlog was recorded.
- Scope: CL-001 no runtime change and no KV physical TTL extension. CL-002 only changes degraded oEmbed fallback cache TTL when `X_BEARER_TOKEN` is configured, X API fails, and oEmbed fallback succeeds.
- Implementation task: Cache degraded fallback results with a short TTL of 1 hour. Preserve the existing 30-day TTL for normal X API success results and token-missing oEmbed primary results.
- Acceptance criteria: No cache key version change, no KV physical TTL extension, no provider fallback rewrite, no production smoke, no live X API/oEmbed, no Cloudflare write/deploy, and no secret or real-data access.
- Validation: Add or update `server/extractService.test.js`; run focused tests, `node --test`, `npm.cmd run check:post-release-docs`, and `git diff --check`.
- Priority: P2

### CL-006

- Finding ID: CL-006
- Reason for approval: The submit button is disabled during extraction, but the UI does not otherwise tell users that retrieval is in progress.
- Scope: Minimal Web UI loading state and regression tests only.
- Implementation task: Show a short Japanese loading label while `/api/extract` is pending and expose busy state for assistive technology.
- Acceptance criteria: During a pending extract request, the submit button shows `取得中…`, remains disabled, and the form has `aria-busy="true"`; after success or failure, the button label and busy state return to idle.
- Validation: Add or update `apps/web/app.test.js`; run `node --test`; perform local-only UI verification without live X API, oEmbed, production, Cloudflare write, secrets, OAuth, or real data.
- Priority: P3

### CL-007 / CL-008

- Finding ID: CL-007 / CL-008
- Reason for approval: Long-lived local servers can retain expired per-IP rate-limit counters, and Cloudflare Function fallback handling for `x-forwarded-for` should avoid using the full header chain as a rate-limit key.
- Scope: Rate limiter bounded housekeeping, Cloudflare Function IP key selection, and regression tests only.
- Implementation task: Remove expired per-IP counters with bounded check-time cleanup, keep `cf-connecting-ip` as the preferred key, and use only the first `x-forwarded-for` candidate when the Cloudflare header is absent.
- Acceptance criteria: Expired per-IP counters are removed without intervals or unbounded loops; `cf-connecting-ip` still wins; comma-separated `x-forwarded-for` values use only the first candidate; API response shape and safe logging remain unchanged.
- Validation: Add or update `server/rateLimiter.test.js` and `functions/api/extract.test.js`; run focused tests, `node --test`, `npm.cmd run check:post-release-docs`, and `git diff --check`.
- Priority: P2

### CL-009 docs-only production HEAD wording

- Finding ID: CL-009
- Reason for approval: Docs that describe an old deployment hash as the current production HEAD can be misread after later merges.
- Scope: Documentation wording only. No production verification, production smoke, Cloudflare write, deploy, runtime behavior, or code changes.
- Implementation task: Reword stale current-production-HEAD claims into dated historical verification records, and state that current production state requires a separate runbook/Cloudflare verification step.
- Acceptance criteria: Docs no longer claim old HEAD `2db0a89...` as the current production state; historical verification evidence remains dated and traceable; current production HEAD is explicitly unverified in this pass.
- Validation: Run `node --test`, `npm.cmd run check:post-release-docs`, and `git diff --check`; confirm changed files are docs only.
- Priority: P3

### Review coordination docs

- Finding ID: ChatGPT review-governance decision
- Reason for approval: The repo needs a durable record that Claude findings are advisory and Codex implements only ChatGPT-approved tasks.
- Scope: `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, and minimal `docs/CLAUDE_REVIEW.md` status correction if needed.
- Implementation task: Record this triage and the approved Codex task queue.
- Acceptance criteria: Approved, non-approved, and out-of-scope items are visible from repo docs.
- Validation: File inspection and final `git status --short`.
- Priority: P2

## Deferred findings

The following runtime or product behavior changes are not approved for Codex implementation after the Claude review follow-up closure and Issue #40 runtime-policy approval. CL-001 and CL-002 are no longer open deferred items under Issue #40; any future cache-policy change requires a new explicit ChatGPT approval.

- Finding ID: CL-011
- Reason for deferral: Adding lint/typecheck/build/`node --check` quality gates was not adopted for MVP. PR #34 addressed the separate GitHub Actions runtime warning only.
- Information needed: Whether no-dependency checks should become project policy.
- Revisit condition: ChatGPT approves quality-gate changes.

## Resolved without code or runtime changes

- Finding ID: CL-012
- Reason for resolution: Tracked docs already preserve the role split and `docs/claude-code-usage.md` documents that ignored local `CLAUDE.md` should only point Claude Code at `AGENTS.md`.
- Scope: Documentation/governance state only.
- Implementation decision: No application code change, no source behavior change, and no need to track local `CLAUDE.md`.
- Notes: Future Claude prompts should attach or cite tracked docs rather than depending on a local ignored `CLAUDE.md`.

## Rejected findings

- Finding ID: CL-013
- Reason for rejection: Local server defaulting to no logger injection is the safer behavior for this MVP's strict no-sensitive-log policy, and ChatGPT did not approve changing local observability behavior.
- Risk accepted: Local server observability remains minimal by default.
- Notes: Do not add local server logger injection unless ChatGPT later approves a specific safe-logging design.

Explicit out-of-scope work for this pass:

- iOS app.
- Database.
- Authentication.
- Custom domain.
- quote/poll support.
- External API calls.
- Production `/api/extract` checks.
- Cloudflare write/deploy operations.
- Dependency additions or `npm install`.

## Open questions

- Which decisions from Issue #41 and Issue #42 should be handled next?
- Should future Claude review prompts include `docs/CHATGPT_HANDOFF.md`, the full review-coordination docs, or a refreshed single handoff?
