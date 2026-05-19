# Release Candidate Memo

このメモは、`v0.1.0` 相当の公開判断に使う1枚サマリーです。
新機能の追加や本番API smokeではなく、現時点のGit資材、CI、Cloudflare Production証跡、公開静的ページ、未確認事項、残リスクを棚卸しする目的で管理します。

## 対象HEAD

- リリース候補HEAD: `b49835a34fac3c76c9e4d2f2159683de975d2094`
- 対象ブランチ: `master`
- 対象リポジトリ: `h8nc4y/x-archive-link-tool`
- バージョン位置づけ: `package.json` は `0.1.0`。まだGit tagとGitHub Releaseは作成していない。

判断: `b49835a34fac3c76c9e4d2f2159683de975d2094` は、静的ページ公開、CI、ローカルテスト、Cloudflare Pages Production deployment一覧の読み取り証跡が揃っており、人間が `v0.1.0` 相当の公開可否を判断するリリース候補HEADとして扱える。

## 確認済み事項

### CI

- GitHub Actions workflow: `.github/workflows/ci.yml`
- 実行内容: `npm test`
- トリガー: `pull_request`、`push` to `master`、`workflow_dispatch`
- `master` の直近CI:
  - `b49835a34fac3c76c9e4d2f2159683de975d2094` の merge commit に対する `CI` は `success`
  - GitHub run: `26031998604`
  - 実行時刻: `2026-05-18T11:57:03Z`

### ローカルテスト

- 確認コマンド: `npm test`
- 直近確認結果: 112 tests pass
- このメモ更新後にも `npm test` を再実行し、結果をPRと最終報告に記録する。

### 公開静的ページ

公開URLの静的確認は、本番 `/api/extract` を呼ばずに行う。

- `https://x-archive-link-tool.pages.dev/`
  - HEAD/GET: `200`
  - 主要security headers: 確認済み
- `https://x-archive-link-tool.pages.dev/privacy.html`
  - `/privacy` へredirect
  - redirect後のHEAD/GET: `200`
  - 主要security headers: 確認済み
- `https://x-archive-link-tool.pages.dev/privacy`
  - HEAD/GET: `200`
  - 主要security headers: 確認済み

確認対象の主要security headers:

- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`

## Cloudflare Production deployment証跡

Cloudflare Pages の正式証跡は、GitHub check-run successや公開URL表示確認だけではなく、Cloudflare Pages deployment一覧の読み取り結果で扱う。

### リリース候補HEAD

2026-05-19に `npx wrangler pages deployment list --project-name x-archive-link-tool --environment production --json` を読み取り実行し、次のProduction deploymentを確認した。

- deployment ID: `2868b8df-0e6b-479a-9f8c-955cfb8aa0e2`
- environment: `Production`
- branch: `master`
- source: `b49835a`
- deployment URL: `https://2868b8df.x-archive-link-tool.pages.dev`
- build URL: `https://dash.cloudflare.com/68b0957405bae91b41430d49645e230f/pages/view/x-archive-link-tool/2868b8df-0e6b-479a-9f8c-955cfb8aa0e2`
- status field: `1 day ago`

事実: Cloudflare Pages deployment一覧に、`master` / `Production` / `b49835a` / deployment ID `2868b8df-0e6b-479a-9f8c-955cfb8aa0e2` が存在する。

注意: Wranglerの一覧出力では `Status` が相対時刻として返っており、明示的な `Success` 文字列は取得できていない。そのため、このメモでは `Success` と断定せず、Cloudflare Pages deployment一覧に存在する事実として記録する。

### 既存証跡との位置づけ

- `1a8fad5b02f540ec1c60ab5e62ffa0c4597533f7`
  - Claude Codeレビューhardening反映時点のProduction deployment証跡。
  - deployment ID: `a79ddcf6-83ba-4dd3-929d-1bb6adc4ecf6`
- `2db0a89a39424ebb1d43268e4e4af7a19b01bc39`
  - PR #8 docs反映後のProduction deployment証跡。
  - deployment ID: `aaadb2ac-bd83-43f5-a4e2-960f9f7a1e4e`
- `b49835a34fac3c76c9e4d2f2159683de975d2094`
  - PR #9 pre-release operations Runbook反映後のリリース候補HEAD。
  - deployment ID: `2868b8df-0e6b-479a-9f8c-955cfb8aa0e2`

### 無限docs更新を避ける方針

このメモを追加または更新すると、新しいdocs-only HEADが発生する。以後、そのdocs-only HEADのProduction deploymentを追記するためだけに再度docsを更新すると、Production証跡追跡が無限に続く。

そのため、このメモでは `b49835a34fac3c76c9e4d2f2159683de975d2094` をリリース候補スナップショットとして固定する。以後のdocs-only修正HEADは、人間が明示的にリリース候補HEADの更新を指示した場合だけ、新しいリリース候補として扱う。

## 実行していない確認

次の確認は、安全境界と費用・credits影響のため実行していない。

- 本番 `/api/extract`
  - 理由: 実X投稿URL、X API credits、oEmbed live通信、実データ処理に影響し得る。
- 本番429確認
  - 理由: 本番に意図的な連続リクエストを発生させ、rate limitやログ、credits、利用者影響に関わり得る。
- X API live通信
  - 理由: X API creditsやBearer Token運用に関わる。
- oEmbed live通信
  - 理由: 外部live通信であり、本番API smokeの一部として人間承認が必要。
- Git tag作成
  - 理由: `v0.1.0` 公開操作であり、今回は公開判断材料の整理に留める。
- GitHub Release作成
  - 理由: 公開操作であり、今回は実行しない。

## 残未確認事項

- X API credits / billing / usage cap
  - 未確認: 現在の残credits、課金状態、usage cap、アラート設定。
  - 推奨: 公開前に人間がX Developer Portalで確認し、スクリーンショットまたは記録を残す。
- ログ保存期間
  - 未確認: Cloudflare側ログ、GitHub Actionsログ、将来KVログがある場合の保存期間と削除方針。
  - 推奨: 初期値は30日以内を候補にし、法務・運用判断後に確定する。
- KV障害時の切り戻し判断者
  - 未確認: KV導入後に誰が切り戻し判断を行うか。
  - 推奨: 初期運用ではリポジトリownerまたは運用責任者を1名明記し、判断不能時はKV依存機能を無効化する。
- 本番 `/api/extract` smokeの実行可否
  - 未確認: どの投稿URLで何回まで確認するか、記録粒度、credits上限。
- 本番429確認の実施可否
  - 未確認: 本番ではなくローカルfixtureまたはpreviewで代替するか。
- プライバシーポリシーと問い合わせ先の法務レビュー
  - 未確認: `h8nc4y.sub01@gmail.com` は候補値として整理済みだが、法務レビュー済みではない。

## 人間判断が必要な事項

- `b49835a34fac3c76c9e4d2f2159683de975d2094` を `v0.1.0` として公開するか。
- Git tag `v0.1.0` を作成するか。
- GitHub Release `v0.1.0` を作成するか。
- 本番 `/api/extract` smokeを実行するか。
- 本番429確認を実行するか、ローカルfixture確認で代替するか。
- X API credits / billing / usage cap確認の責任者と頻度。
- ログ保存期間と削除方針。
- KV障害時の正式な切り戻し判断者と復旧後手順。

## リリース前に実行してはいけない操作

人間承認がない限り、次の操作を実行しない。

- Git tag作成。
- GitHub Release作成。
- 本番 `/api/extract` 実行。
- 本番429確認。
- X API live通信。
- oEmbed live通信。
- 実X投稿URLの送信。
- X API Bearer Token、OAuth token、secret、credentialの表示、送信、変更。
- Cloudflare deploy、delete、rollback、設定変更、環境変数変更、secret操作。
- KV / D1 / Queues / Workers AI / AI Gateway のwrite操作または課金が増える操作。

## 承認文言案

### tagとGitHub Release

`b49835a34fac3c76c9e4d2f2159683de975d2094 を v0.1.0 として tag 作成し、GitHub Release を作成することを承認します。本番 /api/extract、本番429確認、Cloudflare write操作は別途承認があるまで実行しないでください。`

### 本番API smoke

`本番 /api/extract を、私が指定する実X投稿URLで最大 N 回だけ実行することを承認します。記録は HTTP status、source、cached、mediaUrls件数、warnings件数に限定し、実URL、本文、mediaUrls値、username、postId、token、Authorization header、secret値は記録しないでください。`

### 本番429確認

`本番429確認を、最大 N リクエストまで実行することを承認します。実行前後にX API creditsとCloudflare状態を確認し、記録はHTTP status、rate-limit関連の有無、時刻、リクエスト回数に限定してください。実投稿URL、本文、token、Authorization header、secret値は記録しないでください。`

推奨: 本番429確認は初回公開前には実行せず、ローカルfixtureまたはpreview環境での確認を優先する。

