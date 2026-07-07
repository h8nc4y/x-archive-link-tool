# Test Cases

検証コマンド: `npm test`

PowerShellで `npm.ps1` の実行ポリシーエラーになる場合は `npm.cmd test` を使う。

直近確認: 142 tests pass。`package.json` の `npm test` は `node --test` の自動探索で `*.test.js` を実行し、URL validator、rate limiter、KV post cache、Markdown local link and anchor guard、Cloudflare Functions extract tests、Web UI copy/static header testsを含む。

## Valid URL examples

| input | canonicalXPostUrl |
| --- | --- |
| `https://x.com/example/status/1234567890` | `https://x.com/example/status/1234567890` |
| `https://twitter.com/example/status/1234567890` | `https://x.com/example/status/1234567890` |
| `https://mobile.twitter.com/example/status/1234567890` | `https://x.com/example/status/1234567890` |
| `https://x.com/user_123/status/1?s=20` | `https://x.com/user_123/status/1` |
| `https://x.com/Example/status/1234567890123456789#ref` | `https://x.com/Example/status/1234567890123456789` |
| `https://x.com/i/web/status/1234567890` | `https://x.com/i/web/status/1234567890` |

## Invalid URL examples

| input | reason |
| --- | --- |
| `http://x.com/example/status/1234567890` | protocol is not `https` |
| `https://example.com/example/status/1234567890` | host is not allowed |
| `https://t.co/abcdef` | short URL is rejected |
| `https://x.com/example` | path is not `/{username}/status/{postId}` |
| `https://x.com/example/status/abc` | postId is not numeric |
| `https://x.com/example/status/12345678901234567890` | postId is longer than 19 digits |
| `https://x.com/user-name/status/123` | username contains invalid character |
| `https://x.com/abcdefghijklmnop/status/123` | username is longer than 15 characters |
| `https://x.com/example/status/123/extra` | path has extra segment |

## 魚拓リンク例

`canonicalXPostUrl` が `https://x.com/example/status/1234567890` の場合、4サービスを併記する（すべて外部リンク、ポスト取得前は `aria-disabled="true"`）:

| サービス | 型 | href |
| --- | --- | --- |
| ウェブ魚拓（gyo.tc） | prefix | `https://gyo.tc/https://x.com/example/status/1234567890` |
| Wayback Machine | prefix | `https://web.archive.org/save/https://x.com/example/status/1234567890` |
| archive.today | prefix | `https://archive.ph/newest/https://x.com/example/status/1234567890` |
| Twitter魚拓（twtr.satoru.net） | query | `https://twtr.satoru.net/?mode=check&url=https%3A%2F%2Fx.com%2Fexample%2Fstatus%2F1234567890` |

各リンク共通で `target="_blank" rel="noopener"`、`noreferrer` は付けない。

## 魚拓URL入力例

貼り付け欄は、併記した各サービスの結果URLホストを許可する。

| input | result |
| --- | --- |
| `https://megalodon.jp/2026-0509-0000-00/example` | コピー用テキストにそのURLを使う |
| `https://s1.megalodon.jp/2026-0509-0000-00/example` | コピー用テキストにそのURLを使う |
| `https://gyo.tc/abcdef` | コピー用テキストにそのURLを使う |
| `https://web.archive.org/web/20260504/https://x.com/a/status/1` | コピー用テキストにそのURLを使う |
| `https://archive.ph/newest/https://x.com/a/status/1` | コピー用テキストにそのURLを使う |
| `https://archive.today/abcd1` | コピー用テキストにそのURLを使う |
| `https://example.com/archive` | `未取得`（許可外ホスト） |
| `http://megalodon.jp/2026-0509-0000-00/example` | `未取得`（非https） |
| `https://megalodon.jp` | `未取得`（パスなし） |
| ` https://megalodon.jp/2026-0509-0000-00/example ` | `未取得` |
| `https://megalodon.jp/2026-0509-0000-00/example extra` | `未取得` |
| `https://megalodon.jp/2026-0509-0000-00/example` と `extra` が改行で続く貼り付け | `未取得` |
