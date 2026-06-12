# TASKS_BACKLOG

最終更新: 2026-06-12 JST

このファイルはClaude Code引き継ぎ用の現在タスク一覧です。詳細な過去のCodex承認タスク履歴は `docs/CODEX_TASKS.md` を正として参照してください。

## 状態サマリ

- doing: 0
- Codexで実装可能だった直近タスクは完了済み。
- post-release operationsはIssue #42に集約済みで、人間/ChatGPT判断待ち。
- 本番 `/api/extract`、live X API/oEmbed、実X投稿URL送信、secret/OAuth/Cloudflare writeは未実施。

## Backlog

| ID | タスク名 | 出典 | 優先度 | 規模 | 状態 |
| --- | --- | --- | --- | --- | --- |
| BT-001 | Markdown link verifier tests use repo-local fixture temp directory fallback | `node --test` failure in `scripts/verifyMarkdownLinks.test.js`; OS temp `mkdtemp` returned `EPERM` in Codex managed sandbox | 高 | S | done (`37f75bf`) |
| BT-002 | Post-release operations owner and production policy decisions remain human-confirmation items | `README.md`, `docs/current-status.md`, `docs/pre-release-checklist.md`, `docs/deployment-plan.md`, open issue #42 | 低 | L | skip: human/ChatGPT decision, billing/legal/live-production boundary |
| BT-003 | Open GitHub issue inventory | `gh issue list --limit 30 --state open --json number,title,state,labels` returned open issue #42 | 低 | S | done (`f0db0fc`) |
| HUM-001 | Issue #42 post-release operations decisions | GitHub issue #42: privacy, support, billing, log retention, 429 policy | 高 | L | todo: human/ChatGPT decision required |

## Notes

- `docs/CODEX_TASKS.md` の `Current backlog inventory` はBT-001からBT-003のCodex作業記録です。
- `HUM-001` はCodexが自走実装するタスクではありません。人間確認結果は `docs/post-release-human-verification-template.md` の形式で受け取ってから扱ってください。
- `npm.cmd run lint` と `npm.cmd run typecheck` は2026-06-12時点でpackage scriptが存在しないため失敗します。
