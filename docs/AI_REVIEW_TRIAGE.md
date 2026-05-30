# AI_REVIEW_TRIAGE

## Status

ChatGPT triage recorded for the 2026-05-30 Codex implementation pass.

Claude Code review output is recorded in `docs/CLAUDE_REVIEW.md`. ChatGPT approved only the limited items listed below for Codex implementation in this pass.

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

### Review coordination docs

- Finding ID: ChatGPT review-governance decision
- Reason for approval: The repo needs a durable record that Claude findings are advisory and Codex implements only ChatGPT-approved tasks.
- Scope: `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, and minimal `docs/CLAUDE_REVIEW.md` status correction if needed.
- Implementation task: Record this triage and the approved Codex task queue.
- Acceptance criteria: Approved, non-approved, and out-of-scope items are visible from repo docs.
- Validation: File inspection and final `git status --short`.
- Priority: P2

## Deferred findings

The following Claude findings are not approved for Codex implementation in this pass. The prompt did not require Codex to split each item into final "deferred", "additional confirmation", or "rejected" buckets, so they are recorded here as not approved for this implementation pass.

- Finding ID: CL-001
- Reason for deferral: KV stale-cache reachability changes may affect retention/privacy behavior and were explicitly not approved.
- Information needed: Product/privacy decision on physical KV TTL versus documented stale-cache behavior.
- Revisit condition: ChatGPT explicitly approves a specific cache-retention implementation or documentation-only change.

- Finding ID: CL-002
- Reason for deferral: Degraded oEmbed fallback cache TTL policy requires product decision and was explicitly not approved.
- Information needed: Chosen TTL/non-cache policy for degraded fallback results.
- Revisit condition: ChatGPT approves a concrete cache policy.

- Finding ID: CL-004
- Reason for deferral: Provider redirect handling hardening was explicitly not approved for this pass.
- Information needed: Whether X API/oEmbed legitimate redirect behavior should be considered before changing fetch options.
- Revisit condition: ChatGPT approves redirect behavior change and associated tests.

- Finding ID: CL-006
- Reason for deferral: Loading UI is optional UX scope and explicitly not approved.
- Information needed: Desired loading copy/state and UI verification scope.
- Revisit condition: ChatGPT approves loading-state work.

- Finding ID: CL-007 / CL-008
- Reason for deferral: Rate limiter and XFF behavior changes were explicitly not approved.
- Information needed: Cloudflare/IP trust model and production risk priority.
- Revisit condition: ChatGPT approves rate limiter or IP-source changes.

- Finding ID: CL-009
- Reason for deferral: Production HEAD update was explicitly not approved; production verification is out of scope.
- Information needed: Fresh Cloudflare production evidence from an allowed read-only process or human confirmation.
- Revisit condition: ChatGPT approves docs update with current verified evidence.

- Finding ID: CL-011
- Reason for deferral: Adding lint/typecheck/build/node-check gates was explicitly not approved.
- Information needed: Whether no-dependency checks should become project policy.
- Revisit condition: ChatGPT approves quality-gate changes.

- Finding ID: CL-012
- Reason for deferral: AGENTS.md integration of Claude role definition was explicitly not approved.
- Information needed: Whether Claude role policy should live in tracked repo instructions.
- Revisit condition: ChatGPT approves AGENTS/docs governance changes.

- Finding ID: CL-013
- Reason for deferral: Local server logger injection was explicitly not approved.
- Information needed: Whether local observability should change despite current safe default.
- Revisit condition: ChatGPT approves logger behavior changes.

## Rejected findings

No individual Claude finding is recorded here as permanently rejected from the provided prompt alone.

Explicit out-of-scope work for this pass:

- iOS app.
- Database.
- Authentication.
- Custom domain.
- quote/poll support.
- External API calls.
- Production `/api/extract` checks.
- Cloudflare write/deploy operations.
- GitHub Issue/PR operations.
- Dependency additions or `npm install`.

## Open questions

- Which non-approved CL items should be permanently rejected versus deferred?
- Should these review-coordination docs be committed to Git?
- Should future Claude review prompts include `docs/CHATGPT_HANDOFF.md` or the full set of review-coordination docs?
