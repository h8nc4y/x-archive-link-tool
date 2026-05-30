# Current Status

BYOT/oEmbed fallback版Web MVPの現在状態です。

## 現在できること

- Xポスト共有URLを入力できる。
- URLを検証し、`canonicalXPostUrl` に正規化できる。
- `X_BEARER_TOKEN` 設定時はX API v2から取得できる範囲を正規化できる。
- `X_BEARER_TOKEN` 未設定時は公式oEmbed endpoint `https://publish.x.com/oembed` から取得できる範囲を正規化できる。
- postId単位のcache-firstで、cache hit時はX API v2を呼ばない。
- Cloudflare ProductionではKV binding `X_POST_CACHE` によりpostId単位のcacheを保存できる。
- 現行KV実装ではphysical TTLがlogical TTLと同じため、Cloudflare KVで期限切れ後の `stale-cache` 到達性は本番保証として主張しない。
- `X_BEARER_TOKEN` 設定時にX API失敗後のoEmbed fallbackが成功した場合、現行実装ではそのfallback結果も通常cache経路で保存される。非cache、短TTL、現状維持の正式方針は未決。
- Cloudflare Functionsのin-memory cacheとrate limiterはisolate単位のbest-effortであり、真のglobal制限ではない。
- Web UIでコピー用テキストを `textarea` に表示できる。
- 魚拓リンクを外部リンクとして表示できる。
- ローカルで `/healthz` を確認できる。

## 現在できないこと

- iOSアプリ
- DB保存
- ユーザー認証
- OGP取得、短縮URL展開、スクレイピング、メディアダウンロード
- 魚拓の自動取得

## 仕様上あえて取得しないもの

- ログインCookie、X内部GraphQL、guest token
- quote/poll
- oEmbed fallback時のユーザー数値ID
- oEmbed fallback時のメディア直接URL
- oEmbed HTMLそのもの
- 魚拓URLのサーバー取得結果

## 手動確認済み結果

- Web MVPはローカルで起動できる。
- Web UIでXポストURLを入力して取得できる。
- コピー用 `textarea` に結果が表示される。
- userNumericId は `未取得`。
- mediaUrls が空の場合、Web UIでは `なし`。
- 魚拓リンクは表示される。
- 魚拓は自動取得されない。
- ポート競合時の案内を表示できる。
- Cloudflare Productionで同一投稿URLを2回確認し、1回目は `source=x-api-v2`, `cached=false`, mediaUrls件数4, warnings件数0、2回目は `source=cache`, `cached=true`, mediaUrls件数4, warnings件数0。推定X API v2通信回数は1回。
- Cloudflare Pages Dashboardで `ca0bd79` のProduction deployment Successは人間側で確認済み。
- `ca0bd79` deploy後のProduction URLトップページはHTTP 200、title `Xポスト貼り付けテキスト生成` として確認済み。
- `ca0bd79` deploy後の `/api/extract`、429本番確認、X API呼び出しは未実施。
- `cbe25119008814542df28bcd6ea7cc1159d7e3af` のGitHub上のCloudflare Pages check-runはsuccess。external_idは `373397d2-7347-4f4c-bf53-06e42110f4d9`、details URLはCloudflare DashboardのPages deployment URL。
- 公開URL `https://x-archive-link-tool.pages.dev/privacy.html` は静的表示を確認済み。表示項目は `プライバシーポリシー`、問い合わせ先、法務未レビュー表示。console errorは0件。
- Wrangler 4.92.0で `wrangler whoami` が成功し、OAuth tokenが有効であることを確認済み。ただしtokenには広いwrite権限があるため、Cloudflare操作はdeployment一覧の読み取りだけに限定した。
- 2026-05-18 20:40 JSTに `npx wrangler pages deployment list --project-name x-archive-link-tool --environment production --json` を実行し、レビューhardening反映時点のHEAD `1a8fad5b02f540ec1c60ab5e62ffa0c4597533f7` の短縮 `1a8fad5` がCloudflare Pages Production deployment一覧にあることを正式証跡として確認済み。deployment IDは `a79ddcf6-83ba-4dd3-929d-1bb6adc4ecf6`、deployment URLは `https://a79ddcf6.x-archive-link-tool.pages.dev`、environmentは `Production`、branchは `master`、WranglerのStatus欄は `16 minutes ago`、Build URLは `https://dash.cloudflare.com/68b0957405bae91b41430d49645e230f/pages/view/x-archive-link-tool/a79ddcf6-83ba-4dd3-929d-1bb6adc4ecf6`。
- 2026-05-18 20:50 JSTに同じWrangler読み取り確認を再実行し、PR #8 merge後の現在の本番稼働HEAD `2db0a89a39424ebb1d43268e4e4af7a19b01bc39` の短縮 `2db0a89` がCloudflare Pages Production deployment一覧にあることを正式証跡として確認済み。deployment IDは `aaadb2ac-bd83-43f5-a4e2-960f9f7a1e4e`、deployment URLは `https://aaadb2ac.x-archive-link-tool.pages.dev`、environmentは `Production`、branchは `master`、WranglerのStatus欄は `4 minutes ago`、Build URLは `https://dash.cloudflare.com/68b0957405bae91b41430d49645e230f/pages/view/x-archive-link-tool/aaadb2ac-bd83-43f5-a4e2-960f9f7a1e4e`。
- Wranglerのdeployment listは明示的な `Success` 文字列を返さず、Status欄は相対時刻表示だった。補助証跡として、同commitのGitHub上Cloudflare Pages check-run successと公開静的URLのHEAD/GET 200、主要security headersありを確認済み。

## CI導入状況

- Issue #2の判断として、GitHub Actionsの最小CIを導入する。
- CIは `.github/workflows/ci.yml` で、pull request、`master` へのpush、手動実行時に `npm test` のみを実行する。
- package-lock.json がないため、install stepは入れない。
- lint/typecheck/format専用scriptは `package.json` にないため、今回のCIには追加しない。
- GitHub Actionsの実行はGitHubのActions minutesを消費する可能性がある。現時点では追加費用0円見込みだが、account plan、残minutes、spending limit、overage単価は未確認。

## Release

- `v0.1.0` は通常のGitHub Releaseとして作成済み。
- Release URL: https://github.com/h8nc4y/x-archive-link-tool/releases/tag/v0.1.0
- tag object: `c47b21cac5d9c1e9977248bab17982298a9c1673`
- tag target: `4669e5b6fe0387223f1418bc8d9e851cc8e7cbe5`
- アプリ実装のリリース候補スナップショットは `b49835a34fac3c76c9e4d2f2159683de975d2094`。`4669e5b6fe0387223f1418bc8d9e851cc8e7cbe5` はrelease-candidate docs追加後のtag対象HEAD。
- Release notesは `docs/release-notes-v0.1.0.md` にも記録する。ただしこのpost-release docs更新は `v0.1.0` tag対象には含めない。

## 次の推奨作業

- Cloudflare Pages無料URLでの試験公開を継続し、独自ドメインは後工程で判断する。
- レート制限値はProduction初期値としてper IP 10/min、global 60/minを設定済み。X API credits / billing / usage capを見直す頻度と429時の対応基準は未確認。
- 公開前運用未決定項目は `docs/deployment-plan.md` の「運用未決定項目の分類」で管理する。問い合わせ先は `h8nc4y.sub01@gmail.com` を候補値として反映済みだが、法務レビュー済みではない。
- プライバシーポリシーURL候補は `/privacy.html`。公開URLでは `/privacy` へredirectされ、静的表示と主要security headersは確認済み。現在の本番稼働HEAD `2db0a89a39424ebb1d43268e4e4af7a19b01bc39` のCloudflare Pages Production deployment一覧での正式証跡も確認済み。
- `ca0bd79` のCloudflare Production deploy成功は人間側で確認済み。`1a8fad5b02f540ec1c60ab5e62ffa0c4597533f7` はレビューhardening反映時点の証跡として確認済み。現在の本番稼働HEAD `2db0a89a39424ebb1d43268e4e4af7a19b01bc39` はWranglerのCloudflare Pages Production deployment一覧で正式証跡を確認済み。
- 公開前チェックリストを必要に応じて再確認する。
- Cloudflare Pages静的アセット向けに `apps/web/_headers` を追加し、CSP、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy` をローカルサーバーのsecurity headersと揃えた。
