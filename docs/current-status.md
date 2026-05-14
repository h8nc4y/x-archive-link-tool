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

## 次の推奨作業

- Cloudflare Pages無料URLでの試験公開を継続し、独自ドメインは後工程で判断する。
- レート制限値はProduction初期値としてper IP 10/min、global 60/minを設定済み。X API credits / billing / usage capを見直す頻度と429時の対応基準は未確認。
- 公開前運用未決定項目は `docs/deployment-plan.md` の「運用未決定項目の分類」で管理し、実値は人間判断後に反映する。
- `ca0bd79` のCloudflare Production deploy成功は人間側で確認済み。以降のdocs-only更新commitはGitHubへpush後、Cloudflare Production deploy成功状態を個別に確認してdocsへ記録する。
- 公開前チェックリストを必要に応じて再確認する。
