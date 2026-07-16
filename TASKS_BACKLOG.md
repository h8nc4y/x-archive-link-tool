# TASKS_BACKLOG

最終更新: 2026/07/16 JST

このファイルは現在タスク一覧です。詳細な過去のCodex承認タスク履歴は `docs/CODEX_TASKS.md`、自律開発の現在ルールは `docs/CODEX_HANDOFF.md` を正として参照してください。

## 状態サマリ

- CC-001〜CC-020 / HUM-001 はすべて完了・masterへ統合済み。Issue #42 もクローズ済み。
- CC-008（軽量lint）はPR #86でmerge済み。Codexの独立レビューで実行環境別globalsを修正し、merge後masterの`npm.cmd run check:all`（lint + 227 tests + docs guard）まで成功を実測した。
- 未完了タスクは CC-021〜CC-023（下表）。検証基準は `npm.cmd run check:all`（lint + test + docs guard）を基本とする。
- 一般公開(M3)済み。位置づけ=記録補助ツール、魚拓導線=複数併記、API=oEmbed-first維持。
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
| CC-008 | 軽量lint導入の検討 | 旧 `HANDOFF.md` 既知の問題 | 低 | S | done: PR #86（ESLint flat config + `lint`/`check:all` scripts、実行環境別globals、未使用import修正。CIワークフローは変更なし） |
| CC-009 | privacy.html degraded fallback短TTL注記（旧レビューL-01） | `docs/archive/CLAUDE_CODE_REVIEW_2026-06-21.md` | 低 | S | done: PR #63（merged） |
| CC-010 | 要件再検討（価値仮説・質問リスト・市場調査） | `docs/archive/CLAUDECODE_FABLE5_PROMPT.md` | 高 | M | done: PR #64（merged）`docs/fable5-requirements-review-2026-07-03.md`。2026-07-04 オーナー回答受領（Q1=M3ほか） |
| CC-011 | 「記録補助ツール」への文言整合＋スクショ/PDF併用案内のUI明記 | 2026-07-04 オーナー決定（Q2） | 高 | M | done: PR #66（merged） |
| CC-012 | 魚拓導線の複数サービス併記化（gyo.tc/Wayback/archive.today/twtr.satoru） | 2026-07-04 オーナー決定（Q6） | 高 | M | done: PR #67（merged）。敵対的レビュー（Ultracode）済み |
| CC-013 | 無料メディアURL取得手段の調査（syndication/fxtwitter等、禁止事項との整合評価） | 2026-07-04 オーナー指示（Q4） | 高 | M | done: PR #67（merged）`docs/media-url-and-archive-research-2026-07-04.md`。規約適合の無料手段なし→oEmbed-first維持。採用はゲート④ |
| CC-014 | 一般公開(M3)向けUI視覚再設計 | 2026-07-04 オーナー決定（Q1=M3） | 中 | L | done: PR #69（merged・本番反映）。「落ち着いた記録の道具」方針。keyline/影/サブカード/ブランドマーク。171 tests緑・a11y維持 |
| CC-015 | M3運用決定の反映（窓口=public化+Issues／logs確定文言／smoke方針記録） | 2026-07-06 オーナー決定 | 高 | S | done: PR #72（merged）。repo public化済み |
| CC-016 | provider fetch例外の型付け（本番smoke 500の再発防止） | 2026-07-06 本番smoke結果 | 高 | S | done: PR #73（merged）。oembed/x_api の unreachable/invalid_response コード追加 |
| CC-017 | oEmbedブラウザ直接フォールバック（Workers IP遮断対策） | 2026-07-07 オーナー承認（設計A） | 高 | M | done: PR #75（merged・本番反映）。本番E2Eで成功パス実証済み |
| HUM-001 | Issue #42 post-release operations decisions | GitHub issue #42 | 高 | L | done: 全項目決着＋本番検証完了（2026-07-07）。Issue #42 クローズ |
| CC-018 | 記録画像の作成・保存・アップロード | 2026-07-07 オーナー承認 | 高 | M | done: PR #78/#80/#81/#82（merged・本番反映）。R2方式・約7日自動削除。2026-07-11 オーナーのR2設定完了後、本番E2Eでアップロード→共有URL発行→配信（バイト一致）を確認 |
| CC-019 | UX改善（自動アップロード/並べ替え/魚拓折りたたみ） | 2026-07-11 オーナーFB | 高 | M | done: PR #84（merged・本番反映）。本番E2Eで作成→自動アップロード→共有URL発行を確認（2026-07-11） |
| CC-020 | PR #86（CC-008 lint）/ PR #87（docs整備）の独立レビューとmerge・backlog更新 | 2026-07-11 Claude→Codex引き継ぎ | 高 | S | done: PR #87は2026-07-15、PR #86は2026-07-16にmerge。PR #86はCodex敵対的レビューでglobals境界を修正（`cbb404b`）、CI / Pages / merge後`check:all`成功 |
| CC-021 | merge済みremote branchの整理 | 2026-07-11 Claude→Codex引き継ぎ | 低 | S | todo: GitHubのmerged状態を実測確認して削除（master と open PR head は除く） |
| CC-022 | 現行UIのUX再レビュー（改善候補リスト v2 起草） | 2026-07-11 Claude→Codex引き継ぎ | 中 | M | todo: 4視点（操作性・文言・a11y/レスポンシブ・出力形式）で外部通信なしに再レビュー。実装着手はオーナーの優先度判断後 |
| CC-023 | lintのCI組み込み提案書の起草 | 2026-07-11 Claude→Codex引き継ぎ | 低 | S | todo: lintをCIへ組み込む変更範囲・install step・cache・検証方法の提案docsを起草。実装は別タスクで扱う |

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

## 外部レビュー指摘の台帳（2026-07-15 maxエフォート横断レビュー）

読取専用レビュー（実行検証なし）の指摘。採否と実装は次担当が判断する。完了時は行頭を [x] にし、対応PRを追記する。

- [ ] rateLimiter(isolate内メモリ)のためグローバル20/分が実質POP毎 — R2無料枠へのコスト露出。推奨: Cloudflare WAF rate rule / Turnstileの追加(オーナー判断・ダッシュボード作業)。confidence機構高
- [ ] getClientIpのx-forwarded-forフォールバックはローカルextractServer実行時のみ偽装可(CF上はcf-connecting-ip優先で問題なし)。confidence高/影響低
