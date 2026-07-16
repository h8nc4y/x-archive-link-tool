# HANDOFF

最終更新: 2026/07/16 JST（CC-023 merge済み・Codex backlog消化）

## リポジトリの目的

Xポスト共有URLから貼り付け用テキストを生成するWeb MVP（記録補助ツール）。Web UI、ローカルNodeサーバー、Cloudflare Pages Functions、BYOT X API v2連携（任意）、公式oEmbed fallback、記録画像の生成・R2アップロード（約7日保持）を含む。iOSアプリ、DB、独自ドメイン、Xスクレイピング、魚拓のサーバー取得は対象外。

## 現状サマリ（2026-07-16）

- バックログ CC-001〜CC-023 / HUM-001 はすべて完了。Issue #42 もクローズ済み。Codexが承認なしで着手できる登録済みタスクはない。
- **CC-020完了**: PR #87（docs整備）は2026-07-15、PR #86（CC-008 lint）は2026-07-16にmerge済み。PR #86の独立レビューではbrowser / Workers本番コードへNode.js globalsが漏れる設定を検出し、`cbb404b`でpath別globalsへ修正した。merge commit `1a2c850` のGitHub `npm test` / Cloudflare Pages checksは成功。
- **CC-021完了**: PR #50〜#53が`MERGED`、各headが`origin/master`の祖先、open PR headではないことを実測し、対応するmerge済みremote branch 4本を削除した。prune後のremote branchは`master`のみ。
- **CC-022完了**: 現行UIを操作性、文言、アクセシビリティとレスポンシブ、出力形式で再監査し、`docs/ux-improvement-candidates.md`をv2へ更新した。390px、768px、1280pxのローカル画面と合成成功状態を確認し、改善候補9件を記録した。候補の実装はオーナーの優先度判断後に別タスクとして扱う。
- **CC-023完了**: PR #96（merge commit `e09d713`）で`docs/lint-ci-integration-proposal.md`をmergeした。既存Actions/Node.js/trigger/権限を維持し、npm cache、`npm ci`、`npm run check:all`を追加する最小案、検証、受け入れ条件、rollbackを確定した。workflow実装はgate ①の採用判断後に別タスクとして扱う。
- docs全体整理（旧 PR #87、2026-07-12 作成）は 2026-07-15 に master へ merge 済み: 役目を終えた21文書を `docs/archive/` へ移動（索引 `docs/archive/README.md`）、READMEドキュメント節の再編、`docs/requirements.md` への製品位置づけ明記、`docs/DECISION_LOG.md` へ Decision 023〜026 追記、Issue #42 クローズの decision packet / guard 反映。
- 検証基準は `npm.cmd run check:all`（lint + test + post-release docs guard）を基本とする。
- 一般公開(M3)済み。公開URL https://x-archive-link-tool.pages.dev、Production branch は `master`（merge = 本番反映）。
- 記録画像アップロードはR2方式で本番E2E確認済み（CC-018/019、2026-07-11）。R2 lifecycle 7日削除はオーナー設定済み。

## docs の構成（2026-07-12 整理後）

- 現行の正: ルート `README.md`「ドキュメント」節に列挙（CODEX_HANDOFF / requirements / api / test-cases / DECISION_LOG ほか）。
- 役目を終えた文書: `docs/archive/`（旧体制ハンドオフ・公開前チェックリスト・置き換え済みドラフト等21件。現行判断に使わない）。
- プライバシーポリシーの正本は `apps/web/privacy.html`（本番ページ）。

## 引き継ぎタスク（Codex向け、優先順）

1. **オーナー判断待ち（gate ①）**: `docs/lint-ci-integration-proposal.md`を採用するか判断する。採用後に新しいCCタスクを登録し、`.github/workflows/ci.yml`を変更する。
2. **オーナー判断待ち**: `docs/ux-improvement-candidates.md` v2の9候補から実装対象と順序を選ぶ。判断後に新しいCCタスクを台帳へ登録する。

## 停止境界

- 本番 `/api/extract`、live X API/oEmbed、実X投稿URL送信、secret/OAuth/実データ、課金、X Developer Portal、Cloudflare write/config は停止条件。
- GitHub PR merge、通常のGitHub Actions、Pages自動デプロイは、それ自体を停止条件にしない。
- 詳細は `docs/CODEX_HANDOFF.md`（運用契約の正）と `AGENTS.md` を参照。

## 最新検証（2026-07-16、PR #96 merge後のmasterで実測）

- `npm.cmd run check:all`: lint成功、227 tests pass / 0 fail、post-release docs guard成功（markdown local links 46 checked / 7 skipped / 42 files）。
- `git diff --check`: クリーン。
- merge commit `e09d713`: GitHub `npm test` / Cloudflare Pages checks成功。CC-023 remote branch削除済み、open PR 0件。
- GitHub API: `master`のbranch protectionは未設定、repository rulesetは0件。実装時に再確認する。
- CC-022 UI audit: Playwrightで390×844、768×1024、1280×900を確認し、横スクロールなし。空入力エラー、合成取得成功、形式変更とコピー、合成画像アップロード成功、魚拓展開を確認。本番APIと実providerは未実行。

## Do not re-read

- `docs/ux-improvement-candidates.md` のv1候補12件は全実装済み。現行判断には同ファイルのv2だけを使い、v1の詳細を再実装候補として読み直さない。
- `docs/issue-42-mode-decision-packet.md` は決着済み（M3決定・Issue #42クローズ）。
- `docs/archive/` 配下は歴史的記録。現行の開発・運用判断には使わない。
