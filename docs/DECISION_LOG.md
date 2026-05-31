# DECISION_LOG

## Purpose

This file records important product, architecture, review, and AI coordination decisions over time.

It is intended to preserve decision context across ChatGPT, Codex, Claude Code, and human review. It should not contain secrets, OAuth credentials, real customer data, raw real X post URLs, post text, media URLs, usernames, post IDs, or unverified production claims.

## Decision format

Use this template for future decisions:

- Date:
- Decision:
- Context:
- Options considered:
- Rationale:
- Consequences:
- Status:
- Related files:
- Related review findings:

## Initial decisions

### Decision 001: ChatGPT remains the review-triage commander

- Date: 2026-05-29
- Decision: ChatGPT remains the commander for Claude Code review triage.
- Context: This repository is developed through ChatGPT and Codex, and Claude Code will later be used for independent review.
- Options considered:
  - Let Claude Code directly control Codex implementation.
  - Let ChatGPT review Claude findings and decide what Codex may implement.
- Rationale: Keeping ChatGPT as the decision-maker prevents advisory review findings from becoming uncontrolled implementation changes.
- Consequences: Claude findings must be returned to ChatGPT before Codex implements anything.
- Status: Active.
- Related files: `docs/CLAUDE_REVIEW.md`, `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
- Related review findings: none yet.

### Decision 002: Claude Code is used as an independent reviewer

- Date: 2026-05-29
- Decision: Claude Code will be used for review-only inspection unless the user explicitly instructs otherwise.
- Context: The project wants an independent review pass without handing implementation authority to Claude.
- Options considered:
  - Claude review-only.
  - Claude edits the repository directly.
- Rationale: Review-only use preserves separation between reviewer, triage commander, and implementer.
- Consequences: Claude review output belongs in `docs/CLAUDE_REVIEW.md`; implementation tasks are not created until ChatGPT triage.
- Status: Active.
- Related files: `CLAUDE.md`, `docs/claude-code-usage.md`, `docs/CLAUDE_REVIEW.md`.
- Related review findings: none yet.

### Decision 003: Codex implements only ChatGPT-approved tasks

- Date: 2026-05-29
- Decision: Codex implements only tasks approved by ChatGPT and recorded for implementation.
- Context: The requested workflow routes Claude findings back through ChatGPT before implementation.
- Options considered:
  - Codex implements every Claude suggestion.
  - Codex implements only ChatGPT-approved tasks.
- Rationale: ChatGPT triage can reject false positives, defer non-MVP work, and keep implementation scoped.
- Consequences: `docs/CODEX_TASKS.md` must be based on approved items in `docs/AI_REVIEW_TRIAGE.md`.
- Status: Active.
- Related files: `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
- Related review findings: none yet.

### Decision 004: Claude review findings are not automatically accepted

- Date: 2026-05-29
- Decision: Claude review findings remain advisory until ChatGPT accepts them.
- Context: The project needs evidence-based review without automatically changing product requirements or scope.
- Options considered:
  - Treat Claude findings as mandatory.
  - Treat Claude findings as advisory inputs for ChatGPT.
- Rationale: Advisory handling avoids implementing unsupported requirements, risky changes, or suggestions that conflict with `AGENTS.md`.
- Consequences: Deferred and rejected findings must not be implemented unless later approved by ChatGPT.
- Status: Active.
- Related files: `docs/CLAUDE_REVIEW.md`, `docs/AI_REVIEW_TRIAGE.md`.
- Related review findings: none yet.

### Decision 005: AI coordination docs preserve cross-tool context

- Date: 2026-05-29
- Decision: This repository will use dedicated review-management docs to preserve context across AI tools.
- Context: ChatGPT, Codex, and Claude Code each have different roles in the review workflow.
- Options considered:
  - Keep review state only in chat transcripts.
  - Store review brief, Claude output, ChatGPT triage, Codex tasks, and decisions in repository docs.
- Rationale: Repository docs make the workflow auditable and reduce the chance of losing context across chats or tools.
- Consequences: `docs/REVIEW_BRIEF.md`, `docs/CLAUDE_REVIEW.md`, `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, and `docs/DECISION_LOG.md` become the coordination packet for future review passes.
- Status: Active.
- Related files: `docs/REVIEW_BRIEF.md`, `docs/CLAUDE_REVIEW.md`, `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, `docs/DECISION_LOG.md`.
- Related review findings: none yet.

### Decision 006: Limit the first Claude-review implementation pass

- Date: 2026-05-30
- Decision: The first Codex implementation pass after Claude review is limited to CL-003, CL-005, CL-010 regression tests for those two findings, and review-management docs.
- Context: Claude provided multiple advisory findings, and ChatGPT approved only a narrow subset for immediate implementation.
- Options considered:
  - Implement every Claude finding.
  - Implement only the ChatGPT-approved subset.
- Rationale: CL-003 and CL-005 are small UI fixes with clear acceptance criteria. Other findings require product, privacy, production, or follow-up decisions.
- Consequences: Codex must not implement CL-001, CL-002, CL-004, CL-006, CL-007, CL-008, CL-009, CL-011, CL-012, or CL-013 in this pass.
- Status: Active for this implementation pass.
- Related files: `docs/CLAUDE_REVIEW.md`, `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, `apps/web/app.js`, `apps/web/app.test.js`.
- Related review findings: CL-003, CL-005, CL-010.

### Decision 007: Approve CL-004 as the next single-item follow-up

- Date: 2026-05-30
- Decision: ChatGPT approved only CL-004 for the next Codex implementation pass.
- Context: PR #31 completed CL-003, CL-005, approved tests, and review coordination docs. ChatGPT then selected provider fetch redirect non-following as the next bounded task.
- Options considered:
  - Continue to defer CL-004.
  - Implement CL-004 only.
  - Implement CL-004 together with cache, loading UI, rate limiter, CI warning, or governance changes.
- Rationale: CL-004 is a small hardening change that aligns provider client behavior with repository security guidance without requiring live X API, oEmbed, production, Cloudflare, secret, OAuth, or real-data validation.
- Consequences: Codex may add non-following redirect options and mock-fetch tests for CL-004 only. CL-001, CL-002, CL-006, CL-007, CL-008, CL-009, CL-011, CL-012, and CL-013 remain out of scope for this pass.
- Status: Active for this implementation pass.
- Related files: `server/oEmbedClient.js`, `server/xApiV2Client.js`, `server/oEmbedClient.test.js`, `server/xApiV2Client.test.js`, `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
- Related review findings: CL-004.

### Decision 008: Clarify CL-001 and CL-002 as docs-only follow-up

- Date: 2026-05-30
- Decision: CL-001 and CL-002 are clarified in documentation only; runtime cache behavior is not changed in this pass.
- Context: Claude identified possible mismatch between stale-cache wording and Cloudflare KV physical expiration, plus ambiguity around degraded oEmbed fallback caching after X API failure.
- Options considered:
  - Extend KV physical TTL beyond logical TTL.
  - Make degraded oEmbed fallback results non-cacheable.
  - Give degraded oEmbed fallback results a shorter TTL.
  - Keep runtime behavior unchanged and document current limits plus open decisions.
- Rationale: KV retention and degraded fallback caching affect privacy, legal, retention, and product behavior. ChatGPT approved documentation clarification only, not runtime cache changes.
- Consequences: Current docs must not claim production KV guarantees `stale-cache` after KV physical expiration. Future runtime changes require explicit ChatGPT approval and should not use live X API, oEmbed, production smoke, Cloudflare write, secrets, OAuth, or real data without separate approval.
- Status: Active for this documentation pass.
- Related files: `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, `docs/api.md`, `docs/requirements.md`, `docs/current-status.md`, `docs/incident-and-kv-failure-runbook.md`.
- Related review findings: CL-001, CL-002.

### Decision 009: Approve CL-006 as the next single-item UI follow-up

- Date: 2026-05-30
- Decision: ChatGPT approved only CL-006 for the next Codex implementation pass.
- Context: PR #34 completed the GitHub Actions Node deprecation warning update. ChatGPT then selected the minimal loading UI as the next bounded review follow-up.
- Options considered:
  - Continue to defer CL-006.
  - Implement CL-006 only.
  - Implement CL-006 together with cache, rate limiter, XFF, production docs, quality-gate, governance, or logging changes.
- Rationale: CL-006 is a small UX improvement that can be tested with a mock fetch and local UI verification without live X API, oEmbed, production, Cloudflare write, secret, OAuth, or real-data operations.
- Consequences: Codex may add minimal pending-state UI and regression tests for CL-006 only. CL-001/CL-002 runtime cache behavior, CL-007, CL-008, CL-009, CL-011, CL-012, and CL-013 remain out of scope for this pass.
- Status: Active for this implementation pass.
- Related files: `apps/web/app.js`, `apps/web/app.test.js`, `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
- Related review findings: CL-006.

### Decision 010: Approve CL-007 and CL-008 as bounded rate-limit hardening

- Date: 2026-05-31
- Decision: ChatGPT approved CL-007 and CL-008 together for the next Codex implementation pass.
- Context: PR #35 completed the minimal loading UI. ChatGPT then selected rate limiter housekeeping and IP key fallback hardening as the next low-risk implementation.
- Options considered:
  - Continue to defer CL-007 and CL-008.
  - Implement CL-007 and CL-008 only.
  - Implement CL-007 and CL-008 together with cache, production docs, governance, or local server logging changes.
- Rationale: Both items are small server/function hardening changes that can be validated with local tests and do not require live X API, oEmbed, production smoke, Cloudflare write, secret, OAuth, deploy, or real-data operations.
- Consequences: Codex may add bounded cleanup for expired per-IP rate limiter counters and normalize `x-forwarded-for` fallback to the first candidate only. CL-001/CL-002 runtime cache behavior, CL-009 docs-only production wording, CL-012, and CL-013 remain out of scope for this pass.
- Status: Active for this implementation pass.
- Related files: `server/rateLimiter.js`, `server/rateLimiter.test.js`, `functions/api/extract.js`, `functions/api/extract.test.js`, `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
- Related review findings: CL-007, CL-008.

### Decision 011: Approve CL-009 as docs-only production HEAD wording cleanup

- Date: 2026-05-31
- Decision: ChatGPT approved CL-009 as a documentation-only follow-up.
- Context: Several docs described a 2026-05-18 Cloudflare deployment hash as the current production HEAD. Later merges mean that wording can be misread as a current verification result.
- Options considered:
  - Update docs to the latest Git commit without production verification.
  - Run production smoke or Cloudflare verification.
  - Preserve the old evidence as historical and mark current production state as unverified in this pass.
- Rationale: Updating the production HEAD without Cloudflare evidence would create a new unverified claim. Production smoke, live API calls, and Cloudflare write/deploy are out of scope.
- Consequences: Docs should distinguish dated historical production evidence from current production state. Current production HEAD remains unverified until a separate approved runbook or human Cloudflare verification records it.
- Status: Active for this documentation pass.
- Related files: `README.md`, `docs/current-status.md`, `docs/deployment-plan.md`, `docs/pre-release-checklist.md`, `docs/pre-release-operations-runbook.md`, `docs/privacy-policy-draft.md`, `docs/support-page-draft.md`, `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
- Related review findings: CL-009.

### Decision 012: Close Claude review follow-up implementation queue

- Date: 2026-05-31
- Decision: The Claude review follow-up queue is closed after PR #31 through PR #37. No active Codex implementation task remains approved.
- Context: ChatGPT approved bounded follow-up work across multiple PRs: CL-003, CL-005, approved CL-010 regression coverage, CL-004, CL-001/CL-002 docs-only clarification, CL-006, CL-007, CL-008, CL-009, and review coordination docs. The remaining items require either a human/product decision or are not approved.
- Options considered:
  - Leave the review-management docs in a per-pass state.
  - Record the final disposition of CL-001 through CL-013 and close the current Codex task queue.
- Rationale: The repository should not leave stale "current pass" or pending task wording that could cause Codex to implement unapproved Claude suggestions later.
- Consequences: `docs/AI_REVIEW_TRIAGE.md` records the final CL-001 through CL-013 disposition, and `docs/CODEX_TASKS.md` states that no active approved Codex task remains. CL-001/CL-002 runtime cache behavior remains a human/product/privacy decision. CL-012 is resolved through tracked governance docs without application code changes. CL-013 remains rejected for implementation.
- Status: Active.
- Related files: `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, `docs/CLAUDE_REVIEW.md`, `docs/CHATGPT_HANDOFF.md`, `docs/REVIEW_BRIEF.md`, `docs/claude-code-usage.md`.
- Related review findings: CL-001, CL-002, CL-003, CL-004, CL-005, CL-006, CL-007, CL-008, CL-009, CL-010, CL-011, CL-012, CL-013.

### Decision 013: Package remaining decisions before runtime work

- Date: 2026-05-31
- Decision: Remaining post-Claude-review items should be organized as a decision backlog before any further runtime or production work.
- Context: PR #31 through PR #38 completed the approved Claude review follow-up queue, but CL-001/CL-002 runtime cache policy, current production HEAD verification, production smoke, and post-release operations decisions remain unresolved.
- Options considered:
  - Leave the remaining items scattered across release, operations, and review docs.
  - Create one decision backlog packet and matching GitHub issues for human/ChatGPT decisions.
- Rationale: The remaining work is decision-heavy and can affect privacy, retention, API usage, production verification, billing, and operations. Codex should not infer these choices from implementation convenience.
- Consequences: `docs/post-claude-review-decision-backlog.md` becomes the coordination packet for the next human/ChatGPT decisions. Future implementation still requires explicit approval and must preserve the existing secret, real-data, Cloudflare write, production smoke, and live API boundaries.
- Status: Active.
- Related files: `docs/post-claude-review-decision-backlog.md`, `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, `docs/requirements.md`, `docs/api.md`, `docs/current-status.md`, `docs/deployment-plan.md`, `docs/production-smoke-runbook.md`, `docs/post-release-operations-checklist.md`.
- Related review findings: CL-001, CL-002, CL-009.

### Decision 014: Resolve Issue #40 cache policy with degraded fallback short TTL

- Date: 2026-05-31
- Decision: CL-001 receives no runtime change and no KV physical TTL extension. CL-002 adopts short-TTL caching for degraded oEmbed fallback results only.
- Context: Issue #40 asked for a concrete runtime cache policy after the decision backlog was created. ChatGPT approved keeping the existing CL-001 documentation stance while preventing X API failure fallback results from being cached for the normal 30-day TTL.
- Options considered:
  - Extend KV physical TTL beyond logical TTL.
  - Make degraded oEmbed fallback results completely non-cacheable.
  - Cache degraded oEmbed fallback results with a short TTL.
  - Keep degraded oEmbed fallback results cached with the normal TTL.
- Rationale: A 1-hour degraded fallback TTL limits the lifetime of fallback data after temporary X API failures without increasing KV physical retention, changing cache key version, or repeatedly calling providers on every miss.
- Consequences: Normal X API success results and token-missing oEmbed primary results continue to use the normal 30-day TTL. Only token-configured X API failure followed by successful oEmbed fallback uses the 1-hour TTL. Production KV stale-cache remains not guaranteed after physical expiration.
- Status: Active.
- Related files: `server/extractService.js`, `server/extractService.test.js`, `docs/api.md`, `docs/requirements.md`, `docs/current-status.md`, `docs/post-claude-review-decision-backlog.md`, `docs/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
- Related review findings: CL-001, CL-002.

## Open decisions

- Which branch should be reviewed by Claude Code.
- Whether Claude Code should review the whole repository or a specific diff.
- Whether secrets/config should be audited before any external review transcript is shared.
- Which issues are MVP-blocking.
- Which severity taxonomy should be used consistently for Claude findings and ChatGPT triage.
- Whether future Claude review should include production-operation docs or only code and tests.
- Whether future Claude review should use a refreshed single handoff file or the full tracked review-management doc set.
- How Issue #41 production HEAD verification should be performed without production smoke or Cloudflare write operations.
- Which Issue #42 post-release operations items are MVP-blocking.
