# Deployment Plan

oEmbed版Web MVPのCloudflare Pages初回デプロイ設定と、公開前後に残る確認項目の整理です。

## 公開前に決めること

- [x] 公開先: Cloudflare Pages
- [x] ドメイン: Cloudflare Pages無料URL（`*.pages.dev`）
- [x] 問い合わせ先: `h8nc4y.sub01@gmail.com`（ユーザー指定値。法務レビュー済みではない）
- [x] プライバシーポリシーURL: `/privacy.html` 候補を作成済み。公開URLでは `/privacy` へredirectされ、静的表示と主要security headersは2026-05-18時点で確認済み。Cloudflare Pages deployment一覧でのHEAD証跡は過去確認記録として管理する
- [x] レート制限値: Cloudflare Productionに初期運用値を設定済み
- [ ] ログ保存期間: 未設定 / 人間判断待ち
- [ ] 公開時の運用/ロールバック手順の最終確認: 未設定 / 人間判断待ち

## 運用未決定項目の分類

Codexは次の実値を独断で決めない。ユーザー指定値は候補として反映し、未設定または未確認の項目は人間判断後に該当docsへ反映する。
公開前の運用判断、承認文言、実行禁止操作は `docs/pre-release-operations-runbook.md` でも管理する。

| 項目 | 分類 | 現状 | 次アクション |
| --- | --- | --- | --- |
| 問い合わせ先 | 公開前に決めるべき項目 | `h8nc4y.sub01@gmail.com` をユーザー指定値として反映済み。法務レビュー済みではない。 | 公開前にサポート範囲と運用責任者を確認する。 |
| プライバシーポリシーURL | 公開前に決めるべき項目 | `/privacy.html` 候補を作成済み。公開URLでは `/privacy` へredirectされ、静的表示と主要security headersは2026-05-18時点で確認済み。Cloudflare Pages deployment一覧でHEAD `2db0a89a39424ebb1d43268e4e4af7a19b01bc39` のProduction正式証跡も当時の確認記録として残す。現在の本番稼働HEADは別途確認が必要。 | 公開前に法務レビュー要否を確認する。 |
| ログ保存期間 | 公開前に決めるべき項目 | 未設定 / 人間判断待ち。ドラフトでは安全なログ項目のみ記録する方針を記載済み。 | 推奨案は安全ログ項目だけを30日以内、またはCloudflare既定の短い保持期間に合わせること。法務/運用責任者が確定し、プライバシーポリシーへ反映する。 |
| KV障害時の正式切り戻し手順 | 公開前に決めるべき項目 | 候補は `X_POST_CACHE` bindingを外してProduction redeployし、in-memory fallbackで継続すること。ただしCloudflare write操作を伴うためCodexは未実施。 | 実施判断者、切り戻し条件、復旧後の再有効化手順、承認文言を決める。 |
| X API credits / billing / usage cap見直し頻度 | 公開前に決めるべき項目 | 未確認 / 人間判断待ち | 推奨案は公開前、公開直後、以後週次、安定後月次で人間がX Developer Portalを確認すること。tokenやsecretは共有しない。 |
| Cloudflare Functionsログ確認の運用責任者 | 公開後運用TODO候補 | 未設定 / 人間判断待ち | 運用開始後の確認責任者として人間側で決める。 |

## Cloudflare Pages設定

- Project name: `x-archive-link-tool`
- Production branch: `master`
- 公開URL: https://x-archive-link-tool.pages.dev
- Framework preset: なし
- [ ] Root directory: 空欄 / リポジトリルート
- [ ] build command: 不要 / 空欄
- [ ] build output directory: `apps/web`
- [ ] Functions directory: `functions`
- [x] Static security headers: `apps/web/_headers`
- [x] API実行基盤: Cloudflare Pages Functions / Workers
- [x] `/api/extract`: `functions/api/extract.js`
- [x] KV namespace binding: `X_POST_CACHE` -> `x-archive-link-tool-post-cache`（Production）
- [ ] 独自ドメイン: 後回し
- Environment variables: `X_BEARER_TOKEN` はsecretとして設定済み。値は記録しない。未設定時はoEmbed fallback。

Root directoryを `apps/web` にすると、リポジトリ直下の `functions/` が認識されない可能性があるため、空欄またはリポジトリルートのままにする。

## GitHub Actions CI

- Issue #2の判断として、最小CIを導入する。
- Workflow: `.github/workflows/ci.yml`
- Trigger: pull request、`master` へのpush、`workflow_dispatch`
- Permission: `contents: read`
- Job: Ubuntu runnerで `npm test` のみを実行する。
- package-lock.json がないため、install stepは入れない。
- lint/typecheck/format専用scriptは `package.json` にないため、今回のCIには追加しない。
- 費用影響: GitHub Actionsのincluded minutes内なら追加費用0円見込み。ただしaccount plan、残minutes、spending limit、overage単価は未確認。Issue #2にこの判断を関連付ける。

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
- Cloudflare Pages Deploymentsで `13051d6` のProduction deploy成功: OK（人間側で確認済み）。
- `13051d6` deploy後のトップページ表示: OK。
- `13051d6` deploy後の `/api/extract` 再実行: 未実施。
- Cloudflare Pages Deploymentsで `d31275d` のProduction deploy成功: OK（人間側で確認済み）。
- `d31275d` deploy後のトップページ表示: HTTP 200、title `Xポスト貼り付けテキスト生成`。
- `d31275d` deploy後の `/api/extract` 再実行、429本番確認、X API呼び出し: 未実施。
- Cloudflare Pages Deploymentsで `ca0bd79` のProduction deploy成功: OK（人間側で確認済み）。
- `ca0bd79` deploy後のトップページ表示: HTTP 200、title `Xポスト貼り付けテキスト生成`。
- `ca0bd79` deploy後の `/api/extract` 再実行、429本番確認、X API呼び出し: 未実施。
- Static security headersは `apps/web/_headers` で設定する。公開静的ページのHEAD/GETではCSP、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy` を確認する。
- GitHub check-runで `cbe25119008814542df28bcd6ea7cc1159d7e3af` のCloudflare Pages successを確認。external_idは `373397d2-7347-4f4c-bf53-06e42110f4d9`、details URLはCloudflare DashboardのPages deployment URL。ただし、GitHub check-run単独のためProduction正式証跡とは扱わない。
- `cbe25119008814542df28bcd6ea7cc1159d7e3af` deploy後と推定される公開URL `https://x-archive-link-tool.pages.dev/privacy.html` の静的表示は確認済み。H1 `プライバシーポリシー`、問い合わせ先、法務未レビュー表示、console error 0件。ただし公開URL表示だけでは、特定commitのProduction deployment成功は断定しない。
- Cloudflare Pages deployment一覧で `cbe25119008814542df28bcd6ea7cc1159d7e3af` がProduction deploymentとして成功した正式証跡は未確認。Codex環境では `wrangler 4.92.0` の `wrangler whoami` が未認証で、Pages deployment一覧を読めなかった。
- 2026-05-18 20:40 JSTに `npx wrangler pages deployment list --project-name x-archive-link-tool --environment production --json` を実行し、レビューhardening反映時点のHEAD `1a8fad5b02f540ec1c60ab5e62ffa0c4597533f7` の短縮 `1a8fad5` がCloudflare Pages Production deployment一覧にあることを正式証跡として確認済み。deployment IDは `a79ddcf6-83ba-4dd3-929d-1bb6adc4ecf6`、deployment URLは `https://a79ddcf6.x-archive-link-tool.pages.dev`、environmentは `Production`、branchは `master`、WranglerのStatus欄は `16 minutes ago`、Build URLは `https://dash.cloudflare.com/68b0957405bae91b41430d49645e230f/pages/view/x-archive-link-tool/a79ddcf6-83ba-4dd3-929d-1bb6adc4ecf6`。
- 2026-05-18 20:50 JSTに同じWrangler読み取り確認を再実行し、PR #8 merge後の当時確認対象HEAD `2db0a89a39424ebb1d43268e4e4af7a19b01bc39` の短縮 `2db0a89` がCloudflare Pages Production deployment一覧にあることを正式証跡として確認済み。deployment IDは `aaadb2ac-bd83-43f5-a4e2-960f9f7a1e4e`、deployment URLは `https://aaadb2ac.x-archive-link-tool.pages.dev`、environmentは `Production`、branchは `master`、WranglerのStatus欄は `4 minutes ago`、Build URLは `https://dash.cloudflare.com/68b0957405bae91b41430d49645e230f/pages/view/x-archive-link-tool/aaadb2ac-bd83-43f5-a4e2-960f9f7a1e4e`。
- Wranglerのdeployment listは明示的な `Success` 文字列を返さず、Status欄は相対時刻表示だった。補助証跡として、同commitのGitHub上Cloudflare Pages check-run success、公開 `https://x-archive-link-tool.pages.dev/` のHEAD/GET 200、公開 `https://x-archive-link-tool.pages.dev/privacy.html` の `/privacy` redirect後HEAD/GET 200、主要security headersありを確認済み。

## 本番環境で必要な設定

- [ ] `PORT`: Cloudflare Pagesでは不要
- [x] `RATE_LIMIT_PER_IP_PER_MINUTE`: Productionに `10` を設定済み
- [x] `RATE_LIMIT_GLOBAL_PER_MINUTE`: Productionに `60` を設定済み
- [x] `X_BEARER_TOKEN`: secretとして設定済み。値は記録しない。
- [x] `X_POST_CACHE`: Cloudflare KV namespace binding。Productionでは `x-archive-link-tool-post-cache` を設定済み。

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
- [ ] X API credits / billing / usage capを見ながら値を見直す頻度: 未確認 / 人間判断待ち。
- [ ] 正常利用者が429になった場合の問い合わせ先と対応基準: 未確認 / 人間判断待ち。

429確認方針:

- 原則として429挙動はローカルテストで確認する。`npm test` にはrate limitの既定値、環境変数指定、不正値fallback、429時の `Retry-After`、429本文の非漏えい確認が含まれる。
- 本番で429確認を行うのは、公開前に人間が必要と判断した場合だけにする。
- 本番で確認する場合も、実X API通信回数を増やさない方法を先に別checkpointで決める。安全に担保できない場合は実行しない。
- 本番確認中に429以外の応答、5xx、X API provider warning、想定外のFunctionsログ、実X API通信増加の疑いが出た場合は追加実行せず停止する。
- 記録してよい項目はHTTP status、`Retry-After` の有無、エラーcode、実行回数、確認時刻、Cloudflare deploy commit、warnings件数だけにする。
- 記録禁止項目は実投稿URL、投稿本文、mediaUrls値、username、postId、token、Authorization header、secret値、Cookie、Cloudflare内部ログの詳細本文。
- 問い合わせ先、429時の対応基準、X API credits / billing / usage capの見直し頻度は未確認。

## 公開後運用ハンドオーバー

現状:

- `ca0bd79` のCloudflare Production deploy成功は人間側で確認済み。
- `ca0bd79` deploy後のProduction URLトップページはHTTP 200、title `Xポスト貼り付けテキスト生成` として確認済み。
- `cbe25119008814542df28bcd6ea7cc1159d7e3af` はGitHub check-runと公開URL静的表示を確認済み。ただしCloudflare Pages deployment一覧またはDashboardでのProduction正式証跡は未確認。
- `1a8fad5b02f540ec1c60ab5e62ffa0c4597533f7` はレビューhardening反映時点の証跡としてWranglerのCloudflare Pages Production deployment一覧で確認済み。
- `2db0a89a39424ebb1d43268e4e4af7a19b01bc39` は2026-05-18 20:50 JST時点のWrangler Cloudflare Pages Production deployment一覧で正式証跡を確認済み。
- 2026-05-31 12:51 JSTにIssue #41として現在の本番稼働HEADを確認済み。確認対象はmaster HEAD `a6fe436f3f08326c6479561ea997ed6bb3e23f9c`。Cloudflare Workers and Pages GitHub Appのcheck suite `71569644229` は `head_branch=master`, `head_sha=a6fe436f3f08326c6479561ea997ed6bb3e23f9c`, conclusion `success`。Cloudflare Pages check-run `78690922988` は `Latest commit: a6fe436`, `Deploy successful`, deployment ID `143cd043-10bf-406b-b8c8-3a22bb6a9ca2`。Production URL静的 `/` と `/privacy.html` はGET 200、deployment URL静的 `/` もGET 200。root pageのETagはproduction URLとdeployment URLで一致した。
- Production URLトップページ表示はCodex側でHTTP 200を確認済み。ただしトップページ表示だけでは、特定commitのProduction deploy成功は断定しない。
- GitHub check-run successだけではCloudflare Production正式証跡として扱わない。Cloudflare Dashboard、Cloudflare plugin、Pages deployment一覧、またはIssue #41のようにCloudflare Workers and Pages GitHub Appのmaster向けcheck suite/check-run、repoのProduction branch記録、公式docs、公開静的URLの一致を組み合わせた証跡で該当commitのProduction反映を確認できた場合だけProduction確認済みとして記録する。
- `/api/extract` は `ca0bd79` deploy後には再実行していない。429本番確認とX API呼び出しも未実施。

通常確認:

- GitHub push後はCloudflare Pages Deploymentsで該当commitのProduction成功を確認する。
- Production URLトップページ表示を確認する。
- Codexで `wrangler pages deployment list --project-name x-archive-link-tool --environment production --json` を使う場合は、既存認証で `wrangler whoami` が成功する場合だけ実行する。`wrangler login`、OAuth再接続、secret入力が必要な場合は実行せず、人間側確認に切り替える。
- `/api/extract` の本番確認は必要時のみ行う。実X API/oEmbed通信やcredits影響があり得るため、人間承認なしに実行しない。
- 本番429確認も、実X API/oEmbed通信やcredits影響があり得るため、人間承認なしに実行しない。
- 確認結果にはHTTP status、source、cached、mediaUrls件数、warnings件数だけを書く。

人間側のCloudflare Dashboard確認手順:

1. Cloudflare Dashboardで Pages project `x-archive-link-tool` を開く。
2. Deployments一覧でEnvironmentが `Production` のdeploymentを確認する。
3. Deployment detailでbranchが `master`、commitが対象HEADまたは短縮hash、statusがSuccessであることを確認する。過去確認済みの例は `2db0a89a39424ebb1d43268e4e4af7a19b01bc39` または短縮 `2db0a89` だが、現在の本番稼働HEADはこの手順で改めて確認する。
4. deployment URLまたはdeployment ID、environment、branch、commit hash、created/deployed time、statusを記録する。
5. GitHub check-run successや公開URL表示だけでProduction正式確認済みとは書かない。
6. 本番 `/api/extract`、本番429確認、実X API/oEmbed live通信は、この確認手順では実行しない。

KV post cache:

- Production bindingは `X_POST_CACHE`、namespaceは `x-archive-link-tool-post-cache`。
- TTLは30日。
- 同一投稿URLで2回確認済み。1回目は `source=x-api-v2`, `cached=false`, mediaUrls件数4, warnings件数0。2回目は `source=cache`, `cached=true`, mediaUrls件数4, warnings件数0。
- KVは最適化層。KV障害時もorigin取得を優先する設計だが、正式な切り戻し判断者と手順は未確認。

Rate limit:

- Production初期値は `RATE_LIMIT_PER_IP_PER_MINUTE=10`, `RATE_LIMIT_GLOBAL_PER_MINUTE=60`。
- Cloudflare Functionsのrate limiterはisolate単位のbest-effortであり、真のglobal制限ではない。
- 429挙動は原則ローカルテストで確認する。
- 本番429確認は未実施。実施する場合は別checkpointで手順を決める。
- X API credits / billing / usage capの見直し頻度と、429時の問い合わせ先・対応基準は未確認。

記録禁止:

- `X_BEARER_TOKEN` の値、token、Authorization header、secret値、Cookie。
- 実投稿URL、投稿本文、mediaUrls値、username、postId。
- Cloudflare内部ログの詳細本文。

残タスク:

- 問い合わせ先 `h8nc4y.sub01@gmail.com` の公開可否、サポート範囲、法務レビュー要否を人間側で確定する。
- ログ保存期間を人間側で確定する。
- Cloudflare Functionsログ確認の運用責任者を人間側で決める。
- KV障害時の正式な切り戻し手順を人間側で決める。
- X API credits / billing / usage capの見直し頻度を人間側で決める。

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

- [ ] `npm test` を実行する。`package.json` のtestにはURL validator、rate limiter、KV post cache、extract service、Cloudflare Pages Functions extract testsを含める。
- [ ] `docs/pre-release-checklist.md` を再確認する。
- [ ] `docs/privacy-policy-draft.md` と `docs/support-page-draft.md` の未設定項目を埋める。
- [x] 公開先の環境変数にレート制限値を設定する。
- [ ] 公開前にWeb UIを確認する。
- [ ] 本番 `/api/extract` と本番429確認は、人間承認後に実X API/oEmbed通信やcredits影響のない手順を決められた場合だけ実行する。

## ロールバック方針

- [ ] 公開直前のGit commitを記録する。
- [ ] 問題があれば直前の安定版commitへ戻す。
- [ ] ロールバック担当者と判断基準を決める: 未設定 / 人間判断待ち
- レート制限値の変更で回避できる問題は、コード変更より先に設定値で対応する。
- X API v2側障害やoEmbed側障害が疑われる場合は、既存cacheがあればstale-cacheとして返す。

## KV post cache運用・障害時チェック

- 通常確認はProduction redeploy後に同一投稿URLで最大2回だけ行う。1回目が `source=x-api-v2`, `cached=false`、2回目が `source=cache`, `cached=true` ならKV hit相当。
- 確認結果を記録する場合はHTTP status、source、cached、mediaUrls件数、warnings件数だけを書く。実投稿URL、投稿本文、mediaUrls値、username、postId、token、Authorization headerは記録しない。
- 2回目がcacheにならない場合は、Production binding `X_POST_CACHE` が `x-archive-link-tool-post-cache` を指しているか、binding追加後のProduction redeployが成功しているか、Functionsログに重大エラーがないかを確認する。
- `source=oembed` とX API provider failure warningが出る場合は、X API credits / billing / permission / rate limitを確認する。token値は表示、共有、保存しない。
- KVは最適化層として扱う。KV get/set/payload parse失敗時もorigin取得が動く想定だが、serverlessのin-memory cacheは本番永続化として期待しない。
- in-memory cacheとrate limiterはCloudflare isolate単位のbest-effort。真のglobal制限や共有状態が必要になった場合はKVまたはDurable Object等を別工程で検討する。
- KV valueには正規化済み投稿情報が含まれる可能性があるため、Cloudflare画面やログから値をコピーしてdocs、issue、チャットへ貼らない。

## 本番未設定項目と運用残リスク

- [x] `RATE_LIMIT_PER_IP_PER_MINUTE`: Cloudflare Production環境変数に `10` を設定済み。
- [x] `RATE_LIMIT_GLOBAL_PER_MINUTE`: Cloudflare Production環境変数に `60` を設定済み。
- [x] 問い合わせ先: `h8nc4y.sub01@gmail.com` をユーザー指定値として反映済み。法務レビュー済みではない。
- [x] プライバシーポリシーURL: `/privacy.html` 候補を作成済み。公開URLでは `/privacy` へredirectされ、静的表示と主要security headersは2026-05-18時点で確認済み。Cloudflare Pages deployment一覧でのHEAD証跡は過去確認記録として残す。
- [x] Cloudflare Pages deploy status確認: 人間側で `ca0bd79` のProduction成功を確認済み。
- [ ] `cbe25119008814542df28bcd6ea7cc1159d7e3af` のCloudflare Production deploy成功状態: GitHub check-runと公開URL静的表示は確認済み。Cloudflare Pages deployment一覧またはDashboardでの正式証跡は未確認。
- [x] レビューhardening反映HEAD `1a8fad5b02f540ec1c60ab5e62ffa0c4597533f7` のCloudflare Production deploy状態: WranglerのCloudflare Pages Production deployment一覧で正式証跡を確認済み。deployment IDは `a79ddcf6-83ba-4dd3-929d-1bb6adc4ecf6`。
- [x] 2026-05-18 20:50 JST時点の確認対象HEAD `2db0a89a39424ebb1d43268e4e4af7a19b01bc39` のCloudflare Production deploy状態: WranglerのCloudflare Pages Production deployment一覧で正式証跡を確認済み。deployment IDは `aaadb2ac-bd83-43f5-a4e2-960f9f7a1e4e`。
- [x] 2026-05-31 12:51 JST時点の現在master HEAD `a6fe436f3f08326c6479561ea997ed6bb3e23f9c` のProduction HEAD確認: read-only GitHub/Cloudflare Pages check metadataと静的ページGETで確認済み。Cloudflare Pages deployment listはWrangler未導入のため未実行。
- [ ] Cloudflare Functionsログ確認の運用責任者: 未設定 / 人間判断待ち。
- [ ] ログ保存期間: 未設定 / 人間判断待ち。
- [ ] KV namespace / binding / TTL運用: namespaceは `x-archive-link-tool-post-cache`、bindingは `X_POST_CACHE`、TTLは30日。TTL長期運用時の定期確認方法は未確認。
- [ ] KV障害時の正式切り戻し手順: 候補は `X_POST_CACHE` bindingを外してProduction redeployし、in-memory fallbackで継続すること。ただし実施判断者、切り戻し条件、復旧後の再有効化手順は未確認。
- [ ] X API credits / billing / usage cap見直し頻度: 未確認 / 人間判断待ち。
- [ ] 429本番確認: 未実施。原則ローカルテストで担保し、本番確認は実X API/oEmbed通信やcredits影響があり得るため、人間承認後に手順を決めてから行う。
- [ ] 実X API/oEmbed通信回数を増やさない確認方針: 同一投稿URLで最大2回。1回目がHTTP 200かつmediaUrls取得成功の場合だけ2回目を行う。失敗時は追加実行しない。
- [ ] 記録禁止方針: token、Authorization header、secret値、実投稿URL、投稿本文、mediaUrls値、username、postIdはdocs、issue、チャット、ログへ貼らない。

## 既知の制限

- userNumericIdはoEmbed fallbackでは未取得。
- media direct URLsはoEmbed fallbackでは未取得。
- oEmbedで取得できない投稿がある。
- 投稿本文と投稿日は安全に抽出できない場合 `未取得`。
- 魚拓はユーザー操作で外部リンクを開くだけ。
- Cloudflare Pages/Functionsのin-memory cacheは永続化ではない。ProductionではCloudflare KV binding `X_POST_CACHE` を使う。D1は使わない。
