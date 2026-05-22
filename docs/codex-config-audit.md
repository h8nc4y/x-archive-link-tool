# Codex設定棚卸し

このメモは、Codex関連設定の重複や古い停止条件を増やさないための確認メモです。固定日時は書かず、現在のグローバル設定を正として、プロジェクト側には必要な差分だけを残します。

## 棚卸対象

### グローバル

- `C:\Users\h8nc4\.codex\AGENTS.md`
- `C:\Users\h8nc4\.codex\config.toml`
- `C:\Users\h8nc4\.codex\rules\cost-guard.rules`
- `C:\Users\h8nc4\.codex\rules\default.rules`

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
- グローバル `AGENTS.md` は、Codex向けprompt作成時に `/goal` を短くし、詳細指示を通常チャット欄へ分離する方針を持っています。インテリジェンス表記とCodexのチャット継続/新規判断も、copy block外へ出す順序で定義されています。
- グローバル `AGENTS.md` と `cost-guard.rules` は、`read`、`pause`、`select`、`tail -f`、`watch`、`while true`、`sleep infinity`、foreground dev server待機を禁止し、非対話・timeout・bounded retry・background server管理を要求しています。
- GitHub issue、PR comment、review commentは情報源または報告先であり、開発開始やPR作成の前提ではないと定義されています。
- プロジェクト `AGENTS.md` は、グローバルの自走方針を妨げていません。
- プロジェクト `AGENTS.md` の外部ネットワーク、X API、oEmbed、Cloudflare本番確認の注意は、課金、secret、実データ送信を避けるためのプロジェクト固有の安全境界であり、グローバル方針の停止条件と整合しています。
- プロジェクト `AGENTS.md` は、post-release外部・法務・課金・本番live確認の停止条件と、通常のrepo内docs/test/GitHub/Browser確認を分けています。
- グローバル `config.toml` にはこのリポジトリの `trust_level = "trusted"` があり、グローバル方針と矛盾しません。
- グローバル `config.toml` の `project_doc_fallback_filenames` は `AGENTS.md` を先頭に含み、`AGENT.md` はfallbackとして扱われています。グローバル `config.toml` に存在しないhook scriptへの参照は見つかりません。
- グローバル `cost-guard.rules` は、Git/GitHubと非課金Cloudflare操作を許可し、OpenAI API、Workers AI、Vectorize、R2、remote D1、KV、Queues、Hyperdrive、Workflows、Google Cloud/Firebase/BigQuery/Cloud Storage/Kubernetesなど課金または実データ影響があり得る操作をprompt扱いにしており、グローバル `AGENTS.md` と整合しています。
- Modern Web Guidanceは、Web UI、HTML、CSS、クライアントJavaScript等に触れる場合だけ、secretや実データを含まないqueryでsearch/retrieveを使う方針です。interactive wizardになり得るinstallはforbiddenです。
- Google公式skillsは、Google Cloud/Firebase/Gemini等のGoogle技術面に関係する場合だけ対象で、generic frontend、Cloudflare-first app、local-only scriptでは不要と定義されています。
- グローバル `default.rules` には他プロジェクト由来の具体的な許可ルールが残っています。広すぎる `Remove-Item -Recurse -Force` 許可は削除済みです。残る具体的許可ルールは、将来のグローバル棚卸し候補です。

## 今回残すプロジェクト固有方針

- ユーザー入力URLをサーバーで直接fetchせず、validatorが生成した `canonicalXPostUrl` だけを外部endpointへ渡す。
- XのHTMLスクレイピング、Xのブラウザ自動読み取り、魚拓取得、OGP取得、短縮URL展開、メディアダウンロードをしない。
- X投稿本文、media URL、アカウント情報、postId、HTML本文、JSON valuesをログに残さない。
- 投稿本文をHTMLとして描画しない。
- X API Bearer Tokenをクライアントへ出さない。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth`、実データは読まない、表示しない、変更しない、コミットしない。
- 本番 `/api/extract` やX API呼び出しを確認する場合も、記録はHTTP status、source、cached、mediaUrls件数、warnings件数など最小限にする。

## 今後の見直し候補

- グローバル `default.rules` の他プロジェクト固有コマンドを、必要であればプロジェクト単位またはより汎用的なルールへ整理する。
- `cost-guard.rules` の正式parserまたは公式test runnerがある場合は、custom checkではなくそれを使う。現時点では、構文と代表例の確認に留めます。
