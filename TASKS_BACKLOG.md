# TASKS_BACKLOG

最終更新: 2026-06-13 JST

このファイルは現在タスク一覧です。詳細な過去のCodex承認タスク履歴は `docs/CODEX_TASKS.md` を正として参照してください。2026-06-13にCodexからClaude Codeへ主実装を引き継ぎました。

## 状態サマリ

- 2026-06-20: 主実装をCodex（自律主開発）へ再委譲。Codexの運用契約は `docs/CODEX_HANDOFF.md`（自走範囲・4ゲート・デザインブリーフ仲介・セルフレビュー既定）。起動時は `docs/CODEX_HANDOFF.md` → `AGENTS.md` → 本ファイルの順で読む。
- 2026-06-13: Claude Codeが主実装を引き継ぎ。次の目標はWeb UIの機能・UX改善（検証済み12候補をテーマ別5PRで段階実装し、PRごとに本番反映）。
- 改善候補の詳細と不採用理由は `docs/ux-improvement-candidates.md` を参照。
- post-release operationsはIssue #42に集約済みで、人間/ChatGPT判断待ち。Claude Codeは判断材料整理（CC-007）のみ支援する。
- 本番 `/api/extract`、live X API/oEmbed、実X投稿URL送信、secret/OAuth読み取り、Cloudflare write操作は引き続き停止条件のまま。

## Backlog

| ID | タスク名 | 出典 | 優先度 | 規模 | 状態 |
| --- | --- | --- | --- | --- | --- |
| CC-001 | backlog/UX候補docs/CLAUDE.md役割定義の更新 | 2026-06-13引き継ぎ計画 | 高 | S | doing |
| CC-002 | PR1 入力・エラー改善（C-01, C-02, C-03, C-05） | `docs/ux-improvement-candidates.md` | 高 | M | todo |
| CC-003 | PR2 魚拓導線改善（C-04, C-13） | `docs/ux-improvement-candidates.md` | 高 | M | todo |
| CC-004 | PR3 コピー体験改善（C-10, C-11） | `docs/ux-improvement-candidates.md` | 中 | M | todo |
| CC-005 | PR4 出力形式拡張（C-07, C-12） | `docs/ux-improvement-candidates.md` | 高 | M | todo |
| CC-006 | PR5 入力寛容化・高コントラスト（C-09, C-08） | `docs/ux-improvement-candidates.md` | 中 | M | todo |
| CC-007 | Issue #42判断材料の整理docs作成（外部通信なし） | GitHub issue #42 | 中 | M | todo |
| CC-008 | 軽量lint導入の検討 | `HANDOFF.md` 既知の問題 | 低 | S | todo（余裕があれば） |
| HUM-001 | Issue #42 post-release operations decisions | GitHub issue #42: privacy, support, billing, log retention, 429 policy | 高 | L | todo: human/ChatGPT decision required |

## 完了・skip済み（履歴）

| ID | タスク名 | 状態 |
| --- | --- | --- |
| BT-001 | Markdown link verifier tests use repo-local fixture temp directory fallback | done (`37f75bf`) |
| BT-002 | Post-release operations owner and production policy decisions | skip: human/ChatGPT decision, billing/legal/live-production boundary |
| BT-003 | Open GitHub issue inventory | done (`f0db0fc`) |

## Notes

- `docs/CODEX_TASKS.md` の `Current backlog inventory` はBT-001からBT-003のCodex作業記録です。
- `HUM-001` はClaude Codeが自走実装するタスクではありません。人間確認結果は `docs/post-release-human-verification-template.md` の形式で受け取ってから扱ってください。
- `npm.cmd run lint` と `npm.cmd run typecheck` は2026-06-13時点でもpackage scriptが存在しないため失敗します（CC-008で導入可否を検討）。
- 実装PRはテーマ単位で小さく保ち、mergeごとに本番静的URLの表示確認を行います（本番 `/api/extract` は呼ばない）。
