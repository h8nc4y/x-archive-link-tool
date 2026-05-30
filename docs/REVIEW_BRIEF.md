# REVIEW_BRIEF

## Status

Prepared by Codex from local repository inspection on 2026-05-29. This file is a context packet for ChatGPT and Claude Code, not a final product specification.

Confirmed facts are based on repository files, Git metadata, CodeGraph index output, and safe read-only shell commands. Inferred assumptions are labeled as such. Anything not supported by repository evidence is marked as unknown or left as a question.

Current-status note as of the 2026-05-31 Claude review follow-up closure: this brief is a historical pre-review context packet. Claude review output is recorded in `docs/CLAUDE_REVIEW.md`; ChatGPT triage and final CL-001 through CL-013 disposition are recorded in `docs/AI_REVIEW_TRIAGE.md`; completed Codex task history and the current no-active-task state are recorded in `docs/CODEX_TASKS.md`. PR #31 through PR #37 have completed the approved follow-up queue.

## Project summary

Confirmed: this repository contains a Node.js ESM web MVP named `x-post-paste-text-mvp`. It generates paste-ready text from X post sharing URLs.

Confirmed: the project has a browser UI under `apps/web`, a local Node HTTP server under `server`, Cloudflare Pages Functions under `functions`, repository documentation under `docs`, and Node.js `node --test` tests.

Confirmed: the public Cloudflare Pages URL is documented as `https://x-archive-link-tool.pages.dev`.

Inferred: the repository folder name `004_x-archive-link-tool` and deployed project name `x-archive-link-tool` are operational names for the same MVP.

## Repository identity

- Repository/folder name: `004_x-archive-link-tool`
- Package name: `x-post-paste-text-mvp`
- Current branch at inspection time: `master`
- Working tree at inspection time: `git status --short` returned no output before these review-management docs were created.
- Git repository: yes, based on successful `git status`, `git branch`, and `git log` commands.
- Important top-level directories:
  - `apps/web`: static browser UI and UI tests.
  - `server`: local Node HTTP server, extraction service, URL validation, provider clients, cache, and rate limiter.
  - `functions`: Cloudflare Pages Functions entrypoint for `/api/extract`.
  - `scripts`: local/manual verification scripts and post-release doc checks.
  - `docs`: requirements, operations, deployment, release, and review context documentation.
  - `.github/workflows`: GitHub Actions CI.
  - `.codegraph`: local CodeGraph index exists.
- Important config and policy files:
  - `AGENTS.md`: repository operating policy and project-specific prohibitions.
  - `package.json`: Node.js module type and scripts.
  - `.env.example`: example non-secret environment variables.
  - `.gitignore`: ignores `node_modules/`, logs, `tmp/`, `.env`, and `.env.*` except `.env.example`.
  - `.github/workflows/ci.yml`: CI runs `npm test` on pull requests, `master` pushes, and manual dispatch.
  - `apps/web/_headers`: static security headers for Cloudflare Pages.
  - `SECURITY.md`: security and data-handling policy.
  - `CLAUDE.md`: present locally but ignored by Git in this workspace; `docs/claude-code-usage.md` says `AGENTS.md` is the primary rule file.

## Intended goal

Confirmed: the MVP accepts X post sharing URLs, validates and normalizes them, and returns fixed paste-ready fields such as account name, username, numeric user ID when available, post URL, post date, text, media URLs, and archive-related URL fields.

Confirmed: the project intentionally avoids server-side fetching of arbitrary user-input URLs, X HTML scraping, OGP lookup, short URL expansion, media download, and server-side archive retrieval.

Confirmed: X API v2 is optional and BYOT-based through server-side `X_BEARER_TOKEN`. When the token is not configured, the project can fall back to official X oEmbed.

Inferred: the project goal is to provide a small, low-risk web workflow for Japanese users/operators who need copyable X post metadata while minimizing data leakage, API cost exposure, and accidental scraping behavior.

## Target users

- Confirmed: maintainers/operators running or deploying the Cloudflare Pages MVP.
- Confirmed: end users who paste X post URLs into the web UI to generate copyable text.
- Inferred: Japanese non-programmer users are important because repository policy requires Japanese-first UI text and plain Japanese labels.
- Inferred: ChatGPT, Codex, and Claude Code are secondary "AI operator" users of these review-management docs.

## Primary use cases

- Paste an X post sharing URL into the web UI and get copy-ready text.
- Validate and normalize allowed X/Twitter post URL formats.
- Use X API v2 when a server-side bearer token is configured.
- Use official oEmbed fallback when X API v2 is not configured or fails in a fallback-compatible way.
- Serve the static UI and `/api/extract` through Cloudflare Pages and Pages Functions.
- Run local tests with Node.js `node --test`.
- Preserve post-release operations context without exposing secrets, raw post content, real URLs, media URLs, usernames, or post IDs in logs/docs.
- Coordinate independent Claude Code review while keeping ChatGPT as the decision-maker and Codex as the implementer of approved tasks only.

## Non-goals

Confirmed non-goals from repository docs:

- iOS app.
- Database-backed app storage.
- User authentication.
- Additional production deployment settings unless explicitly planned.
- Server-side fetch of arbitrary user-input URLs.
- X HTML scraping.
- Browser automation to read X.
- Server-side web archive retrieval.
- OGP lookup.
- Short URL expansion.
- Media download.
- Storing X post text, media URLs, account information, login cookies, X internal GraphQL data, or guest tokens.
- Automatic acceptance of Claude Code review findings.
- Direct Claude control over Codex implementation.

Unclear or not yet documented:

- Whether future quote or poll support should become in scope.
- Whether a whole-repository Claude review or a diff-only Claude review is preferred for the next review pass.

## Current implementation status

### Implemented or likely implemented

- Static web UI in `apps/web`.
- Local Node HTTP server in `server/extractServer.js`.
- Cloudflare Pages Function endpoint in `functions/api/extract.js`.
- URL validation and canonicalization in `server/urlValidator.js`.
- X API v2 client in `server/xApiV2Client.js`.
- oEmbed fallback client in `server/oEmbedClient.js`.
- Extraction orchestration and cache-first behavior in `server/extractService.js`.
- In-memory cache in `server/postCache.js`.
- Cloudflare KV cache adapter in `server/kvPostCache.js`.
- Rate limiter in `server/rateLimiter.js`.
- GitHub Actions CI running `npm test`.
- Security, deployment, release, post-release, and manual operation docs under `docs`.

### Partially implemented

- Production operation documentation exists, but several operations remain human-confirmed or explicitly unconfirmed.
- Cloudflare KV is documented as configured for Production, but formal ongoing operational responsibility and failure procedures still have open items.
- Contact/privacy/legal docs exist as drafts or candidate values; legal review is not confirmed.
- Rate limiting is implemented, but Cloudflare Functions in-memory state is documented as isolate-local best effort rather than a true global limit.

### Missing or unclear

- No documented lint script.
- No documented typecheck script.
- No documented build script.
- No package lockfile and no install step in CI.
- No explicit dependency manifest beyond Node.js built-ins and platform APIs visible in `package.json`.
- No database or migration layer.
- At creation time, no confirmed Claude review findings had been recorded yet. Current review output is in `docs/CLAUDE_REVIEW.md`.
- At creation time, no ChatGPT triage decisions for Claude findings had been recorded yet. Current triage and closure state are in `docs/AI_REVIEW_TRIAGE.md`.
- At closure time, no active Codex implementation task remains approved. Completed task history is in `docs/CODEX_TASKS.md`.

### Broken or risky, if evidence exists

No broken behavior was verified during this documentation-only task. Risk areas are listed below for review focus. Historical docs mention production-operation unknowns, Cloudflare confirmation caveats, billing/credits review needs, and strict logging prohibitions.

## Architecture overview

The apparent request flow is:

1. Browser UI under `apps/web` accepts a URL and calls `/api/extract`.
2. Local development can serve the UI and API through `server/extractServer.js`.
3. Cloudflare production serves static UI from `apps/web` and handles `/api/extract` through `functions/api/extract.js`.
4. API handling validates the URL through `server/urlValidator.js` and rejects unsupported hosts, paths, protocols, redirects, short URLs, and malformed post IDs.
5. `server/extractService.js` handles cache-first extraction keyed by normalized post ID and extractor cache version.
6. On cache miss, the service uses `server/xApiV2Client.js` when `X_BEARER_TOKEN` is available, otherwise or on supported failures it uses `server/oEmbedClient.js`.
7. Responses are normalized into safe, fixed output fields. oEmbed HTML is not rendered as HTML.
8. Production can use Cloudflare KV via `server/kvPostCache.js`; otherwise cache fallback is in-memory.
9. Rate limiting is handled by `server/rateLimiter.js`; docs warn that Cloudflare isolate-local in-memory limits are best-effort.

External integrations identified from repository evidence:

- X API v2: `https://api.x.com/2/tweets/{postId}` when server-side bearer token is configured.
- X official oEmbed: `https://publish.x.com/oembed`.
- Cloudflare Pages, Pages Functions / Workers runtime, and KV binding `X_POST_CACHE`.
- GitHub Actions CI.

No database service is identified. No paid API execution or deployment operation was performed for this brief.

## Tech stack

- Language: JavaScript.
- Module format: Node.js ESM (`"type": "module"`).
- Runtime: Node.js, documented CI setup uses Node.js 22.
- Browser UI: plain HTML/CSS/JavaScript in `apps/web`.
- Local server: Node.js `http` module style server in `server/extractServer.js`.
- Serverless target: Cloudflare Pages Functions / Workers runtime.
- Cache: in-memory cache locally/fallback; Cloudflare KV binding `X_POST_CACHE` in production.
- Tests: Node.js built-in test runner via `node --test`.
- CI: GitHub Actions.
- Deployment target: Cloudflare Pages with static output directory `apps/web` and Functions directory `functions`.
- Security headers: Cloudflare Pages `_headers` file plus local server policy.
- Documentation: Markdown under `docs`.

No third-party npm dependencies are visible in `package.json`.

## Important files and directories

- `README.md`: project summary, startup, testing, environment variables, MVP scope, deployment notes, docs index, and validation notes.
- `AGENTS.md`: operating policy, project scope, prohibitions, verification commands, GitHub and reporting rules.
- `package.json`: project identity, ESM mode, scripts.
- `.github/workflows/ci.yml`: CI behavior and Node version.
- `.gitignore`: confirms `.env` and `.env.*` are ignored while `.env.example` remains allowed.
- `.env.example`: documents expected non-secret environment variable names.
- `SECURITY.md`: security policy and logging prohibitions.
- `apps/web`: end-user static UI, styles, privacy page, headers, and UI tests.
- `functions/api/extract.js`: Cloudflare Pages `/api/extract` function.
- `server`: extraction service, URL validator, provider clients, cache adapters, rate limiter, local server, and tests.
- `scripts`: manual and post-release verification scripts.
- `docs/requirements.md`: MVP scope, URL validation, cache, archive-link, and out-of-scope rules.
- `docs/current-status.md`: current implemented/unimplemented state and operational notes.
- `docs/api.md`: API contract and logging rules.
- `docs/deployment-plan.md`: Cloudflare Pages, KV, rate limit, production verification, and remaining operations decisions.
- `docs/claude-code-usage.md`: current Claude Code usage note and safety limits.

## Validation commands

Commands supported by repository evidence:

- Install: no install command is documented; CI intentionally has no install step because no `package-lock.json` is present.
- Lint: no lint script is documented in `package.json`.
- Typecheck: no typecheck script is documented in `package.json`.
- Test: `npm test`.
- Test on Windows when PowerShell blocks `npm.ps1`: `npm.cmd test`.
- Test without npm: `node --test`.
- Post-release docs check: `npm.cmd run check:post-release-docs`.
- Local dev server: set `PORT=3000`, then run `npm start`, `npm.cmd start`, or `node server/extractServer.js`.
- Production smoke: `npm.cmd run smoke:production-once`, but only under the strict approval and target-file conditions documented in `README.md` and `docs/production-smoke-runbook.md`.

Commands run for this brief are not product tests unless listed in the final Codex report. This brief does not claim test results unless the command was actually run.

## Known risks and review focus

Claude should review carefully:

- Requirement ambiguity: quote/poll future scope, MVP-blocking issues, and whether future product goals are documented enough.
- Architecture risk: duplication or drift between local server and Cloudflare Function behavior.
- Security risk: strict URL validation, no arbitrary fetch, no scraping, no HTML rendering, no sensitive values in logs, and safe handling of provider errors.
- Data handling: cache contents, KV values, stale-cache behavior, and prohibited documentation/logging of raw X data.
- Auth/permissions: `X_BEARER_TOKEN` stays server-side only; no token leakage to client or tests.
- Rate limiting: isolate-local best-effort behavior on Cloudflare may not be a true global cap.
- Testing gaps: absence of lint/typecheck/build scripts; no dependency lockfile; review whether existing tests cover UI, Cloudflare function parity, logging redaction, cache versioning, and rate limits sufficiently.
- UX/UI issues: Japanese-first text, validation errors, empty/loading/error states, focus/hover behavior, and responsive checks.
- Deployment/config risk: Cloudflare Pages root/output/functions directory assumptions, KV binding, `_headers`, privacy/support/legal review, production verification restrictions.
- AI-generated-code risk: ensure review findings are evidence-based, no invented product requirements, and no implementation of unapproved Claude suggestions.

## Questions for ChatGPT before Claude review

- Should Claude review the entire `master` branch or only the diff represented by these coordination docs?
- Should Claude focus on security/data-handling first, or provide a broad code review?
- Are production-operation docs in scope for Claude, or should Claude avoid Cloudflare/billing/legal operational recommendations?
- Should Claude be asked to produce only findings, or also a Codex-ready prompt that ChatGPT will triage before use?
- Which severity taxonomy should ChatGPT require: P0/P1/P2/P3 or P0/P1/P2/Nice-to-have?
- Should Claude inspect ignored local files such as `CLAUDE.md`, or only Git-tracked files?
- Should a secrets/config audit be performed before any external review transcript is shared?
- Which unresolved operational decisions are MVP-blocking?

## Questions for Claude reviewer

- Does the implementation enforce the documented prohibition on server-side fetch of arbitrary user-input URLs?
- Are X API v2 and oEmbed called only with validator-produced canonical URLs or post IDs?
- Can any user-provided text or upstream HTML be rendered unsafely in the UI?
- Are raw URLs, post IDs, usernames, media URLs, text, HTML bodies, JSON values, tokens, or secret values ever logged or exposed?
- Do local server and Cloudflare Function behavior remain equivalent for request validation, response shape, rate limiting, and errors?
- Is cache versioning sufficient to avoid stale incorrect text extraction after extraction logic changes?
- Are rate-limit and provider-error warnings machine-readable and safe?
- Are tests sufficient for current documented MVP scope?
- Are docs consistent with actual scripts, deployment layout, and current source behavior?
- Are there stale or contradictory production-status claims that ChatGPT should resolve before the next release?

## Source evidence

- `README.md`: project summary, public URL, local startup, tests, env vars, MVP scope, non-goals, docs index, and verification commands.
- `AGENTS.md`: repository operating policy, project scope, prohibitions, verification requirements, GitHub workflow, and Claude/Codex reporting constraints.
- `package.json`: package name, version, ESM mode, and scripts.
- `.github/workflows/ci.yml`: CI triggers, Node.js version, and `npm test` command.
- `.gitignore`: ignored secret/temp/log patterns and `.env.example` exception.
- `.env.example`: documented environment variable names without secret values.
- `CLAUDE.md`: local ignored Claude role instructions observed in workspace.
- `docs/claude-code-usage.md`: `AGENTS.md` as primary rule file and Claude safety limits.
- `docs/requirements.md`: MVP scope, URL validation, cache policy, archive link rules, and non-goals.
- `docs/current-status.md`: implemented/unimplemented status and known operational unknowns.
- `docs/api.md`: API behavior, provider selection, response shape, cache, and logging rules.
- `docs/deployment-plan.md`: Cloudflare Pages settings, KV/rate-limit operations, production verification limits, and open operational decisions.
- `SECURITY.md`: security policy, logging allowlist/blocklist, and secret-handling rules.
- `server/*`, `functions/api/*`, and `apps/web/*`: CodeGraph and targeted `rg` inspection identified primary components and tests.
- `git status --short`, `git branch --show-current`, `git log --oneline -n 10`, `git diff --stat`, `git ls-files`, `git check-ignore`: repository state, branch, recent history, and tracking/ignore facts.
