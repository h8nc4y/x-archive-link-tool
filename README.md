# X Post Paste Text MVP

Xポスト共有URLから貼り付け用テキストを生成するWeb MVPです。

Web UI と `POST /api/extract` は実装済みです。Cloudflare Pages無料URLで初回デプロイ済みです。iOSアプリ、DB、独自ドメイン設定は未実装です。

公開URL: https://x-archive-link-tool.pages.dev
プライバシーポリシーURL候補: https://x-archive-link-tool.pages.dev/privacy.html（`/privacy` へredirect後の静的表示は2026-05-18時点で確認済み。Cloudflare Pages Production deployment一覧で確認したHEAD `2db0a89a39424ebb1d43268e4e4af7a19b01bc39` は2026-05-18 20:50 JST時点の過去証跡です。現在のProduction HEAD確認は `docs/post-release-human-verification-record.md` のIssue #41記録を参照してください。このmaintenance auditでは本番API、production smoke、live provider確認を再実行していません。）

Cloudflare Pages無料URL（`*.pages.dev`）では、静的UIは `apps/web` を配信し、`/api/extract` は Cloudflare Pages Functions / Workers で実行します。静的ページ用のセキュリティヘッダは `apps/web/_headers` で指定します。

## ローカル起動

PowerShellでローカルポートを一時設定してから起動します。X API Bearer Tokenは任意です。未設定時はoEmbed fallbackで動作します。

```powershell
$env:PORT="3000"
npm start
```

PowerShellで `npm.ps1` の実行ポリシーエラーになる場合は、同じscriptを `npm.cmd` 経由で実行します。

```powershell
$env:PORT="3000"
npm.cmd start
```

ブラウザで `http://127.0.0.1:3000/` を開き、XポストURLを入力します。
疎通確認だけなら `http://127.0.0.1:3000/healthz` を開き、`{"ok":true}` が返ることを確認します。

`npm` が使えない場合の起動コマンド:

```powershell
$env:PORT="3000"
node server/extractServer.js
```

## テスト

GitHub Actionsでは、pull request、`master` へのpush、手動実行で最小CIとして `npm test` を実行します。package-lock.json がないため、CIにinstall stepは入れていません。`npm test` は `node --test` の自動探索で `*.test.js` を実行します。

```powershell
npm test
```

PowerShellで `npm.ps1` の実行ポリシーエラーになる場合:

```powershell
npm.cmd test
```

`npm` が使えない場合:

```powershell
node --test
```

## 環境変数

`.env.example` は見本です。`.env` は作成してもコミット禁止です。

- `PORT`: ローカル起動ポート。既定値は `3000`。
- `RATE_LIMIT_PER_IP_PER_MINUTE`: IP単位の1分あたり上限。既定値は `10`。
- `RATE_LIMIT_GLOBAL_PER_MINUTE`: 全体の1分あたり上限。既定値は `60`。
- `X_BEARER_TOKEN`: 任意。設定時のみBring Your Own Token方式でX API v2を使い、メディアURL取得を試みます。未設定時はoEmbed fallbackを使います。
- `X_POST_CACHE`: Cloudflare Pages ProductionのKV namespace binding。postId単位の本番cacheに使います。

Cloudflare Pagesでは `PORT` は不要です。試験公開時のRoot directoryは空欄/リポジトリルート、build commandは不要/空欄、build output directoryは `apps/web`、Functions directoryは `functions` です。Root directoryを `apps/web` にすると `/api/extract` のFunctionsが認識されない可能性があります。X API Bearer Tokenは任意です。ProductionではKV binding `X_POST_CACHE` を `x-archive-link-tool-post-cache` に設定済みです。

## MVP対象範囲

- 入力はXのポスト共有URLのみ。
- URLを安全に検証し、正規化した `canonicalXPostUrl` を扱う。
- 出力項目は、アカウント名、`@username`、ユーザー数値ID、ポストURL、投稿日、本文、メディアURL、魚拓URL。
- X API v2はBring Your Own Token方式で任意利用する。未設定時は公式oEmbed endpoint `https://publish.x.com/oembed` を使う。
- X API v2でlong-form Postの `note_tweet.text` が返る場合は、コピー用本文にその全文を優先して使う。
- 同じpostIdはcache-firstで扱い、cache hit時はX API v2を呼ばない。本文抽出仕様を変えた場合はcache key versionを上げ、旧仕様の抽出cacheを再利用しない。
- oEmbed fallbackでは取得できない項目があるため、ユーザー数値IDとメディア直接URLは未取得になる場合がある。
- 投稿本文と投稿日はoEmbed HTMLから安全に抽出できる場合だけ表示し、抽出できない場合は `未取得`。
- 魚拓は自動取得しない。
- 「魚拓を取得する場合はこちら」リンクを表示するだけで、サーバーから魚拓を取得しない。
- X API Bearer Tokenはサーバー側環境変数だけで扱い、クライアントへ返さない。
- 入力URL、投稿本文、メディアURL、ユーザー情報はログに残さない方針。

## 対象外

- iOSアプリ
- DB
- 追加の本番デプロイ設定
- ユーザー入力URLのfetch
- X HTMLスクレイピング
- ブラウザ自動化によるX閲覧
- ウェブ魚拓のサーバー取得
- OGP取得、短縮URL展開、メディアダウンロード

## よくある応答

- token未設定: oEmbed fallbackで起動できます。メディアURLを取得できない場合があります。
- 不正URL: URL検証エラーになります。`https://x.com/{username}/status/{postId}` 形式を使ってください。
- `404`: 対象ポストが見つからない、または取得できません。
- `429`: レート制限に達しています。時間を置いて再試行してください。

非公開、削除済み、埋め込み不可、oEmbed側制限などにより取得できない投稿があります。

## 手動確認

- 公開XポストURLを1件入力し、コピー用 `textarea` に結果が出ることを確認します。
- 魚拓リンクは別タブで開くだけです。魚拓は自動取得されません。
- 魚拓URL欄は `https://megalodon.jp/...` または `https://s{digits}.megalodon.jp/...` のみ有効です。
- `.env`、投稿本文、メディアURLをGitやログに残さないでください。

## v0.1.0後の運用確認

v0.1.0後の残タスクは、人間がX Developer Portal、billing、credits、privacy/legal、問い合わせ先、KV障害時判断者を確認する項目と、Codexがrepo内docs・Issue・dry-run検証だけを整備できる項目に分けます。

本番 `/api/extract`、本番429確認、X API / oEmbed live通信、実X投稿URL送信、secret/token/OAuth/実データ読み取り、Cloudflare write操作は、明示承認と専用runbookなしに実行しません。

人間確認結果は、実URLやtokenを含めず、[人間確認結果テンプレート](docs/post-release-human-verification-template.md) の形式で共有します。その後に [本番API smoke Runbook](docs/production-smoke-runbook.md) の承認文言を使って、最大回数と記録項目を限定します。

## ドキュメント

- [要件](docs/requirements.md)
- [API案](docs/api.md)
- [テストケース](docs/test-cases.md)
- [現状まとめ](docs/current-status.md)
- [公開前チェックリスト](docs/pre-release-checklist.md)
- [リリース候補メモ](docs/release-candidate.md)
- [v0.1.0 Release Notes](docs/release-notes-v0.1.0.md)
- [公開前運用Runbook](docs/pre-release-operations-runbook.md)
- [v0.1.0後の人間確認チェックリスト](docs/post-release-operations-checklist.md)
- [post-release operations判断パケット](docs/post-release-operations-decision-packet.md)
- [post-review maintenance audit](docs/post-review-maintenance-audit.md)
- [本番API smoke Runbook](docs/production-smoke-runbook.md)
- [人間確認結果テンプレート](docs/post-release-human-verification-template.md)
- [人間確認結果記録](docs/post-release-human-verification-record.md)
- [Incident / KV障害Runbook](docs/incident-and-kv-failure-runbook.md)
- [デプロイ準備](docs/deployment-plan.md)
- [プライバシーポリシードラフト](docs/privacy-policy-draft.md)
- [サポートページドラフト](docs/support-page-draft.md)
- [Claude Code利用手順](docs/claude-code-usage.md)
- [セキュリティ](SECURITY.md)

## 検証

```powershell
npm test
```

PowerShellで `npm.ps1` の実行ポリシーエラーになる場合は `npm.cmd test` を使います。

post-release運用docsの必須セクションだけを外部通信なしで確認する場合:

```powershell
npm.cmd run check:post-release-docs
```

本番API smokeは、`docs/production-smoke-runbook.md` の承認条件を満たし、`tmp/approved-smoke-target.txt` に人間が指定したテスト用公開X投稿URLが1行だけ入っている場合に限り、最大1回だけ実行します。`tmp/` はGit管理外です。

```powershell
npm.cmd run smoke:production-once
```

smoke後は `tmp/approved-smoke-target.txt` の内容を読まずに削除し、smoke scriptや本番 `/api/extract` を再実行しないでください。記録はHTTP status、source、cached、mediaUrls件数、warnings件数、error code、確認時刻、実行回数などの抽象項目に限定します。
