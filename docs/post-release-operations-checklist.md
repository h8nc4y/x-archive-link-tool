# Post-release Operations Checklist

2026/05/20 18:38:44 JST

`v0.1.0` Release後に、人間が確認すべき運用項目と、限定的な本番API smokeへ進むための承認条件を整理するチェックリストです。

この文書は手順整理用です。作成時点では、本番 `/api/extract`、本番429確認、X API live通信、oEmbed live通信、実X投稿URL送信、Cloudflare write操作、secret / token / OAuth / 実データの読み取りは実行していません。

Issue #42の現在の判断パケットは `docs/post-release-operations-decision-packet.md`。このチェックリストは個別項目の作業台帳であり、Issue #42のclose可否は判断パケットのclose条件に従う。

## 残タスクの分類

| 分類 | 項目 | Codexの扱い | 次の入力 |
| --- | --- | --- | --- |
| 人間確認が必須 | X Developer Portal credits残量、billing状態、usage cap / spending cap相当、rate limit / quota、App権限、本番利用可否 | Codexはログイン、OAuth、実確認をしない。`docs/post-release-human-verification-template.md` の空欄を埋めるためのtemplate整備だけ行う。 | 実URLやtokenを含まないOK/NG、確認日、判断者、上限値の要約。 |
| 人間確認が必須 | privacy/legal review、ログ保存期間、問い合わせ先、サポート範囲 | Codexは法務判断を代替しない。候補文面、確認欄、Issue整理だけ行う。 | review済み/未確認、問い合わせ先の公開可否、ログ保存期間の確定値。 |
| 人間確認が必須 | KV障害時判断者、cacheなし継続可否、停止判断 | Codexは判断者を推測しない。`docs/incident-and-kv-failure-runbook.md` へ未確定として残す。 | 判断者名またはrole、停止/継続基準、復旧確認の承認範囲。 |
| Codexが自走可能 | repo内docs、README導線、Issue、dry-run script、Node test | 実装、検証、PR、mergeまで実行可能。外部live通信は行わない。 | 追加承認不要。 |
| Codexが実行禁止 | 実X投稿URL送信、X API / oEmbed live通信、本番 `/api/extract` smoke、本番429確認 | 明示承認とrunbook条件が揃うまで停止。 | `docs/production-smoke-runbook.md` の承認文言、最大回数、抽象化済み記録形式。 |
| Codexが実行禁止 | secret/token/OAuth/`.env`/実データ読み取り、課金が発生しうる外部操作、Cloudflare write操作 | 必要になった時点で停止し、費用・代替案・承認文言を報告する。 | secret値そのものではなく、設定済み/未設定/確認済みなどの抽象結果だけ。 |

## Codexへ渡してよい安全な情報

- X Developer Portal、billing、credits、usage cap / spending cap相当の `OK` / `NG` / `未確認`。
- credits残量やcap値の要約。ただし請求明細、支払い情報、token、secretは含めない。
- 確認日、確認者role、次回確認予定日。
- smoke対象が「人間が選んだテスト用公開投稿」かどうかの分類。実URL自体は渡さない。
- 本番API smoke承認文言、最大実行回数、記録してよい抽象項目。
- smoke実行後の抽象化済み結果: HTTP status、source、cached、mediaUrls件数、warnings件数、error code、確認時刻。

## 記録禁止情報

- token、secret、OAuth credential、Authorization header、Cookie。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth` 配下の内容。
- 実X投稿URL、postId、username、account name、実投稿本文、media URL、HTML本文、raw JSON values。
- 個人情報、請求明細、支払い情報、Cloudflare内部ログの詳細本文。

## GitHub Issue追跡

- [#13 Confirm X Developer Portal credits, billing, and usage caps before production smoke](https://github.com/h8nc4y/x-archive-link-tool/issues/13)
- [#14 Confirm privacy, legal, log retention, and support contact operations](https://github.com/h8nc4y/x-archive-link-tool/issues/14)
- [#15 Define KV outage owner and incident handling path](https://github.com/h8nc4y/x-archive-link-tool/issues/15)
- [#16 Approve and record production API smoke test without secrets or real URLs](https://github.com/h8nc4y/x-archive-link-tool/issues/16)

## 現在の前提

- Repository: `h8nc4y/x-archive-link-tool`
- Release: `v0.1.0`
- GitHub Release: https://github.com/h8nc4y/x-archive-link-tool/releases/tag/v0.1.0
- `v0.1.0` tag target: `4669e5b6fe0387223f1418bc8d9e851cc8e7cbe5`
- Release後docs HEAD: `61fd97373362b36725ee02c338f59ad6a8c2205d`
- 公開URL: https://x-archive-link-tool.pages.dev
- 本番API smoke: 未実行
- 本番429確認: 未実行
- X API / oEmbed live通信: この文書作成では未実行
- X Developer Portal、billing、credits、usage capの実状態: 未確認
- Cloudflare write操作、deploy、delete、rollback、KV/D1/Queues/Workers AI/AI Gateway/secret/環境変数変更: この文書作成では未実行

## 人間確認チェックリスト

### X Developer Portal

Codexへtoken、secret、OAuth credential、実X投稿URL、実データ、スクリーンショット内の秘密情報を共有しない。確認結果を共有する場合は、数値や状態だけを必要最小限に要約する。

| 項目 | 状態 | 人間が確認する内容 | 推奨記録 |
| --- | --- | --- | --- |
| credits残量 | 未確認 | 現在の残credits、当月または対象期間の消費量、次回reset日を確認する。 | 残credits、消費量、reset日。tokenや投稿URLは記録しない。 |
| billing状態 | 未確認 | 有料請求の有無、支払い方法、課金停止状態、未払い警告、plan状態を確認する。 | `課金なし` / `有料plan` / `未確認` などの状態だけ。請求明細や支払い情報は貼らない。 |
| usage cap / spending cap相当 | 未確認 | 予算上限、usage cap、spending cap、アラート、overage防止設定の有無を確認する。 | cap有無、上限値、alert有無。支払い情報は記録しない。 |
| API使用量確認頻度 | 未確認 | 公開後初期の確認頻度を決める。 | 推奨: 公開前、公開直後、初週は毎日、その後は週次、安定後は月次。429や取得失敗の問い合わせがあれば臨時確認。 |
| endpoint access / App権限 | 未確認 | `GET /2/tweets/:id` 相当が利用可能か、App権限やproject紐付けに問題がないか確認する。 | access可否と確認日。tokenやApp secretは記録しない。 |
| 402 / 403 / 429発生時の判断者 | 未確認 | credits、billing、権限、rate limitのどれを疑うか、誰がX Developer Portalを確認するか決める。 | 判断者名またはrole、一次対応方針。 |

## Cloudflareログ確認方針

Cloudflareでは読み取り確認だけを行う。Wrangler OAuth tokenには広いwrite権限が含まれる可能性があるため、Codexや自動作業では `whoami` とdeployment listなどのread-only操作に限定する。

| 項目 | 状態 | 方針 |
| --- | --- | --- |
| 確認対象 | 未確認 | Pages Functionsの安全な構造化ログだけを見る。request body、投稿本文、media URL、username、postId、JSON values、token、Authorization header、Cookie、secret値は見ない、貼らない、保存しない。 |
| 確認頻度 | 未確認 | 推奨: 公開直後は日次、安定後は週次。429、5xx、X API warning、問い合わせ発生時は臨時確認。 |
| 記録してよい項目 | 方針あり | HTTP status、error code、source、cached、mediaUrls件数、warnings件数、deployment ID、commit hash、確認時刻。 |
| ログ保存期間 | 未確認 | 推奨: 安全な構造化項目だけを30日以内、またはCloudflare既定の短い保持期間に合わせる。法務レビュー後に確定する。 |
| ログ削除・保持責任者 | 未確認 | Cloudflare account ownerまたは運用責任者を1名決める。 |
| Wrangler OAuth token注意 | 方針あり | 広いwrite権限を持ち得るため、deploy、delete、rollback、設定変更、環境変数変更、secret操作、KV/D1/Queues/AI操作は本書のsmoke承認とは別承認にする。 |

## KV障害時の判断

KVはpostId単位cacheの最適化層です。cache miss時はX API v2またはoEmbed fallbackへ進むため、KV障害時にcacheなしで継続すると、同じ投稿でも外部API creditsやoEmbed live通信が増える可能性があります。

| 項目 | 状態 | 判断内容 |
| --- | --- | --- |
| KV障害時判断者 | 未確認 | Cloudflare account ownerまたは運用責任者を1名決める。判断者不在時は、credits保護を優先し、本番API smokeや追加確認を停止する。 |
| cacheなし継続可否 | 未確認 | 低トラフィックかつcredits残量とusage capが安全に確認済みなら、短時間だけcacheなし継続を検討できる。未確認ならAPI credits保護のため停止または利用制限を優先する。 |
| API credits保護の停止条件 | 未確認 | KV障害に加えて、X API 402 / 429、急なcache miss増加、5xx増加、usage cap未確認、billing未確認のいずれかがある場合は追加実行しない。 |
| 切り戻し候補 | 候補のみ | `X_POST_CACHE` bindingを外してProduction redeployし、in-memory fallbackで継続する案。ただしCloudflare write操作なので、本書の作成や本番API smoke承認とは別に明示承認が必要。 |
| 復旧後の確認手順 | 未確認 | 1. KV namespace / binding / TTLが想定どおりか人間が確認する。2. Production deployment対象commitをread-onlyで確認する。3. 静的URL `/` と `/privacy` のHEAD/GETだけ確認する。4. 本番 `/api/extract` は別途限定smoke承認がある場合だけ実行する。5. 記録はHTTP status、source、cached、mediaUrls件数、warnings件数、error codeに限定する。 |

## Privacy / Support / Legal確認

| 項目 | 状態 | 人間が確認する内容 |
| --- | --- | --- |
| privacy文面 | 未確認 | `docs/privacy-policy-draft.md` と公開 `/privacy` の文面が、実運用、ログ項目、X API/oEmbed利用、問い合わせ先と矛盾しないか確認する。 |
| 問い合わせ先 | 未確認 | `h8nc4y.sub01@gmail.com` を公開問い合わせ先として使うか、受信体制、返信SLA、迷惑メール対策を確認する。 |
| 法務レビュー | 未確認 | privacy文面、問い合わせ先、ログ保存期間、外部API利用、X投稿URL処理、魚拓外部リンク導線について法務または責任者レビューを行う。 |
| public release表示 | 未確認 | GitHub Release、README、公開UI、privacyページの説明が一致しているか確認する。 |

## 本番API smokeへ進む条件

本番API smokeは、実X投稿URL、X API credits、oEmbed live通信、Cloudflare Functionsログに影響し得るため、人間の明示承認がある場合だけ実行する。

実行前にすべて満たすこと:

- X Developer Portalでcredits残量、billing状態、usage cap / spending cap相当、endpoint accessを人間が確認済み。
- smokeに使う実X投稿URLを人間が指定済み。ただしURLそのものはdocs、issue、PR、チャット、ログに残さない。
- 実行回数上限が決まっている。初回推奨は最大1回。cache確認まで行う場合でも最大2回。
- 429確認は含めない。429確認をする場合は別の明示承認にする。
- 記録項目と禁止記録項目を実行者が確認済み。
- Cloudflare write操作、deploy、delete、rollback、KV/D1/Queues/Workers AI/AI Gateway/secret/環境変数変更を同時に行わない。
- 5xx、402、403、429、X API provider warning、想定外のsource、想定外のログ、credits消費増加疑いが出たら追加実行しない。

承認文言案:

```text
本番 /api/extract を、私が指定する実X投稿URLで最大 N 回だけ実行することを承認します。429確認、Cloudflare write操作、deploy、delete、rollback、KV/D1/Queues/Workers AI/AI Gateway/secret/環境変数変更は実行しないでください。記録は HTTP status、source、cached、mediaUrls件数、warnings件数、error code、確認時刻に限定し、実投稿URL、投稿本文、mediaUrls値、username、postId、HTML本文、JSON values、Authorization header、token、secret値、Cookieは記録しないでください。
```

## 本番API smoke手順

### 実行前チェック

1. `git status` と対象commitを確認する。
2. X Developer Portalのcredits、billing、usage cap / spending cap相当、endpoint access確認が人間により完了していることを確認する。
3. 実行回数上限を確認する。初回推奨は最大1回。
4. 本番429確認を含めないことを確認する。
5. Cloudflare操作はread-onlyに限定し、deploy、delete、rollback、設定変更、secret操作、KV/D1/Queues/Workers AI/AI Gateway操作をしない。
6. 記録先に実投稿URL、投稿本文、mediaUrls値、username、postId、HTML本文、JSON values、Authorization header、token、secret値、Cookieを書かない運用を確認する。

### 実行時記録項目

記録してよい項目:

- 確認時刻
- HTTP status
- source
- cached
- mediaUrls件数
- warnings件数
- error code
- 実行回数
- deployment IDまたはcommit hash

記録してはいけない項目:

- 実投稿URL
- 投稿本文
- mediaUrls値
- username
- postId
- HTML本文
- JSON values
- Authorization header
- token
- secret値
- Cookie
- Cloudflare内部ログの詳細本文

### 実行後確認

1. 結果が承認範囲内の実行回数に収まっていることを確認する。
2. 記録が許可項目だけになっていることを確認する。
3. X Developer Portalでcredits消費、rate limit、billing警告、usage cap到達の有無を人間が確認する。
4. Cloudflare Functionsログを見る場合は、安全な構造化項目だけを確認する。
5. 402 / 403 / 429 / 5xx / provider warning / 想定外sourceがあれば、追加実行せず、原因分類だけを記録する。

### 停止条件

次のいずれかが出たら追加実行しない。

- 承認回数上限に達した。
- HTTP 402、403、429、5xx。
- `source` が想定外。
- `cached` が想定と違い、credits消費増加の疑いがある。
- warnings件数が0ではない、またはX API provider warningがある。
- Cloudflare Functionsログに想定外のエラーがある。
- X Developer Portalでcredits、billing、usage cap、spending cap相当、endpoint accessが未確認。
- 実投稿URL、本文、mediaUrls値、username、postId、HTML本文、JSON values、Authorization header、token、secret値、Cookieを記録しそうになった。
- Cloudflare write操作、deploy、delete、rollback、設定変更、secret操作、KV/D1/Queues/Workers AI/AI Gateway操作が必要になった。

## 本番429確認の扱い

本番429確認は、本番API smokeとは別作業として扱う。初回公開後の確認では原則実行しない。

理由:

- 意図的な連続リクエストで本番負荷を作る。
- X API creditsまたはoEmbed live通信に影響し得る。
- 正常利用者に影響する可能性がある。
- Cloudflareログやrate limit状態の確認が必要になる。

推奨代替:

- ローカルfixtureと `npm test` でrate limit挙動を確認する。
- 本番でどうしても確認する場合は、実行回数、間隔、対象、記録項目、停止条件を別文書または別承認で固定する。

## この文書作成時に実行していないこと

- 本番 `/api/extract`
- 本番429確認
- X API live通信
- oEmbed live通信
- 実X投稿URL送信
- X Developer Portal、billing、credits画面の実確認
- secret、token、OAuth、credential、実データの読み取り、表示、変更、送信
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth`、実データの読み取り
- Cloudflare deploy、delete、rollback、設定変更、環境変数変更、secret操作
- KV/D1/Queues/Workers AI/AI Gatewayのwrite操作
