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

## Response format

- Codexの回答、checkpoint報告、最終報告の先頭に、日本時間の回答日時を `YYYY/MM/DD HH:MM:SS` 形式で明記する。
- テスト結果、git diff summary、未確認事項、残リスク、次checkpoint案の報告にも同じ形式を適用する。
- ChatGPTへ貼り戻す報告文にも同じ形式を適用する。
- ユーザーが明示的に別形式を指定した場合のみ、その指示を優先する。

## Codex 共通運用

- `/goal` は作業開始してよいタイミングでだけ使う。
- 計画、確認、読み取り専用調査だけの場合は `/goal` を使わない。
- Codex は checkpoint 完了ごとに停止せず、ローカルで安全に継続できる複数 checkpoint を自律的に進める。
- ローカルで完結するコード編集、テスト追加・修正、lint/type/format、docs 更新、fixture 更新、AGENTS.md/AGENT.md 更新、`.codex/config.toml` のローカル編集、必要最小限のリファクタ、local commit は停止せず実行してよい。
- 停止するのは、料金が発生する可能性がある API 呼び出し、OpenAI API・YouTube API・Salesforce API・Cloudflare API などの外部 API/サービス実行、本番 deploy、push/tag/GitHub Release などの外部 write、ネットワーク経由の依存追加、秘密情報・token・OAuth・credential・実データを外部送信する可能性がある操作、sandbox/approval/権限/usage limit など物理的に継続できない blocker がある場合だけにする。
- 複雑・高リスク・複数ファイル横断・設計判断がある場合でも、上記停止条件に該当しないローカル作業は、対象範囲を絞って判断根拠を残しながら継続する。
- OpenAI API、Codex、ChatGPT Apps SDK、OpenAI 関連仕様を確認する場合は、利用可能なら OpenAI Developer Docs MCP を優先する。

## Codex 作業ガード

- 変更前に `git status --short` を確認し、未追跡ファイルや既存差分があれば作業前に明示する。
- 対象ファイルを絞り、仕様外改善、広範なリファクタ、依存追加、公開API変更を避ける。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth`、実データは読まない、表示しない、変更しない、コミットしない。
- `git add .` は使わない。local commit は作業目的に含まれる場合は停止せず行ってよい。`git push`、tag、GitHub Release、deploy は明示依頼があるまで行わない。
- 完了前に `git diff --stat` と `git diff --name-only` を確認し、秘密情報、実データ、不要ファイルが混入していないか点検する。
- コマンド結果、テスト結果、ファイル内容、commit hash、外部事実を捏造しない。不明点は `未確認` と書く。
- 最終報告には、完了 checkpoint、commit、実行した確認、最終 `git status`、最終 `git diff --stat`、未確認事項、残リスク、停止理由、次の推奨アクションを含める。

## プロジェクト固有メモ

- プロジェクト種別: Node.js ESM。ローカルサーバーは `node server/extractServer.js`、テストは Node.js の `node --test` ベース。
- 確認済みテスト候補: `npm test`。
- `npm` を使わない場合の確認済みテスト候補: `node --test server/urlValidator.test.js server/extractServer.test.js server/oEmbedClient.test.js server/xApiV2Client.test.js server/kvPostCache.test.js server/rateLimiter.test.js server/extractService.test.js server/env.test.js apps/web/app.test.js scripts/manualOEmbedCheck.test.js functions/api/extract.test.js`。
- ローカル起動候補: PowerShell で `$env:PORT="3000"` を設定してから `npm start`、または `node server/extractServer.js`。
- 外部ネットワーク、X API、Cloudflare Pages、oEmbed、デプロイ、依存追加を伴う操作は明示承認なしに実行しない。
