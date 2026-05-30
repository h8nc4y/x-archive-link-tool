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

## Open decisions

- Which branch should be reviewed by Claude Code.
- Whether Claude Code should review the whole repository or a specific diff.
- Whether secrets/config should be audited before any external review transcript is shared.
- Which issues are MVP-blocking.
- Which severity taxonomy should be used consistently for Claude findings and ChatGPT triage.
- Whether future Claude review should include production-operation docs or only code and tests.
- Whether ignored local files such as `CLAUDE.md` should be included as context for Claude review.
