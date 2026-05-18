# Security Policy

## 基本方針

このMVPは、XポストURLを安全に検証し、cache-firstで正規化済み情報を返す。`X_BEARER_TOKEN` が設定されている場合のみサーバー側でX API v2をBring Your Own Token方式で使い、未設定時はoEmbed fallbackを使う。サーバー外向き通信先は `https://api.x.com/2/tweets/{postId}` または `https://publish.x.com/oembed` に限定し、oEmbedへ渡すURLはURL validatorで生成した `canonicalXPostUrl` のみとする。ユーザー入力URLのfetch、X HTMLスクレイピング、OGP取得、短縮URL展開、メディアダウンロードは行わない。

## ログに残す情報

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

ローカルサーバーとCloudflare Pages Functionsの本番ログは、上記の安全な構造化項目だけを出力対象にする。

## ログに残さない情報

- 入力された生URL
- X投稿本文
- メディアURL
- アカウント名
- `@username`
- postId
- 魚拓URL
- ユーザー数値ID
- 認証情報
- `.env` の内容
- 実ユーザーを識別できる情報

## セキュリティ禁止事項

- ユーザー入力URLをサーバーでfetchしない。
- `X_BEARER_TOKEN` 未設定時に `api.x.com` へ通信しない。
- cache hit時にX API v2 providerを呼ばない。
- リダイレクトを追跡しない。
- 短縮URLを展開しない。
- XのHTMLをスクレイピングしない。
- ブラウザ自動化でXを読まない。
- OGPを取得しない。
- メディアをダウンロードしない。
- ウェブ魚拓をサーバーから取得しない。
- 投稿本文をHTMLとして描画しない。
- 認証情報をクライアントへ出さない。

## 秘密情報

X API Bearer Tokenはサーバー側環境変数 `X_BEARER_TOKEN` からのみ読む。必須ではなく、未設定時はoEmbed fallbackを使う。`.env` はコミットしない。
