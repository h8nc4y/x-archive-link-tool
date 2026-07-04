# TASKS_BACKLOG

最終更新: 2026/07/04 JST

このファイルは現在タスク一覧です。詳細な過去のCodex承認タスク履歴は `docs/CODEX_TASKS.md`、自律開発の現在ルールは `docs/CODEX_HANDOFF.md` を正として参照してください。

## 状態サマリ

- Codex が最新グローバル方針に従い主実装者として自走します。
- CC-001〜CC-006 は完了済みです。UX改善PR群は `origin/master` に統合済みです。
- Issue #42 の post-release operations は人間/ChatGPT判断待ちです。Codex は判断材料整理とrepo内docs整備まで支援します。
- 本番 `/api/extract`、live X API/oEmbed、実X投稿URL送信、secret/OAuth読み取り、Cloudflare write操作は引き続き停止条件です。

## Backlog

| ID | タスク名 | 出典 | 優先度 | 規模 | 状態 |
| --- | --- | --- | --- | --- | --- |
| CC-001 | backlog/UX候補docs/CLAUDE.md役割定義の更新 | 2026-06-13引き継ぎ計画 | 高 | S | done: PR #54 |
| CC-002 | PR1 入力・エラー改善（C-01, C-02, C-03, C-05） | `docs/ux-improvement-candidates.md` | 高 | M | done: PR #51 |
| CC-003 | PR2 魚拓導線改善（C-04, C-13） | `docs/ux-improvement-candidates.md` | 高 | M | done: PR #52 |
| CC-004 | PR3 コピー体験改善（C-10, C-11） | `docs/ux-improvement-candidates.md` | 中 | M | done: PR #53 |
| CC-005 | PR4 出力形式拡張（C-07, C-12） | `docs/ux-improvement-candidates.md` | 高 | M | done: PR #55 |
| CC-006 | PR5 入力寛容化・高コントラスト（C-09, C-08） | `docs/ux-improvement-candidates.md` | 中 | M | done: PR #57 / #58 |
| CC-007 | Issue #42判断材料の整理docs作成（外部通信なし） | GitHub issue #42 | 中 | M | done: `docs/issue-42-mode-decision-packet.md`（公開範囲別3モード縮退案）を2026-07-03起草。決定はHUM-001 |
| CC-008 | 軽量lint導入の検討 | 旧 `HANDOFF.md` 既知の問題 | 低 | S | todo: 必要なら別タスクで検討 |
| CC-009 | privacy.html degraded fallback短TTL注記（旧レビューL-01） | `docs/CLAUDE_CODE_REVIEW_2026-06-21.md` | 低 | S | done: PR #63（merge待ち） |
| CC-010 | 要件再検討（価値仮説・質問リスト・市場調査） | `docs/CLAUDECODE_FABLE5_PROMPT.md` | 高 | M | done: `docs/fable5-requirements-review-2026-07-03.md`。オーナー回答待ち（特にQ1公開範囲） |
| CC-011 | 「記録補助ツール」への文言整合＋スクショ/PDF併用案内のUI明記 | 2026-07-04 オーナー決定（Q2） | 高 | M | todo: 実装委譲予定 |
| CC-012 | 魚拓導線の複数サービス併記化（gyo.tc/megalodon/twtr.satoru/Wayback等） | 2026-07-04 オーナー決定（Q6） | 高 | M | todo: URL形式調査中→実装委譲予定 |
| CC-013 | 無料メディアURL取得手段の調査（syndication/fxtwitter等、禁止事項との整合評価） | 2026-07-04 オーナー指示（Q4） | 高 | M | doing: 調査中。採用はゲート④で別途承認 |
| CC-014 | 一般公開(M3)向けUI視覚再設計（frontend-design→wireframe→実装） | 2026-07-04 オーナー決定（Q1=M3） | 中 | L | todo: CC-011/012の後 |
| HUM-001 | Issue #42 post-release operations decisions | GitHub issue #42 | 高 | L | 一部決着: 2026-07-04 M3一般公開を決定（`docs/issue-42-mode-decision-packet.md` 決定記録）。残: privacy法務レビュー、公開窓口選択、logs数値、smoke要否 |

## 完了・skip済み（履歴）

| ID | タスク名 | 状態 |
| --- | --- | --- |
| BT-001 | Markdown link verifier tests use repo-local fixture temp directory fallback | done (`37f75bf`) |
| BT-002 | Post-release operations owner and production policy decisions | skip: human/ChatGPT decision, billing/legal/live-production boundary |
| BT-003 | Open GitHub issue inventory | done (`f0db0fc`) |

## Notes

- `docs/CODEX_TASKS.md` の `Current backlog inventory` はBT-001からBT-003のCodex作業記録です。
- `HUM-001` はCodexが自走決定するタスクではありません。人間確認結果は `docs/post-release-human-verification-template.md` の形式で受け取ってから扱ってください。
- 実装PRは小さく保ち、Web UI変更時はlocal/previewのレンダリング検証を行います。本番 `/api/extract` は呼びません。
