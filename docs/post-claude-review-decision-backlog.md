# Post-Claude Review Decision Backlog

## Status

Prepared by Codex after Claude review follow-up PR #31 through PR #38 were merged.

This document is a decision packet for human and ChatGPT review. Issue #40 later approved one scoped runtime cache update: CL-002 degraded oEmbed fallback results use a short cache TTL. Codex must not change any other cache runtime behavior, production settings, Cloudflare configuration, live API checks, or operational policy until ChatGPT or a human explicitly approves another scoped follow-up.

Current repository state at preparation time:

- Claude review output: recorded in `docs/CLAUDE_REVIEW.md`.
- ChatGPT triage and closure: recorded in `docs/AI_REVIEW_TRIAGE.md`.
- Completed Codex follow-up tasks: recorded in `docs/CODEX_TASKS.md`.
- Issue #40: approved and implemented CL-002 degraded fallback short TTL; CL-001 remains no runtime change.
- Current production HEAD: unverified in this pass.
- Open PRs/issues before this packet: none observed.

## Completed Claude Review Follow-Up

| PR | Scope | Status |
| --- | --- | --- |
| #31 | CL-003, CL-005, approved CL-010 regression tests, review coordination docs | Merged |
| #32 | CL-004 provider fetch redirect non-following | Merged |
| #33 | CL-001/CL-002 docs-only cache policy clarification | Merged |
| #34 | GitHub Actions runtime warning follow-up | Merged |
| #35 | CL-006 loading UI | Merged |
| #36 | CL-007/CL-008 rate limiter and IP key hardening | Merged |
| #37 | CL-009 production HEAD wording cleanup | Merged |
| #38 | Claude review follow-up closure docs | Merged |

## CL-001 Through CL-013 Final State

| ID | State | Notes |
| --- | --- | --- |
| CL-001 | Closed no runtime change | KV physical TTL extension is not implemented. Docs continue to avoid claiming production KV stale-cache is guaranteed after physical expiration. |
| CL-002 | Completed | Degraded oEmbed fallback results use a short cache TTL when X API is configured and fails before fallback succeeds. |
| CL-003 | Completed | Generic Japanese UI fallback for unexpected client errors. |
| CL-004 | Completed | Provider fetch redirect non-following. |
| CL-005 | Completed | No `@未取得` copy text. |
| CL-006 | Completed | Minimal loading UI. |
| CL-007 | Completed | Bounded expired rate-limit counter cleanup. |
| CL-008 | Completed | First `x-forwarded-for` candidate fallback handling. |
| CL-009 | Completed docs-only | Stale production HEAD claims rewritten as historical evidence. |
| CL-010 | Completed for approved items | Regression coverage added with approved implementation PRs. |
| CL-011 | Partially addressed / not adopted | GitHub Actions runtime warning addressed in PR #34. Lint/typecheck/build/`node --check` gates are not adopted for MVP. |
| CL-012 | Resolved no code change | Role separation is tracked in docs; ignored local `CLAUDE.md` remains non-authoritative. |
| CL-013 | Rejected | Local server logger injection remains not approved. |

## Decision Categories

### Human Decision Required

- Legal/privacy/support approval: confirm privacy wording, support contact, support scope, and whether legal or responsible-owner review is complete.
- X Developer Portal and billing state: confirm credits, billing, usage cap/spending cap equivalent, endpoint access, and review cadence without sharing tokens or billing details.
- Log retention and owner: define retention period, deletion expectations, and who checks Cloudflare Functions logs.
- KV/incident ownership: define KV outage decision owner, cache-disabled continuation policy, rollback/redeploy approval path, and recovery verification path.
- Production HEAD verification: confirm which commit Cloudflare Pages Production currently serves through approved read-only deployment evidence or human Cloudflare verification.

### ChatGPT Decision Required

- CL-001 runtime policy: closed as no runtime change; do not extend KV physical TTL unless a new approval supersedes Issue #40.
- CL-002 runtime policy: closed as degraded fallback short TTL. Current value: 1 hour.
- Whether any future approved runtime cache change needs a cache key/schema version change.
- Whether production smoke should be performed, and under which runbook limits.

### Codex Can Implement After Approval

Codex can implement only after ChatGPT or a human provides an explicit scoped approval:

- Update docs and tests for a future cache policy only after a new approval.
- Implement future cache policy changes with mock/local tests only after a new approval.
- Record human-provided production HEAD verification evidence without inventing values.
- Record human-provided post-release operations decisions.
- Run production smoke only under `docs/production-smoke-runbook.md` with explicit approval and no prohibited data recording.

### Already Completed

The approved Claude review implementation queue is complete through PR #38. See `docs/CODEX_TASKS.md` for historical task records.

### Rejected / No Action

- CL-013 local server logger injection remains rejected.
- Tracking local `CLAUDE.md` is not required; tracked docs and `AGENTS.md` are the source of truth.
- iOS app, DB, auth, custom domain, quote/poll, extra external integrations, dependency additions, and production infrastructure changes remain out of scope unless separately approved.

## CL-001 / CL-002 Runtime Cache Options

### Option A: Keep Current Behavior

- Description: Keep KV physical TTL equal to logical TTL and continue caching degraded oEmbed fallback results as normal successful responses.
- Benefits: No runtime change, no migration, no retention expansion, lowest implementation risk.
- Costs/Risks: Production KV cannot guarantee stale-cache after physical expiration. Degraded oEmbed fallback data can remain cached for the normal TTL after transient X API failure.
- Needs: Docs already reflect this limitation; no implementation unless ChatGPT explicitly chooses to codify current behavior further.

### Option B: Make Degraded oEmbed Fallback Non-Cacheable

- Description: If X API is configured and fails, and oEmbed fallback succeeds, return the fallback response without storing it in the normal cache.
- Benefits: Avoids long-lived degraded cache entries after transient X API failures.
- Costs/Risks: Repeated misses may increase X API/oEmbed calls and latency until X API recovers or a normal successful result is cached.
- Needs: Clear tests, safe warning semantics, and a product decision on API usage versus data freshness.

### Option C: Cache Degraded oEmbed Fallback With Short TTL

- Description: Store degraded fallback responses with a shorter TTL than normal successful X API responses.
- Benefits: Reduces repeated external calls during temporary failures while limiting degraded-data lifetime.
- Costs/Risks: Documents separate cache semantics for degraded fallback responses.
- Decision: Adopted for Issue #40. Current TTL is 1 hour.

### Option D: Extend KV Physical TTL Beyond Logical TTL

- Description: Keep logical freshness at 30 days but set KV physical expiration longer so stale-cache can be served after logical expiration when upstream fails.
- Benefits: Makes production stale-cache fallback reachable for KV-backed cache.
- Costs/Risks: Retains normalized post data longer than the logical freshness window. Requires privacy/legal/retention decision.
- Needs: Human approval on retention, tests for stale behavior, and docs update.

### Option E: Combine Short Degraded TTL and Extended Stale Retention

- Description: Use short TTL for degraded fallback results and extended physical TTL for normal cached entries.
- Benefits: Balanced freshness and availability.
- Costs/Risks: More complex cache semantics, more tests, and higher documentation burden.
- Needs: Explicit ChatGPT decision and privacy/legal/retention approval.

## Production HEAD Verification Conditions

Current production HEAD must not be updated in docs from Git commit history alone.

Acceptable evidence:

- Human Cloudflare Dashboard confirmation of Production deployment commit, status, branch, and deployment time.
- Approved read-only deployment listing that does not require OAuth refresh, secret input, Cloudflare write operations, or deploy.
- GitHub Cloudflare Pages check can be supporting evidence but is not sufficient by itself as production confirmation.

Do not perform:

- Cloudflare Dashboard/API/write operations.
- `wrangler deploy`, Pages deploy, rollback, environment variable changes, secret operations, or KV writes.
- Production `/api/extract` or production smoke as part of HEAD verification unless separately approved.

## Production Smoke Conditions

Production `/api/extract` smoke remains blocked unless all conditions in `docs/production-smoke-runbook.md` are met.

Minimum required before any smoke:

- Human verification template completed without secrets or real URL values.
- Explicit maximum execution count.
- Clear statement that 429 verification is excluded unless separately approved.
- Recording limited to HTTP status, source, cached flag, mediaUrls count, warnings count, error code, timestamp, and execution count.
- Stop on any 402, 403, 429, 5xx, unexpected source/cache state, provider warning, suspected credits/billing issue, or risk of recording prohibited data.

## Codex Must Not Do Without Later Approval

- Implement additional CL-001/CL-002 runtime cache behavior.
- Change KV physical TTL, cache key/schema version, or provider fallback logic.
- Change the degraded fallback short TTL again without a new approval.
- Run production smoke or production `/api/extract`.
- Call live X API or oEmbed.
- Send real X post URLs.
- Read `.env`, tokens, secrets, OAuth credentials, `tmp/approved-smoke-target.txt`, or real data.
- Perform Cloudflare write/deploy/rollback/secret/KV operations.
- Add dependencies or run `npm install`.
- Create more than three issues for this backlog packet.

## GitHub Issue Candidates

Create issues only if no duplicate open issue exists.

1. `Decide runtime cache policy for CL-001/CL-002`
   - Decision owner: ChatGPT / human.
   - Scope: Closed by Issue #40 after choosing CL-001 no runtime change and CL-002 degraded fallback short TTL.
   - Further runtime changes require a new approval.

2. `Run approved production HEAD verification`
   - Decision owner: human / ChatGPT.
   - Scope: Confirm current Cloudflare Pages Production commit through approved read-only or human evidence.
   - Must not run production `/api/extract`, production smoke, deploy, or Cloudflare write.

3. `Decide post-release operations items`
   - Decision owner: human.
   - Scope: privacy/legal/support, billing/credits, log retention, KV incident ownership, and 429 policy.
   - Must not expose secrets, billing details, real URLs, real post content, or Cloudflare internal logs.

## Related Documents

- `docs/AI_REVIEW_TRIAGE.md`
- `docs/CODEX_TASKS.md`
- `docs/DECISION_LOG.md`
- `docs/requirements.md`
- `docs/api.md`
- `docs/current-status.md`
- `docs/deployment-plan.md`
- `docs/production-smoke-runbook.md`
- `docs/post-release-operations-checklist.md`
- `docs/post-release-human-verification-template.md`
- `docs/incident-and-kv-failure-runbook.md`
