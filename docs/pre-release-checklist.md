# Pre-release Checklist

公開前に確認する最小チェックリストです。Cloudflare Productionの一部設定は完了済みで、未確認事項は未確認のまま残します。

## ローカル確認

- `npm test` が成功する。直近確認は92 tests pass。
- `node server/extractServer.js` でローカル起動できる。
- `http://127.0.0.1:3000/healthz` が `{"ok":true}` を返す。
- Web UIで公開XポストURLを1件入力し、コピー用 `textarea` に結果が出る。
- oEmbed実通信確認は `scripts/manualOEmbedCheck.js` で行い、投稿URL、本文、username、postId、JSON valuesを出力しない。

## Cloudflare Production設定

- Project: `x-archive-link-tool`
- KV namespace: `x-archive-link-tool-post-cache`
- Pages Production binding: `X_POST_CACHE`
- `RATE_LIMIT_PER_IP_PER_MINUTE=10`
- `RATE_LIMIT_GLOBAL_PER_MINUTE=60`
- `X_BEARER_TOKEN`: secretとして設定済み。値は記録しない。
- Production redeploy: 人間側で実施済み。
- Production deploy成功状態: `ca0bd79` は人間側で確認済み。`ca0bd79` 以降の最新push済みcommitのProduction deploy成功状態は未確認。
- Production URLトップページ表示: HTTP 200、title `Xポスト貼り付けテキスト生成`。
- `/api/extract`、429本番確認、X API呼び出し: この確認では実行していない。

## 本番確認済み

- KV post cache: 同一投稿URLで2回確認済み。
- 1回目: `source=x-api-v2`, `cached=false`, mediaUrls件数4, warnings件数0。
- 2回目: `source=cache`, `cached=true`, mediaUrls件数4, warnings件数0。
- 推定実X API通信回数: 1回。

## 仕様確認

- X_BEARER_TOKEN は任意。設定時だけBring Your Own Token方式でX API v2を使う。
- cache hit時はX API v2 providerを呼ばない。
- サーバー外向き通信先は `https://api.x.com/2/tweets/{postId}` または `https://publish.x.com/oembed` のみ。
- oEmbedへ渡すURLは validator が生成した `canonicalXPostUrl` のみ。
- 魚拓は自動取得しない。
- 魚拓リンクは `https://gyo.tc/{postUrl}` の外部リンクのみ。

## 取得できない項目

- userNumericId は `未取得`。
- media direct URLs はX API v2取得時だけ返る。oEmbed fallbackでは取得しない。
- mediaUrls はoEmbed fallbackでは空配列。Web UIでは `なし`。
- 投稿本文と投稿日は安全に抽出できない場合 `未取得`。

## セキュリティ確認

- `innerHTML` / `dangerouslySetInnerHTML` 相当を使わない。
- oEmbed HTMLを画面にHTMLとして表示しない。
- ユーザー入力URLをfetchしない。
- 任意URLを外部へ渡さない。
- X HTMLスクレイピング、OGP取得、短縮URL展開、メディアダウンロードをしない。
- ログに入力URL、投稿内容、username、postId、HTML本文、mediaUrlsを出さない。

## 公開前に決めること

- 公開先: Cloudflare Pages。
- ドメイン: Cloudflare Pages無料URL。独自ドメインは後回し。
- レート制限値: Production初期値はper IP 10/min、global 60/min。
- 問い合わせ先: 未設定 / 人間判断待ち。
- プライバシーポリシーURL: 未設定 / 人間判断待ち。
- ログ保存期間: 未設定 / 人間判断待ち。
- KV障害時の正式切り戻し手順: 未設定 / 人間判断待ち。
- X API credits / billing / usage capを見直す頻度: 未確認 / 人間判断待ち。
- 正常利用者が429になった場合の問い合わせ先と対応基準: 未確認 / 人間判断待ち。
- 429確認方針: 原則ローカルテストで担保し、本番確認は必要時のみ別checkpointで手順を決める。

## 公開後運用TODO候補

- Cloudflare Functionsログ確認の運用責任者: 未設定 / 人間判断待ち。
- Cloudflare Functionsログ確認の頻度と確認手順: 未設定 / 人間判断待ち。
- KV TTL長期運用時の定期確認方法: 未確認 / 人間判断待ち。

## 残確認

- Cloudflare Pages Deployments上の `ca0bd79` Production deploy成功状態は人間側で確認済み。`ca0bd79` 以降の最新push済みcommitのProduction deploy成功状態は未確認。
- rate limit設定後の実際の429挙動は未確認。確認する場合は、実X API通信回数を増やさない方法を別checkpointで決める。
- 本番429確認の停止条件: 429以外の応答、5xx、X API provider warning、想定外のFunctionsログ、実X API通信増加の疑いがある場合は追加実行しない。
- 429確認で記録してよい項目: HTTP status、`Retry-After` の有無、エラーcode、実行回数、確認時刻、Cloudflare deploy commit、warnings件数。
- 確認結果にはHTTP status、source、cached、mediaUrls件数、warnings件数だけを書く。実投稿URL、投稿本文、mediaUrls値、username、postId、token、Authorization headerは記録しない。
