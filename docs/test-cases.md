# Test Cases

検証コマンド: 未確認

## Valid URL examples

| input | canonicalXPostUrl |
| --- | --- |
| `https://x.com/example/status/1234567890` | `https://x.com/example/status/1234567890` |
| `https://twitter.com/example/status/1234567890` | `https://x.com/example/status/1234567890` |
| `https://mobile.twitter.com/example/status/1234567890` | `https://x.com/example/status/1234567890` |
| `https://x.com/user_123/status/1?s=20` | `https://x.com/user_123/status/1` |
| `https://x.com/Example/status/1234567890123456789#ref` | `https://x.com/Example/status/1234567890123456789` |

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
| `https://x.com/i/web/status/1234567890` | path is not accepted |
| `https://x.com/example/status/123/extra` | path has extra segment |

## 魚拓リンク例

`canonicalXPostUrl` が `https://x.com/example/status/1234567890` の場合:

```html
<a href="https://gyo.tc/https://x.com/example/status/1234567890" target="_blank" rel="noopener">魚拓を取得する場合はこちら</a>
```

`noreferrer` は付けない。
