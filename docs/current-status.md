# Current Status

BYOT/oEmbed fallback版Web MVPの現在状態です。

## 現在できること

- Xポスト共有URLを入力できる。
- URLを検証し、`canonicalXPostUrl` に正規化できる。
- `X_BEARER_TOKEN` 設定時はX API v2から取得できる範囲を正規化できる。
- `X_BEARER_TOKEN` 未設定時は公式oEmbed endpoint `https://publish.x.com/oembed` から取得できる範囲を正規化できる。
- postId単位のcache-firstで、cache hit時はX API v2を呼ばない。
- Cloudflare ProductionではKV binding `X_POST_CACHE` によりpostId単位のcacheを保存できる。
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
- ただし、Cloudflare Pages deployment一覧またはCloudflare Dashboardで `cbe25119008814542df28bcd6ea7cc1159d7e3af` がProduction deploymentとして成功した正式証跡は未確認。`wrangler whoami` は未認証で `wrangler login` が必要なため、Codex側ではPages deployment一覧を読めなかった。

## CI導入状況

- Issue #2の判断として、GitHub Actionsの最小CIを導入する。
- CIは `.github/workflows/ci.yml` で、pull request、`master` へのpush、手動実行時に `npm test` のみを実行する。
- package-lock.json がないため、install stepは入れない。
- lint/typecheck/format専用scriptは `package.json` にないため、今回のCIには追加しない。
- GitHub Actionsの実行はGitHubのActions minutesを消費する可能性がある。現時点では追加費用0円見込みだが、account plan、残minutes、spending limit、overage単価は未確認。

## 次の推奨作業

- Cloudflare Pages無料URLでの試験公開を継続し、独自ドメインは後工程で判断する。
- レート制限値はProduction初期値としてper IP 10/min、global 60/minを設定済み。X API credits / billing / usage capを見直す頻度と429時の対応基準は未確認。
- 公開前運用未決定項目は `docs/deployment-plan.md` の「運用未決定項目の分類」で管理する。問い合わせ先は `h8nc4y.sub01@gmail.com` を候補値として反映済みだが、法務レビュー済みではない。
- プライバシーポリシーURL候補は `/privacy.html`。公開URLの静的表示は確認済みだが、`cbe25119008814542df28bcd6ea7cc1159d7e3af` のCloudflare Pages deployment一覧でのProduction正式証跡は未確認。
- `ca0bd79` のCloudflare Production deploy成功は人間側で確認済み。`cbe25119008814542df28bcd6ea7cc1159d7e3af` はGitHub check-runと公開URL表示まで確認済みだが、Cloudflare Dashboard、Cloudflare plugin、Pages deployment一覧などの信頼できるProduction証跡が取れていないため、Production確認済みとは扱わない。
- 公開前チェックリストを必要に応じて再確認する。
