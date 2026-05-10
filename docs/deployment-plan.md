# Deployment Plan

oEmbed版Web MVPのCloudflare Pages初回デプロイ設定と、公開前後に残る確認項目の整理です。

## 公開前に決めること

- [ ] 公開先: Cloudflare Pages
- [ ] ドメイン: Cloudflare Pages無料URL（`*.pages.dev`）
- [ ] 問い合わせ先: TODO/未設定
- [ ] プライバシーポリシーURL: TODO/未設定
- [ ] レート制限値: TODO/未設定
- [ ] ログ保存期間: TODO/未設定
- [ ] 公開時の運用/ロールバック手順の最終確認: TODO/未設定

## Cloudflare Pages設定

- Project name: `x-archive-link-tool`
- Production branch: `master`
- 公開URL: https://x-archive-link-tool.pages.dev
- Framework preset: なし
- [ ] Root directory: 空欄 / リポジトリルート
- [ ] build command: 不要 / 空欄
- [ ] build output directory: `apps/web`
- [ ] Functions directory: `functions`
- [ ] API実行基盤: Cloudflare Pages Functions / Workers
- [ ] `/api/extract`: `functions/api/extract.js`
- [ ] 独自ドメイン: 後回し
- Environment variables: なし

Root directoryを `apps/web` にすると、リポジトリ直下の `functions/` が認識されない可能性があるため、空欄またはリポジトリルートのままにする。

## 初回デプロイ手動確認結果

- Cloudflare Pages初回デプロイ: OK
- Cloudflare Pages Deploymentsで `6745361` のproduction deployment成功: OK
- Cloudflare Pages Deploymentsで `77e937b` のproduction deployment成功: OK
- Cloudflare Pages Deploymentsで `676a81c` のproduction deployment成功: OK
- トップ画面表示: OK
- 空欄送信時の必須入力表示: OK（ブラウザ標準の必須入力メッセージ）
- 公開X投稿URLを1件使用した抽出: OK
- 魚拓URL生成: OK
- コピー用テキスト生成: OK
- 不正URL時のエラー表示: OK（表示例: `URL host is not allowed.`）
- Functions tabでリアルタイムログ確認: OK
- `/api/extract` へのPOSTが Ok として記録: OK
- Cloudflare Functionsログ重大エラー: なし（確認時点）

## 本番環境で必要な設定

- [ ] `PORT`: Cloudflare Pagesでは不要
- [ ] `RATE_LIMIT_PER_IP_PER_MINUTE`: TODO/未設定
- [ ] `RATE_LIMIT_GLOBAL_PER_MINUTE`: TODO/未設定

X API Bearer Tokenは不要。`.env` を作る場合もコミットしない。

## 本番で守る制約

- X_BEARER_TOKEN不要。
- X API v2と `api.x.com` は使わない。
- サーバー外向き通信先は `https://publish.x.com/oembed` のみ。
- oEmbedへ渡すURLは validator が生成した `canonicalXPostUrl` のみ。
- 入力URLを直接fetchしない。
- X HTMLスクレイピング、OGP取得、短縮URL展開、メディアダウンロードをしない。
- 魚拓は自動取得しない。
- 投稿本文、mediaUrls、username、postId、HTML本文、JSON valuesをログに出さない。

## 公開前チェック手順

- [ ] `node --test server/urlValidator.test.js server/extractServer.test.js server/oEmbedClient.test.js server/env.test.js apps/web/app.test.js scripts/manualOEmbedCheck.test.js` を実行する。
- [ ] Cloudflare Pages Functions用APIを含める場合は `functions/api/extract.test.js` も実行する。
- [ ] `docs/pre-release-checklist.md` を再確認する。
- [ ] `docs/privacy-policy-draft.md` と `docs/support-page-draft.md` の未設定項目を埋める。
- [ ] 公開先の環境変数にレート制限値を設定する。
- [ ] 公開前にWeb UIと `/api/extract` を確認する。

## ロールバック方針

- [ ] 公開直前のGit commitを記録する。
- [ ] 問題があれば直前の安定版commitへ戻す。
- [ ] ロールバック担当者と判断基準を決める: TODO/未設定
- レート制限値の変更で回避できる問題は、コード変更より先に設定値で対応する。
- oEmbed側障害が疑われる場合は、取得不能として扱い、X API v2へ切り戻さない。

## 既知の制限

- userNumericIdは未取得。
- media direct URLsは未取得。
- oEmbedで取得できない投稿がある。
- 投稿本文と投稿日は安全に抽出できない場合 `未取得`。
- 魚拓はユーザー操作で外部リンクを開くだけ。
