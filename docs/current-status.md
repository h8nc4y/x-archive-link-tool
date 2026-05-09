# Current Status

oEmbed版Web MVPの現在状態です。

## 現在できること

- Xポスト共有URLを入力できる。
- URLを検証し、`canonicalXPostUrl` に正規化できる。
- 公式oEmbed endpoint `https://publish.x.com/oembed` から取得できる範囲を正規化できる。
- Web UIでコピー用テキストを `textarea` に表示できる。
- 魚拓リンクを外部リンクとして表示できる。
- ローカルで `/healthz` を確認できる。

## 現在できないこと

- 本番公開
- iOSアプリ
- DB保存
- ユーザー認証
- X API v2利用
- `api.x.com` への通信
- OGP取得、短縮URL展開、スクレイピング、メディアダウンロード
- 魚拓の自動取得

## 仕様上あえて取得しないもの

- X_BEARER_TOKEN
- ユーザー数値ID
- メディア直接URL
- oEmbed HTMLそのもの
- 魚拓URLのサーバー取得結果

## 手動確認済み結果

- oEmbed版Web MVPはローカルで起動できる。
- Web UIでXポストURLを入力して取得できる。
- コピー用 `textarea` に結果が表示される。
- userNumericId は `未取得`。
- mediaUrls が空の場合、Web UIでは `なし`。
- 魚拓リンクは表示される。
- 魚拓は自動取得されない。
- ポート競合時の案内を表示できる。

## 次の推奨作業

- 公開先とドメインを決める。
- レート制限値を公開前に見直す。
- 問い合わせ先とプライバシーポリシーを用意する。
- 公開前チェックリストを再実行する。
