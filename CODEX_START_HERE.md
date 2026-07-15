# CODEX_START_HERE — 004_x-archive-link-tool

> 全リポジトリ共通の「Codex 引き継ぎの入口」ファイル(2026-07-15 標準化)。
> どのリポジトリでも本ファイルを読めば、正本の所在と着手手順が分かる。

## このリポジトリは何か

Xポスト共有URLから貼り付け用テキストを生成するWeb MVP(記録補助、Cloudflare Pages公開済み)。

## 読み順(正本)

1. `README.md` — 概要とドキュメント一覧
2. `docs/requirements.md` — 要件定義
3. `docs/CODEX_HANDOFF.md` — 運用契約
4. `HANDOFF.md` — 現況・次の一手
5. `TASKS_BACKLOG.md` — タスク台帳

## 検証コマンド

`node --test / npm run check:post-release-docs (PR #86 merge後は check:all)`

## 主要 gate(承認なしに越えない境界)

- master merge=本番反映(公開済み)
- R2/API keyまわりは既定設計を維持

## 次の一手

上記読み順の「現況」資料(HANDOFF 等)の「次の一手」節が正本。本ファイルには時点情報を書かない。

---
運用注記: 開発領域の固定分掌は 2026-07-11 に廃止済み(開発の主軸は Codex、要件・設計・実装・検証・docs を end-to-end で担当)。本ファイルは薄い入口に保ち、現在地・タスクは正本側を更新する。
