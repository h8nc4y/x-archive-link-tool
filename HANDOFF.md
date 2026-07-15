# HANDOFF

最終更新: 2026/07/15 JST（docs整理のmaster反映と現状同期）

## リポジトリの目的

Xポスト共有URLから貼り付け用テキストを生成するWeb MVP（記録補助ツール）。Web UI、ローカルNodeサーバー、Cloudflare Pages Functions、BYOT X API v2連携（任意）、公式oEmbed fallback、記録画像の生成・R2アップロード（約7日保持）を含む。iOSアプリ、DB、独自ドメイン、Xスクレイピング、魚拓のサーバー取得は対象外。

## 現状サマリ（2026-07-15）

- バックログ CC-001〜CC-019 / HUM-001 はすべて完了・masterへ統合・本番反映済み。Issue #42 もクローズ済み。open issue はなし。
- open PR は1件:
  - **PR #86**（`chore/cc008-eslint`）: CC-008 軽量lint導入。ESLint flat config（eslint:recommended のみ）、`lint` / `check:all` scripts、未使用import 1件の実修正、README追記。CIワークフローは未変更（ゲート①のため）。レビューと merge が次の担当の最初の作業。
- docs全体整理（旧 PR #87、2026-07-12 作成）は 2026-07-15 に master へ merge 済み: 役目を終えた21文書を `docs/archive/` へ移動（索引 `docs/archive/README.md`）、READMEドキュメント節の再編、`docs/requirements.md` への製品位置づけ明記、`docs/DECISION_LOG.md` へ Decision 023〜026 追記、Issue #42 クローズの decision packet / guard 反映。
- 検証基準は今後 `npm.cmd run check:all`（lint + test + post-release docs guard、PR #86 merge後に有効）を基本とする。
- 一般公開(M3)済み。公開URL https://x-archive-link-tool.pages.dev、Production branch は `master`（merge = 本番反映）。
- 記録画像アップロードはR2方式で本番E2E確認済み（CC-018/019、2026-07-11）。R2 lifecycle 7日削除はオーナー設定済み。

## docs の構成（2026-07-12 整理後）

- 現行の正: ルート `README.md`「ドキュメント」節に列挙（CODEX_HANDOFF / requirements / api / test-cases / DECISION_LOG ほか）。
- 役目を終えた文書: `docs/archive/`（旧体制ハンドオフ・公開前チェックリスト・置き換え済みドラフト等21件。現行判断に使わない）。
- プライバシーポリシーの正本は `apps/web/privacy.html`（本番ページ）。

## 引き継ぎタスク（Codex向け、優先順）

1. **CC-020**: PR #86（lint）と PR #87（docs整備）の独立レビューと merge。CI緑・レビュー観点（CODEX_HANDOFF §9）確認のうえ merge し、`TASKS_BACKLOG.md` の CC-008 / CC-020 を done に更新する。
2. **CC-021**: merge済みremote branchの整理。GitHub上のmerged branchを実測確認して削除（`master` と open PR の head は除く）。
3. **CC-022**: UI/UXの再レビュー。2026-06-13版 `docs/ux-improvement-candidates.md` は12件全消化済みのため、現行UI（記録画像・魚拓折りたたみ・自動アップロード導入後）を4視点で再レビューし、候補リスト v2 を起草する。実装着手はオーナーの優先度判断後。
4. **CC-023**（任意）: lintのCI組み込み提案書の起草。`.github/workflows/` 変更はゲート①のため、提案docsまでを自走範囲とし、実施はオーナー承認後。

## 停止境界（変更なし）

- 本番 `/api/extract`、live X API/oEmbed、実X投稿URL送信、secret/OAuth/実データ、課金、X Developer Portal、Cloudflare write/config は停止条件。
- ゲート①〜④（デプロイ/Actions/release・課金・secret外部送信・製品要件変更）は人間承認。
- 詳細は `docs/CODEX_HANDOFF.md`（運用契約の正）と `AGENTS.md` を参照。

## 最新検証（2026-07-12、docs/handoff-to-codex-2026-07-11 上で実測）

- `npm.cmd test`: 225 tests pass / 0 fail。
- `npm.cmd run check:post-release-docs`: 緑（markdown local links 46 checked / 4 skipped / 41 files）。
- `git diff --check`: クリーン。
- lint は PR #86 側で導入（同ブランチでの実測は lint 0件）。

## Do not re-read

- `docs/ux-improvement-candidates.md` の12候補は全実装済み。再実装候補を探す目的では読み直さない（CC-022で新版を作る）。
- `docs/issue-42-mode-decision-packet.md` は決着済み（M3決定・Issue #42クローズ）。
- `docs/archive/` 配下は歴史的記録。現行の開発・運用判断には使わない。
