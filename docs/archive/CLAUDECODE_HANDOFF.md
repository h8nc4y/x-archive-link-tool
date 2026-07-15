# 開発引き継ぎ — 004_x-archive-link-tool

> **2026-07-11 方針更新**: 開発領域の固定分掌は廃止済み。このファイル名は既存リンクとの
> 互換性のため残す。開発の主軸は Codex で、依頼範囲を end-to-end で担当する。
> 廃止済みの `codex` / `codex-deep` MCP bridge と `agmsg` は復活させない。

作成日時: 2026/07/06 JST

## 開発体制

- Codex が要件整理、Web UI、実装、検証、文書化までを一貫して進める。
- Claude Code、subagent、外部レビューは必要時の実行手段であり、固定担当ではない。
- UI 変更も特定のモデルや skill を必須経路にせず、既存仕様と実レンダー検証に基づいて主担当が完遂する。

## 調査範囲と注意（引き継ぎ時点の限界）

- 根拠は local git 状態、repo 内 README/HANDOFF/TASKS_BACKLOG/docs、読み取り専用調査のみ。
- 本番 `/api/extract`、live X API/oEmbed、実X投稿URL送信、Cloudflare write/deploy/rollback/config、
  X Developer Portal、billing/credits の実挙動は未確認。
- `.env*`、`auth.json`、secret、実X投稿本文/メディアURL/ユーザー情報は読んでいない。
- 既存資料は現状把握の材料であり、要件定義の最終正本ではない。市場・仕様調査は陳腐化を疑って
  再確認すること。

## リポジトリの目的

X ポスト共有URLから貼り付け用テキストを生成するWeb MVP。Web UI (`apps/web`)、ローカル
Node サーバー (`server/`)、Cloudflare Pages Functions (`functions/`)、任意の BYOT X API v2
連携、公式 oEmbed fallback を含む。iOS アプリ、DB、独自ドメイン、X HTML スクレイピング、
魚拓のサーバー取得は対象外。位置づけは「記録補助ツール」（法的証拠保全はスクショ/PDF併用を
推奨）。2026-07-04 オーナー決定で公開範囲は **M3一般公開**。

## 現在地

- 基準は `origin/master`。CC-001〜CC-014 は完了・master へ統合済み（PR #51〜#69）。
- CC-014（M3向けUI視覚再設計、PR #69）で「落ち着いた記録の道具」方針・keyline/影/サブカード/
  ブランドマークを適用済み。171 tests 緑、a11y 維持を確認済み（当時）。
- 魚拓導線は複数サービス併記化済み（gyo.tc / Wayback / archive.today / twtr.satoru、PR #67）。
- 無料メディアURL取得手段（syndication/fxtwitter等）は調査済みで、規約適合の無料手段なしと
  判断し oEmbed-first を維持（`docs/media-url-and-archive-research-2026-07-04.md`）。
- 残る公開ブロッカーは **HUM-001（Issue #42 post-release operations decisions）**。
  privacy法務レビュー、公開窓口選択、logs保持数値、production smoke要否は人間/ChatGPT判断待ち。

## 主要ファイル（reading order）

1. `AGENTS.md` — Codex 側運用ポリシー（Claude Code とルール共有元）
2. `HANDOFF.md` — 現況サマリ、完了タスク、既知の問題、次アクション候補
3. `TASKS_BACKLOG.md` — タスク一覧（CC-001〜CC-014、HUM-001 他）、状態サマリ
4. `docs/CODEX_HANDOFF.md` — Codex 自律開発の運用契約（viewport/UI検証条件を含む）
5. `docs/issue-42-mode-decision-packet.md` — Issue #42 決定記録・公開範囲別モード案
6. `docs/requirements.md` / `docs/api.md` — 要件・API仕様
7. `docs/fable5-requirements-review-2026-07-03.md` — 2026-07-03 要件再検討（記録補助ツール
   への位置づけ確定の根拠）
8. `docs/production-smoke-runbook.md` / `docs/post-release-human-verification-template.md` —
   本番 smoke・人間確認結果の受け渡し形式
9. `README.md` — repo 概要、起動/テスト手順

## 次アクション候補

1. **クリティカルパス**: HUM-001（Issue #42）は人間/ChatGPT からの判断結果受領が前提。
   主担当は判断材料の追加整理・ドラフト作成のみ先回りできる（privacy/legal、logs保持数値、
   smoke要否の決定そのものは行わない）。
2. 判断結果を受領した場合、`docs/post-release-human-verification-template.md` 形式で記録を
   更新し、必要なら `docs/production-smoke-runbook.md` の承認条件下で最大1回の smoke を検討する。
3. CC-008（軽量lint/typecheck導入）は todo のまま。導入する場合は保守コストと CI 条件を
   明記した別タスクとして扱う。
4. UI を再度変更する場合は、主担当が方針から実装まで進め、`docs/CODEX_HANDOFF.md` の
   viewport/UI 検証条件に従う。本番 API や live provider は呼ばない。

## Stop only when（費用・外部リスクの境界）

有料API/有料クラウド/課金、OAuth/secret/token 入力、実ユーザー/実データ（実X投稿URL・本文・
メディアURL・ユーザー情報）の外部送信、X Developer Portal 操作、billing/credits 確認、
Cloudflare write/deploy/rollback/config 変更、または人間の意思決定なしには進めない product
判断（privacy/legal レビュー、公開窓口、logs 保持数値、smoke 要否など HUM-001 該当項目）が
必要なときだけ止まる。本番 `/api/extract` の実行は、承認・secret 設定確認・
`docs/production-smoke-runbook.md` の条件（`tmp/approved-smoke-target.txt` への人間指定URL、
最大1回）がそろうまで実行しない。

## 委譲時の注意

委譲する場合は self-contained spec（対象ファイル・受け入れ条件・検証コマンド・書き込み許可範囲）
を渡し、成果物の実在と検証結果を主担当が確認する。フロント/UIも固定の委譲先を設けない。
実データ・実API 呼び出しを含む作業は上記ゲートを再確認する。
