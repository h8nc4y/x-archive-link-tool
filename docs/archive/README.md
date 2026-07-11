# docs/archive — 役目を終えた文書の保管庫

ここには、過去の一時点で作成され、役目を終えた文書を保管しています。**現行の開発・運用判断には使わないでください。** 現在の正はリポジトリルートの `README.md`「ドキュメント」節に列挙された文書です。

各文書は歴史的記録として原文のまま保管しており、本文中の「現在」「未決」「open」等の記述は作成当時の状態です。文中の相対リンクは移動により切れている場合があります。

## 旧体制のハンドオフ・レビュー文書（体制変遷の記録）

体制変遷: Codex主実装＋ChatGPT司令塔（〜2026-06-12）→ Claude Code主実装（2026-06-13〜）→ Codex自律主実装（2026-06-20 再委譲、Decision 021）→ Fable5司令塔での要件再検討（2026-07-02〜07）。現行の運用契約は `../CODEX_HANDOFF.md`。

- [CHATGPT_HANDOFF.md](CHATGPT_HANDOFF.md) — ChatGPT司令塔体制（2026-05-29）の事前レビューパケット
- [CLAUDE_REVIEW.md](CLAUDE_REVIEW.md) — Claude Codeレビュー結果と旧レビュー運用ルール
- [AI_REVIEW_TRIAGE.md](AI_REVIEW_TRIAGE.md) — CL-001〜013 レビュー指摘のトリアージクローズ記録
- [REVIEW_BRIEF.md](REVIEW_BRIEF.md) — 事前レビュー用コンテキストパケット（2026-05-29）
- [CLAUDE_CODE_REVIEW_2026-06-21.md](CLAUDE_CODE_REVIEW_2026-06-21.md) — 2026-06-21 独立レビュー（指摘は全て解消済み。CC-009=PR #63）
- [CLAUDECODE_FABLE5_HANDOFF.md](CLAUDECODE_FABLE5_HANDOFF.md) / [CLAUDECODE_FABLE5_PROMPT.md](CLAUDECODE_FABLE5_PROMPT.md) — Fable5司令塔体制（2026-07-02）の引き継ぎとプロンプト
- [CLAUDECODE_HANDOFF.md](CLAUDECODE_HANDOFF.md) — post-Fable5構想（2026-07-06）。実際の現行体制はCodex自律主実装
- [claude-code-usage.md](claude-code-usage.md) — 旧体制でのClaude Code利用手順
- [codex-config-audit.md](codex-config-audit.md) — Codex設定の単発監査メモ

## 公開前（v0.1.0）の文書

v0.1.0は2026-05に公開済み。以後の変更はPR単位でmasterへ継続反映されている。

- [pre-release-checklist.md](pre-release-checklist.md) — 公開前チェックリスト
- [pre-release-operations-runbook.md](pre-release-operations-runbook.md) — 公開前運用Runbook（2026-05-18 HEAD確認記録）
- [release-candidate.md](release-candidate.md) — v0.1.0公開判断サマリー
- [release-notes-v0.1.0.md](release-notes-v0.1.0.md) — v0.1.0リリースノート（GitHub Release対応）
- [deployment-plan.md](deployment-plan.md) — 初回デプロイ計画。未決とされた運用項目はIssue #42（2026-07-07クローズ）で決着済み

## 置き換え済み・重複整理された文書

- [current-status.md](current-status.md) — 現状まとめ。ルート `HANDOFF.md` に置き換え
- [privacy-policy-draft.md](privacy-policy-draft.md) — プライバシーポリシードラフト。正本は `apps/web/privacy.html`（本番ページ）
- [support-page-draft.md](support-page-draft.md) — サポートページ草案。本番ページ化されず、窓口はGitHub Issuesに決定（Issue #42 M3決定）
- [manual-check.md](manual-check.md) — 手動確認チェックリスト。内容はルート `README.md` と重複
- [post-claude-review-decision-backlog.md](post-claude-review-decision-backlog.md) — レビュー後決定バックログ。Issue #42決着で役目終了
- [post-review-maintenance-audit.md](post-review-maintenance-audit.md) — 2026-05-31時点のdocsメンテナンス監査
