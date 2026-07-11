# Post-release Operations Decision Packet

2026/05/31

## Status

Prepared by Codex for Issue #42. This is a decision packet, not an operations approval.

**Resolution: Issue #42 was closed on 2026-07-07.** All decision items were explicitly recorded by the owner (M3 public release decision and related operations decisions). The decision records live in `docs/issue-42-mode-decision-packet.md` (§決定記録) and `docs/DECISION_LOG.md`. This packet is retained as the historical record of the decision space. The production smoke approval gate and the prohibited-work boundaries below remain in force through `AGENTS.md` and `docs/CODEX_HANDOFF.md`.

At preparation time (2026/05/31), Codex had not decided privacy, legal, billing, credits, log retention, 429 policy, production smoke, Cloudflare log handling, or incident ownership. Items below remained human or ChatGPT decisions until explicitly recorded.

## Current repository state

- Repository: `h8nc4y/x-archive-link-tool`.
- Product: X post paste-text Web MVP on Cloudflare Pages.
- Production URL is documented as `https://x-archive-link-tool.pages.dev`.
- Issue #40 is closed: CL-001 received no runtime change and CL-002 degraded fallback responses use a short TTL.
- Issue #41 is closed: Production HEAD was verified in a separate read-only pass and recorded in `docs/post-release-human-verification-record.md`.
- Issue #42 state at preparation time: open (post-release operations decisions were not complete). Issue #42 was closed on 2026-07-07 after all decision items were recorded.
- No production `/api/extract`, production smoke, live X API, live oEmbed, real X URL submission, Cloudflare write/deploy, secret/OAuth, or real-data access is approved by this packet.

## Issue #42 scope

Issue #42 covers human or ChatGPT decisions for:

- privacy and legal review
- support contact and support scope
- billing, X API credits, usage cap, and review cadence
- log retention and Cloudflare Functions log handling
- 429 policy and normal-user response path
- production smoke approval boundaries
- Cloudflare KV and incident ownership
- data recording boundaries for future operations

Issue #42 does not approve runtime code changes, production API checks, X API live calls, oEmbed live calls, Cloudflare writes, deploys, rollback, dependency additions, or policy decisions by Codex.

## Decision item summary

| ID | Area | Current repo evidence | Human or ChatGPT decision still needed |
| --- | --- | --- | --- |
| OPS-PRIVACY | Privacy/legal | `docs/privacy-policy-draft.md` exists and states it is not a legal final version. | Whether the privacy wording is approved, who reviewed it, and whether any public wording must change. |
| OPS-SUPPORT | Support | `docs/support-page-draft.md` and `docs/deployment-plan.md` contain the candidate contact address. | Whether the contact may be public, expected response scope, owner role, and escalation path. |
| OPS-BILLING | Billing and X API credits | `docs/post-release-operations-checklist.md` and `docs/post-release-human-verification-template.md` define safe abstract recording. Historical human verification exists, but Issue #42 does not re-confirm current billing or credits state. | Current review cadence, responsible owner, OK/NG/unknown state, and stop conditions without sharing billing details. |
| OPS-LOGS | Log retention and Cloudflare logs | `SECURITY.md` and runbooks restrict logs to safe structured fields. Retention remains unresolved in current docs. | Retention period, deletion policy, log reviewer role, and whether Cloudflare default retention is acceptable. |
| OPS-429 | 429 policy | Rate limiting is implemented and tested locally. Production 429 verification is explicitly not part of normal smoke. | Whether to rely on local tests only, when production 429 checks are allowed, support response, and rate-limit adjustment path. |
| OPS-SMOKE | Production smoke | `docs/production-smoke-runbook.md` defines bounded approval language and recording limits. | Whether to run any future production `/api/extract`, maximum count, target-selection ownership, and stop conditions. |
| OPS-KV | KV and incident ownership | KV is a cache optimization layer; stale-cache after physical TTL is not a production guarantee. | Incident owner, cache-disabled continuation policy, rollback/redeploy approval path, and recovery verification path. |
| OPS-DATA | Data recording boundaries | Multiple docs forbid real URL, post ID, username, post text, media URL, tokens, secrets, and raw JSON recording. | Who verifies future operation records before posting to issues/docs, and whether extra redaction checks are required. |

## Decision item details

### OPS-PRIVACY: Privacy and legal review

Decision owner:

- Human owner or ChatGPT after human-provided review status.

Options:

- Approve current draft wording as MVP wording.
- Approve current wording with specified edits.
- Mark legal/privacy review as not complete and block production smoke.
- Keep privacy page as a draft while allowing static public availability, if the owner accepts that risk.

Recommended record:

- Review date.
- Reviewer role, not private identity unless intentionally public.
- Status: `approved`, `approved with edits`, `blocked`, or `not reviewed`.
- Files reviewed: `docs/privacy-policy-draft.md`, public `/privacy`, README/support wording if applicable.
- Required wording changes, if any.

Forbidden record:

- Legal advice transcripts that should not be public.
- Personal data, real X post data, raw logs, tokens, secrets, billing details, or private contact information.

Stop conditions:

- Legal approval requires private counsel notes, account access, user data, or non-public operational records.

### OPS-SUPPORT: Support contact and support scope

Decision owner:

- Human owner.

Options:

- Use the current candidate contact address for MVP support.
- Use a different public support route.
- Keep support limited to GitHub/docs and do not publish an email address.
- Define no public support commitment beyond best effort.

Recommended record:

- Public contact route.
- Owner role.
- Expected response scope.
- What support will not cover.
- Escalation path for 402/403/429/5xx, privacy requests, and abuse reports.

Forbidden record:

- Private inbox credentials, OAuth, recovery codes, private phone numbers, or customer data.

Stop conditions:

- Support setup requires account login, mailbox credentials, paid service setup, or exposing private contact details.

### OPS-BILLING: Billing, X API credits, and usage cap

Decision owner:

- Human owner with X Developer Portal and billing access.

Options:

- Treat current billing/credits/cap as OK for MVP and set a review cadence.
- Treat state as unknown and block production smoke.
- Treat state as NG and keep production API checks disabled.
- Define a lower rate-limit or feature-freeze posture until credits/cap are rechecked.

Recommended record:

- Status only: `OK`, `NG`, or `unknown`.
- Review date and owner role.
- Review cadence.
- Whether usage cap/spending cap/alerting exists.
- Whether production smoke maximum count is safe.

Forbidden record:

- Billing detail, payment method, invoice, card data, token, secret, OAuth credential, raw dashboard screenshot, real URL, post ID, username, post text, media URL, or raw provider response.

Stop conditions:

- Any check requires Codex to access X Developer Portal, billing portal, OAuth, token, secret, paid APIs, or real data.

### OPS-LOGS: Log retention and Cloudflare Functions logs

Decision owner:

- Human owner, operations owner, or legal/privacy reviewer.

Options:

- Use Cloudflare default retention only and avoid copying logs into repo docs.
- Keep only safe structured operational summaries for a fixed period.
- Set a shorter retention policy for any copied summaries.
- Block production smoke until retention and reviewer ownership are decided.

Recommended record:

- Retention period.
- Deletion expectation.
- Log reviewer role.
- Allowed fields: request timestamp, request_id, method, path, statusCode, durationMs, errorCode, source, cached, mediaUrls count, warnings count, deployment ID or commit hash.
- Whether Cloudflare internal log details may be viewed by humans, and what may be summarized back to Codex.

Forbidden record:

- Request body, real X URL, post ID, username, account name, post text, media URL, HTML body, raw JSON values, token, Authorization header, Cookie, secret, billing detail, or Cloudflare internal log detail text.

Stop conditions:

- Log confirmation requires Cloudflare Dashboard/API access by Codex, secret/OAuth, production API execution, or copying internal logs into public docs/issues.

### OPS-429: 429 policy and rate-limit handling

Decision owner:

- Human owner or ChatGPT after human sets policy goals.

Options:

- Rely on local `node --test` rate-limit coverage and do not perform production 429 testing.
- Allow production 429 testing only in a separate bounded approval with maximum requests and no real X provider calls.
- Lower rate-limit values if credits or abuse risk increases.
- Define support response for normal users who hit 429.

Recommended record:

- Whether production 429 testing is allowed.
- If allowed, maximum request count, spacing, target, and stop conditions.
- Support response text or owner role.
- Rate-limit adjustment owner.

Forbidden record:

- Real X URL, post ID, username, post text, media URL, raw API response, token, Authorization header, secret, Cookie, or Cloudflare internal log details.

Stop conditions:

- Testing would create production load, call production `/api/extract`, increase live X API/oEmbed calls, risk credits, or require Cloudflare write/config changes without a separate approval.

### OPS-SMOKE: Production smoke approval

Decision owner:

- Human owner. ChatGPT may format the approved prompt, but it must not invent approval.

Options:

- Do not run production smoke.
- Run one bounded production `/api/extract` smoke using a human-selected public test post.
- Run up to two calls only when the second call is explicitly for cache confirmation.
- Defer until billing, credits, privacy, support, and logs are re-confirmed.

Recommended record:

- Exact approval phrase from `docs/production-smoke-runbook.md`.
- Maximum execution count.
- Target classification, not the actual URL.
- Allowed result fields only.
- Stop conditions.

Forbidden record:

- The real target URL, post ID, username, post text, media URL value, raw JSON, Authorization header, token, secret, Cookie, or `tmp/approved-smoke-target.txt` contents.

Stop conditions:

- `tmp/approved-smoke-target.txt` must be read, production `/api/extract` must be called, live provider calls are needed, or smoke approval is incomplete.

### OPS-KV: KV and incident ownership

Decision owner:

- Human owner or operations owner.

Options:

- Continue current KV behavior and document owner/stop conditions only.
- Define cache-disabled continuation criteria.
- Define rollback/redeploy path for KV binding issues.
- Defer any KV physical TTL or retention change until privacy/legal retention is approved.

Recommended record:

- Incident owner role.
- Cache-disabled continuation criteria.
- Stop conditions for credits, 402/403/429/5xx, provider warnings, or cache miss spikes.
- Recovery verification path.
- Whether Cloudflare write operations require separate approval.

Forbidden record:

- KV values, normalized post payloads, post IDs, real URLs, post text, media URLs, tokens, secrets, or Cloudflare internal log details.

Stop conditions:

- KV value inspection, binding changes, production redeploy, rollback, Cloudflare write, or secret/OAuth access is required.

### OPS-DATA: Data recording boundaries

Decision owner:

- Human owner or ChatGPT for workflow policy.

Options:

- Keep current strict redaction rules.
- Add an explicit human review step before posting operation results to issues.
- Add future local redaction tooling, if separately approved.

Recommended record:

- Reviewer role for future operation summaries.
- Allowed aggregate fields.
- Disallowed raw fields.
- Where operation summaries may be posted.

Forbidden record:

- Real URL, post ID, username, account name, post text, media URL, raw JSON, raw HTML, request body, Authorization header, token, secret, Cookie, `.env`, OAuth credential, billing detail, personal data, or Cloudflare internal log detail text.

Stop conditions:

- The task requires reading or copying prohibited data.

## Codex allowed work for Issue #42

Codex may:

- Edit repository documentation.
- Organize decision options and checklists.
- Record explicit human or ChatGPT decisions after they are supplied.
- Run local tests and docs checks.
- Use GitHub read/write operations for branch, PR, merge, and Issue comments.
- Search repository docs for unresolved decisions.

## Codex prohibited work for Issue #42

Codex must not:

- Decide privacy, legal, billing, credits, support, retention, 429 policy, production smoke, Cloudflare log policy, or incident ownership.
- Close Issue #42 while human decisions remain incomplete.
- Run production `/api/extract`, production smoke, production 429 checks, live X API, or live oEmbed.
- Send real X URLs or real user data externally.
- Read `.env`, token, secret, OAuth credential, `tmp/approved-smoke-target.txt`, or real data.
- Use Cloudflare Dashboard/API, perform Cloudflare write/deploy/rollback/config changes, or inspect KV values.
- Change runtime code, tests, scripts, dependencies, deployment config, or cache behavior as part of this issue.

## Production smoke approval gate

Production smoke may only proceed after all of the following are true:

- A human owner provides the exact bounded approval from `docs/production-smoke-runbook.md`.
- Billing, X API credits, usage cap/spending cap equivalent, endpoint access, and rate limit/quota are recorded as safe using only abstract values.
- Privacy/legal/support/log-retention status is either approved or explicitly documented as an accepted risk by the owner.
- Maximum execution count is fixed.
- 429 testing is excluded unless separately approved.
- The target is provided through the approved local mechanism without recording the URL.
- The output record is limited to HTTP status, source, cached, mediaUrls count, warnings count, error code, timestamp, execution count, deployment ID or commit hash.

## Issue #42 close conditions

All conditions below were met and recorded by 2026-07-07, and Issue #42 was closed. Issue #42 could be closed only when all required decisions below were explicitly recorded, or when the owner explicitly marked remaining items as not MVP-blocking:

- Privacy/legal status.
- Support contact and support scope.
- Billing, X API credits, usage cap/spending cap status and review cadence.
- Log retention and Cloudflare Functions log owner.
- 429 policy.
- Production smoke approval or non-approval.
- KV/incident owner and cache-disabled continuation policy.
- Data-recording boundary owner for future operation summaries.

## Why Issue #42 remained open until 2026-07-07

This packet organized the decision space but did not supply the human decisions. Codex cannot verify current billing, credits, privacy/legal approval, log retention, support responsibility, or Cloudflare log ownership from repo files alone. Therefore Issue #42 remained open until the owner recorded all decisions (2026-07-06〜07), after which it was closed.

## Source evidence inspected

- `README.md`: project overview, public URL, post-release operation boundaries, docs index.
- `SECURITY.md`: safe logging fields and security prohibitions.
- `docs/post-claude-review-decision-backlog.md`: Issue #42 scope and decision backlog.
- `docs/post-release-operations-checklist.md`: current human checklist and production smoke boundaries.
- `docs/post-release-human-verification-template.md`: safe human-verification format.
- `docs/post-release-human-verification-record.md`: historical human/Codex records; not a fresh Issue #42 re-verification.
- `docs/production-smoke-runbook.md`: production smoke approval language and stop conditions.
- `docs/incident-and-kv-failure-runbook.md`: KV/incident ownership and log boundaries.
- `docs/deployment-plan.md`: Cloudflare settings, rate-limit policy, and unresolved operational items.
- `docs/current-status.md`: current app status and remaining operation decisions.
- `docs/privacy-policy-draft.md`: privacy draft and legal-review caveat.
- `docs/support-page-draft.md`: support page draft and support-scope caveat.
