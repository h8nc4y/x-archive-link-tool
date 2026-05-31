# Post-release Human Verification Record

## Production HEAD verification for Issue #41

2026/05/31 12:51 JST時点のCodex read-only確認結果:

| 項目 | 結果 |
| --- | --- |
| Issue | #41 |
| 判断 | verified |
| 確認対象commit | `a6fe436f3f08326c6479561ea997ed6bb3e23f9c` |
| branch | `master` |
| GitHub check suite | `71569644229` |
| Cloudflare Pages check-run | `78690922988` |
| Cloudflare Pages deployment ID | `143cd043-10bf-406b-b8c8-3a22bb6a9ca2` |
| Cloudflare Pages check result | `Latest commit: a6fe436`, `Deploy successful` |
| Production static `/` | GET 200 |
| Production static `/privacy.html` | GET 200, effective path `/privacy` |
| Deployment URL static `/` | GET 200 |
| root ETag comparison | production URL and deployment URL matched |
| GitHub Deployments API | no deployment records returned |
| Wrangler deployment list | not run; no global or local `wrangler` command was installed |

根拠:

- `master` HEADは `a6fe436f3f08326c6479561ea997ed6bb3e23f9c`。
- GitHub branches APIで `master` が同commitを指すことを確認した。
- Cloudflare Workers and Pages GitHub Appのcheck suite `71569644229` は `head_branch=master`, `head_sha=a6fe436f3f08326c6479561ea997ed6bb3e23f9c`, conclusion `success`。
- Cloudflare Pages check-run `78690922988` は `Latest commit: a6fe436`, `Deploy successful`, deployment ID `143cd043-10bf-406b-b8c8-3a22bb6a9ca2`。
- `docs/deployment-plan.md` 上のProduction branchは `master`。
- Cloudflare Pages公式docsでは、production branchへのcommitが `*.pages.dev` production URLを更新し、non-production branchはpreview deploymentとして扱われる。
- 公開Production URLの静的 `/` と `/privacy.html` はGET 200。deployment URLの静的 `/` もGET 200。root pageのETagはproduction URLとdeployment URLで一致した。

確認していないこと:

- 本番 `/api/extract`。
- production smoke。
- live X API。
- live oEmbed。
- Cloudflare Dashboard/API/CLI deployment list。
- Cloudflare Functions logs。
- secrets、OAuth credentials、tokens、`.env`、`tmp/approved-smoke-target.txt`、実データ。

禁止事項の遵守:

- 本番 `/api/extract`、production smoke、X API live通信、oEmbed live通信、実X URL送信、Cloudflare write/deploy/rollback/config変更、dependency追加、`npm install` は実行していない。

2026/05/21 14:26:02 JST

v0.1.0後の人間確認結果を、実X投稿URL、postId、username、投稿本文、media URL、raw JSON values、token値、secret、OAuth credential、Authorization header、Cookieを含めずに記録する。

## 確認結果

| 項目 | 結果 |
| --- | --- |
| 確認日 | 2026/05/21 |
| 確認者role | owner |
| X Developer Portal credits | OK |
| billing | OK |
| usage cap / spending cap相当 | OK |
| rate limit / quota | OK |
| App権限・本番利用可否 | OK |
| privacy/legal | OK |
| ログ保存期間 | OK |
| 問い合わせ先運用 | OK |
| KV障害時判断者 | OK |
| cacheなし継続可否 | OK |
| 復旧後確認手順 | OK |
| 本番API smoke承認 | 承認 |
| 最大実行回数 | 1 |
| 429確認 | 含めない |

## X Developer Console確認の抽象結果

- 残高: USD 4.97
- 請求サイクル: 2026-05-10 から 2026-06-10
- plan: Pay Per Use
- 自動チャージ: オフ
- 請求サイクル上限: USD 5.00
- 現在の支出: 約 USD 0.03 から USD 0.04
- 総リクエスト数: 7
- 利用イベント: Readイベントのみ
- App状態: ACTIVE
- Bearer Token: あり
- OAuth 1.0 Read権限表示: あり

## 本番API smoke承認

承認範囲:

- 本番 `/api/extract` を最大1回だけ実行する。
- 429確認は含めない。
- retry、負荷確認、繰り返し実行は行わない。
- 記録はHTTP status、source、cached、mediaUrls件数、warnings件数、error code、確認時刻、実行回数に限定する。

停止条件:

- `tmp/approved-smoke-target.txt` が存在しない、空、複数行、またはX/Twitter投稿URL形式ではない。
- 本番 `/api/extract` が1回を超えそうになった。
- 429確認、retry、負荷確認、繰り返し実行が必要になった。
- secret、token、OAuth、`.env`、`data/`、実データ、Cloudflare write操作が必要になった。

## 本番API smoke実行結果

2026/05/21 23:03:25 JST時点の結果:

| 項目 | 結果 |
| --- | --- |
| `tmp/approved-smoke-target.txt` | 提供済み |
| target ignore | OK |
| target validation | OK |
| 本番 `/api/extract` | 実行済み |
| 実行回数 | 1/1 |
| HTTP status | 200 |
| source | x-api-v2 |
| cached | false |
| mediaUrls件数 | 1 |
| warnings件数 | 0 |
| error code | なし |
| 429確認 | 未実行 |
| retry / 負荷確認 / 繰り返し実行 | 未実行 |
| Cloudflare write操作 | 未実行 |
| secret/token/OAuth/実データ読み取り | 未実行 |
| Issue #16 | 完了条件を満たすためclose |

完了判断:

- 本番API smokeは承認範囲どおり最大1回だけ実行した。
- 429確認、retry、負荷確認、繰り返し実行は行っていない。
- 記録は許可された集計項目だけに限定した。

## 最終クリーンアップ結果

2026/05/21 23:17:28 JST時点の結果:

| 項目 | 結果 |
| --- | --- |
| `tmp/approved-smoke-target.txt` | 内容を読まずに削除済み |
| 削除後の存在確認 | 存在しない |
| `tmp/` ignore | OK |
| smoke再実行 | 未実行 |
| 本番 `/api/extract` 再実行 | 未実行 |
| 429確認 / retry / 負荷確認 | 未実行 |
| Issue #13 - #16 | すべてclose済み |
| open issue | なし |
| open PR | なし |

補足:

- target fileは実X投稿URLを含む可能性があるため、削除時も内容を読まない。
- post-smoke cleanupでは、smoke scriptを再実行しない。
- 記録は削除有無、ignore状態、Issue / PR状態、test結果などの抽象情報に限定する。

## long-form Post 本番Web UI確認結果

2026/05/22 19:53:43 JST時点の人間確認結果:

| 項目 | 結果 |
| --- | --- |
| 確認者role | owner |
| 確認対象 | 本番Web UIでのlong-form X Post再取得 |
| PR #22 note_tweet対応 | merge済み |
| PR #24 stale cache無効化対応 | merge済み |
| 本文取得改善 | 確認済み |
| 以前の状態 | 冒頭付近で本文が途切れ、短縮URL表記が末尾に残る状態 |
| 修正後の状態 | 後半セクション、終盤の見出し、media URL欄まで取得できる状態 |
| 判断 | 旧cache由来の短縮本文ではなく、fresh抽出経路で改善したと判断できる |
| 本番 `/api/extract` 再実行 | Codexでは未実行 |
| `npm.cmd run smoke:production-once` | 未実行 |
| X API / oEmbed live通信 | Codexでは未実行 |
| Cloudflare write操作 | 未実行 |

記録境界:

- 実X投稿URL、postId、username、投稿本文、media URL値、raw JSON valuesは記録していない。
- token、secret、OAuth credential、Authorization header、Cookie、`.env`、`data/`、実データは読んでいない。
- この確認は人間による本番Web UI操作結果の抽象記録であり、Codexはlive API確認を追加実行していない。

## 記録禁止項目

- 実X投稿URL
- postId
- username
- account name
- 投稿本文
- media URL
- HTML本文
- raw JSON values
- token値
- secret
- OAuth credential
- Authorization header
- Cookie
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth` の内容
- 請求明細、支払い情報、個人情報
- Cloudflare内部ログの詳細本文
