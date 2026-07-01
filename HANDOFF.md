# HANDOFF

最終更新: 2026/07/01 10:28 JST

## リポジトリの目的

このリポジトリは、Xポスト共有URLから貼り付け用テキストを生成するWeb MVPです。Web UI、ローカルNodeサーバー、Cloudflare Pages Functions、任意のBYOT X API v2連携、公式oEmbed fallbackを含みます。iOSアプリ、DB、独自ドメイン、X HTMLスクレイピング、魚拓のサーバー取得は対象外です。

## 現状サマリ

- 現在の基準は `origin/master` の PR #61 merge commit `9056345`。open PR はありません。
- Codex は `docs/CODEX_HANDOFF.md` と 2026-06-29以降のグローバル自走方針に従う主実装者です。
- CC-001〜CC-006 のUX/backlog系タスクは PR #51、#52、#53、#54、#55、#57、#58 までに完了済みです。
- PR #59〜#61 では Claude review advisory / local path redaction / ChatGPT triage wording をdocs同期済みです。
- Issue #42 の post-release operations decisions は引き続き人間/ChatGPT判断待ちです。Codex が自走してよいのは判断材料整理、repo内docs、外部通信しないdry-run/testの整備までです。
- 本番 `/api/extract`、live X API/oEmbed、実X投稿URL送信、secret/OAuth読み取り、X Developer Portal、billing/credits確認、Cloudflare write/deploy/rollback/config変更は未実施です。

## 完了タスクと根拠

| ID | 状態 | 根拠 |
| --- | --- | --- |
| CC-001 | done | PR #54 `docs/codex-autonomous-handoff` |
| CC-002 | done | PR #51 `feat/ux-input-error-improvements` |
| CC-003 | done | PR #52 `feat/ux-archive-guidance` |
| CC-004 | done | PR #53 `feat/ux-copy-feedback` |
| CC-005 | done | PR #55 `feat/ux-output-format-options` |
| CC-006 | done | PR #57 `feat/ux-high-contrast` / PR #58 `feat/ux-paste-tolerance-refresh` |
| Advisory docs | done | PR #59 `docs/sync-claude-review-advisory`, PR #60 `docs/redact-local-paths`, PR #61 `docs/chatgpt-triage-wording` |

## 未完了 / 停止境界

- CC-007 / HUM-001: Issue #42 post-release operations decisions は人間/ChatGPT判断待ち。privacy/legal、support、billing/credits、log retention、429 policy、Cloudflare logs、production smoke、incident owner は Codex が決定しません。
- CC-008: 軽量lint/typecheck導入は未採用。導入する場合は別タスクとして、保守コストとCI条件を明記して扱います。
- 本番API smoke、live provider、secret/OAuth、実URL/実データ、課金・billing・Cloudflare write は停止条件です。

## 最新検証

2026/07/01 の docs sync 作業前に `origin/master` worktree で確認:

- `npm.cmd run check:post-release-docs`: pass。local markdown links 24 checked / 4 skipped / 34 files。
- `node --test --test-isolation=none`: 169 tests pass / 0 fail。
- `gh pr list --state open`: `[]`。

## 次にやるべき候補

1. Issue #42 について、人間/ChatGPTから判断結果が提供された場合だけ、`docs/post-release-human-verification-template.md` 形式で記録を更新する。
2. local-safeで進める場合は、post-release docs guardやMarkdown link/anchor guardの小さな整備に限定する。
3. UIを再度変更する場合は `docs/CODEX_HANDOFF.md` のviewport/UI検証条件に従い、本番APIやlive providerを呼ばない。
