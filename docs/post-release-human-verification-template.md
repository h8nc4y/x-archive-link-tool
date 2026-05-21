# Post-release Human Verification Template

2026/05/21 13:45:31 JST

人間がX Developer Portal、billing、credits、privacy/legal、問い合わせ先、KV障害時判断者を確認した結果を、実URL・token・secret・OAuth情報なしでCodexへ渡すためのテンプレートです。

このテンプレートに実X投稿URL、postId、username、投稿本文、media URL、raw JSON values、token、secret、Authorization header、Cookie、請求明細、支払い情報、個人情報を書かないでください。

## 1. X Developer Portal / Billing

- [ ] credits残量を確認した。
  - 状態: `OK / NG / 未確認`
  - 残量の要約:
  - 次回reset日または対象期間:
- [ ] billing状態を確認した。
  - 状態: `OK / NG / 未確認`
  - 課金planまたは無料枠の要約:
  - 支払い警告の有無:
- [ ] usage cap / spending cap相当を確認した。
  - 状態: `OK / NG / 未確認`
  - cap有無:
  - 上限値の要約:
  - alert有無:
- [ ] rate limit / quotaを確認した。
  - 状態: `OK / NG / 未確認`
  - 本番smoke最大回数に対して安全か:
- [ ] App権限・本番利用可否を確認した。
  - 状態: `OK / NG / 未確認`
  - `GET /2/tweets/:id` 相当の利用可否:

## 2. Privacy / Legal / Support

- [ ] privacy文面を確認した。
  - 状態: `OK / NG / 未確認`
  - 確認対象:
- [ ] legal reviewまたは責任者reviewを確認した。
  - 状態: `OK / NG / 未確認`
  - review者role:
- [ ] ログ保存期間を確認した。
  - 状態: `OK / NG / 未確認`
  - 保存期間:
  - 削除方針:
- [ ] 問い合わせ先と運用を確認した。
  - 状態: `OK / NG / 未確認`
  - 公開問い合わせ先の利用可否:
  - 返信責任者またはrole:

## 3. KV / Incident

- [ ] KV障害時判断者を確認した。
  - 状態: `OK / NG / 未確認`
  - 判断者名またはrole:
- [ ] cacheなし継続可否を確認した。
  - 状態: `OK / NG / 未確認`
  - 継続してよい条件:
  - 停止する条件:
- [ ] 復旧後確認手順を確認した。
  - 状態: `OK / NG / 未確認`
  - 本番 `/api/extract` を含めるか:
  - Cloudflare write操作が必要な場合の承認経路:

## 4. Production API Smoke Approval

- [ ] 本番API smokeを承認する。
  - 状態: `承認 / 非承認 / 未確認`
  - 最大実行回数:
  - smoke対象分類: `人間が選んだテスト用公開投稿 / その他 / 未確認`
  - 429確認を含めるか: `含めない / 別承認 / 未確認`

承認する場合は、次の文言を具体化して渡す:

```text
本番 /api/extract を、私が指定するテスト用公開X投稿URLで最大 N 回だけ実行することを承認します。429確認、Cloudflare write操作、deploy、delete、rollback、KV/D1/Queues/Workers AI/AI Gateway/secret/環境変数変更は実行しないでください。記録は HTTP status、source、cached、mediaUrls件数、warnings件数、error code、確認時刻、実行回数に限定し、実投稿URL、投稿本文、mediaUrls値、username、postId、HTML本文、raw JSON values、Authorization header、token、secret値、Cookieは記録しないでください。停止条件に該当したら追加実行しないでください。
```

## 5. Codexへ渡してよい要約

```text
確認日: YYYY/MM/DD
確認者role:
X Developer Portal credits: OK / NG / 未確認
billing: OK / NG / 未確認
usage cap / spending cap相当: OK / NG / 未確認
rate limit / quota: OK / NG / 未確認
App権限・本番利用可否: OK / NG / 未確認
privacy/legal: OK / NG / 未確認
ログ保存期間: OK / NG / 未確認
問い合わせ先運用: OK / NG / 未確認
KV障害時判断者: OK / NG / 未確認
本番API smoke承認: 承認 / 非承認 / 未確認
最大実行回数:
補足:
```

## 6. 禁止記録項目

- 実X投稿URL、postId、username、account name、投稿本文、media URL。
- HTML本文、raw JSON values、raw API response。
- token、secret、OAuth credential、Authorization header、Cookie。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth` の内容。
- 請求明細、支払い情報、個人情報。
- Cloudflare内部ログの詳細本文。
