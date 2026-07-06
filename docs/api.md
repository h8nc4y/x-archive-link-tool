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
- fallback warningには安全な範囲で上流HTTP statusだけを含める。401はBearer Token不正、402はX API credits / billing / payment required、403はApp権限/プラン/endpoint access不足、429はrate limit/usage capの可能性がある。402は機械可読code `x_api_402` として扱う。
- `X_BEARER_TOKEN` 設定時にX APIが一時失敗し、oEmbed fallbackが成功した場合、そのdegraded fallback結果は短TTLでcache保存する。現行TTLは1時間。
- provider への fetch 自体の失敗（ネットワーク障害、`redirect: "error"` によるリダイレクト遮断）と JSON でない応答は、素の500（`internal_error`）ではなく型付きの機械可読codeで返す: `oembed_unreachable` / `oembed_invalid_response` / `x_api_unreachable` / `x_api_invalid_response`（いずれもHTTP 502）。2026-07-06 の本番smokeで素の500を観測した再発防止。

## X API v2 request

- endpoint: `https://api.x.com/2/tweets/{postId}`
- `expansions=attachments.media_keys,author_id`
- `media.fields=url,preview_image_url,variants,type,width,height,alt_text,duration_ms`
- `tweet.fields=created_at,entities,attachments,note_tweet`
- `user.fields=username,name`
- Bearer Tokenはサーバー側環境変数 `X_BEARER_TOKEN` からのみ読む。
- long-form Postでは、`note_tweet.text` が返る場合は本文として最優先する。ない場合は通常の `text` を使う。

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

- logical cache identity: postId
- 実際のextractor cache keyにはschema versionを含める。long-form Post対応後は旧versionの短縮本文cacheをmiss扱いにし、次回取得時に新しい本文抽出結果を保存する。
- 通常TTL: 30日
- 通常のX API成功結果と、`X_BEARER_TOKEN` 未設定時にoEmbedがprimary providerとして成功した結果は通常TTLでcacheする。
- `X_BEARER_TOKEN` 設定時にX API失敗後のoEmbed fallbackが成功したdegraded fallback結果は1時間TTLでcacheする。
- 成功レスポンスだけを保存する。
- cache hit時はX API v2 providerを呼ばない。
- cache miss時だけX API v2またはoEmbed fallbackを呼ぶ。
- API失敗時に期限切れcacheがあれば `source="stale-cache"` とwarnings付きで返す。
- Cloudflare Pages/FunctionsのProductionではCloudflare KV binding `X_POST_CACHE` を使う。
- 現行KV実装のphysical expiration TTLはlogical TTLと同じであるため、Cloudflare KV上でphysical TTL経過後の `stale-cache` 到達性は本番保証として主張しない。期限切れentryが取得可能な場合にだけ `stale-cache` を返せる。
- KV physical TTLをlogical TTLより長くする案は採用していない。現行実装ではKV physical TTL延長、cache key version変更、fallback結果の完全非cache化は行わない。
- `X_POST_CACHE` binding未設定時はin-memory cacheへfallbackするが、serverless環境では永続化を期待しない。Cloudflare Functionsのin-memory cacheとrate limiterはisolate単位のbest-effortであり、真のglobal制限ではない。

## 魚拓リンク仕様

`canonicalXPostUrl = https://x.com/{username}/status/{postId}`

2026-07-04 オーナー決定（Issue #42 M3 / Q6）により、単一の gyo.tc リンクから複数サービス併記へ変更した。詳細は `docs/requirements.md` の魚拓リンク仕様を正とする。

併記する魚拓サービス（すべて外部リンク、サーバー側から魚拓を取得しない）:

- ウェブ魚拓（gyo.tc、prefix型）: `https://gyo.tc/{canonicalXPostUrl}`
- Wayback Machine（archive.org、prefix型）: `https://web.archive.org/save/{canonicalXPostUrl}`
- archive.today（prefix型）: `https://archive.ph/newest/{canonicalXPostUrl}`
- Twitter魚拓（twtr.satoru.net、フォーム型）: `https://twtr.satoru.net/`（サイトトップ固定、開いた先で手動貼り付け）

```html
<ul class="archive-links" aria-label="魚拓サービス">
  <li><a id="gyotaku-link" class="archive-link" target="_blank" rel="noopener" aria-disabled="true">ウェブ魚拓（gyo.tc）で魚拓を取る</a></li>
  <li><a id="wayback-link" class="archive-link" target="_blank" rel="noopener" aria-disabled="true">Wayback Machine（archive.org）で保存する</a></li>
  <li><a id="archivetoday-link" class="archive-link" target="_blank" rel="noopener" aria-disabled="true">archive.today で保存・確認する</a></li>
  <li><a id="twtr-link" class="archive-link" target="_blank" rel="noopener" aria-disabled="true">Twitter魚拓（twtr.satoru.net）を開く</a></li>
</ul>
```

- 各リンク共通: `target="_blank"`、`rel="noopener"`、`noreferrer` は付けない。ポスト取得前は `aria-disabled="true"`。
- 「取得後の魚拓URL」貼り付け欄は、上記サービスの結果URLホスト（megalodon.jp系 / gyo.tc / web.archive.org / archive.today系ミラーTLD / twtr.satoru.net）のみを許可し、非httpsや許可外ホストは拒否する。
- コピー用テキストの魚拓URL項目は1件のまま（出力スキーマ非変更）。

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

Cloudflare Functions本番ログも上記の安全な構造化項目に限定する。

残さない情報:

- 入力された生URL
- 投稿本文
- メディアURL
- アカウント名
- `@username`
- postId
- ユーザー数値ID
- 認証情報
