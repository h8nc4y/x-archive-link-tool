# AGENTS.md

このリポジトリでは、グローバルの Codex 設定を基本とし、ここにはプロジェクト固有の範囲、禁止事項、検証方法だけを置く。

## Project scope

- プロジェクト種別: Node.js ESM。
- ローカルサーバー: `node server/extractServer.js`。
- テスト: Node.js の `node --test` ベース。
- 既存のWeb UI、Cloudflare Pages Functions、BYOTのX API v2コード、oEmbed fallbackは保守対象。
- 明示タスクなしに、追加のX API連携、別Web UI、iOSアプリ、DB、マイグレーションは作らない。
- この既存アプリの公開先は Cloudflare Pages を維持する。新規web appや将来の移行では Workers with Static Assets を優先候補にする。

## Prohibitions

- ユーザー入力URLをサーバーで直接fetchしない。validatorが生成した `canonicalXPostUrl` だけをX API v2または公式oEmbed endpointへ渡す。
- XのHTMLをスクレイピングしない。ブラウザ自動化でXを読まない。
- ウェブ魚拓をサーバーから取得しない。魚拓は外部リンクとして表示するだけ。
- OGP取得、短縮URL展開、メディアダウンロードをしない。
- X投稿本文、メディアURL、アカウント情報、postId、HTML本文、JSON valuesをログに残さない。
- 投稿本文をHTMLとして描画しない。
- X API Bearer Tokenをクライアントへ出さない。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth`、実データは読まない、表示しない、変更しない、コミットしない。
- 本番 `/api/extract` 確認やX API呼び出しは、実投稿URLやAPI creditsへ影響し得るため必要性を分けて扱う。実行する場合も記録は HTTP status、source、cached、mediaUrls件数、warnings件数など最小限にし、実URLや本文やtokenは記録しない。

## Post-release operations

- v0.1.0後の外部・法務・課金確認は、人間確認結果を `docs/post-release-human-verification-template.md` の形で受け取ってから扱う。
- Codexが自走してよいのは、repo内docs、Issue、template、外部通信しないdry-run/testの整備まで。
- 本番 `/api/extract`、本番429確認、X API/oEmbed live通信、実X投稿URL送信、X Developer Portal、billing/credits確認、secret/token/OAuth/実データ読み取り、Cloudflare write操作は停止条件とする。
- Cloudflareは今回のpost-release整備ではwrite操作を行わない。既存認証でread-only確認を行う場合も、広いWrangler OAuth権限を前提に最小コマンドへ限定する。
- 上記の停止条件は、v0.1.0後の外部・法務・課金・本番live確認に関するプロジェクト固有制限である。通常のrepo内docs/test/GitHub/Browser確認や、実URL・secret・課金を伴わないWeb UI作業は、グローバルの自走方針に従う。

## Verification

- 確認済みテスト候補: `npm test`。
- PowerShellで `npm.ps1` の実行ポリシーエラーになる場合は `npm.cmd test` を使う。
- `npm` を使わない場合の確認済みテスト候補: `node --test`。Node.js test runnerの自動探索で `*.test.js` を実行する。
- ローカル起動候補: PowerShell で `$env:PORT="3000"` を設定してから `npm start`。PowerShell実行ポリシーに当たる場合は `npm.cmd start`。`npm` を使わない場合は `node server/extractServer.js`。
- 外部ネットワーク、X API、oEmbed、Cloudflare本番API確認は、料金・secret・実データ送信に該当しない範囲を確認してから実行する。
- CLIは非対話実行を基本にする。`read`、`pause`、`select`、対話式prompt待ち、`tail -f`、`watch`、無限sleep、foreground dev server待機は使わない。
- 長時間コマンドにはtimeout、watch回数、または明示的な上限を付ける。dev serverが必要な場合だけbackground起動し、PIDとlogを保存し、不要になったら停止する。
- post-release運用docsの必須セクション確認は `npm.cmd run check:post-release-docs` を使う。
- Web UIを変更した場合は、グローバル方針に従い、日本語firstの文言と実レンダリングを確認する。可能な範囲で390px、768px、1280px以上の表示を確認し、Browser/Chrome/Chrome DevTools/Playwrightのどれを使ったかを報告する。
- Web UI、HTML、CSS、クライアントJavaScriptに触れる実装では、secretや実データを含まないqueryだけでModern Web Guidanceのsearch/retrieveを使う。Google公式skillsは、このrepoにGoogle Cloud/Firebase/Gemini等のGoogle技術面が追加される明示タスクがある場合だけ対象にする。

## Agent docs

- このリポジトリの正は `AGENTS.md`。`AGENT.md` は現時点で未導入。
- `.codex/config.toml` も現時点で未導入。追加する場合は、存在しないhook scriptや未導入MCP/Skillを参照しない。

## GitHub operations

- sandbox内の `gh auth status` が `token invalid` を返す、またはsandbox内のGit HTTPS操作が `SEC_E_NO_CREDENTIALS` を返すだけでは、GitHub認証破損とは判断しない。
- `gh auth login` や認証待ちを求める前に、sandbox外で既存Windows keyring認証を確認する。確認候補は `gh auth status -h github.com --json hosts` の `tokenSource=keyring` / `state=success`、`gh api user --jq .login`、`GIT_TERMINAL_PROMPT=0 git -C <repo> ls-remote origin HEAD`。`gh api user` が実行ポリシーで拒否された場合は未確認として扱い、他の証跡だけでログイン要求を断定しない。
- GitHubのIssue、PR、merge確認は、利用可能なGitHub connectorを優先し、connectorでできない場合はlocal commitと実際に通る `git push` までに留める。
- PR URL、CI結果、merge結果は、GitHub connector、git remote状態、または別の確認済み証跡で確認できた場合だけ報告する。確認できない場合は未確認と書き、捏造しない。

## Reporting

- Codexの最終報告は、現在の日本時間 `YYYY/MM/DD HH:MM:SS` から開始する。
- ChatGPT側のメタ判断欄はCodexの最終報告フォーマットではないため、Codexの報告に混入させない。

## Localization

- このプロジェクトは日本語ユーザーと日本のエンドユーザー向けに保守する。
- Web UIは日本語firstにし、非プログラマーにも分かる短く具体的なラベル、ヘルプ、空状態、validation、error文言を使う。
- コードコメントは機械的に日本語化しない。非自明な仕様、商品挙動、運用制約、費用、deploy注意点を説明する場合だけ日本語コメントを検討する。
