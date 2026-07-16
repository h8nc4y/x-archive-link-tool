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
- Related files: `docs/archive/CLAUDE_REVIEW.md`, `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
- Related review findings: none yet.

### Decision 002: Claude Code is used as an independent reviewer

- Date: 2026-05-29
- Decision: Claude Code will be used for review-only inspection unless the user explicitly instructs otherwise.
- Context: The project wants an independent review pass without handing implementation authority to Claude.
- Options considered:
  - Claude review-only.
  - Claude edits the repository directly.
- Rationale: Review-only use preserves separation between reviewer, triage commander, and implementer.
- Consequences: Claude review output belongs in `docs/archive/CLAUDE_REVIEW.md`; implementation tasks are not created until ChatGPT triage.
- Status: Active.
- Related files: `CLAUDE.md`, `docs/archive/claude-code-usage.md`, `docs/archive/CLAUDE_REVIEW.md`.
- Related review findings: none yet.

### Decision 003: Codex implements only ChatGPT-approved tasks

- Date: 2026-05-29
- Decision: Codex implements only tasks approved by ChatGPT and recorded for implementation.
- Context: The requested workflow routes Claude findings back through ChatGPT before implementation.
- Options considered:
  - Codex implements every Claude suggestion.
  - Codex implements only ChatGPT-approved tasks.
- Rationale: ChatGPT triage can reject false positives, defer non-MVP work, and keep implementation scoped.
- Consequences: `docs/CODEX_TASKS.md` must be based on approved items in `docs/archive/AI_REVIEW_TRIAGE.md`.
- Status: Active.
- Related files: `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
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
- Related files: `docs/archive/CLAUDE_REVIEW.md`, `docs/archive/AI_REVIEW_TRIAGE.md`.
- Related review findings: none yet.

### Decision 005: AI coordination docs preserve cross-tool context

- Date: 2026-05-29
- Decision: This repository will use dedicated review-management docs to preserve context across AI tools.
- Context: ChatGPT, Codex, and Claude Code each have different roles in the review workflow.
- Options considered:
  - Keep review state only in chat transcripts.
  - Store review brief, Claude output, ChatGPT triage, Codex tasks, and decisions in repository docs.
- Rationale: Repository docs make the workflow auditable and reduce the chance of losing context across chats or tools.
- Consequences: `docs/archive/REVIEW_BRIEF.md`, `docs/archive/CLAUDE_REVIEW.md`, `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, and `docs/DECISION_LOG.md` become the coordination packet for future review passes.
- Status: Active.
- Related files: `docs/archive/REVIEW_BRIEF.md`, `docs/archive/CLAUDE_REVIEW.md`, `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, `docs/DECISION_LOG.md`.
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
- Related files: `docs/archive/CLAUDE_REVIEW.md`, `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, `apps/web/app.js`, `apps/web/app.test.js`.
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
- Related files: `server/oEmbedClient.js`, `server/xApiV2Client.js`, `server/oEmbedClient.test.js`, `server/xApiV2Client.test.js`, `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
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
- Related files: `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, `docs/api.md`, `docs/requirements.md`, `docs/archive/current-status.md`, `docs/incident-and-kv-failure-runbook.md`.
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
- Related files: `apps/web/app.js`, `apps/web/app.test.js`, `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
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
- Related files: `server/rateLimiter.js`, `server/rateLimiter.test.js`, `functions/api/extract.js`, `functions/api/extract.test.js`, `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
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
- Related files: `README.md`, `docs/archive/current-status.md`, `docs/archive/deployment-plan.md`, `docs/archive/pre-release-checklist.md`, `docs/archive/pre-release-operations-runbook.md`, `docs/archive/privacy-policy-draft.md`, `docs/archive/support-page-draft.md`, `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
- Related review findings: CL-009.

### Decision 012: Close Claude review follow-up implementation queue

- Date: 2026-05-31
- Decision: The Claude review follow-up queue is closed after PR #31 through PR #37. No active Codex implementation task remains approved.
- Context: ChatGPT approved bounded follow-up work across multiple PRs: CL-003, CL-005, approved CL-010 regression coverage, CL-004, CL-001/CL-002 docs-only clarification, CL-006, CL-007, CL-008, CL-009, and review coordination docs. The remaining items require either a human/product decision or are not approved.
- Options considered:
  - Leave the review-management docs in a per-pass state.
  - Record the final disposition of CL-001 through CL-013 and close the current Codex task queue.
- Rationale: The repository should not leave stale "current pass" or pending task wording that could cause Codex to implement unapproved Claude suggestions later.
- Consequences: `docs/archive/AI_REVIEW_TRIAGE.md` records the final CL-001 through CL-013 disposition, and `docs/CODEX_TASKS.md` states that no active approved Codex task remains. CL-001/CL-002 runtime cache behavior remains a human/product/privacy decision. CL-012 is resolved through tracked governance docs without application code changes. CL-013 remains rejected for implementation.
- Status: Active.
- Related files: `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, `docs/archive/CLAUDE_REVIEW.md`, `docs/archive/CHATGPT_HANDOFF.md`, `docs/archive/REVIEW_BRIEF.md`, `docs/archive/claude-code-usage.md`.
- Related review findings: CL-001, CL-002, CL-003, CL-004, CL-005, CL-006, CL-007, CL-008, CL-009, CL-010, CL-011, CL-012, CL-013.

### Decision 013: Package remaining decisions before runtime work

- Date: 2026-05-31
- Decision: Remaining post-Claude-review items should be organized as a decision backlog before any further runtime or production work.
- Context: PR #31 through PR #38 completed the approved Claude review follow-up queue, but CL-001/CL-002 runtime cache policy, current production HEAD verification, production smoke, and post-release operations decisions remain unresolved.
- Options considered:
  - Leave the remaining items scattered across release, operations, and review docs.
  - Create one decision backlog packet and matching GitHub issues for human/ChatGPT decisions.
- Rationale: The remaining work is decision-heavy and can affect privacy, retention, API usage, production verification, billing, and operations. Codex should not infer these choices from implementation convenience.
- Consequences: `docs/archive/post-claude-review-decision-backlog.md` becomes the coordination packet for the next human/ChatGPT decisions. Future implementation still requires explicit approval and must preserve the existing secret, real-data, Cloudflare write, production smoke, and live API boundaries.
- Status: Active.
- Related files: `docs/archive/post-claude-review-decision-backlog.md`, `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`, `docs/requirements.md`, `docs/api.md`, `docs/archive/current-status.md`, `docs/archive/deployment-plan.md`, `docs/production-smoke-runbook.md`, `docs/post-release-operations-checklist.md`.
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
- Related files: `server/extractService.js`, `server/extractService.test.js`, `docs/api.md`, `docs/requirements.md`, `docs/archive/current-status.md`, `docs/archive/post-claude-review-decision-backlog.md`, `docs/archive/AI_REVIEW_TRIAGE.md`, `docs/CODEX_TASKS.md`.
- Related review findings: CL-001, CL-002.

### Decision 015: Verify current Production HEAD without production API smoke

- Date: 2026-05-31
- Decision: Issue #41 verified the current Cloudflare Pages Production HEAD as master HEAD `a6fe436f3f08326c6479561ea997ed6bb3e23f9c` using read-only metadata and static page checks only.
- Context: Current Production HEAD had remained unverified after PR #31 through PR #43. ChatGPT approved Production HEAD verification without production `/api/extract`, production smoke, live X API, live oEmbed, Cloudflare write/deploy, secret/OAuth, or real-data access.
- Options considered:
  - Use only the GitHub Cloudflare Pages check-run.
  - Use Cloudflare Pages read-only deployment listing.
  - Combine GitHub Cloudflare Pages check metadata, documented production branch, Cloudflare Pages docs, and static page GET checks.
- Rationale: GitHub Deployments API returned no deployment records and Wrangler was not installed locally or globally. The available evidence shows the Cloudflare Workers and Pages App check suite ran on `head_branch=master` at `head_sha=a6fe436f3f08326c6479561ea997ed6bb3e23f9c`, completed successfully, and reported deployment ID `143cd043-10bf-406b-b8c8-3a22bb6a9ca2` with latest commit `a6fe436`. The public production URL and the deployment URL both returned static root page HTTP 200 with matching ETag.
- Consequences: Docs may state the current Production HEAD verification result for Issue #41. This does not authorize production `/api/extract`, smoke tests, Cloudflare write/deploy/rollback/config changes, or Issue #42 operations work.
- Status: Active.
- Related files: `docs/archive/current-status.md`, `docs/archive/deployment-plan.md`, `docs/post-release-human-verification-record.md`, `docs/archive/post-claude-review-decision-backlog.md`, `docs/CODEX_TASKS.md`.
- Related review findings: CL-009, Issue #41.

### Decision 016: Keep Issue #42 open until post-release operations decisions are supplied

- Date: 2026-05-31
- Decision: Issue #42 should be treated as a human/ChatGPT decision packet, not as an implementation task. Codex may organize the decision checklist and safe recording boundaries, but must not decide privacy, legal, support, billing, credits, log retention, 429 policy, production smoke, Cloudflare logs, or incident ownership.
- Context: Issue #42 covers post-release operations items that affect user trust, legal/privacy posture, API cost control, support responsibility, logs, and production verification. These cannot be safely finalized from repository files alone.
- Options considered:
  - Let Codex infer reasonable defaults and close Issue #42.
  - Leave the existing scattered docs unchanged.
  - Add a dedicated decision packet and keep Issue #42 open until decisions are explicitly supplied.
- Rationale: A dedicated decision packet makes the remaining choices reviewable without changing runtime behavior or performing prohibited production, Cloudflare, billing, secret, or live-provider operations.
- Consequences: `docs/post-release-operations-decision-packet.md` is the current coordination document for Issue #42. Future Codex work may only record explicit decisions or implement separately approved tasks. Issue #42 remains open while human decisions are incomplete.
- Status: Active.
- Related files: `docs/post-release-operations-decision-packet.md`, `docs/archive/post-claude-review-decision-backlog.md`, `docs/post-release-operations-checklist.md`, `docs/post-release-human-verification-template.md`, `docs/production-smoke-runbook.md`, `docs/incident-and-kv-failure-runbook.md`, `docs/archive/deployment-plan.md`, `docs/archive/current-status.md`, `docs/CODEX_TASKS.md`.
- Related review findings: Issue #42.

### Decision 017: Keep the post-review maintenance audit docs-only

- Date: 2026-05-31
- Decision: The post-review maintenance audit is limited to repository documentation inventory, stale wording cleanup, docs index upkeep, and local validation. It must not change runtime behavior, resolve Issue #42, or perform production, Cloudflare, live-provider, secret, OAuth, or real-data operations.
- Context: PR #31 through PR #45 closed the approved Claude-review implementation and documentation follow-ups, while Issue #42 remains open for human/ChatGPT post-release operations decisions.
- Options considered:
  - Treat the audit as a new implementation pass.
  - Use the audit only to record repository state and fix docs inventory drift.
  - Close Issue #42 based on existing docs.
- Rationale: The remaining open work is decision-oriented and may affect privacy/legal, billing, support, log retention, production smoke, 429 policy, and incident ownership. Codex can make the docs easier to review, but cannot supply those decisions.
- Consequences: `docs/archive/post-review-maintenance-audit.md` records the audit results. `README.md` links the audit and avoids stale current-production wording. `docs/test-cases.md` reflects the current local test count. Issue #42 remains open.
- Status: Active.
- Related files: `README.md`, `docs/archive/post-review-maintenance-audit.md`, `docs/test-cases.md`, `docs/post-release-operations-decision-packet.md`, `docs/archive/current-status.md`.
- Related review findings: Issue #42.

### Decision 018: Guard Issue #42 decision boundaries in docs verification

- Date: 2026-05-31
- Decision: `npm.cmd run check:post-release-docs` should fail when `docs/post-release-operations-decision-packet.md` stops preserving Issue #42 as a human/ChatGPT decision item or loses required safety boundaries.
- Context: Issue #42 remains open for privacy/legal, support, billing/credits, log retention, 429 policy, production smoke, Cloudflare logs, and incident ownership decisions. These must remain explicit and must not be silently weakened by future docs edits.
- Options considered:
  - Rely on manual review of the decision packet.
  - Add deterministic docs verification for the packet's required sections and guardrail phrases.
  - Close Issue #42 after adding the packet.
- Rationale: A local docs guardrail is a low-risk way to preserve the governance boundary without making the human decisions or touching runtime behavior.
- Consequences: `scripts/verifyPostReleaseDocs.js` validates the decision packet alongside the existing post-release operations docs. The script checks the keep-open status, decision areas, Codex prohibitions, production/live-provider/secret/Cloudflare stop boundaries, and close conditions. Issue #42 remains open.
- Status: Active.
- Related files: `scripts/verifyPostReleaseDocs.js`, `scripts/verifyPostReleaseDocs.test.js`, `docs/post-release-operations-decision-packet.md`, `docs/CODEX_TASKS.md`.
- Related review findings: Issue #42.

### Decision 019: Guard repo-local Markdown links without external URL checks

- Date: 2026-05-31
- Decision: Repository docs verification should check local Markdown file links in `README.md`, `AGENTS.md`, `SECURITY.md`, and `docs/`, while skipping external URLs, `mailto:`, `tel:`, image links, and links inside fenced code blocks.
- Context: The post-release docs set is increasingly used as a coordination boundary across ChatGPT, Codex, Claude Code, and humans. Broken local file links can silently weaken that boundary, but checking external URLs would add network and drift risk.
- Options considered:
  - Leave local links to manual review.
  - Add a local-only Markdown link checker and integrate it into existing docs verification.
  - Check external URL availability.
- Rationale: Local file existence checks are deterministic, cheap, and safe. External URL availability checks are intentionally out of scope because they require network access and may be unstable.
- Consequences: `scripts/verifyMarkdownLinks.js` verifies repo-local Markdown link targets. PR #49 adds local Markdown heading-anchor validation for fragment-only links and `docs/file.md#anchor` links; see Decision 020. `check:post-release-docs` runs this local link guard.
- Status: Active.
- Related files: `scripts/verifyMarkdownLinks.js`, `scripts/verifyMarkdownLinks.test.js`, `scripts/verifyPostReleaseDocs.js`, `docs/test-cases.md`, `docs/CODEX_TASKS.md`.
- Related review findings: Issue #42.

### Decision 020: Guard repo-local Markdown heading anchors

- Date: 2026-06-01
- Decision: Extend the local Markdown link guard so fragment-only links such as `#section` and Markdown file links such as `docs/file.md#section` must resolve to a heading anchor in the target Markdown file.
- Context: The previous local link guard verified file existence but could not catch stale in-page anchors. The new scope remains local-only and does not add external URL HTTP checks.
- Options considered:
  - Keep file-existence-only checks.
  - Add a local Markdown heading-anchor parser with stable GitHub-like slug behavior.
  - Add full GitHub Markdown anchor reproduction.
- Rationale: A bounded local parser catches the common stale-anchor failure without making docs verification dependent on external services or exact GitHub rendering behavior.
- Consequences: Duplicate headings are accepted with `-1`, `-2` suffixes. External URLs, `mailto:`, `tel:`, image links, and fenced code block links remain skipped. Runtime app behavior is unchanged.
- Status: Accepted and implemented.
- Related files: `scripts/verifyMarkdownLinks.js`, `scripts/verifyMarkdownLinks.test.js`, `scripts/verifyPostReleaseDocs.js`, `docs/test-cases.md`, `docs/CODEX_TASKS.md`.
- Related review findings: Documentation guardrail follow-up; not a runtime Claude finding.

### Decision 021: Re-delegate primary implementation to Codex as autonomous primary developer

- Date: 2026-06-20
- Decision: Primary implementation of this repository is re-delegated to Codex acting as an autonomous primary developer. Codex self-drives task selection, implementation, self-verification, Japanese commits, and PR creation without per-task approval. The operating contract is `docs/CODEX_HANDOFF.md`. Claude Code returns to an orchestrator-plus-reviewer role.
- Context: On 2026-06-13 implementation was handed from Codex to Claude Code for the UX backlog (CC-002 through CC-008). The user now wants Codex to run as the autonomous primary developer under a four-rule model, with Claude reserved for orchestration and review and a human-mediated brief for front-end visual design.
- Options considered:
  - Keep Claude Code as the primary implementer (2026-06-13 state).
  - Keep the original ChatGPT-triage / Codex-implements-only-approved / Claude-review-only model (Decisions 001-004).
  - Re-delegate primary implementation to Codex as an autonomous primary developer with human-approved gates.
- Rationale: Autonomous Codex implementation up to PR creation maximizes throughput while keeping production deploy, billing/paid API, secret/real-data egress, and product-requirement changes under human approval. Visual-design creation stays human-mediated so Codex implements a returned design rather than inventing one.
- Consequences: This supersedes the implementation-authority parts of Decisions 001, 002, 003, and 004 (ChatGPT per-task approval, Claude review-only, Codex implements only ChatGPT-approved tasks). Reviews default to Codex self-review (`check:all` green plus adversarial self-review); ChatGPT or Claude review is requested only when needed. The original 2026-06-20 wording kept merge to `master` as a human gate because Cloudflare Pages production follows `master`; that merge-gate detail is superseded by Decision 022. The security and data boundaries in `AGENTS.md` (Prohibitions, Post-release operations) and the Issue #42 human-decision status (Decision 016) remain unchanged.
- Status: Active for role delegation. Merge/human-gate details are superseded by Decision 022.
- Related files: `docs/CODEX_HANDOFF.md`, `CLAUDE.md`, `AGENTS.md`, `TASKS_BACKLOG.md`, `README.md`.
- Related review findings: none (workflow/governance decision).

### Decision 022: Align Codex autonomy with 2026-06-29 global policy

- Date: 2026-06-29
- Decision: The repository-specific Codex handoff follows the current global autonomy policy. GitHub PR merge and normal GitHub Actions execution are part of Codex's autonomous workflow when checks, mergeability, and cost/security boundaries are satisfied.
- Context: Decision 021 originally kept merge-to-`master` as a human gate because Cloudflare Pages production follows `master`. The global Codex policy was later updated to allow commits, pushes, PR work, merges, and non-cost deployments unless a stop condition applies.
- Rationale: Keeping a stale merge prohibition in repo docs would block the current long-running autonomous development loop and contradict the global source of truth.
- Consequences: Stop conditions are limited to paid/cost-bearing operations, secret/OAuth/real-data or real-asset external transmission, live provider or production API checks using real X data, product-requirement changes, and physical blockers. The project-specific post-release boundaries in `AGENTS.md` remain active for live X API/oEmbed, production `/api/extract`, X Developer Portal, billing/credits, and secret/token/OAuth handling.
- Status: Active.
- Related files: `AGENTS.md`, `docs/CODEX_HANDOFF.md`, `TASKS_BACKLOG.md`.
- Related review findings: none (workflow/governance update).
### Decision 023: Reposition as a record-support tool and release publicly (M3)

- Date: 2026-07-04
- Decision: The product is repositioned as a record-support tool (記録補助ツール), not a legal-evidence preservation tool. The release scope is M3 (general public release). The archive link section lists multiple external services (gyo.tc, Wayback Machine, archive.today, twtr.satoru.net) instead of a single gyo.tc link. The API policy stays oEmbed-first with optional BYOT X API v2.
- Context: The Fable5 requirements review (`docs/fable5-requirements-review-2026-07-03.md`) re-examined the value hypothesis and posed owner questions. The owner answered on 2026-07-04 (Q1=M3, Q2=record-support positioning with screenshot/PDF guidance, Q4=investigate free media-URL options, Q6=multiple archive services).
- Rationale: The tool cannot guarantee legal evidence preservation; honest positioning plus screenshot/PDF guidance serves users better. Multiple archive services remove a single point of failure. The 2026-07-04 research (`docs/media-url-and-archive-research-2026-07-04.md`) found no terms-compliant free media-URL source, so oEmbed-first stays.
- Consequences: UI wording, README, and privacy page state the record-support positioning (CC-011, PR #66). Archive links became multi-service (CC-012, PR #67). A visual redesign for public release followed (CC-014, PR #69). `docs/requirements.md` carries the positioning as the requirement source.
- Status: Active.
- Related files: `docs/requirements.md`, `docs/fable5-requirements-review-2026-07-03.md`, `docs/media-url-and-archive-research-2026-07-04.md`, `apps/web/index.html`.
- Related review findings: none (product/positioning decision).

### Decision 024: Record M3 operations decisions and close Issue #42

- Date: 2026-07-06 (decisions recorded), 2026-07-07 (Issue #42 closed)
- Decision: The owner recorded the remaining post-release operations decisions for M3: the public contact channel is GitHub Issues with the repository made public, log-retention wording was finalized, and the production smoke policy was recorded. With all decision items recorded, Issue #42 was closed on 2026-07-07.
- Context: Issue #42 tracked human decisions for privacy/legal, support, billing, log retention, 429 policy, smoke approval, KV/incident ownership, and data-recording boundaries (`docs/post-release-operations-decision-packet.md`). The M3 mode decision packet (`docs/issue-42-mode-decision-packet.md` §決定記録) captured the owner answers.
- Rationale: All Issue #42 close conditions were met by explicit owner records; keeping the issue open no longer served a purpose.
- Consequences: CC-015 (PR #72) applied the decisions to the repository, and the repository became public. The decision packet remains as a historical record; the smoke gate and prohibited-work boundaries stay in force through `AGENTS.md` and `docs/CODEX_HANDOFF.md`.
- Status: Active (recorded decisions); Issue #42 closed.
- Related files: `docs/issue-42-mode-decision-packet.md`, `docs/post-release-operations-decision-packet.md`, `TASKS_BACKLOG.md`.
- Related review findings: Issue #42.

### Decision 025: Record image upload via Cloudflare R2 with about-7-day retention

- Date: 2026-07-07 (feature approved), 2026-07-08 to 2026-07-11 (R2 redesign and rollout)
- Decision: The record image feature renders fetched post text onto a canvas PNG client-side, and uploads through the site's own `/api/upload-image` Pages Function into a Cloudflare R2 bucket binding (`RECORD_IMAGE_BUCKET`), served back via `/i/{id}` with about-7-day automatic deletion (serving-side expiry check plus an owner-configured R2 object lifecycle rule).
- Context: The initial design relayed uploads to catbox.moe, which failed in production because Cloudflare Workers egress to that host is blocked. The owner approved redesigning to R2 (PR #78/#80/#81/#82). The owner completed the R2 bucket, binding, and lifecycle setup on 2026-07-11, and a production E2E confirmed upload, share-URL issuance, and byte-identical delivery.
- Rationale: Serving uploads through the site's own function avoids third-party egress blocks and keeps the no-external-transmission boundary; a short retention window fits the temporary-share use case and limits storage cost to the free tier.
- Consequences: The image renders text only (no fetched media), keeping X terms compliance. Upload stays disabled with `upload_not_configured` guidance until the binding exists. Rate limits are separate from `/api/extract` (`UPLOAD_RATE_LIMIT_*`).
- Status: Active.
- Related files: `functions/api/upload-image.js`, `functions/i/[id].js`, `functions/lib/recordImage.js`, `docs/api.md`, `docs/requirements.md`, `README.md`.
- Related review findings: none (feature decision, CC-018).

### Decision 026: One-press auto-upload and collapsed archive section

- Date: 2026-07-11
- Decision: The record image flow becomes a single button that creates the image and automatically uploads it for a share URL (with a retry button reusing the same blob on failure). Page sections were reordered, and the archive (魚拓) section became a collapsed `<details>` element, closed by default.
- Context: Owner feedback after using the shipped CC-018 feature asked for fewer steps and a lighter-weight archive section (CC-019, PR #84). Production E2E on 2026-07-11 confirmed create → auto-upload → share-URL issuance.
- Rationale: One press removes the most common friction; collapsing the archive section signals it is optional without removing it.
- Consequences: Upload failure now surfaces a retry path instead of a dead end. UI tests cover the retry-resends-same-blob behavior.
- Status: Active.
- Related files: `apps/web/app.js`, `apps/web/index.html`, `apps/web/styles.css`, `docs/requirements.md`.
- Related review findings: none (UX decision, CC-019).

## Open decisions

- Priority and adoption of the nine UX improvement candidates documented as v2 by CC-022; owner decides which to implement.
- Whether to wire the local lint into CI (`.github/workflows/`); CC-023の[提案書](lint-ci-integration-proposal.md)を起草済み。採用はgate ①（human approval）。
