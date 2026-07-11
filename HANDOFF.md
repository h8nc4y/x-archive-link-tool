# HANDOFF

最終更新: 2026/07/11 JST（Claude Code → Codex 引き継ぎ）

## リポジトリの目的

Xポスト共有URLから貼り付け用テキストを生成するWeb MVP（記録補助ツール）。Web UI、ローカルNodeサーバー、Cloudflare Pages Functions、BYOT X API v2連携（任意）、公式oEmbed fallback、記録画像の生成・R2アップロード（約7日保持）を含む。iOSアプリ、DB、独自ドメイン、Xスクレイピング、魚拓のサーバー取得は対象外。

## 現状サマリ（2026-07-11）

- バックログ CC-001〜CC-019 / HUM-001 はすべて完了・masterへ統合・本番反映済み。Issue #42 もクローズ済みで、open issue / open PR は本引き継ぎ時点で PR #86 のみ。
- 最後の残タスクだった CC-008（軽量lint導入）を Claude Code が実装し、PR #86（`chore/cc008-eslint`）としてレビュー・merge待ち。内容: ESLint flat config（eslint:recommended のみ）、`lint` / `check:all` scripts、未使用import 1件の実修正、README追記。CIワークフローは未変更（ゲート①のため）。
- 検証基準は今後 `npm.cmd run check:all`（lint + test + post-release docs guard）を基本とする。2026-07-11 時点で緑（lint 0件 / 225 tests pass / docs guard OK）。
- 一般公開(M3)済み。公開URL https://x-archive-link-tool.pages.dev、Production branch は `master`（merge = 本番反映）。
- 記録画像アップロードはR2方式で本番E2E確認済み（CC-018/019、2026-07-11）。R2 lifecycle 7日削除はオーナー設定済み。

## 引き継ぎタスク（Codex向け、優先順）

1. **CC-020**: PR #86 の独立レビューと merge。CI緑・レビュー観点（CODEX_HANDOFF §9）確認のうえ merge し、`TASKS_BACKLOG.md` の CC-008 を done に更新する。
2. **CC-021**: merge済みremote branchの整理。GitHub上のmerged branchを実測確認して削除（`master` と open PR の head は除く）。
3. **CC-022**: UI/UXの再レビュー。2026-06-13版 `docs/ux-improvement-candidates.md` は12件全消化済みのため、現行UI（記録画像・魚拓折りたたみ・自動アップロード導入後）を4視点で再レビューし、候補リスト v2 を起草する。実装着手はオーナーの優先度判断後。
4. **CC-023**（任意）: lintのCI組み込み提案書の起草。`.github/workflows/` 変更はゲート①のため、提案docsまでを自走範囲とし、実施はオーナー承認後。

## 停止境界（変更なし）

- 本番 `/api/extract`、live X API/oEmbed、実X投稿URL送信、secret/OAuth/実データ、課金、X Developer Portal、Cloudflare write/config は停止条件。
- ゲート①〜④（デプロイ/Actions/release・課金・secret外部送信・製品要件変更）は人間承認。
- 詳細は `docs/CODEX_HANDOFF.md`（運用契約の正）と `AGENTS.md` を参照。

## 最新検証（2026-07-11、chore/cc008-eslint 上で実測）

- `npm.cmd run check:all`: 緑。lint指摘0件、225 tests pass / 0 fail、post-release docs guard OK（markdown local links 26 checked / 4 skipped / 40 files）。
- `gh pr list --state open`: PR #86 のみ。`gh issue list --state open`: なし。

## Do not re-read

- `docs/ux-improvement-candidates.md` の12候補は全実装済み。再実装候補を探す目的では読み直さない（CC-022で新版を作る）。
- `docs/issue-42-mode-decision-packet.md` は決着済み（M3決定・Issue #42クローズ）。
