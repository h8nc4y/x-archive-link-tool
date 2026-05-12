# Deployment Plan

oEmbed版Web MVPのCloudflare Pages初回デプロイ設定と、公開前後に残る確認項目の整理です。

## 公開前に決めること

- [ ] 公開先: Cloudflare Pages
- [ ] ドメイン: Cloudflare Pages無料URL（`*.pages.dev`）
- [ ] 問い合わせ先: TODO/未設定
- [ ] プライバシーポリシーURL: TODO/未設定
- [ ] レート制限値: TODO/未設定
- [ ] ログ保存期間: TODO/未設定
- [ ] 公開時の運用/ロールバック手順の最終確認: TODO/未設定

## Cloudflare Pages設定

- Project name: `x-archive-link-tool`
- Production branch: `master`
- 公開URL: https://x-archive-link-tool.pages.dev
- Framework preset: なし
- [ ] Root directory: 空欄 / リポジトリルート
- [ ] build command: 不要 / 空欄
- [ ] build output directory: `apps/web`
- [ ] Functions directory: `functions`
- [ ] API実行基盤: Cloudflare Pages Functions / Workers
- [ ] `/api/extract`: `functions/api/extract.js`
- [ ] KV namespace binding: `X_POST_CACHE` -> `x-archive-link-tool-post-cache`（Production）
- [ ] 独自ドメイン: 後回し
- Environment variables: `X_BEARER_TOKEN` は任意。未設定時はoEmbed fallback。

Root directoryを `apps/web` にすると、リポジトリ直下の `functions/` が認識されない可能性があるため、空欄またはリポジトリルートのままにする。

## 初回デプロイ手動確認結果

- Cloudflare Pages初回デプロイ: OK
- Cloudflare Pages Deploymentsで `6745361` のproduction deployment成功: OK
- Cloudflare Pages Deploymentsで `77e937b` のproduction deployment成功: OK
- Cloudflare Pages Deploymentsで `676a81c` のproduction deployment成功: OK
- トップ画面表示: OK
- 空欄送信時の必須入力表示: OK（ブラウザ標準の必須入力メッセージ）
- 公開X投稿URLを1件使用した抽出: OK
- 魚拓URL生成: OK
- コピー用テキスト生成: OK
- 不正URL時のエラー表示: OK（表示例: `URL host is not allowed.`）
- Functions tabでリアルタイムログ確認: OK
- `/api/extract` へのPOSTが Ok として記録: OK
- Cloudflare Functionsログ重大エラー: なし（確認時点）
- KV post cache本番確認: OK。同一投稿URLで2回確認し、1回目は `source=x-api-v2`, `cached=false`, mediaUrls件数4, warnings件数0。2回目は `source=cache`, `cached=true`, mediaUrls件数4, warnings件数0。推定X API v2通信回数は1回。

## 本番環境で必要な設定

- [ ] `PORT`: Cloudflare Pagesでは不要
- [ ] `RATE_LIMIT_PER_IP_PER_MINUTE`: TODO/未設定
- [ ] `RATE_LIMIT_GLOBAL_PER_MINUTE`: TODO/未設定
- [ ] `X_BEARER_TOKEN`: 任意。Bring Your Own Token方式でX API v2を使う場合だけ設定。
- [ ] `X_POST_CACHE`: Cloudflare KV namespace binding。Productionでは `x-archive-link-tool-post-cache` を設定済み。

X API Bearer Tokenは必須ではない。`.env` を作る場合もコミットしない。

## 本番で守る制約

- X_BEARER_TOKENは任意。設定時だけX API v2を使う。
- X API v2はBring Your Own Token方式に限定する。
- サーバー外向き通信先は `https://api.x.com/2/tweets/{postId}` または `https://publish.x.com/oembed` のみ。
- oEmbedへ渡すURLは validator が生成した `canonicalXPostUrl` のみ。
- cache hit時はX API v2を呼ばない。
- 入力URLを直接fetchしない。
- X HTMLスクレイピング、OGP取得、短縮URL展開、メディアダウンロードをしない。
- 魚拓は自動取得しない。
- 投稿本文、mediaUrls、username、postId、HTML本文、JSON valuesをログに出さない。

## 公開前チェック手順

- [ ] `node --test server/urlValidator.test.js server/extractServer.test.js server/oEmbedClient.test.js server/env.test.js apps/web/app.test.js scripts/manualOEmbedCheck.test.js` を実行する。
- [ ] Cloudflare Pages Functions用APIを含める場合は `functions/api/extract.test.js` も実行する。
- [ ] `docs/pre-release-checklist.md` を再確認する。
- [ ] `docs/privacy-policy-draft.md` と `docs/support-page-draft.md` の未設定項目を埋める。
- [ ] 公開先の環境変数にレート制限値を設定する。
- [ ] 公開前にWeb UIと `/api/extract` を確認する。

## ロールバック方針

- [ ] 公開直前のGit commitを記録する。
- [ ] 問題があれば直前の安定版commitへ戻す。
- [ ] ロールバック担当者と判断基準を決める: TODO/未設定
- レート制限値の変更で回避できる問題は、コード変更より先に設定値で対応する。
- X API v2側障害やoEmbed側障害が疑われる場合は、既存cacheがあればstale-cacheとして返す。

## KV post cache運用・障害時チェック

- 通常確認はProduction redeploy後に同一投稿URLで最大2回だけ行う。1回目が `source=x-api-v2`, `cached=false`、2回目が `source=cache`, `cached=true` ならKV hit相当。
- 確認結果を記録する場合はHTTP status、source、cached、mediaUrls件数、warnings件数だけを書く。実投稿URL、投稿本文、mediaUrls値、username、postId、token、Authorization headerは記録しない。
- 2回目がcacheにならない場合は、Production binding `X_POST_CACHE` が `x-archive-link-tool-post-cache` を指しているか、binding追加後のProduction redeployが成功しているか、Functionsログに重大エラーがないかを確認する。
- `source=oembed` とX API provider failure warningが出る場合は、X API credits / billing / permission / rate limitを確認する。token値は表示、共有、保存しない。
- KVは最適化層として扱う。KV get/set/payload parse失敗時もorigin取得が動く想定だが、serverlessのin-memory cacheは本番永続化として期待しない。
- KV valueには正規化済み投稿情報が含まれる可能性があるため、Cloudflare画面やログから値をコピーしてdocs、issue、チャットへ貼らない。

## 既知の制限

- userNumericIdはoEmbed fallbackでは未取得。
- media direct URLsはoEmbed fallbackでは未取得。
- oEmbedで取得できない投稿がある。
- 投稿本文と投稿日は安全に抽出できない場合 `未取得`。
- 魚拓はユーザー操作で外部リンクを開くだけ。
- Cloudflare Pages/Functionsのin-memory cacheは永続化ではない。ProductionではCloudflare KV binding `X_POST_CACHE` を使う。D1は使わない。
