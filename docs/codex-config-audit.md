# Codex設定棚卸し

このメモは、Codex関連設定の重複や古い停止条件を増やさないための確認メモです。固定日時は書かず、現在のグローバル設定を正として、プロジェクト側には必要な差分だけを残します。

## 棚卸対象

### グローバル

この実行環境では `CODEX_HOME` は `D:\Agent\Codex\.codex` です。今回参照したグローバル設定は次のファイルです。

- `D:\Agent\Codex\.codex\AGENTS.md`
- `D:\Agent\Codex\.codex\config.toml`
- `D:\Agent\Codex\.codex\rules\cost-guard.rules`
- `D:\Agent\Codex\.codex\rules\default.rules`
- `D:\Agent\Codex\.codex\hooks\no_input_wait.py`

`C:\Users\h8nc4\.codex` も存在しますが、今回のCodex Appセッションの `CODEX_HOME` ではないため、棚卸しの正にはしません。

### プロジェクト

- `AGENTS.md`

次のプロジェクト固有設定は存在しません。

- `AGENT.md`
- `.codex/config.toml`
- プロジェクト内の `rules`

## グローバル設定との関係

グローバル `AGENTS.md` は、自走開発、GitHub操作、非課金Cloudflare操作、Browser/Chrome検証、日本語報告、停止条件を定義しています。このリポジトリの `AGENTS.md` は、それらを繰り返さず、次のプロジェクト固有差分だけを持ちます。

- Node.js ESMアプリであること。
- ローカルサーバーは `node server/extractServer.js`。
- テストは Node.js の `node --test` ベース。
- 既存のWeb UI、Cloudflare Pages Functions、BYOTのX API v2コード、oEmbed fallbackを保守対象とすること。
- 既存公開先は Cloudflare Pages を維持すること。
- X、oEmbed、魚拓、OGP、短縮URL、media、token、実データに関するプロジェクト固有の安全境界。
- このアプリのUIとユーザー向け文言を日本語firstで保守すること。

## 整合確認結果

- 古い「checkpointごとに必ず停止する」方針は、Codex関連設定内には見つかりません。
- 古い「push、deploy、依存追加、GitHub操作を一律禁止する」方針は、Codex関連設定内には見つかりません。
- グローバル `AGENTS.md` と `cost-guard.rules` は、Codex向けprompt作成時に `/goal` を使わず、通常チャット欄の単一 `Goal` ブロックへまとめる方針を持っています。インテリジェンス表記とCodexのチャット継続/新規判断も、copy block外へ出す順序で定義されています。
- グローバル `AGENTS.md` と `cost-guard.rules` は、`read`、`pause`、`select`、`tail -f`、`watch`、`while true`、`sleep infinity`、foreground dev server待機を禁止し、非対話・timeout・bounded retry・background server管理を要求しています。
- グローバル `config.toml` は `features.goals = false` とし、hooksを有効化しています。`no_input_wait.py` hook は入力待ち、無限polling、foreground dev serverをPreToolUseで拒否する実装です。
- GitHub issue、PR comment、review commentは情報源または報告先であり、開発開始やPR作成の前提ではないと定義されています。
- プロジェクト `AGENTS.md` は、グローバルの自走方針を妨げていません。
- プロジェクト `AGENTS.md` の外部ネットワーク、X API、oEmbed、Cloudflare本番確認の注意は、課金、secret、実データ送信を避けるためのプロジェクト固有の安全境界であり、グローバル方針の停止条件と整合しています。
- プロジェクト `AGENTS.md` は、post-release外部・法務・課金・本番live確認の停止条件と、通常のrepo内docs/test/GitHub/Browser確認を分けています。
- グローバル `config.toml` にはこのリポジトリの `trust_level = "trusted"` があり、グローバル方針と矛盾しません。
- グローバル `config.toml` の `project_doc_fallback_filenames` は `AGENTS.md` を先頭に含み、`AGENT.md` はfallbackとして扱われています。グローバル `config.toml` に存在しないhook scriptへの参照は見つかりません。
- グローバル `cost-guard.rules` は、Git/GitHubと非課金Cloudflare操作を許可し、OpenAI API、Workers AI、Vectorize、R2、remote D1、KV、Queues、Hyperdrive、Workflows、Google Cloud/Firebase/BigQuery/Cloud Storage/Kubernetesなど課金または実データ影響があり得る操作をprompt扱いにしており、グローバル `AGENTS.md` と整合しています。ただしこのリポジトリでは、Codex実行環境の `gh` CLI制約をプロジェクト固有の運用制約として優先します。
- Modern Web Guidanceは、Web UI、HTML、CSS、クライアントJavaScript等に触れる場合だけ、secretや実データを含まないqueryでsearch/retrieveを使う方針です。interactive wizardになり得るinstallはforbiddenです。
- Google公式skillsは、Google Cloud/Firebase/Gemini等のGoogle技術面に関係する場合だけ対象で、generic frontend、Cloudflare-first app、local-only scriptでは不要と定義されています。
- グローバル `AGENTS.md` にはPPC個人情報保護方針の確認観点があり、データ最小化、利用目的、第三者提供・外部送信、保存期間・削除、本人対応、ログ・テストデータ・スクリーンショット、外部サービスへの個人情報やsecret送信有無を確認する方針が定義されています。
- グローバル `default.rules` には他プロジェクト由来の具体的な許可ルールが残っています。古い削除系の個別許可は今回削除しました。広めの `python -m` 許可は今回のrepo内作業では直接使わず、将来のグローバル棚卸し候補です。

## Codex実行環境のGitHub操作制約

- sandbox内の `gh auth status` が `token invalid` を返す、またはsandbox内のGit HTTPS操作が `SEC_E_NO_CREDENTIALS` を返すだけでは、GitHub認証破損とは判断しません。
- 直近再診断では、sandbox外の `gh auth status -h github.com --json hosts` で `tokenSource=keyring` / `state=success` を確認し、sandbox外の `GIT_TERMINAL_PROMPT=0 git -C <repo> ls-remote origin HEAD` も成功しました。この場合は、GitHub認証はkeyring上で有効であり、sandbox内表示は誤判定リスクとして扱います。
- `gh api user --jq .login` は、GitHub APIへ既存credentialを送る操作として実行ポリシーで拒否される場合があります。その場合は未確認として扱い、`gh auth login` が必要とは断定しません。
- この差分はGitHubアカウント全体ではなく、Codex実行環境またはsandbox境界から見える `gh` / Git credential状態の制約として扱います。Codex内で `gh auth login` や認証待ちは繰り返しません。
- このリポジトリでは、通常の `git` 操作可否と `gh` CLIによるGitHub API操作可否を分離して扱います。`git status`、commit、pushが可能でも、`gh` CLIでIssue、PR、merge、CI結果を確認できるとは扱いません。
- 今後のCodex作業では、GitHub Issue/PR/merge確認は利用可能なGitHub connectorを優先します。connectorで作成・mergeまで確認できない場合は、local commitと実際に通る `git push` までに留め、PR URL、CI結果、merge結果は確認できた場合だけ報告します。
- GitHub認証復旧確認は、開発開始条件にはしません。復旧が必要な作業では、sandbox外のkeyring確認、実API確認が許可された場合の `gh api user --jq .login`、非対話の `git ls-remote`、Codex側で確認可能な証跡を分けて扱います。

## Codex報告フォーマットの分離

- ChatGPT側で使うメタ判断欄は、Codexの最終報告フォーマットではありません。Codexの最終報告には混入させません。
- Codexの最終報告は、現在の日本時間 `YYYY/MM/DD HH:MM:SS` から開始します。
- その後に、実施内容、変更ファイル、コマンド結果、検証結果、GitHub、未実行、未確認、残課題、次の最小手順を日本語で報告します。

## 今回残すプロジェクト固有方針

- ユーザー入力URLをサーバーで直接fetchせず、validatorが生成した `canonicalXPostUrl` だけを外部endpointへ渡す。
- XのHTMLスクレイピング、Xのブラウザ自動読み取り、魚拓取得、OGP取得、短縮URL展開、メディアダウンロードをしない。
- X投稿本文、media URL、アカウント情報、postId、HTML本文、JSON valuesをログに残さない。
- 投稿本文をHTMLとして描画しない。
- X API Bearer Tokenをクライアントへ出さない。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth`、実データは読まない、表示しない、変更しない、コミットしない。
- 本番 `/api/extract` やX API呼び出しを確認する場合も、記録はHTTP status、source、cached、mediaUrls件数、warnings件数など最小限にする。
- PPC個人情報保護方針に関係する作業では、上記のデータ最小化、外部送信、ログ抑制に加え、保存期間・削除方針、本人からの問い合わせ・訂正・削除対応、外部サービスや委託先管理の確認状態を分けて扱う。未確定の法務・運用判断はCodexが断定せず、`docs/privacy-policy-draft.md`、`docs/post-release-operations-checklist.md`、`docs/post-release-human-verification-template.md` の未確認項目として残す。

## 今後の見直し候補

- グローバル `default.rules` の他プロジェクト固有コマンドを、必要であればプロジェクト単位またはより汎用的なルールへ整理する。
- `cost-guard.rules` の正式parserまたは公式test runnerがある場合は、custom checkではなくそれを使う。現時点では、構文と代表例の確認に留めます。
