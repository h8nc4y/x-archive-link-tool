# v0.1.0 Release Notes

2026/05/20 17:53:00

GitHub Release: https://github.com/h8nc4y/x-archive-link-tool/releases/tag/v0.1.0

## 位置づけ

- 最終tag対象: `4669e5b6fe0387223f1418bc8d9e851cc8e7cbe5`
- tag object: `c47b21cac5d9c1e9977248bab17982298a9c1673`
- アプリ実装のリリース候補スナップショット: `b49835a34fac3c76c9e4d2f2159683de975d2094`
- `4669e5b` は、`b49835a` に release-candidate docs を追加した後のHEAD。
- GitHub Releaseは通常release。draftではなく、pre-releaseでもない。

このファイルはrelease後の記録として追加したdocsであり、`v0.1.0` tag対象commitには含めない。

## 確認済み事項

- GitHub Actions CI: `npm test` success
  - master CI run: `26105203618`
- ローカルテスト: `npm test` 112 tests pass
- Cloudflare Pages Production deployment一覧で確認済み
  - `b49835a`: deployment ID `2868b8df-0e6b-479a-9f8c-955cfb8aa0e2`
  - `4669e5b`: deployment ID `0215eabb-7db3-4aa1-97c8-e8572b4fd29f`
- 公開静的URL確認済み
  - `https://x-archive-link-tool.pages.dev/`: HEAD/GET 200
  - `https://x-archive-link-tool.pages.dev/privacy.html`: `/privacy` へredirect後 HEAD/GET 200
  - `https://x-archive-link-tool.pages.dev/privacy`: HEAD/GET 200
- 主要security headers確認済み
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- プライバシーページは公開静的ページとして表示確認済み。

## 主な内容

- Xポスト共有URLから貼り付け用テキストを生成するWeb MVP。
- Cloudflare Pagesの静的UIとPages Functionsの `/api/extract` を利用。
- URL validatorが生成したcanonical URLだけをX API v2または公式oEmbed endpointへ渡す設計。
- X API v2はBring Your Own Token方式で任意利用。未設定時はoEmbed fallback。
- Cloudflare ProductionではKV binding `X_POST_CACHE` によるpostId単位cacheに対応。
- 静的ページ用security headersを `apps/web/_headers` で設定。
- UIエラー・warning表示は日本語first。

## 今回実行していない確認

次の確認は、X API credits、oEmbed live通信、実データ、または本番負荷に影響し得るため、このRelease作成では実行していない。

- 本番 `/api/extract`
- 本番429確認
- X API live通信
- oEmbed live通信
- 実X投稿URLを使う確認
- secret、token、OAuth、実ユーザーデータの読み取りや送信

## 既知リスク / 未確認事項

- X API credits / billing / usage cap の実残量と上限設定は未確認。
- ログ保存期間は未確定。
- KV障害時の正式な切り戻し判断者と復旧後手順は未確定。
- 問い合わせ先 `h8nc4y.sub01@gmail.com` とプライバシーポリシーは候補として整理済みだが、法務レビュー済みではない。
- Cloudflare Functionsのin-memory cacheとrate limiterはisolate単位のbest-effortであり、真のglobal制限ではない。
- 本番API smokeを実行していないため、公開後に実通信確認を行う場合は別途人間承認が必要。

## 費用影響

- Release作成自体による追加費用は想定していない。
- GitHub Actionsはincluded minutes内であれば追加費用0円見込み。ただしaccount plan、残minutes、spending limit、overage単価は未確認。
- X API creditsを消費し得る確認は今回実行していない。
- Cloudflare write操作、deploy、delete、rollback、KV/D1/Workers AI/AI Gateway/secret/環境変数変更は実行していない。

## 次アクション

- 公開前または公開直後に、人間がX Developer Portalでcredits / billing / usage capを確認する。
- ログ保存期間、KV障害時判断者、復旧後手順を確定する。
- 本番API smokeを実行する場合は、実行回数、使用する投稿URL、記録項目を限定したうえで明示承認する。
- 本番429確認は、初回公開前は原則ローカルfixtureまたはpreview代替を優先する。

