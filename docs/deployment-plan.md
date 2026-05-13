# Deployment Plan

oEmbed版Web MVPのCloudflare Pages初回デプロイ設定と、公開前後に残る確認項目の整理です。

## 公開前に決めること

- [ ] 公開先: Cloudflare Pages
- [ ] ドメイン: Cloudflare Pages無料URL（`*.pages.dev`）
- [ ] 問い合わせ先: TODO/未設定
- [ ] プライバシーポリシーURL: TODO/未設定
- [x] レート制限値: Cloudflare Productionに初期運用値を設定済み
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
- Environment variables: `X_BEARER_TOKEN` はsecretとして設定済み。値は記録しない。未設定時はoEmbed fallback。

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
- Cloudflare Pages Deploymentsで `13051d6` またはmaster最新のProduction deploy成功: OK（人間側で確認済み）。
- `13051d6` deploy後のトップページ表示: OK。
- `13051d6` deploy後の `/api/extract` 再実行: 未実施。

## 本番環境で必要な設定

- [ ] `PORT`: Cloudflare Pagesでは不要
- [x] `RATE_LIMIT_PER_IP_PER_MINUTE`: Productionに `10` を設定済み
- [x] `RATE_LIMIT_GLOBAL_PER_MINUTE`: Productionに `60` を設定済み
- [x] `X_BEARER_TOKEN`: secretとして設定済み。値は記録しない。
- [ ] `X_POST_CACHE`: Cloudflare KV namespace binding。Productionでは `x-archive-link-tool-post-cache` を設定済み。

X API Bearer Tokenは必須ではない。`.env` を作る場合もコミットしない。

## Rate limit本番初期値と反映手順

現状:

- `RATE_LIMIT_PER_IP_PER_MINUTE` の初期運用値は `10`。
- `RATE_LIMIT_GLOBAL_PER_MINUTE` の初期運用値は `60`。
- 人間側でCloudflare Production環境変数へ `RATE_LIMIT_PER_IP_PER_MINUTE=10` / `RATE_LIMIT_GLOBAL_PER_MINUTE=60` を設定し、Production redeploy済み。
- コード上の既定値もper IP 10/min、global 60/min。
- KV post cacheにより、同一postIdのcache hit時はX API v2を呼ばない。
- cache miss時はX API v2またはoEmbed fallbackを呼ぶため、公開範囲が広がる前に本番値を決める。

Cloudflare Productionへの反映手順:

1. 人間がCloudflare Pages project `x-archive-link-tool` のProduction環境変数を開く。
2. `RATE_LIMIT_PER_IP_PER_MINUTE=10` を設定する。
3. `RATE_LIMIT_GLOBAL_PER_MINUTE=60` を設定する。
4. Production redeployを行う。
5. Cloudflare Pages DeploymentsでProduction成功を確認する。

保護強化時の切り下げ候補:

- X API creditsやusage capを強く保護する場合は `RATE_LIMIT_PER_IP_PER_MINUTE=5`, `RATE_LIMIT_GLOBAL_PER_MINUTE=30` へ下げる。
- 一時的な問題対応ではglobal値を先に下げ、必要ならper IP値も下げる。

redeploy後の最小確認方針:

- トップページ表示確認と、必要時だけ `/api/extract` の同一投稿URL最大2回確認に留める。
- 1回目がHTTP 200かつmediaUrls取得成功の場合だけ2回目を行う。
- 2回目が `source=cache`, `cached=true` なら、追加確認は行わない。
- 失敗時は連続実行せず、Cloudflare DeploymentsとFunctionsログを確認する。
- 確認結果にはHTTP status、source、cached、mediaUrls件数、warnings件数だけを書く。実投稿URL、投稿本文、mediaUrls値、username、postId、token、Authorization headerは記録しない。

未決事項:

- [x] Cloudflare Pages Production環境変数への設定有無: 人間側で設定・redeploy済み。
- [ ] X API credits / billing / usage capを見ながら値を見直す頻度。
- [ ] 正常利用者が429になった場合の問い合わせ先と対応基準。

429確認方針:

- 原則として429挙動はローカルテストで確認する。`npm test` にはrate limitの既定値、環境変数指定、不正値fallback、429時の `Retry-After`、429本文の非漏えい確認が含まれる。
- 本番で429確認を行うのは、公開前に人間が必要と判断した場合だけにする。
- 本番で確認する場合も、実X API通信回数を増やさない方法を先に別checkpointで決める。安全に担保できない場合は実行しない。
- 本番確認中に429以外の応答、5xx、X API provider warning、想定外のFunctionsログ、実X API通信増加の疑いが出た場合は追加実行せず停止する。
- 記録してよい項目はHTTP status、`Retry-After` の有無、エラーcode、実行回数、確認時刻、Cloudflare deploy commit、warnings件数だけにする。
- 記録禁止項目は実投稿URL、投稿本文、mediaUrls値、username、postId、token、Authorization header、secret値、Cookie、Cloudflare内部ログの詳細本文。
- 問い合わせ先、429時の対応基準、X API credits / billing / usage capの見直し頻度は未確認。

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

## 本番未設定項目と運用残リスク

- [x] `RATE_LIMIT_PER_IP_PER_MINUTE`: Cloudflare Production環境変数に `10` を設定済み。
- [x] `RATE_LIMIT_GLOBAL_PER_MINUTE`: Cloudflare Production環境変数に `60` を設定済み。
- [ ] 問い合わせ先: TODO/未設定。
- [ ] プライバシーポリシーURL: TODO/未設定。
- [x] Cloudflare Pages deploy status確認: 人間側で `13051d6` またはmaster最新のProduction成功を確認済み。
- [ ] Cloudflare Functionsログ確認の運用責任者: TODO/未設定。
- [ ] ログ保存期間: TODO/未設定。
- [ ] KV namespace / binding / TTL運用: namespaceは `x-archive-link-tool-post-cache`、bindingは `X_POST_CACHE`、TTLは30日。TTL長期運用時の定期確認方法は未確認。
- [ ] KV障害時の一時切り戻し方針: TODO/未設定。候補は `X_POST_CACHE` bindingを外してProduction redeployし、in-memory fallbackで継続すること。ただし実施判断者と手順は未確認。
- [ ] 429本番確認: 未実施。原則ローカルテストで担保し、本番確認は実X API通信を増やさない手順を別checkpointで決めてから行う。
- [ ] 実X API通信回数を増やさない確認方針: 同一投稿URLで最大2回。1回目がHTTP 200かつmediaUrls取得成功の場合だけ2回目を行う。失敗時は追加実行しない。
- [ ] 記録禁止方針: token、Authorization header、secret値、実投稿URL、投稿本文、mediaUrls値、username、postIdはdocs、issue、チャット、ログへ貼らない。

## 既知の制限

- userNumericIdはoEmbed fallbackでは未取得。
- media direct URLsはoEmbed fallbackでは未取得。
- oEmbedで取得できない投稿がある。
- 投稿本文と投稿日は安全に抽出できない場合 `未取得`。
- 魚拓はユーザー操作で外部リンクを開くだけ。
- Cloudflare Pages/Functionsのin-memory cacheは永続化ではない。ProductionではCloudflare KV binding `X_POST_CACHE` を使う。D1は使わない。
