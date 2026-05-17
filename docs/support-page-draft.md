# Support Page Draft

公開前検討用のサポートページ草案です。

## 使い方

1. Xポスト共有URLを入力します。
2. 取得ボタンを押します。
3. コピー用 `textarea` に表示された内容を確認します。
4. 必要に応じてコピーボタンを押します。
5. 魚拓が必要な場合は「魚拓を取得する場合はこちら」リンクを開きます。

## 取得できない場合

- 投稿が削除済み、非公開、埋め込み不可の場合は取得できないことがあります。
- oEmbed側の制限や一時的な障害で取得できないことがあります。
- 投稿本文と投稿日は安全に抽出できない場合 `未取得` になります。

## 不正URLエラー

対応URLは次の形式です。

- `https://x.com/{username}/status/{postId}`
- `https://twitter.com/{username}/status/{postId}`
- `https://mobile.twitter.com/{username}/status/{postId}`
- `https://x.com/i/web/status/{postId}`

短縮URL、他host、余分なpath、http URLは受け付けません。

## 取得方式による制限

X API Bearer Tokenが設定されている場合はX API v2から取得します。未設定時はoEmbed fallbackで取得するため、メディア直接URLを取得できない場合があります。

## 魚拓

- 魚拓は自動取得しません。
- 魚拓リンクは外部サイトをユーザー操作で開くだけです。
- 魚拓URL欄は `https://megalodon.jp/...` または `https://s{digits}.megalodon.jp/...` のみ有効です。

## 問い合わせ先

`h8nc4y.sub01@gmail.com`

この問い合わせ先はユーザー指定値として反映したもので、公開前にサポート範囲と法務レビュー要否を確認します。

## プライバシーポリシー

公開URL候補: `https://x-archive-link-tool.pages.dev/privacy.html`

最新Production反映: 未確認

## 公開前レビューで決めること

- [x] 問い合わせ先: `h8nc4y.sub01@gmail.com`
- [ ] サポート対応範囲: 未設定 / 人間判断待ち
- [ ] 障害時の告知方法: 未設定 / 人間判断待ち
