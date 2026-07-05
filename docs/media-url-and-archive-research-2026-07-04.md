# 無料メディアURL取得手段と魚拓導線の調査 (2026-07-04)

作成: 2026-07-04 JST（Claude Code Fable 5、Web調査は Sonnet subagent 実施）
背景: 2026-07-04 オーナー指示（CC-013）「https://ohayua.cloudfree.jp/twitter/ が無料でメディア画像出力を実現している仕組みを調査し、同様の無料手段を模索する」への回答。あわせて魚拓導線の複数併記（CC-012）に必要な各サービスのURL連携形式を調査した。

調査方法: 対象サイトの公開HTML/JSの静的解析と公開ドキュメントのWeb調査のみ。**実在のX投稿URL・postIdはどのAPI/サービスにも送信していない**（AGENTS.md 禁止事項の遵守。このため各手法の「現時点で実際に動くか」は文献ベース）。

## 1. ohayua.cloudfree.jp/twitter/ の仕組み

- **確認した事実**（トップページと main.js の静的解析）: 入力URLをクライアントJSが同一オリジンのサーバー側PHP `json.php` へ渡し、抽出処理はすべてサーバー側で実行している。レスポンスには長文投稿全文（`note_tweet`）や複数枚画像URL（`pbs.twimg.com/media/...`、原寸 `?name=orig` 付与）が含まれる。
- **推測（事実と区別）**: `json.php` の中身は非公開のため未確認だが、無料ホスティング上で動作し有料X APIを負担している形跡がないこと、`note_tweet`・投票結果・原寸画像への対応から、**X の非公開 syndication API（cdn.syndication.twimg.com）または内部GraphQL をサーバー側から叩いている可能性が高い**。
- 結論: **規約適合の無料手段によるものではない（可能性が高い）**。サイト管理者がAPI料金を負担している形跡は確認できなかった。

## 2. 無料メディアURL取得の候補と評価

| 手法 | 無料 | 安定性 | X規約リスク | 本repo禁止事項との整合 |
| --- | --- | --- | --- | --- |
| X API v2 BYOT（現行） | ユーザー負担（2026-02から従量課金） | 高（公式） | なし | 適合 |
| 公式oEmbed（現行fallback） | 無料 | 高（公式）。ただしメディアURLは構造的に取得不可 | なし | 適合 |
| syndication API 直叩き | 無料 | 低〜中（非公開API。token生成式の変更実績が2025年に複数回） | 中〜高（非公式内部API） | **抵触**（送信先ホワイトリスト「X API v2と公式oEmbedのみ」の外） |
| fxtwitter (FxEmbed) 公開API | 無料（1000req/分/IP明記） | 中（第三者コミュニティ運営、障害実績あり、SLAなし） | 中（間接） | **抵触**（ホワイトリスト外＋postIdの第三者送信） |
| vxtwitter | 無料 | 中（レート制限非公開） | 中（間接） | **抵触**（同上） |

## 3. 結論と推奨（CC-013）

1. 「無料でメディアURL」を規約適合かつ本repoの安全境界（ユーザー入力URLをX API v2/公式oEmbed以外へ送らない）の内側で実現する手段は**存在しない**（2026-07-04時点の調査では発見できず）。
2. **推奨: 現行の oEmbed-first + X API 任意BYOT を維持**し、「oEmbed経路ではメディアURL未取得」は仕様として受け入れる（UIでは実装済みの補足文で説明）。
3. どうしてもメディアURLが必要なら、候補の中では fxtwitter (FxEmbed) 公開APIが最も整備されているが、(a) 送信先ホワイトリストの変更＝**製品要件変更（ゲート④、オーナー承認必須）**、(b) postId の第三者送信、(c) 持続性リスク、の3点を受け入れる判断が前提。**Fable5 としては非推奨**。
4. syndication API 直叩きは、仕様変更実績と規約グレーの二重リスクで**非推奨**。

## 4. 魚拓・アーカイブ各サービスのURL連携形式（CC-012 実装用）

| サービス | 連携形式 | 保存/導線URL | 備考 |
| --- | --- | --- | --- |
| ウェブ魚拓 gyo.tc | prefix型 | `https://gyo.tc/{canonicalXPostUrl}` | 現行採用。**megalodon.jp と同一サービス**（gyo.tc は入口ドメイン、閲覧URLが megalodon.jp）。X投稿はログイン壁で取得失敗の報告あり |
| Wayback Machine | prefix型 | `https://web.archive.org/save/{canonicalXPostUrl}` | 公式。X投稿は再生品質に難（JSON形保存、2025-05からHTMLプレビュー対応）という留意点あり |
| archive.today 系 | prefix型 | 保存 `https://archive.ph/?url={encoded}` 系 / 閲覧 `https://archive.ph/newest/{canonicalXPostUrl}` | 保存時に毎回CAPTCHAあり（ユーザー操作前提なら成立）。2026-02 に Wikipedia が信頼性問題で参照除外した留意点あり |
| Twitter魚拓 twtr.satoru.net | **form型** | トップページへのリンクのみ（URL自動連携は不可） | スクリーンショット型。ユーザーがURLを貼り付ける手順案内が必要 |

- どのサービスもサーバーから取得しない（外部リンク提示のみ）という現行方針は全サービス共通で維持する。
- 「複数サービス併記（どれかが落ちても代替が残る）」は 2026-07-04 オーナー決定（Q6）。

## 5. 未確認事項

- syndication API / fxtwitter の 2026-07-04 現在の実稼働（実postId送信禁止のため未検証）
- ohayua `json.php` のサーバー側実装の実体
- twtr.satoru.net の GET パラメータ連携の実挙動
- gyo.tc の X 投稿魚拓の現在の成功率
