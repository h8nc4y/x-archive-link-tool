# Post-release Human Verification Record

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

2026/05/21 14:28:00 JST時点の結果:

| 項目 | 結果 |
| --- | --- |
| `tmp/approved-smoke-target.txt` | 未提供 |
| target ignore | OK |
| 本番 `/api/extract` | 未実行 |
| 実行回数 | 0/1 |
| 429確認 | 未実行 |
| retry / 負荷確認 / 繰り返し実行 | 未実行 |
| Cloudflare write操作 | 未実行 |
| secret/token/OAuth/実データ読み取り | 未実行 |
| Issue #16 | target未提供のためopen継続 |

停止理由:

- `tmp/approved-smoke-target.txt` が存在しないため、停止条件 `target_missing` に該当した。
- 入力待ちは行わず、本番API smokeは実行していない。

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
