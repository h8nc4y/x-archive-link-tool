# CLAUDE_REVIEW

## Status

Claude Code review output recorded. ChatGPT triage is recorded separately in `docs/AI_REVIEW_TRIAGE.md`.

Do not treat Claude findings as implementation instructions. Claude findings remain advisory unless ChatGPT approves them.

Follow-up closure note: ChatGPT-approved work from this Claude review was implemented through PR #31 through PR #37. Current final disposition and the no-active-task state are recorded in `docs/AI_REVIEW_TRIAGE.md` and `docs/CODEX_TASKS.md`.

## Review instructions

Claude Code should review only and should not edit files unless the user explicitly instructs it to do so.

Claude should treat `AGENTS.md` as the primary repository rule file and should respect the project prohibitions around secrets, OAuth credentials, real X post data, production `/api/extract`, X API/oEmbed live calls, Cloudflare write operations, and billing-sensitive actions.

Claude findings are advisory. ChatGPT remains the commander that decides whether each finding is accepted, deferred, or rejected. Codex must not implement Claude suggestions until ChatGPT records approval in `docs/AI_REVIEW_TRIAGE.md` and converts the approved work into `docs/CODEX_TASKS.md`.

Suggested review output shape:

- Executive summary.
- Findings grouped by severity.
- Evidence with file paths and line references where possible.
- Risk if ignored.
- Suggested action.
- Open questions.
- Review limitations.

Claude should not invent runtime results, test results, production status, commit hashes, PR URLs, issue URLs, or user requirements.

## Claude review output

Let me read the remaining test files to ground my coverage assessment, and check `tmp/` contents by name only (without reading any file).

I have completed a thorough read-only review: all required docs, the full `server/`, `functions/`, `apps/web/`, `scripts/`, key test files, and the test suite (123/123 pass, offline). Below is my independent review. I made no edits, no network/API/deploy calls, and read no secrets/real data (no bare `.env` present; `tmp/` exists but is empty — no `approved-smoke-target.txt`).

---

# Claude Code Independent Review

## 0. Review constraints observed

- **Read-only:** yes
- **Files edited:** none
- **External network/API/deploy:** none. `node --test` ran fully offline (provider clients use injected `fetchFn` mocks in tests; `runProductionSmokeOnce.js` / `manualOEmbedCheck.js` `main()` are guarded by `import.meta.url === process.argv[1]` and are never invoked by their test files).
- **Secrets or real data read:** none. Confirmed no bare top-level `.env` (only `.env.example`). `tmp/` exists (git-ignored) but is **empty** — `tmp/approved-smoke-target.txt` not present; I did not read any file under `tmp/`. I did not open `.codegraph/`, `.claude/`, or `X_BEARER_TOKEN` anywhere.
- **Tests run:**
  - `node --version` → `v24.15.0`
  - `node --test` → **123 tests, 123 pass, 0 fail** (duration ~366ms)
- **Tests skipped:** `npm test` / `npm.cmd test` (equivalent to `node --test`; not re-run to avoid PowerShell `npm.ps1` policy noise). `npm.cmd run check:post-release-docs` not run separately — instead I read `scripts/verifyPostReleaseDocs.js` and confirmed the required-section/forbidden-term logic statically. `smoke:production-once` and `manual:oembed-check` intentionally **not run** (prohibited: live X API/oEmbed/production).

## 1. Executive summary

- **Overall verdict:** Solid, security-conscious MVP. The documented safety posture (no arbitrary-URL fetch, no scraping, token server-side only, no sensitive logging, no HTML rendering of post text) is **actually implemented and well-tested**. Code quality is high and consistent across the local server and Cloudflare Function.
- **No P0 and no P1 issues found.** No secret leakage, no SSRF/arbitrary fetch, no token client-leak, no unsafe HTML rendering, no destructive operations.
- **Main risks are P2/P3 quality items**, chiefly two cache-behavior nuances: (a) the documented `stale-cache` fallback is effectively unreachable on Cloudflare KV, and (b) a degraded oEmbed fallback result gets cached for the full 30-day TTL even when a token is configured. Plus a UX gap where network/parse errors surface non-Japanese technical messages.
- **ChatGPT can safely proceed to triage.** Nothing blocks Codex from implementing approved items.
- **More repo evidence needed?** No additional *code* evidence required. Remaining open items are **human/production-domain** (actual Cloudflare deploy state, legal/privacy/support review, X API billing/credits, log retention, KV-failure owner, 429 policy) and cannot be verified read-only from this repo.

## 2. Repository and evidence reviewed

| Area | Files / dirs checked | Notes |
| --- | --- | --- |
| Policy/config | `AGENTS.md`, `CLAUDE.md` (system-provided), `package.json`, `.github/workflows/ci.yml`, `.gitignore`, `.env.example`, `SECURITY.md` | CLAUDE.md is global-gitignored; `@AGENTS.md` is the effective rule source. No conflict found between CLAUDE.md and AGENTS.md. |
| Core docs | `README.md`, `docs/requirements.md`, `docs/api.md`, `docs/current-status.md`, `docs/test-cases.md`, `docs/claude-code-usage.md` | Coherent and detailed. |
| Ops docs | `docs/deployment-plan.md`, `docs/production-smoke-runbook.md`, `docs/incident-and-kv-failure-runbook.md` | Strong human-gating of risky ops. |
| Coordination | `docs/CHATGPT_HANDOFF.md`, `docs/REVIEW_BRIEF.md`, `docs/DECISION_LOG.md` | Accurately self-describe state (untracked, pending review). |
| Server | `urlValidator.js`, `extractService.js`, `extractServer.js`, `oEmbedClient.js`, `xApiV2Client.js`, `postCache.js`, `kvPostCache.js`, `rateLimiter.js`, `env.js` | Full read. |
| Functions | `functions/api/extract.js` | Full read; parity checked vs local server. |
| Web UI | `apps/web/index.html`, `app.js`, `styles.css`, `privacy.html`, `_headers` | Full read; XSS + UX + responsive (code-level). |
| Scripts | `runProductionSmokeOnce.js`, `verifyPostReleaseDocs.js`, `manualOEmbedCheck.js` | Read; confirmed safe import behavior. |
| Tests | `urlValidator.test.js`, `extractService.test.js`, `extractServer.test.js`, `oEmbedClient.test.js`, `xApiV2Client.test.js` (partial via run output), `functions/api/extract.test.js`, `apps/web/app.test.js`, `scripts/runProductionSmokeOnce.test.js` | Read directly. **Not individually read:** `styles.test.js`, `rateLimiter.test.js`, `kvPostCache.test.js`, `env.test.js`, `manualOEmbedCheck.test.js`, `verifyPostReleaseDocs.test.js`, `xApiV2Client.test.js` (full file) — all included in the passing 123-test run. |

## 3. Goal and requirement alignment

**Confirmed alignment (fact):**
- README / requirements / api / current-status agree on: input = X post share URL only; strict validate→canonicalize; cache-first by postId+schema version; X API v2 BYOT optional; oEmbed fallback; no arbitrary fetch / scraping / OGP / short-URL expansion / media download / server-side archive; archive shown as external link only; token server-side only; sensitive data excluded from logs.
- Implementation matches these: `urlValidator.js` (strict), `extractService.js` (cache-first + provider selection + fallback), `oEmbedClient.js`/`xApiV2Client.js` (fixed endpoints only), `_headers` + in-code `SECURITY_HEADERS` (CSP etc.), UI uses `textContent`/`textarea.value` only.
- Response shape in `docs/api.md` matches `normalizeProviderPost` output (incl. legacy `accountName`/`postId`/`postUrl`/`userNumericId`).

**Gaps / ambiguities:**
- The documented `stale-cache` graceful-degradation behavior is not achievable on the production cache target (KV) — see CL-001.
- "Cache only successful responses" technically permits caching a degraded oEmbed fallback for 30 days when a token is set — see CL-002.

**MVP blocker candidates:** None identified. Core flow works and is safe.

**Future-scope candidates (correctly kept out of scope, not mixed in):** iOS app, DB, auth, custom domain, quote/poll (requirements.md L41 explicitly defers quote/poll to "P1/P2"), additional production deploy settings. Scope separation is clean.

## 4. Findings

| ID | Category | Sev | Conf | Evidence | 放置リスク | 推奨対応 | Codex cand. | ChatGPT triage hint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CL-001 | architecture | P2 | High | `kvPostCache.js` L62-76 (`expirationTtl = ceil(ttl/1000)`) + `extractService.js` L128-133 (stale path via `allowStale:true`) | KV auto-evicts at logical TTL, so the promised `stale-cache` return after upstream failure can never fire in production; users get an error instead of last-known data | KV `expirationTtl` を論理TTLより長く設定（freshnessはmetadata.cacheExpiresAtで判定済）。または docsで「stale-cacheはin-memory限定」と明記 | Maybe | 採用寄り（doc/impl不一致）。ただしユーザー影響は境界時のみ |
| CL-002 | implementation | P2 | High | `extractService.js` L135-144 (token時のfallbackを `setCachedPost(..., ttlMs)` で30日保存) | token設定時にX APIが一時失敗→oEmbed劣化結果（media/userNumericId欠落）が最大30日キャッシュされ、回復後も古い劣化データを返す | fallback結果は短TTLで保存 or 非キャッシュ or 「要再取得」フラグ付与 | Maybe | 要判断（設計トレードオフ）。media取得が主目的なら採用寄り |
| CL-003 | UX-UI | P2 | High | `apps/web/app.js` L184,196-200 (`await response.json()` 失敗 / network失敗時 `error.message` をそのまま表示) | ネットワーク断やnon-JSON応答時に "Failed to fetch" 等の英語技術文言が日本語非プログラマーに表示される | catchで汎用日本語文言にfallback（既存`ERROR_MESSAGES`既定値を流用） | Yes | 採用寄り（小さく安全、UX改善明確） |
| CL-004 | security/data-handling | P3 | High | `oEmbedClient.js` L104-109, `xApiV2Client.js` L206-212（`redirect`未指定→既定`follow`）vs `SECURITY.md` L42「リダイレクトを追跡しない」 | 固定ホスト宛のためSSRF実害は低いが、明文ポリシーとコードが不一致。多層防御の欠如 | provider fetchに `redirect: "error"`（または`"manual"`）を付与 | Maybe | 採用寄り（低リスク・低コストの整合化） |
| CL-005 | UX-UI | P3 | High | `urlValidator.js` L41 (`username:"未取得"`) → `app.js` L74,80 で `@未取得` 表示 | `/i/web/status/{id}` をoEmbed経由で処理時、コピー文に `アカウントID：@未取得` と出る | username が "未取得" sentinel の場合も `@` を付けない分岐を追加 | Maybe | 採用寄り（軽微表示バグ） |
| CL-006 | UX-UI | P3 | Med | `app.js` L172-204（submit時 `submitButton.disabled=true` のみ、loading表示なし） | 取得に時間がかかる時、進捗が分からず二度押し/不安につながる | 「取得中…」表示やaria-busy等の最小ローディング状態 | Maybe | 任意改善 |
| CL-007 | implementation | P3 | Med | `rateLimiter.js` L32,42-46（`ipCounters` Map に追加のみ、削除なし） | 長寿命プロセスでIP単位エントリが無限増加（メモリ）。Cloudflareはisolate再生成で緩和、localはdev用 | 期限切れカウンタの定期掃除 or サイズ上限 | Maybe | 保留〜採用（実害は限定的） |
| CL-008 | security | P3 | Low-Med | `functions/api/extract.js` L121-123（`x-forwarded-for` をRLキーにfallback） | XFFは偽装可能。`cf-connecting-ip`不在時に per-IP制限を回避され得る（Pagesでは通常cf-connecting-ip有り） | XFF使用時は先頭IPのみ採用、または信用しない方針を明記 | Maybe | 保留（Pages前提では影響小） |
| CL-009 | docs/operations | P3 | Med | `README.md` L8 / `current-status.md` L53,78 が「現在の本番稼働HEAD `2db0a89…`」と記載。`git log` の現HEADは `69224d6` | 文書上の「現在の本番HEAD」がrepo HEADより古く、将来app変更時に乖離・誤認の恐れ（直近commitはdocs/policy中心で乖離は現状小） | 「本番HEAD」記述の更新運用ルール化、または相対表現化 | Maybe | 保留（実害小、定期reconcile推奨） |
| CL-010 | tests | P2 | High | テスト網羅の隙間（下記） | CL-001/002/003/005の挙動が無検証で、回帰検知できない | 該当挙動のテスト追加（§5参照） | Yes（採用findings次第） | 採用findingsに紐づけて採用 |
| CL-011 | tests/quality | P3→Nice | High | `package.json` L5-12（lint/typecheck/build scriptなし）。`current-status.md` L61 が意図的と明記 | 構文ミス/未使用importの検知手段がCIにない | 任意で `node --check` 一括 or 軽量lint導入（依存追加判断はChatGPT/人間） | Maybe | 任意（MVPでは許容可。意図的と明記済） |
| CL-012 | AI-workflow | P3 | High | `git check-ignore` → `CLAUDE.md` はグローバル `~/.gitignore_global` で無視。`claude-code-usage.md` L5 が説明 | Claude役割定義がrepoに残らず、別環境/他レビュアーへ伝播しない | Claude役割の要点を `AGENTS.md` か tracked docs にも明記 | Maybe | 保留（運用次第） |
| CL-013 | data-handling | P3 | Med | `extractServer.js` L234-242（本番entrypointは `logger` 未注入＝null）vs `functions/.../extract.js` L207（`logger: console`） | localサーバは既定で一切ログ出力なし＝観測性ゼロ（安全側ではある）。Functionsとのparityがログだけズレ | 必要なら安全項目のみのlogger注入を任意化 | No | 保留（安全な現状。観測性は任意） |

Categories with **no evidence-backed finding**: *requirements*（整合確認済み、ブロッカーなし）。weak/unverifiable な懸念は §7 Unknowns へ回しています。

## 5. Codex improvement candidates for ChatGPT triage

> Claude は採用確定・実装命令を出しません。以下は ChatGPT が採用/保留/却下を判断するための候補です。

### CAND-A — UI fetch失敗時の日本語フォールバック文言
- **Based on:** CL-003
- **Goal:** ネットワーク断・non-JSON応答・予期せぬ例外時に、英語技術文言ではなく汎用日本語メッセージを表示する。
- **Why:** 日本語非プログラマー利用者向けという中核要件（AGENTS.md / Localization）に直結。現状 `error.message` が素通し。
- **Likely files:** `apps/web/app.js`（submit handlerのcatch、必要なら`app.test.js`）。
- **Acceptance criteria:** fetch reject / JSON parse失敗 / `response.ok===false` だが既知codeなし のいずれでも、UIには日本語の汎用文言（例:「取得に失敗しました。時間を置いて再試行してください。」）のみ表示。既知errorコードの日本語マッピングは現状維持。
- **Suggested validation:** `node --test`。`app.js` の表示文言生成部を純関数化できれば単体テスト追加。
- **Risk / caution:** UI挙動変更は最小に。390/768/1280pxの実レンダリング確認推奨（本レビューは未実施＝コード推測）。
- **Recommended triage:** **Adopt**（小・安全・要件直結）。

### CAND-B — provider fallback結果のキャッシュTTL方針
- **Based on:** CL-002（必要に応じ CL-001 と併せて）
- **Goal:** token設定時にX API一時失敗で得たoEmbed劣化結果を、長期(30日)キャッシュしない、または短TTL/再取得対象にする。
- **Why:** media URL等が一過性障害後も最大30日欠落し続ける。
- **Likely files:** `server/extractService.js`（fallback分岐の `setCachedPost` TTL）、`server/postCache.js`/`kvPostCache.js`（TTL受け渡し）、関連テスト。
- **Acceptance criteria:** ChatGPTが選んだ方針（非キャッシュ or 短TTL）どおりに動作し、token成功時の通常キャッシュ(30日)は不変。`source`/`warnings`の意味が壊れない。
- **Suggested validation:** `extractService.test.js` に「fallback結果のTTL/再取得」ケース追加 + `node --test`。
- **Risk / caution:** TTL設計変更はcache挙動に波及。`POST_EXTRACT_CACHE_VERSION` 整合に注意。
- **Recommended triage:** **Needs more evidence**（仕様判断要。docsの「成功のみ保存」をどう解釈するかをChatGPTが決定）。

### CAND-C — KVでのstale-cache到達性の解消 or 文書化
- **Based on:** CL-001
- **Goal:** 「upstream失敗時に期限切れcacheをstaleで返す」挙動を本番KVでも成立させる（physical TTL > logical TTL）か、できないと明記する。
- **Likely files:** `server/kvPostCache.js`（`expirationTtl` を論理TTLより長く）、`docs/api.md`/`requirements.md`、テスト。
- **Acceptance criteria:** KV adapterで論理期限切れ後も `allowStale` getが値を返せる（physical TTLが長い場合）。または docsに「stale-cacheはin-memory限定」と明記し挙動を一致させる。
- **Suggested validation:** `kvPostCache` のstale取得テスト追加（mock KV）+ `node --test`。
- **Risk / caution:** KV保持期間延長はストレージ/プライバシー観点（保持データ=正規化済み投稿情報）に触れる。privacy方針との整合をChatGPT/人間が確認。
- **Recommended triage:** **Defer / Needs more evidence**（保持期間はプライバシー判断を伴う）。

### CAND-D — provider fetchのリダイレクト非追従化
- **Based on:** CL-004
- **Goal:** `SECURITY.md` の「リダイレクトを追跡しない」とコードを一致させる。
- **Likely files:** `server/oEmbedClient.js`、`server/xApiV2Client.js`（`fetch` optionに `redirect:"error"`）、各clientテスト。
- **Acceptance criteria:** 両clientが3xxを追わない。既存のerror mappingに矛盾しない。テストでredirect時にエラー化を確認。
- **Suggested validation:** mock fetchで3xx応答→例外、を `node --test` で確認。
- **Risk / caution:** 万一X側が正規に3xxを返す設計だと取得が壊れ得る（実通信での挙動は未確認＝外部仕様未検証）。挙動変更前にfixtureで検討。
- **Recommended triage:** **Adopt（要慎重）**（多層防御。ただし外部挙動はlive検証不可のため保守的に）。

### CAND-E — `@未取得` 表示の修正
- **Based on:** CL-005
- **Likely files:** `apps/web/app.js`（`buildCopyText` のusername分岐）、`app.test.js`。
- **Acceptance criteria:** `username` が空 **または** "未取得" のとき `アカウントID：未取得`（`@`なし）。既存の正常usernameは `@username` のまま。
- **Suggested validation:** `app.test.js` に "未取得" sentinelケース追加 + `node --test`。
- **Recommended triage:** **Adopt**（軽微・安全）。

### CAND-F — 回帰テスト追加（CL-010）
- **Based on:** CL-010（採用されたA/B/C/Eに対応）
- **Goal:** 採用挙動を固定するテスト追加（UI error localization、fallback TTL、KV stale、`@未取得`）。
- **Likely files:** `apps/web/app.test.js`、`server/extractService.test.js`、`server/kvPostCache.test.js`。
- **Recommended triage:** **Adopt**（対応findingが採用された範囲でのみ）。

### CAND-G — rate limiterのカウンタ掃除 / XFF扱い
- **Based on:** CL-007, CL-008
- **Likely files:** `server/rateLimiter.js`、`functions/api/extract.js`（IP取得）、`rateLimiter.test.js`。
- **Acceptance criteria:** 期限切れIPカウンタが除去される（or 上限）。XFF使用時は先頭IPのみ採用。既存429テスト不変。
- **Recommended triage:** **Defer**（実害限定。Cloudflare isolate前提では優先度低）。

## 6. Positive confirmations

- **No SSRF / no arbitrary fetch (fact).** Input URL is parsed but never fetched. Providers hit only fixed hosts: `publish.x.com/oembed` (with `url=` set to validator-built `canonicalXPostUrl`) and `api.x.com/2/tweets/{validated postId}`. `urlValidator.test.js` explicitly rejects host-confusion (`x.com.evil.example`, `x.com@evil.example`), `t.co`, `file://`, `http://`.
- **Token never leaves the server (fact).** `X_BEARER_TOKEN` read only in `xApiV2Client`/`extractService`; multiple tests assert the serialized response and logs never contain the token or `Authorization`.
- **No unsafe HTML rendering (fact).** UI uses `textContent`, `textarea.value`, and `<a>.href` (always `https://gyo.tc/...`) only — no `innerHTML`. `app.test.js` asserts `<script>` post text is not wrapped in markup; `oEmbedClient` strips `<script>`/`<style>` and decodes entities to plain text.
- **Logging redaction (fact).** `writeSafeLog` is an allowlist (`request_id/method/path/statusCode/durationMs/errorCode`); `extractServer.test.js` and `functions/.../extract.test.js` assert raw URL, username, postId, post body, media URLs, and token never appear in logs.
- **Cache schema versioning works for both caches (fact).** Version is embedded via `buildPostCacheKey`; `extractService.test.js` confirms a legacy unversioned entry is ignored after long-form support.
- **KV failure resilience (fact).** `getCachedPost`/`setCachedPost` swallow errors; Function tests cover KV get-fail, put-fail, malformed payload, and missing-binding → all degrade gracefully with no public warning and origin still works.
- **Provider fallback + safe warnings (fact).** X API 401/402/403/429 failures fall back to oEmbed with machine-safe warnings exposing only the numeric upstream status; tests confirm no token/Authorization leakage.
- **Security headers on every response (fact).** CSP is appropriately strict (`default-src 'self'`, no inline script/style, `frame-ancestors 'none'`), applied in both runtimes and in `_headers`; asserted across many tests.
- **Strong human-gating of risky ops (fact).** Smoke runbook, incident/KV runbook, and human-verification template consistently require explicit approval and forbid recording sensitive values; `verifyPostReleaseDocs.js` enforces required sections + forbidden-term reminders.
- **Local↔Function parity is good (fact).** Same validation, body limits (1024B), 1-key body rule, error mapping, and headers; differences are expected (static/`/healthz` only local; KV/IP-source only Function).
- **Test suite is broad and green (fact).** 123/123 pass offline.

## 7. Questions / unknowns

These need ChatGPT decision or human/production verification (not verifiable read-only here):
1. **Actual production state.** Whether Cloudflare prod is truly at the documented HEAD `2db0a89…`, and whether KV binding/env are live as documented — unverifiable without Cloudflare read access (out of scope). Recent commits look docs/policy-only, so app code is *plausibly* current, but unconfirmed.
2. **Caching-of-degraded-fallback (CL-002) and stale-in-KV (CL-001):** is current behavior intended, or should it change? Requires a product/spec decision.
3. **KV retention vs privacy:** lengthening physical TTL (CAND-C) stores normalized post data longer — needs privacy/legal judgment (currently "法務レビュー済みではない").
4. **External X behavior:** whether `publish.x.com`/`api.x.com` ever legitimately redirect (affects CAND-D). Cannot live-verify under constraints.
5. **Open ops decisions (human):** log retention period, X API credits/billing/usage-cap review cadence, 429 production policy + contact, KV-failure decision owner — all documented as undecided.
6. **lint/typecheck (CL-011):** acceptable to remain absent for MVP, or add a no-dependency `node --check` gate? ChatGPT call.
7. **Coordination docs:** whether the six untracked `docs/*.md` (and CLAUDE.md being global-ignored) should be committed — DECISION_LOG lists this as an open decision.

## 8. Commands run

| Command | Purpose | Result | Notes |
| --- | --- | --- | --- |
| `pwd`, `git branch --show-current`, `git status --short`, `git log --oneline -n 10` | Repo state | branch `master`, HEAD `69224d6`; 6 untracked `docs/*.md` | Read-only |
| `git ls-files` | Inventory tracked files | Full file list | Read-only |
| `git check-ignore -v CLAUDE.md` | Verify CLAUDE.md status | Ignored via `~/.gitignore_global` | Confirms claude-code-usage.md claim |
| `git status --short --ignored` | Find ignored/untracked | `.claude/`, `.codegraph/`, `CLAUDE.md` ignored | No node_modules (no deps) |
| `ls -1 tmp/` ; `ls -1a | grep .env` | Existence-only check of sensitive paths | `tmp/` empty; no bare `.env` | **Did not read contents** |
| `node --version` | Runtime | `v24.15.0` | — |
| `node --test` | Run suite | **123 pass / 0 fail** (~366ms) | Offline; mocks injected |
| ~30× `Read` | Read docs/server/functions/web/scripts/tests | — | No edits |

## 9. Do-not-implement list (at this review point)

- **Anything in §7 Unknowns** until ChatGPT decides (esp. CL-001/CL-002 spec choices, CAND-C retention).
- **KV physical-TTL extension (CAND-C)** until privacy/legal retention is decided by a human.
- **Out-of-MVP scope:** iOS, DB, auth, custom domain, quote/poll.
- **Any work touching external/paid/secret/OAuth/production-write surfaces:** live `/api/extract`, real 429 testing, X API / oEmbed live calls, real X URL submission, Cloudflare write/deploy, reading `.env`/tokens/`tmp/approved-smoke-target.txt`.
- **Human-pending operational items:** legal/privacy/support sign-off, billing/credits checks, log-retention finalization, KV-failure owner, 429 policy, production smoke.
- **CL-004 / CAND-D redirect change:** do not ship without considering that real X redirect behavior is unverified here — treat as conservative hardening, not an urgent fix.

---

**For ChatGPT:** No P0/P1 blockers; the safety-critical posture is implemented and tested. Highest-value, lowest-risk candidates to consider first are **CAND-A** (Japanese error fallback) and **CAND-E** (`@未取得`), both small and safety-neutral. **CAND-B/CAND-C** (cache behavior) are real but need a product/privacy decision before Codex acts. All findings are advisory.

## Findings table

| ID | Severity | Confidence | Area | Finding | Evidence | Risk if ignored | Suggested action | ChatGPT triage status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Raw Claude notes

Paste raw Claude notes here if useful. Do not paste secrets, tokens, OAuth credentials, raw real X post URLs, post text, media URLs, usernames, post IDs, or Cloudflare internal log details.

## Follow-up questions for Claude

Record any questions ChatGPT wants Claude to answer in a later review-only pass.
