# Privacy Policy Draft

これは法務確定版ではなく、公開前検討用のドラフトです。法務レビュー済みではありません。

公開URL候補: `https://x-archive-link-tool.pages.dev/privacy.html`

公開URLの静的表示: 確認済み

現在の本番稼働HEAD `2db0a89a39424ebb1d43268e4e4af7a19b01bc39` のCloudflare Pages Production deployment正式証跡: 確認済み（Wrangler deployment ID `aaadb2ac-bd83-43f5-a4e2-960f9f7a1e4e`）

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
- ログ保存期間は未設定 / 人間判断待ちです。

## 外部サービス

- X API v2取得のため `https://api.x.com/2/tweets/{postId}` を使用する場合があります。
- oEmbed fallback取得のため `https://publish.x.com/oembed` を使用します。
- 魚拓リンクはユーザー操作で外部サイトを開きます。
- 魚拓は自動取得しません。

## 問い合わせ先

`h8nc4y.sub01@gmail.com`

この問い合わせ先はユーザー指定値として反映したもので、公開前にサポート範囲と法務レビュー要否を確認します。

## 公開前レビューで決めること

- [x] 問い合わせ先: `h8nc4y.sub01@gmail.com`
- [x] プライバシーポリシーURL: `/privacy.html` 候補。公開URLでは `/privacy` へredirectされ、静的表示と主要security headersは確認済み。最新HEADのCloudflare Pages Production deployment正式証跡も確認済み
- [ ] ログ保存期間: 未設定 / 人間判断待ち
- [ ] 法務または運用責任者による確認: 未設定 / 人間判断待ち
