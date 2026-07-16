# HANDOFF

最終更新: 2026/07/16 JST（CC-020完了・PR #86/#87のmaster反映）

## リポジトリの目的

Xポスト共有URLから貼り付け用テキストを生成するWeb MVP（記録補助ツール）。Web UI、ローカルNodeサーバー、Cloudflare Pages Functions、BYOT X API v2連携（任意）、公式oEmbed fallback、記録画像の生成・R2アップロード（約7日保持）を含む。iOSアプリ、DB、独自ドメイン、Xスクレイピング、魚拓のサーバー取得は対象外。

## 現状サマリ（2026-07-16）

- バックログ CC-001〜CC-020 / HUM-001 はすべて完了・masterへ統合済み。Issue #42 もクローズ済み。open issue / open PR はなし。
- **CC-020完了**: PR #87（docs整備）は2026-07-15、PR #86（CC-008 lint）は2026-07-16にmerge済み。PR #86の独立レビューではbrowser / Workers本番コードへNode.js globalsが漏れる設定を検出し、`cbb404b`でpath別globalsへ修正した。merge commit `1a2c850` のGitHub `npm test` / Cloudflare Pages checksは成功。
- docs全体整理（旧 PR #87、2026-07-12 作成）は 2026-07-15 に master へ merge 済み: 役目を終えた21文書を `docs/archive/` へ移動（索引 `docs/archive/README.md`）、READMEドキュメント節の再編、`docs/requirements.md` への製品位置づけ明記、`docs/DECISION_LOG.md` へ Decision 023〜026 追記、Issue #42 クローズの decision packet / guard 反映。
- 検証基準は `npm.cmd run check:all`（lint + test + post-release docs guard）を基本とする。
- 一般公開(M3)済み。公開URL https://x-archive-link-tool.pages.dev、Production branch は `master`（merge = 本番反映）。
- 記録画像アップロードはR2方式で本番E2E確認済み（CC-018/019、2026-07-11）。R2 lifecycle 7日削除はオーナー設定済み。

## docs の構成（2026-07-12 整理後）

- 現行の正: ルート `README.md`「ドキュメント」節に列挙（CODEX_HANDOFF / requirements / api / test-cases / DECISION_LOG ほか）。
- 役目を終えた文書: `docs/archive/`（旧体制ハンドオフ・公開前チェックリスト・置き換え済みドラフト等21件。現行判断に使わない）。
- プライバシーポリシーの正本は `apps/web/privacy.html`（本番ページ）。

## 引き継ぎタスク（Codex向け、優先順）

1. **CC-021**: merge済みremote branchの整理。GitHub上のmerged状態を実測確認して削除（`master` と open PR の head は除く）。
2. **CC-022**: UI/UXの再レビュー。2026-06-13版 `docs/ux-improvement-candidates.md` は12件全消化済みのため、現行UI（記録画像・魚拓折りたたみ・自動アップロード導入後）を4視点で再レビューし、候補リスト v2 を起草する。実装着手はオーナーの優先度判断後。
3. **CC-023**（任意）: lintのCI組み込み提案書の起草。実装は別タスクとして扱い、まず提案docsで変更範囲と検証方法を確定する。

## 停止境界

- 本番 `/api/extract`、live X API/oEmbed、実X投稿URL送信、secret/OAuth/実データ、課金、X Developer Portal、Cloudflare write/config は停止条件。
- GitHub PR merge、通常のGitHub Actions、Pages自動デプロイは、それ自体を停止条件にしない。
- 詳細は `docs/CODEX_HANDOFF.md`（運用契約の正）と `AGENTS.md` を参照。

## 最新検証（2026-07-16、PR #86 merge後のmasterで実測）

- `npm.cmd run check:all`: lint成功、227 tests pass / 0 fail、post-release docs guard成功（markdown local links 44 checked / 4 skipped / 41 files）。
- `git diff --check`: クリーン。
- PR #86 review probe: browser内の`process`とWorkers内の`Buffer`を期待どおり`no-undef`で検出。
- merge commit `1a2c850`: GitHub `npm test` / Cloudflare Pages checks成功。

## Do not re-read

- `docs/ux-improvement-candidates.md` の12候補は全実装済み。再実装候補を探す目的では読み直さない（CC-022で新版を作る）。
- `docs/issue-42-mode-decision-packet.md` は決着済み（M3決定・Issue #42クローズ）。
- `docs/archive/` 配下は歴史的記録。現行の開発・運用判断には使わない。
