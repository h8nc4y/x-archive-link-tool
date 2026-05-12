# Requirements

## MVP対象範囲

- 入力はXのポスト共有URLのみ。
- URLを検証し、`canonicalXPostUrl` を生成する。
- 貼り付け用テキスト出力項目を固定する。
- X API v2はBring Your Own Token方式で任意利用する。
- `X_BEARER_TOKEN` 未設定時は公式oEmbed endpoint `https://publish.x.com/oembed` をfallbackとして使う。
- 同じpostIdはcache-firstで扱い、cache hit時はX API v2を呼ばない。
- oEmbed由来HTMLは画面にHTMLとして描画しない。
- oEmbed fallbackではユーザー数値IDとメディア直接URLは未取得とする。
- 投稿日と本文は安全にプレーンテキスト抽出できる場合だけ扱い、抽出できない場合は `未取得` とする。
- 魚拓は自動取得せず、リンクだけを表示する。
- X API Bearer Tokenはサーバー側環境変数だけで扱い、クライアントへ返さない。

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
- ログインCookie、X内部GraphQL、guest token取得
- quote/poll取得（P1/P2で検討）

## 入力URL仕様

入力はXのポスト共有URLのみ。

許可する形式:

- `https://x.com/{username}/status/{postId}`
- `https://twitter.com/{username}/status/{postId}`
- `https://mobile.twitter.com/{username}/status/{postId}`
- `https://x.com/i/web/status/{postId}`

## URL検証ルール

- protocol: `https` only
- exact hosts: `x.com`, `twitter.com`, `mobile.twitter.com`
- path: `/{username}/status/{postId}` または `/i/web/status/{postId}`
- username: `/^[A-Za-z0-9_]{1,15}$/`
- postId: `/^[0-9]{1,19}$/` as string
- query/hash are dropped
- reject redirects, short URLs, other hosts, other paths

`canonicalXPostUrl` はユーザー名付きURLでは `https://x.com/{username}/status/{postId}`、`/i/web/status/{postId}` では `https://x.com/i/web/status/{postId}` とする。

## キャッシュ方針

- cache keyは正規化したpostId。
- TTL初期値は30日。
- 成功レスポンスだけを保存する。
- 保存対象は本文、投稿者、時刻、canonicalUrl、expandedUrls、media、mediaUrls、source、fetchedAt。
- TTL内のcache hitではX API v2を呼ばない。
- APIエラー、認証エラー、rate limitエラーは原則キャッシュしない。
- 期限切れcacheがあり、最新取得に失敗した場合は `stale-cache` とwarnings付きで返す。
- X API認証、権限、rate limit、上流エラー時は、可能ならoEmbed fallbackへ戻し、warning付きで返す。
- fallback warningには安全な範囲で上流HTTP statusだけを含める。401はBearer Token不正、402はX API credits / billing / payment required、403はApp権限/プラン/endpoint access不足、429はrate limit/usage capの可能性がある。
- Cloudflare Pages/FunctionsのProductionではCloudflare KV binding `X_POST_CACHE` を使う。
- `X_POST_CACHE` binding未設定時はin-memory cacheへfallbackするが、serverless環境では永続化を期待しない。

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
