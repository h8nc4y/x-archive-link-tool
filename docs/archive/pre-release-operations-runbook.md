# Pre-release Operations Runbook

公開前に人間が判断する運用項目と、Codexが実行してよい確認範囲を分けて管理するRunbookです。

## 2026-05-18時点の本番HEAD確認記録

- HEAD: `2db0a89a39424ebb1d43268e4e4af7a19b01bc39`
- 位置づけ: PR #8 merge後のdocs-only HEADで、2026-05-18 20:50 JST時点のCloudflare Pages Production確認対象。現在の本番稼働HEADはこの文書更新では未確認。
- Cloudflare確認日時: 2026-05-18 20:50 JST
- 確認コマンド: `npx wrangler pages deployment list --project-name x-archive-link-tool --environment production --json`
- Deployment ID: `aaadb2ac-bd83-43f5-a4e2-960f9f7a1e4e`
- Deployment URL: `https://aaadb2ac.x-archive-link-tool.pages.dev`
- Environment: `Production`
- Branch: `master`
- Source: `2db0a89`
- Wrangler Status欄: `4 minutes ago`
- Build URL: `https://dash.cloudflare.com/68b0957405bae91b41430d49645e230f/pages/view/x-archive-link-tool/aaadb2ac-bd83-43f5-a4e2-960f9f7a1e4e`

Wranglerのdeployment listは明示的な `Success` 文字列を返さず、Status欄は相対時刻を返す。GitHub check-run successや公開URL表示だけではProduction正式証跡として扱わず、Cloudflare Pages deployment一覧に対象HEADが出ていることを正式証跡として扱う。

現在の本番稼働HEADを確認する場合は、この過去記録を更新せず、Cloudflare deployment確認または `docs/production-smoke-runbook.md` の承認済み手順に沿って別途記録する。

## 過去の証跡との位置づけ

- `1a8fad5b02f540ec1c60ab5e62ffa0c4597533f7`: PR #7 merge後のレビューhardening反映時点の証跡。deployment IDは `a79ddcf6-83ba-4dd3-929d-1bb6adc4ecf6`。
- `2db0a89a39424ebb1d43268e4e4af7a19b01bc39`: PR #8 merge後のdocs-only HEADで、2026-05-18 20:50 JST時点のCloudflare Pages Production確認対象。

## Codexが実行してよい確認

- `git status`, `git rev-parse HEAD origin/master`, `git log -1 --oneline`
- `npx wrangler whoami`
- `npx wrangler pages deployment list --project-name x-archive-link-tool --environment production --json`
- 公開静的URLのHEAD/GET確認: `/`, `/privacy.html`, `/privacy`
- `git diff --check`
- `npm test`

Wrangler OAuth tokenには広いwrite権限が含まれるため、Wranglerは読み取りコマンドだけに限定する。

## Codexが実行しない操作

- `wrangler pages deploy`, deploy、delete、rollback
- Cloudflare設定変更、環境変数変更、secret操作
- KV/D1/Queues/Workers AI/AI Gatewayなどのwrite操作
- 本番 `/api/extract`
- 本番429確認
- X API/oEmbed live通信
- 実X投稿URL、secret、token、OAuth credential、実ユーザーデータの読み取りや送信

## 公開前運用チェックリスト

| 項目 | 状態 | 推奨案 | 承認が必要な操作 |
| --- | --- | --- | --- |
| X API credits / billing / usage cap確認頻度 | 未確認 / 人間判断待ち | 公開前、公開直後、以後週次。安定後は月次。429や取得失敗の問い合わせがあれば臨時確認する。 | X Developer Portalやbilling画面を人間が確認する。Codexへtoken、secret、実データを共有しない。 |
| ログ保存期間 | 未確認 / 人間判断待ち | 安全ログ項目だけを30日以内、またはCloudflare既定の短い保持期間に合わせる。法務レビュー後にプライバシーポリシーへ反映する。 | 法務/運用責任者の決定。必要ならCloudflare側のログ保持設定確認。 |
| KV障害時の切り戻し判断者 | 未確認 / 人間判断待ち | サービス管理者を1名決め、障害時の実施可否を判断する。 | Cloudflare設定変更やredeployを伴う場合は人間承認が必要。 |
| KV障害時の切り戻し手順 | 候補のみ | `X_POST_CACHE` bindingを外してProduction redeployし、in-memory fallbackで継続する。ただし真のglobal cacheではなくなる。 | binding変更、Production redeploy、rollbackはCloudflare write操作のためCodexは承認なしに実行しない。 |
| KV復旧後手順 | 未確認 / 人間判断待ち | `X_POST_CACHE` bindingを戻してProduction redeployし、静的URL確認後、必要なら承認済み手順で最小の `/api/extract` 確認を行う。 | binding再設定、Production redeploy、本番 `/api/extract` 確認は承認が必要。 |
| 429本番確認 | 未実施 | 原則ローカルテストで担保する。本番確認は実X API/oEmbed通信やcredits影響がない手順を先に決める。 | 本番429確認は人間承認が必要。 |
| Wrangler OAuth token権限 | 確認済み / write権限が広い | Codexでは `whoami` とPages deployment listだけに限定する。 | deploy/delete/rollback/secret/KV/D1/AIなどのwrite操作は承認が必要。 |

## 障害時の記録ルール

記録してよい項目:

- HTTP status
- `Retry-After` の有無
- error code
- source
- cached
- mediaUrls件数
- warnings件数
- deployment ID
- commit hash
- 確認時刻

記録しない項目:

- 実投稿URL
- 投稿本文
- mediaUrls値
- username
- postId
- HTML本文
- JSON values
- token
- Authorization header
- secret値
- Cookie
- Cloudflare内部ログの詳細本文

## 人間承認文言の候補

KV切り戻しを行う場合:

`Cloudflare Pages project x-archive-link-tool のProductionで、X_POST_CACHE bindingを一時的に外してProduction redeployすることを承認します。実施後は静的URLだけを確認し、本番 /api/extract と本番429確認は別途承認があるまで実行しないでください。`

本番 `/api/extract` を確認する場合:

`本番 /api/extract を、指定した手順と記録項目に限定して最大N回だけ実行することを承認します。実投稿URL、投稿本文、mediaUrls値、username、postId、token、Authorization header、secret値は記録しないでください。`
