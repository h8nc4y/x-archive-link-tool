# Privacy Policy Draft

これは法務確定版ではなく、公開前検討用のドラフトです。

## 取り扱う情報

- 入力されたXポストURLは、貼り付け用テキスト生成のため一時的に使用します。
- 入力URLはvalidatorで検証し、`canonicalXPostUrl` に正規化します。
- `X_BEARER_TOKEN` 設定時はX API v2取得のためpostIdを `https://api.x.com/2/tweets/{postId}` へ送信します。
- `X_BEARER_TOKEN` 未設定時はoEmbed取得のため、`canonicalXPostUrl` を `https://publish.x.com/oembed` へ送信します。
- API利用料削減のため、正規化済みの投稿情報をpostId単位でキャッシュします。

## 保存しない情報

- DB保存はしません。
- DB保存は未実装です。
- サーバーログにX投稿本文を保存しません。
- サーバーログにメディアURLを保存しません。
- サーバーログにユーザー情報を保存しません。
- 魚拓URLをサーバーで取得または保存しません。

## ログ

- ログに投稿内容を出しません。
- ログに入力URL、username、postId、HTML本文、mediaUrlsを出しません。
- 障害調査用には、request_id、method、path、statusCode、durationMs、errorCodeなどの安全な項目だけを使います。

## 外部サービス

- X API v2取得のため `https://api.x.com/2/tweets/{postId}` を使用する場合があります。
- oEmbed fallback取得のため `https://publish.x.com/oembed` を使用します。
- 魚拓リンクはユーザー操作で外部サイトを開きます。
- 魚拓は自動取得しません。

## 問い合わせ先

未設定 / 人間判断待ち

## 公開前レビューで決めること

- [ ] 問い合わせ先: 未設定 / 人間判断待ち
- [ ] プライバシーポリシーURL: 未設定 / 人間判断待ち
- [ ] ログ保存期間: 未設定 / 人間判断待ち
- [ ] 法務または運用責任者による確認: 未設定 / 人間判断待ち
