# API Draft

## POST /api/extract

Xポスト共有URLを受け取り、貼り付け用テキスト生成に必要な項目を返すAPI。

## Request

```json
{
  "url": "https://x.com/example/status/1234567890123456789"
}
```

## URL検証

- protocol: `https` only
- exact hosts: `x.com`, `twitter.com`, `mobile.twitter.com`
- path: `/{username}/status/{postId}`
- username: `/^[A-Za-z0-9_]{1,15}$/`
- postId: `/^[0-9]{1,19}$/` as string
- query/hash are dropped
- reject redirects, short URLs, other hosts, other paths

サーバーは入力URLをfetchしない。リダイレクト確認、短縮URL展開、OGP取得は行わない。

## oEmbed request

X API v2は使わない。サーバー外向き通信先は公式oEmbed endpointだけに限定する。

- endpoint: `https://publish.x.com/oembed`
- `url`: URL validatorで生成した `canonicalXPostUrl` のみ
- `omit_script=1`
- `dnt=true`

## Response案

```json
{
  "accountName": "Example",
  "username": "example",
  "userNumericId": "未取得",
  "postId": "1234567890123456789",
  "postUrl": "https://x.com/example/status/1234567890123456789",
  "createdAt": "未取得",
  "text": "未取得",
  "mediaUrls": []
}
```

値はサーバー側のoEmbed clientで取得して正規化する。oEmbed HTMLはレスポンスへそのまま返さず、本文と投稿日は安全にプレーンテキスト抽出できる場合だけ返す。ユーザー数値IDとメディア直接URLは取得しない。魚拓URLはAPIレスポンスに含めず、Web UI側で任意入力または外部リンク導線として扱う。

## 魚拓リンク仕様

`canonicalXPostUrl = https://x.com/{username}/status/{postId}`

```html
<a href="https://gyo.tc/{canonicalXPostUrl}" target="_blank" rel="noopener">魚拓を取得する場合はこちら</a>
```

`noreferrer` は付けない。サーバー側から魚拓を取得しない。

## ログ

残す情報:

- リクエスト時刻
- APIエンドポイント名
- 成功または失敗の種別
- URL検証エラーの分類
- request_id
- method
- path
- statusCode
- durationMs
- errorCode

残さない情報:

- 入力された生URL
- 投稿本文
- メディアURL
- アカウント名
- `@username`
- postId
- ユーザー数値ID
- 認証情報
