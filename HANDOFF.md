# HANDOFF

最終更新: 2026-06-12 JST

## リポジトリの目的

このリポジトリは、Xポスト共有URLから貼り付け用テキストを生成するWeb MVPです。Web UI、ローカルNodeサーバー、Cloudflare Pages Functions、任意のBYOT X API v2連携、公式oEmbed fallbackを含みます。iOSアプリ、DB、独自ドメイン、X HTMLスクレイピング、魚拓のサーバー取得は対象外です。

## 現状サマリ

- 現在の引き継ぎ対象ブランチは `chore/backlog-maintenance`。
- `docs/CODEX_TASKS.md` にCodexの履歴タスク、`TASKS_BACKLOG.md` に現在の引き継ぎ用backlogを記録済み。
- doingタスクは0件。
- 直近のCodex実装タスクBT-001は完了し、Markdown link verifierのfixture temp fallbackを追加済み。
- open issueは #42 のpost-release operations判断のみ確認済み。
- Issue #42はprivacy/legal、support、billing/credits、log retention、429 policy、Cloudflare logs、production smoke、KV/incident ownerの人間/ChatGPT判断待ち。
- 本番 `/api/extract`、live X API/oEmbed、実X投稿URL送信、secret/OAuth読み取り、Cloudflare write/deploy/rollback/config変更はこの締め作業では未実施。
- Cloudflare Productionの現在HEAD確認はIssue #41記録を参照する。今回再確認はしていない。

## 完了タスクとcommit

- `0d51ebd` `docs: inventory task backlog`: `docs/CODEX_TASKS.md` にcurrent backlog inventoryを追加。
- `37f75bf` `test: stabilize markdown link fixtures`: `scripts/verifyMarkdownLinks.test.js` のfixture作成をOS temp失敗時にrepo-local `tmp` fallbackするよう変更。
- `f0db0fc` `docs: record github issue inventory`: `gh issue list` でopen issue #42を確認し、backlogに反映。
- `b92ad75` `docs: add handoff backlog`: `HANDOFF.md` と `TASKS_BACKLOG.md` を追加。

## 未完了/skipタスク

- BT-002: post-release operations owner and production policy decisions remain human-confirmation items。
  - 状態: skip。
  - 理由: human/ChatGPT decision、billing/legal/live-production boundary。
- HUM-001: Issue #42 post-release operations decisions。
  - 状態: todo。
  - 理由: privacy/support/billing/log retention/429 policyなどの人間判断が必要。

## 既知の問題・残懸念

- `npm.cmd run lint` は `Missing script: "lint"` で失敗する。lint scriptは未定義。
- `npm.cmd run typecheck` は `Missing script: "typecheck"` で失敗する。typecheck scriptは未定義。
- sandbox内の通常 `npm.cmd test` はNode test runnerのchild process spawnが `EPERM` で失敗する。権限昇格経路ではpass。
- local `master` は `origin/master` よりBT-001/BT-003関連の3commit分進んでいるが、引き継ぎ対象は `chore/backlog-maintenance`。
- `claude/serene-wilson-1d0197` は別worktreeでcheckout中の古いブランチ。今回の引き継ぎ対象ではない。

## 最終検証結果

- `npm.cmd test`
  - sandbox通常実行: fail。15 test-file wrapper failures、主要原因 `Error: spawn EPERM`。
  - 権限昇格実行: pass。142 tests / 142 pass / 0 fail。
- `npm.cmd run check:post-release-docs`: pass。
  - 対象docsはOK。
  - Markdown local links: 22 checked / 4 skipped / 31 files。
- `npm.cmd run lint`: fail。`Missing script: "lint"`。
- `npm.cmd run typecheck`: fail。`Missing script: "typecheck"`。
- `gh issue list --limit 30 --state open --json number,title,state,labels`: open issue #42のみ確認。

## セットアップ・テスト・ビルド系コマンド

- ローカル起動:
  - PowerShell: `$env:PORT="3000"`
  - `npm.cmd start`
  - 代替: `node server/extractServer.js`
- テスト:
  - `npm.cmd test`
  - 代替: `node --test`
- post-release docs guard:
  - `npm.cmd run check:post-release-docs`
- manual oEmbed check:
  - `npm.cmd run manual:oembed-check`
  - live oEmbed通信になるため、実行前に対象と外部送信リスクを確認する。
- production smoke:
  - `npm.cmd run smoke:production-once`
  - 実X投稿URLと本番 `/api/extract` を使うため、`docs/production-smoke-runbook.md` の承認条件が必要。

## ブランチ状況

- `chore/backlog-maintenance`: 現在ブランチ。直近Codex作業とこの引き継ぎ文書を含む。
- `master`: localは `origin/master` より3commit進んでいる。Cloudflare Production branchが `master` のため、直接pushはproduction deployに波及し得る。
- `claude/serene-wilson-1d0197`: 別worktreeでcheckout中。`origin/master` から大きくbehindしており、今回の作業対象外。

## 次にやるべき候補

1. Claude Codeで `TASKS_BACKLOG.md` と `HANDOFF.md` を読み、Issue #42の人間判断待ち項目を確認する。
2. 人間確認結果がある場合だけ、`docs/post-release-human-verification-template.md` の形式で受け取り、Issue #42関連docsを更新する。
3. `lint` / `typecheck` を導入するかどうかを判断する。導入する場合はMVP方針とCI費用・保守コストを先に確認する。
