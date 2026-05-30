# Incident and KV Failure Runbook

2026/05/21 13:45:31 JST

v0.1.0後にKV、X API、oEmbed、rate limit、Cloudflare Functionsで異常が疑われる場合の初動Runbookです。作成時点では、Cloudflare write操作、本番 `/api/extract`、X API / oEmbed live通信、実X投稿URL送信は実行していません。

## 基本方針

- KVはpostId単位cacheの最適化層。KV障害時にcacheなし継続をすると、cache missごとにX API v2またはoEmbed live通信が増える可能性がある。
- 現行KV実装ではphysical expiration TTLがlogical TTLと同じであるため、Cloudflare KV上で期限切れ後の `stale-cache` 到達性は本番保証として扱わない。
- KV physical TTL延長やdegraded oEmbed fallback結果の非cache化/短TTL化/現状維持は、privacy/legal/retentionまたはproduct判断が必要な未決事項として扱う。
- 判断者、credits、billing、usage capが未確認なら、API credits保護を優先し、追加smokeや連続確認は停止する。
- Codexはsecret、token、OAuth、実URL、実データ、Cloudflare write操作へ進まない。

## 役割と未確定事項

| 項目 | 状態 | 既定方針 |
| --- | --- | --- |
| Incident判断者 | 未確定 | Cloudflare account ownerまたは運用責任者を1名決める。未確定なら停止寄りに判断する。 |
| KV障害時判断者 | 未確定 | 判断者不在時はcacheなし継続を開始しない。 |
| ユーザー告知責任者 | 未確定 | 問い合わせ先運用が確定するまで、告知文案だけをrepoに残し、実告知は人間判断にする。 |
| ログ保存期間 | 未確定 | 安全な構造化ログだけを30日以内、またはCloudflare既定の短い保持期間に合わせる案。 |
| 復旧後の本番API smoke | 未確定 | `docs/production-smoke-runbook.md` の承認がある場合だけ実行する。 |

## 暫定停止の判断

次のどれかに該当したら、追加実行を止める。

- X API 402、403、429、5xx。
- oEmbed 429、5xx。
- `source` が想定外。
- `cached` が想定と違い、cache miss増加が疑われる。
- Cloudflare Functionsログに5xxまたは想定外error codeが出る。
- credits、billing、usage cap、spending cap相当が未確認。
- KV障害時判断者が未確定。
- Cloudflare write操作、secret確認、環境変数変更、rollbackが必要になった。

## ユーザー告知の文案

実告知は人間判断で行う。必要な場合の短い文案:

```text
現在、X投稿情報の取得が不安定な可能性があります。安全確認のため、一部の取得処理を停止または制限しています。復旧後に再度お試しください。
```

告知に実投稿URL、username、postId、投稿本文、media URL、token、secret、内部ログ本文を含めない。

## ログ確認

見てよい項目:

- 確認時刻
- request_id
- method
- path
- statusCode
- durationMs
- errorCode
- source
- cached
- mediaUrls件数
- warnings件数
- deployment IDまたはcommit hash

見ない・貼らない項目:

- request body
- 実X投稿URL
- postId
- username
- 投稿本文
- media URL
- HTML本文
- raw JSON values
- token、secret、OAuth credential、Authorization header、Cookie
- 請求明細、支払い情報、個人情報

## KV障害時の判断手順

1. 追加の本番 `/api/extract` と本番429確認を止める。
2. 人間がCloudflare DashboardでKV namespace、binding、TTL、Functionsエラー有無を確認する。Codexへ値やログ本文を貼らない。
3. 人間がX Developer Portalでcredits、billing、usage cap / spending cap相当を確認する。
4. 判断者がcacheなし継続可否を決める。
5. cacheなし継続をする場合でも、低トラフィック、短時間、最大回数、停止条件を明記する。
6. binding変更、redeploy、rollbackが必要ならCloudflare write操作として別承認にする。

## 復旧後確認

1. 変更した設定、deployment、binding、TTLを人間が確認する。
2. Codexが行えるのは、repo内docs更新、Issue更新、静的URL確認、またはread-only deployment確認まで。
3. 本番 `/api/extract` を確認する場合は `docs/production-smoke-runbook.md` の承認文言を使う。
4. 結果記録はHTTP status、source、cached、mediaUrls件数、warnings件数、error code、確認時刻に限定する。
5. 402 / 403 / 429 / 5xx / provider warning / 想定外sourceがあれば追加実行しない。

## 記録テンプレート

```text
確認時刻: YYYY/MM/DD HH:MM:SS JST
incident分類: KV / X API / oEmbed / rate limit / Cloudflare Functions / その他
判断者role: 未確認
HTTP status: 未確認
source: 未確認
cached: 未確認
mediaUrls件数: 未確認
warnings件数: 未確認
error code: 未確認
deployment IDまたはcommit hash: 未確認
追加実行: 停止 / 継続
Cloudflare write操作: 未実行
secret/token/OAuth/実データ読み取り: 未実行
次の人間確認: credits / billing / usage cap / KV binding / logs / legal / support
```
