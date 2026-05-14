# X Post Paste Text MVP

Xポスト共有URLから貼り付け用テキストを生成するWeb MVPです。

Web UI と `POST /api/extract` は実装済みです。Cloudflare Pages無料URLで初回デプロイ済みです。iOSアプリ、DB、独自ドメイン設定は未実装です。

公開URL: https://x-archive-link-tool.pages.dev

Cloudflare Pages無料URL（`*.pages.dev`）では、静的UIは `apps/web` を配信し、`/api/extract` は Cloudflare Pages Functions / Workers で実行します。

## ローカル起動

PowerShellでローカルポートを一時設定してから起動します。X API Bearer Tokenは任意です。未設定時はoEmbed fallbackで動作します。

```powershell
$env:PORT="3000"
npm start
```

ブラウザで `http://127.0.0.1:3000/` を開き、XポストURLを入力します。
疎通確認だけなら `http://127.0.0.1:3000/healthz` を開き、`{"ok":true}` が返ることを確認します。

`npm` が使えない場合の起動コマンド:

```powershell
$env:PORT="3000"
node server/extractServer.js
```

## テスト

```powershell
npm test
```

`npm` が使えない場合:

```powershell
node --test server/urlValidator.test.js server/extractServer.test.js server/oEmbedClient.test.js server/xApiV2Client.test.js server/kvPostCache.test.js server/rateLimiter.test.js server/extractService.test.js server/env.test.js apps/web/app.test.js apps/web/styles.test.js scripts/manualOEmbedCheck.test.js functions/api/extract.test.js
```

## 環境変数

`.env.example` は見本です。`.env` は作成してもコミット禁止です。

- `PORT`: ローカル起動ポート。既定値は `3000`。
- `RATE_LIMIT_PER_IP_PER_MINUTE`: IP単位の1分あたり上限。既定値は `10`。
- `RATE_LIMIT_GLOBAL_PER_MINUTE`: 全体の1分あたり上限。既定値は `60`。
- `X_BEARER_TOKEN`: 任意。設定時のみBring Your Own Token方式でX API v2を使い、メディアURL取得を試みます。未設定時はoEmbed fallbackを使います。
- `X_POST_CACHE`: Cloudflare Pages ProductionのKV namespace binding。postId単位の本番cacheに使います。

Cloudflare Pagesでは `PORT` は不要です。試験公開時のRoot directoryは空欄/リポジトリルート、build commandは不要/空欄、build output directoryは `apps/web`、Functions directoryは `functions` です。Root directoryを `apps/web` にすると `/api/extract` のFunctionsが認識されない可能性があります。X API Bearer Tokenは任意です。ProductionではKV binding `X_POST_CACHE` を `x-archive-link-tool-post-cache` に設定済みです。

## MVP対象範囲

- 入力はXのポスト共有URLのみ。
- URLを安全に検証し、正規化した `canonicalXPostUrl` を扱う。
- 出力項目は、アカウント名、`@username`、ユーザー数値ID、ポストURL、投稿日、本文、メディアURL、魚拓URL。
- X API v2はBring Your Own Token方式で任意利用する。未設定時は公式oEmbed endpoint `https://publish.x.com/oembed` を使う。
- 同じpostIdはcache-firstで扱い、cache hit時はX API v2を呼ばない。
- oEmbed fallbackでは取得できない項目があるため、ユーザー数値IDとメディア直接URLは未取得になる場合がある。
- 投稿本文と投稿日はoEmbed HTMLから安全に抽出できる場合だけ表示し、抽出できない場合は `未取得`。
- 魚拓は自動取得しない。
- 「魚拓を取得する場合はこちら」リンクを表示するだけで、サーバーから魚拓を取得しない。
- X API Bearer Tokenはサーバー側環境変数だけで扱い、クライアントへ返さない。
- 入力URL、投稿本文、メディアURL、ユーザー情報はログに残さない方針。

## 対象外

- iOSアプリ
- DB
- 追加の本番デプロイ設定
- ユーザー入力URLのfetch
- X HTMLスクレイピング
- ブラウザ自動化によるX閲覧
- ウェブ魚拓のサーバー取得
- OGP取得、短縮URL展開、メディアダウンロード

## よくある応答

- token未設定: oEmbed fallbackで起動できます。メディアURLを取得できない場合があります。
- 不正URL: URL検証エラーになります。`https://x.com/{username}/status/{postId}` 形式を使ってください。
- `404`: 対象ポストが見つからない、または取得できません。
- `429`: レート制限に達しています。時間を置いて再試行してください。

非公開、削除済み、埋め込み不可、oEmbed側制限などにより取得できない投稿があります。

## 手動確認

- 公開XポストURLを1件入力し、コピー用 `textarea` に結果が出ることを確認します。
- 魚拓リンクは別タブで開くだけです。魚拓は自動取得されません。
- 魚拓URL欄は `https://megalodon.jp/...` または `https://s{digits}.megalodon.jp/...` のみ有効です。
- `.env`、投稿本文、メディアURLをGitやログに残さないでください。

## ドキュメント

- [要件](docs/requirements.md)
- [API案](docs/api.md)
- [テストケース](docs/test-cases.md)
- [現状まとめ](docs/current-status.md)
- [公開前チェックリスト](docs/pre-release-checklist.md)
- [デプロイ準備](docs/deployment-plan.md)
- [プライバシーポリシードラフト](docs/privacy-policy-draft.md)
- [サポートページドラフト](docs/support-page-draft.md)
- [セキュリティ](SECURITY.md)

## 検証

```powershell
npm test
```
