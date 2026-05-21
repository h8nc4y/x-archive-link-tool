# Production API Smoke Runbook

2026/05/21 13:45:31 JST

v0.1.0後に本番 `/api/extract` を限定確認する場合のRunbookです。この文書は承認条件と記録境界を固定するためのものであり、作成時点では本番 `/api/extract`、本番429確認、X API / oEmbed live通信、実X投稿URL送信は実行していません。

## 実行前提

- 人間が `docs/post-release-human-verification-template.md` を実URL・tokenなしで記入済み。
- X Developer Portal credits、billing、usage cap / spending cap相当、rate limit / quota、App権限、本番利用可否が `OK`。
- privacy/legal review、ログ保存期間、問い合わせ先、KV障害時判断者が確認済み、または未確認のまま実施する理由と責任者が明記済み。
- smokeに使う投稿は、人間が選んだテスト用の公開投稿である。ただし実URL、postId、usernameはdocs、Issue、PR、チャット、ログに記録しない。
- 実行回数上限が決まっている。初回推奨は最大1回。cache確認を含める場合でも最大2回。
- Cloudflare deploy、delete、rollback、設定変更、環境変数変更、secret操作、KV/D1/Queues/Workers AI/AI Gateway操作を同時に行わない。

## 人間承認条件

実行者は、次の条件がすべて満たされた場合だけ本番API smokeへ進める。

- 人間確認templateの必須項目が `OK` または明示的な `未確認のまま進める理由あり` になっている。
- X API credits消費、oEmbed live通信、本番Functionsログへの影響が理解されている。
- 記録してよい項目と禁止記録項目が確認済み。
- 失敗時に追加実行しない停止条件が確認済み。
- 429確認はこの承認に含めない。429確認は別承認にする。

## 承認文言

```text
本番 /api/extract を、私が指定するテスト用公開X投稿URLで最大 N 回だけ実行することを承認します。429確認、Cloudflare write操作、deploy、delete、rollback、KV/D1/Queues/Workers AI/AI Gateway/secret/環境変数変更は実行しないでください。記録は HTTP status、source、cached、mediaUrls件数、warnings件数、error code、確認時刻、実行回数に限定し、実投稿URL、投稿本文、mediaUrls値、username、postId、HTML本文、raw JSON values、Authorization header、token、secret値、Cookieは記録しないでください。停止条件に該当したら追加実行しないでください。
```

`N` は具体的な数字に置き換える。初回推奨は `1`、cache確認を含める場合の上限は `2`。

## 実行してよい範囲

- 承認された最大回数以内の本番 `/api/extract`。
- 実行前後の `git status`、対象commit確認、PR/Issueへの抽象結果記録。
- Cloudflareログを確認する場合は、安全な構造化項目だけを読む。

## 実行してはいけない範囲

- 本番429確認。
- 承認回数を超える再試行。
- X Developer Portal、billing、credits画面へのCodexログイン。
- 実URL、postId、username、本文、media URL、raw JSON valuesの記録。
- token、secret、OAuth credential、Authorization header、Cookie、`.env`、実データの読み取りや記録。
- Cloudflare deploy、delete、rollback、設定変更、環境変数変更、secret操作、KV/D1/Queues/Workers AI/AI Gateway操作。
- 料金が発生しうる外部操作、paid API、paid model、Workers AI、AI Gateway。

## 429確認時の扱い

本番429確認はこのRunbookの通常smokeに含めない。必要な場合は、実行回数、間隔、対象、記録項目、停止条件、X API credits保護方針を別承認にする。

推奨代替はローカル `npm test` のrate limit testである。本番で意図的な連続リクエストを作る前に、ローカルfixtureで再現できない理由を記録する。

## X API / oEmbed live通信が発生しうる場合の停止条件

次のどれかに該当したら、追加実行しない。

- 人間確認templateでcredits、billing、usage cap、App権限が `OK` ではない。
- HTTP 402、403、429、5xx。
- `source` が想定外、または `cached` が想定と違う。
- warnings件数が0ではない、またはX API provider warningがある。
- credits消費増加、usage cap接近、billing警告、rate limit接近の疑いがある。
- 実URL、postId、username、本文、media URL、raw JSON values、token、secretを記録しそうになった。
- Cloudflare write操作やsecret確認が必要になった。

## 失敗時の記録方法

原因分類だけを記録する。raw response、本文、実URL、postId、username、media URL、HTML本文、raw JSON valuesは記録しない。

記録例:

```text
確認時刻: YYYY/MM/DD HH:MM:SS JST
実行回数: 1/1
HTTP status: 429
source: 未確認
cached: 未確認
mediaUrls件数: 未確認
warnings件数: 未確認
error code: rate_limited
判断: 停止条件に該当したため追加実行なし
```

## rollbackまたは停止判断

このRunbookの通常smokeではrollbackを実行しない。rollback、binding変更、環境変数変更、redeployが必要な場合はCloudflare write操作になるため停止し、人間承認を別途取得する。

通常smokeで異常が出た場合の既定対応は、追加実行停止、Issueへ抽象結果記録、人間がX Developer PortalとCloudflare Dashboardを確認することである。

## 記録項目

記録してよい項目:

- 確認時刻
- 実行回数
- HTTP status
- source
- cached
- mediaUrls件数
- warnings件数
- error code
- deployment IDまたはcommit hash
- 停止条件に該当したかどうか

## 禁止記録項目

- 実X投稿URL
- postId
- username
- account name
- 投稿本文
- media URL
- HTML本文
- raw JSON values
- token
- secret
- OAuth credential
- Authorization header
- Cookie
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth` の内容
- 請求明細、支払い情報、個人情報
- Cloudflare内部ログの詳細本文
