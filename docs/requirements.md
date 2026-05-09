# Requirements

## MVP対象範囲

- 入力はXのポスト共有URLのみ。
- URLを検証し、`canonicalXPostUrl` を生成する。
- 貼り付け用テキスト出力項目を固定する。
- X API v2は使わず、公式oEmbed endpoint `https://publish.x.com/oembed` だけを使う。
- oEmbed由来HTMLは画面にHTMLとして描画しない。
- ユーザー数値IDとメディア直接URLは未取得とする。
- 投稿日と本文は安全にプレーンテキスト抽出できる場合だけ扱い、抽出できない場合は `未取得` とする。
- 魚拓は自動取得せず、リンクだけを表示する。
- X API Bearer Tokenは使わない。

## 出力項目

- アカウント名
- `@username`
- ユーザー数値ID
- ポストURL
- 投稿日
- 本文
- メディアURL
- 魚拓URL

## 対象外

- iOSアプリ
- DB
- ユーザー入力URLのサーバーfetch
- X HTMLスクレイピング
- ブラウザ自動化でのX閲覧
- ウェブ魚拓のサーバー取得
- OGP取得
- 短縮URL展開
- メディアダウンロード
- X投稿本文、メディアURL、アカウント情報の保存
- X API v2
- `api.x.com`

## 入力URL仕様

入力はXのポスト共有URLのみ。

許可する形式:

- `https://x.com/{username}/status/{postId}`
- `https://twitter.com/{username}/status/{postId}`
- `https://mobile.twitter.com/{username}/status/{postId}`

## URL検証ルール

- protocol: `https` only
- exact hosts: `x.com`, `twitter.com`, `mobile.twitter.com`
- path: `/{username}/status/{postId}`
- username: `/^[A-Za-z0-9_]{1,15}$/`
- postId: `/^[0-9]{1,19}$/` as string
- query/hash are dropped
- reject redirects, short URLs, other hosts, other paths

`canonicalXPostUrl` は `https://x.com/{username}/status/{postId}` とする。

## 魚拓リンク仕様

- 表示文言: `魚拓を取得する場合はこちら`
- `href = https://gyo.tc/{canonicalXPostUrl}`
- `target="_blank"`
- `rel="noopener"`
- `noreferrer` は付けない
- サーバーから魚拓を取得しない

## 今後の実装順序

1. ローカルMVPのセルフレビューを行う。
2. 必要な安全修正とテストを最小追加する。
3. iOS版を検討する。
4. 本番デプロイ設定は別工程で検討する。
