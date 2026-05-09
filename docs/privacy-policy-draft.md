# Privacy Policy Draft

これは法務確定版ではなく、公開前検討用のドラフトです。

## 取り扱う情報

- 入力されたXポストURLは、貼り付け用テキスト生成のため一時的に使用します。
- 入力URLはvalidatorで検証し、`canonicalXPostUrl` に正規化します。
- oEmbed取得のため、`canonicalXPostUrl` を `https://publish.x.com/oembed` へ送信します。

## 保存しない情報

- DB保存はしません。
- X投稿本文を保存しません。
- メディアURLを保存しません。
- ユーザー情報を保存しません。
- 魚拓URLをサーバーで取得または保存しません。

## ログ

- ログに投稿内容を出しません。
- ログに入力URL、username、postId、HTML本文、mediaUrlsを出しません。
- 障害調査用には、request_id、method、path、statusCode、durationMs、errorCodeなどの安全な項目だけを使います。

## 外部サービス

- oEmbed取得のため `https://publish.x.com/oembed` を使用します。
- 魚拓リンクはユーザー操作で外部サイトを開きます。
- 魚拓は自動取得しません。

## 問い合わせ先

TODO/未設定

## 公開前レビューで決めること

- [ ] 問い合わせ先: TODO/未設定
- [ ] プライバシーポリシーURL: TODO/未設定
- [ ] ログ保存期間: TODO/未設定
- [ ] 法務または運用責任者による確認: TODO/未設定
