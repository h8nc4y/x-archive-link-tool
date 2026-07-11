# ClaudeCode Fable5 handoff - 004_x-archive-link-tool

作成日時: 2026/07/02 08:30:54 JST  
配置: repo-local draft。公開・commit・PR化する前に、private context とローカル絶対パスが残っていないか確認すること。

## 調査範囲と注意

- 根拠は local git 状態、repo 内 README/HANDOFF/TASKS/docs、読み取り専用 subagent 調査。
- 外部API、GitHub live、CI、ブラウザ、テスト、Cloudflare、Chrome Web Store、Discord、Google、Anthropic、YouTube、X API は今回未確認。
- `*.p12`、`*.pem`、`*.pfx`、`.env*`、`auth.json` は読んでいない。
- raw log、cache、DB、state、queue、drafts、実データの中身は読んでいない。
- 既存のWeb調査/判断資材は repo 内資料の path map であり、Fable5 側で最新市場調査・最新仕様確認をやり直すこと。

## Repo handoff

## 004_x-archive-link-tool

- 状態: `<repo-root>`; branch `master`; `origin/master` behind 18; dirty `docs/CHATGPT_HANDOFF.md`, `docs/CODEX_TASKS.md`, `docs/codex-config-audit.md`, untracked `docs/CLAUDE_CODE_REVIEW_2026-06-21.md`; latest `6f6fa27 Merge pull request #57`
- 目的: X投稿URLから貼り付け用テキストを生成するWeb MVP。現行は Issue #42 post-release operations 判断待ち。
- 要件定義/要件相当: `docs/requirements.md`, `TASKS_BACKLOG.md`, `docs/CODEX_TASKS.md`
- Web調査/判断資材: `docs/post-release-operations-decision-packet.md`, `docs/production-smoke-runbook.md`, `docs/api.md`
- 設計書/UI: `docs/api.md`, `docs/requirements.md`, `docs/ux-improvement-candidates.md`, `docs/test-cases.md`
- 完成までのタスク一覧: `TASKS_BACKLOG.md`, `docs/CODEX_TASKS.md`, `docs/ux-improvement-candidates.md`
- 進捗: CC-001 doing、CC-002-CC-006 UI改善 todo、CC-007 Issue #42 判断材料 docs、HUM-001 は人間/ChatGPT decision。
- 残タスク/gate: 本番 `/api/extract`、live X API/oEmbed、実X投稿URL、X Developer Portal、billing/credits、Cloudflare write/deploy/rollback/config、secret/OAuth。
- Fable5 reading order: `AGENTS.md` → `HANDOFF.md` → `TASKS_BACKLOG.md` → `docs/post-release-operations-decision-packet.md` → `docs/requirements.md` → `docs/api.md` → `docs/ux-improvement-candidates.md`
- Prompt addendum: UIあり。まず dirty WIP と behind 18 の扱いを確認する。ClaudeDesign ではURL入力、抽出結果、失敗時、コピー操作、運用者向け判断画面を再設計する。実URL/postId/本文/media URL は記録しない。

## Fable5 next action

1. `docs/CLAUDECODE_FABLE5_PROMPT.md` を読み、Fable5 の作業方針を確認する。
2. 上記の reading order に従って repo の正本資料を読む。
3. 既存要件をそのまま前提にせず、ユーザーへの質問から目的・市場・成功指標・非目標を再定義する。
4. UI が存在する repo では ClaudeDesign で wireframe または UI spec を作ってから実装へ進む。
5. 実装は Codex GPT5.5 XHIGH skill に依頼してよいが、Fable5 が受け入れ条件・対象ファイル・検証コマンド・gate を具体化してから渡す。