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
- path: `/{username}/status/{postId}` または `/i/web/status/{postId}`
- username: `/^[A-Za-z0-9_]{1,15}$/`
- postId: `/^[0-9]{1,19}$/` as string
- query/hash are dropped
- reject redirects, short URLs, other hosts, other paths

サーバーは入力URLをfetchしない。リダイレクト確認、短縮URL展開、OGP取得は行わない。

## Provider selection

- cache-first。正規化したpostIdでcache hitした場合、X API v2もoEmbedも呼ばない。
- cache missかつ `X_BEARER_TOKEN` 設定時だけ、Bring Your Own Token方式でX API v2を呼ぶ。
- `X_BEARER_TOKEN` 未設定時は公式oEmbed endpointをfallbackとして使う。
- X API認証、権限、rate limit、上流エラー時は、可能ならoEmbed fallbackへ戻し、warning付きで返す。
- fallback warningには安全な範囲で上流HTTP statusだけを含める。401はBearer Token不正、402はX API credits / billing / payment required、403はApp権限/プラン/endpoint access不足、429はrate limit/usage capの可能性がある。

## X API v2 request

- endpoint: `https://api.x.com/2/tweets/{postId}`
- `expansions=attachments.media_keys,author_id`
- `media.fields=url,preview_image_url,variants,type,width,height,alt_text,duration_ms`
- `tweet.fields=created_at,entities,attachments`
- `user.fields=username,name`
- Bearer Tokenはサーバー側環境変数 `X_BEARER_TOKEN` からのみ読む。

## oEmbed fallback request

- endpoint: `https://publish.x.com/oembed`
- `url`: URL validatorで生成した `canonicalXPostUrl` のみ
- `omit_script=1`
- `dnt=true`

## Response案

```json
{
  "id": "1234567890123456789",
  "canonicalUrl": "https://x.com/i/web/status/1234567890123456789",
  "authorName": "Example",
  "username": "example",
  "createdAt": "未取得",
  "text": "未取得",
  "expandedUrls": [],
  "media": [],
  "mediaUrls": [],
  "source": "cache",
  "cached": true,
  "fetchedAt": "2026-05-10T00:00:00.000Z",
  "cacheExpiresAt": "2026-06-09T00:00:00.000Z",
  "warnings": []
}
```

後方互換のため、Web UI向けに `accountName`, `userNumericId`, `postId`, `postUrl` も返す場合がある。oEmbed HTMLはレスポンスへそのまま返さず、本文と投稿日は安全にプレーンテキスト抽出できる場合だけ返す。oEmbed fallbackではメディア直接URLを取得できない場合がある。魚拓URLはAPIレスポンスに含めず、Web UI側で任意入力または外部リンク導線として扱う。

## Cache policy

- cache key: postId
- TTL: 30日
- 成功レスポンスだけを保存する。
- cache hit時はX API v2 providerを呼ばない。
- cache miss時だけX API v2またはoEmbed fallbackを呼ぶ。
- API失敗時に期限切れcacheがあれば `source="stale-cache"` とwarnings付きで返す。
- Cloudflare Pages/FunctionsのProductionではCloudflare KV binding `X_POST_CACHE` を使う。
- `X_POST_CACHE` binding未設定時はin-memory cacheへfallbackするが、serverless環境では永続化を期待しない。

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
