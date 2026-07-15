# Post-Review Maintenance Audit

## Status

Prepared by Codex on 2026-05-31 after the Claude-review follow-up PR series.

This is a docs-only maintenance audit. It does not approve or perform runtime changes, production checks, Cloudflare operations, live X API calls, live oEmbed calls, secret/OAuth access, real-data access, deploys, rollbacks, or Issue #42 closure.

## Scope

Included:

- Repository status, branch, and recent PR inventory.
- Review of tracked Markdown docs and README links.
- Stale current-status wording that could mislead future ChatGPT, Claude Code, or Codex runs.
- Current local test inventory wording.
- Open human/ChatGPT decision items.

Excluded:

- Runtime code changes under `apps/`, `server/`, `functions/`, or `scripts/`.
- Cache runtime policy changes.
- Production `/api/extract`, production smoke, production 429, live X API, or live oEmbed checks.
- Cloudflare Dashboard/API/write/deploy/rollback/config operations.
- Reading `.env`, tokens, secrets, OAuth material, `tmp/approved-smoke-target.txt`, or real data.
- Closing or deciding Issue #42.

## Repository State Observed

- Current branch at audit start: `master`.
- Audit branch: `docs/post-review-maintenance-audit`.
- `master...origin/master` was clean before the audit branch was created.
- Start commit: `f990dd4c1ffba3d1be0804a80470a06e2ea288e8`.
- Latest start commit summary: `docs: add post-release operations decision packet (#45)`.
- Open issues observed: Issue #42 only.
- Open PRs observed before the audit: none.

## PR Inventory

Read-only GitHub PR inventory showed these Claude-review and post-review follow-ups as merged:

- PR #31: CL-003 / CL-005 approved UI fixes and tests.
- PR #32: CL-004 provider fetch redirect non-following.
- PR #33: CL-001 / CL-002 cache-policy documentation clarification.
- PR #34: GitHub Actions runtime warning follow-up.
- PR #35: CL-006 loading UI.
- PR #36: CL-007 / CL-008 rate limiter and IP key hardening.
- PR #37: CL-009 production HEAD wording cleanup.
- PR #38: Claude review follow-up queue closure.
- PR #39: post-review decision backlog.
- PR #43: degraded fallback short TTL.
- PR #44: production HEAD verification record.
- PR #45: post-release operations decision packet.

No merged PR records for #40, #41, or #42 were observed in the merged PR list read during this audit. The currently open GitHub item observed for this audit was Issue #42.

## Documentation Inventory Findings

- Tracked Markdown inventory included `README.md`, `SECURITY.md`, `AGENTS.md`, and 27 files under `docs/`.
- A local Markdown link scan found no broken local Markdown targets.
- README documentation links had existing targets.
- README did not previously link this maintenance audit because the file did not exist.
- Several older release and pre-release docs preserve dated historical evidence and old test counts. Those were left unchanged unless they represented current inventory.

## Corrections Made

- Added this audit file: `docs/post-review-maintenance-audit.md`.
- Added `docs/post-review-maintenance-audit.md` to the README documentation index.
- Reworded the README privacy-policy URL note so it points to the Issue #41 production HEAD record instead of saying the current Production HEAD is unverified in that old work context.
- Updated `docs/test-cases.md` from `123 tests pass` to `132 tests pass` after running `node --test` during this audit.
- Added Decision 017 to `docs/DECISION_LOG.md` to record that this audit is docs-only and does not close Issue #42.

## Items Reviewed And Left Unchanged

- `docs/CLAUDE_REVIEW.md` retains Claude's raw review output, including historical `123 tests` references. Those are not current repository inventory statements.
- `docs/pre-release-checklist.md`, `docs/release-candidate.md`, and `docs/release-notes-v0.1.0.md` retain historical `112 tests pass` release-era records.
- `docs/pre-release-checklist.md`, `docs/pre-release-operations-runbook.md`, `docs/privacy-policy-draft.md`, and `docs/support-page-draft.md` contain older production-evidence wording. Those files are historical or draft/runbook context and were not rewritten broadly in this audit.
- `docs/current-status.md` already records the Issue #41 production HEAD verification and states that Issue #42 did not re-confirm production HEAD.
- `docs/post-release-operations-decision-packet.md` already states that Issue #42 remains open and that Codex must not decide privacy/legal, billing, support, log retention, 429 policy, production smoke, Cloudflare log handling, or incident ownership.

## Validation Commands

Commands run for this audit or immediately before the docs updates:

- `git status --short --branch`
- `git checkout master`
- `git fetch --prune origin`
- `git pull --ff-only origin master`
- `git log --oneline -n 10`
- `git diff --stat`
- `git remote -v`
- `git config --get-all credential.helper`
- `git config --get-all credential.https://github.com.helper`
- `gh auth status -h github.com --json hosts`
- `gh api user --jq .login`
- `GIT_TERMINAL_PROMPT=0 git ls-remote origin HEAD`
- `gh pr list --state merged --limit 50 --json number,state,mergedAt,title,url`
- `gh issue list --state open --json number,title,url`
- `git ls-files README.md AGENTS.md SECURITY.md docs`
- local temporary Markdown audit scan script, removed before commit
- `node --test`

Validation to run before merging this audit PR:

- `node --test`
- `npm.cmd run check:post-release-docs`
- `git diff --check`

## Remaining Human Or ChatGPT Decisions

Issue #42 remains open. The unresolved decision areas are:

- Privacy/legal approval status.
- Support contact, owner, expected response scope, and escalation path.
- Billing and X API credits review cadence and owner.
- Log retention period and Cloudflare log handling.
- Production 429 policy.
- Production smoke approval criteria and target-selection ownership.
- KV and incident ownership.
- Whether any Issue #42 item is MVP-blocking or explicitly deferred.

## Non-Actions Confirmed

This audit did not:

- Change runtime source code, tests, scripts, deployment config, dependencies, or cache behavior.
- Run production `/api/extract`, production smoke, production 429, live X API, or live oEmbed.
- Read `.env`, tokens, secrets, OAuth credentials, `tmp/approved-smoke-target.txt`, or real data.
- Use Cloudflare Dashboard/API/write/deploy/rollback/config operations.
- Close Issue #42.
