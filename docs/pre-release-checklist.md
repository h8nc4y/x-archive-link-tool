# Pre-release Checklist

公開前に確認する最小チェックリストです。本番デプロイ設定はまだ行わない。

## ローカル確認

- `node --test server/urlValidator.test.js server/extractServer.test.js server/oEmbedClient.test.js server/env.test.js apps/web/app.test.js scripts/manualOEmbedCheck.test.js` が成功する。
- `node server/extractServer.js` でローカル起動できる。
- `http://127.0.0.1:3000/healthz` が `{"ok":true}` を返す。
- Web UIで公開XポストURLを1件入力し、コピー用 `textarea` に結果が出る。
- oEmbed実通信確認は `scripts/manualOEmbedCheck.js` で行い、投稿URL、本文、username、postId、JSON valuesを出力しない。

## 仕様確認

- X_BEARER_TOKEN は不要。
- X API v2 と `api.x.com` は使わない。
- サーバー外向き通信先は `https://publish.x.com/oembed` のみ。
- oEmbedへ渡すURLは validator が生成した `canonicalXPostUrl` のみ。
- 魚拓は自動取得しない。
- 魚拓リンクは `https://gyo.tc/{postUrl}` の外部リンクのみ。

## 取得できない項目

- userNumericId は `未取得`。
- media direct URLs は取得しない。
- mediaUrls は空配列。Web UIでは `なし`。
- 投稿本文と投稿日は安全に抽出できない場合 `未取得`。

## セキュリティ確認

- `innerHTML` / `dangerouslySetInnerHTML` 相当を使わない。
- oEmbed HTMLを画面にHTMLとして表示しない。
- ユーザー入力URLをfetchしない。
- 任意URLを外部へ渡さない。
- X HTMLスクレイピング、OGP取得、短縮URL展開、メディアダウンロードをしない。
- ログに入力URL、投稿内容、username、postId、HTML本文、mediaUrlsを出さない。

## 公開前に決めること

- 公開先
- ドメイン
- レート制限値
- 問い合わせ先
- プライバシーポリシー
