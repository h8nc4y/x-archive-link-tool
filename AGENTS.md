# AGENTS.md

このリポジトリでは、最小差分で慎重に作業する。

## 作業方針

- 実装を広げず、指定された要件、ドキュメント、骨組みを優先する。
- 不明な仕様やコマンドは補完せず「未確認」と書く。
- 既存の公開APIや仕様を変更する場合は、先に意図を明記する。
- 広範囲の探索、無関係なリファクタ、依存追加、DB作成、マイグレーションは行わない。

## 禁止事項

- まだX API連携を実装しない。
- まだWeb UIを実装しない。
- iOSアプリを作らない。
- DBを作らない。
- ユーザー入力URLをサーバーでfetchしない。
- XのHTMLをスクレイピングしない。
- ブラウザ自動化でXを読まない。
- ウェブ魚拓をサーバーから取得しない。
- OGP取得、短縮URL展開、メディアダウンロードをしない。
- X投稿本文、メディアURL、アカウント情報を保存しない。
- 投稿本文をHTMLとして描画しない。
- X API Bearer Tokenをクライアントへ出さない。
- 秘密情報、`.env`、認証情報、トークン、実ユーザーデータを読まない、表示しない、コミットしない。

## 検証

検証コマンド: 未確認

## Codex 共通運用

- `/goal` は作業開始してよいタイミングでだけ使う。
- 計画、確認、読み取り専用調査だけの場合は `/goal` を使わない。
- 作業は checkpoint 単位で進め、1 checkpoint が完了したら差分、確認結果、未確認事項、残リスクを報告して停止する。
- 外部ネットワーク、push、deploy、実API呼び出し、依存追加、秘密情報、実データ操作が必要になった場合は、承認ポイントとして停止し、必要性、副作用、代替案、必要な承認内容を報告する。
- 複雑、高リスク、複数ファイル横断、設計判断、データ影響、セキュリティ、権限、外部副作用があり `xhigh` が必要な場面では、自動切替せず、停止して理由と続行プロンプトを出す。
- OpenAI API、Codex、ChatGPT Apps SDK、OpenAI 関連仕様を確認する場合は、利用可能なら OpenAI Developer Docs MCP を優先する。

## Codex 作業ガード

- 変更前に `git status --short` を確認し、未追跡ファイルや既存差分があれば作業前に明示する。
- 対象ファイルを絞り、仕様外改善、広範なリファクタ、依存追加、公開API変更を避ける。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth`、実データは読まない、表示しない、変更しない、コミットしない。
- `git add .` は使わない。`git commit`、`git push`、deploy は明示依頼があるまで行わない。
- 完了前に `git diff --stat` と `git diff --name-only` を確認し、秘密情報、実データ、不要ファイルが混入していないか点検する。

## プロジェクト固有メモ

- プロジェクト種別: Node.js ESM。ローカルサーバーは `node server/extractServer.js`、テストは Node.js の `node --test` ベース。
- 確認済みテスト候補: `npm test`。
- `npm` を使わない場合の確認済みテスト候補: `node --test server/urlValidator.test.js server/extractServer.test.js server/oEmbedClient.test.js server/xApiV2Client.test.js server/extractService.test.js server/env.test.js apps/web/app.test.js scripts/manualOEmbedCheck.test.js functions/api/extract.test.js`。
- ローカル起動候補: PowerShell で `$env:PORT="3000"` を設定してから `npm start`、または `node server/extractServer.js`。
- 外部ネットワーク、X API、Cloudflare Pages、oEmbed、デプロイ、依存追加を伴う操作は明示承認なしに実行しない。
