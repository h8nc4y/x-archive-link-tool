# AI_REVIEW_TRIAGE

## Status

ChatGPT triage recorded for the 2026-05-30 Codex implementation passes.

Claude Code review output is recorded in `docs/CLAUDE_REVIEW.md`. ChatGPT approved only the limited items listed below for Codex implementation.

Current update: after PR #34, ChatGPT approved CL-006 as the next single-item implementation pass. Behavior changes for CL-001 and CL-002 remain deferred. CL-007, CL-008, CL-009, CL-011, CL-012, and CL-013 remain not approved for this pass.

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

### CL-006

- Finding ID: CL-006
- Reason for approval: The submit button is disabled during extraction, but the UI does not otherwise tell users that retrieval is in progress.
- Scope: Minimal Web UI loading state and regression tests only.
- Implementation task: Show a short Japanese loading label while `/api/extract` is pending and expose busy state for assistive technology.
- Acceptance criteria: During a pending extract request, the submit button shows `取得中…`, remains disabled, and the form has `aria-busy="true"`; after success or failure, the button label and busy state return to idle.
- Validation: Add or update `apps/web/app.test.js`; run `node --test`; perform local-only UI verification without live X API, oEmbed, production, Cloudflare write, secrets, OAuth, or real data.
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

The following runtime or product behavior changes are not approved for Codex implementation in this pass. Documentation-only clarification for CL-001 and CL-002 is approved above, but behavior changes remain deferred.

- Finding ID: CL-001
- Reason for deferral: KV stale-cache behavior changes may affect retention/privacy behavior. Documentation-only clarification is approved, but runtime behavior changes remain deferred.
- Information needed: Product/privacy decision on physical KV TTL versus documented stale-cache behavior.
- Revisit condition: ChatGPT explicitly approves a specific cache-retention implementation.

- Finding ID: CL-002
- Reason for deferral: Degraded oEmbed fallback cache TTL policy requires product decision. Documentation-only clarification is approved, but runtime behavior changes remain deferred.
- Information needed: Chosen TTL/non-cache policy for degraded fallback results.
- Revisit condition: ChatGPT approves a concrete cache behavior policy.

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
