# UX改善候補リスト

最終更新: 2026-06-13 JST

2026-06-13のCodex→Claude Code引き継ぎ時に、Web UI（`apps/web/`）を4視点（操作性・文言・アクセシビリティ/レスポンシブ・出力形式）でレビューし、`AGENTS.md` の禁止事項・実現性の検証を通過した改善候補の記録です。ユーザー承認済みの実装順序は `TASKS_BACKLOG.md` のCC-002〜CC-006を参照してください。

実装上の共通制約: ユーザー入力URLのサーバーfetch禁止 / Xスクレイピング禁止 / 魚拓のサーバー取得禁止 / 投稿本文・メディアURL・アカウント情報・postIdのログ禁止 / 投稿本文のHTML描画禁止 / tokenのクライアント露出禁止 / cache-first方針維持 / 投稿本文やURLをlocalStorageへ保存しない / 日本語firstの文言。

## 採用候補（12件）

### PR1: 入力・エラー改善（CC-002）

#### C-01 投稿URL入力欄に入力例・プレースホルダーを追加（価値:高 / 規模:S）

- 問題: 入力フィールド（`apps/web/index.html` の `#post-url`）にプレースホルダーや例示がなく、初見ユーザーがどの形式のURLを入力すべきか分からない。
- 案: input要素に `placeholder="https://x.com/username/status/1234567890"` を追加、またはラベル下に「例：https://x.com/example_user/status/1234567890」の説明文を表示。
- 対象: `apps/web/index.html`

#### C-02 エラー表示後のフォーカス移動（価値:高 / 規模:S）

- 問題: form submit失敗時に `#error-message` へテキストを表示するが `focus()` が呼ばれず、スクリーンリーダー・キーボード利用者がエラーを検出しにくい。
- 案: `#error-message` に `tabindex="-1"` を追加し、エラー設定直後に `errorMessage.focus()` を実行。`:focus-visible` スタイルをCSSに整備。
- 対象: `apps/web/index.html`, `apps/web/app.js`, `apps/web/styles.css`

#### C-03 disabled/readonly/ローディング中の状態視覚化とヒント（価値:高 / 規模:S）

- 問題: (1) `button:disabled` が `opacity: 0.55` でWCAG AA（4.5:1）コントラスト未達の懸念。(2) コピーボタンが押せない理由のヒントがない。(3) readonly textareaに視覚的区別がない。(4) 取得中はsubmitボタンのみdisabledで、入力欄は操作可能という不整合。
- 案: (1) opacityでなく色値調整でコントラスト確保（実装時に具体色値を計測して決定）。(2) 「ポスト取得後にコピーできます」等のヒント表示。(3) textarea[readonly]に淡い背景色。(4) 取得中はinputも無効化（fieldset等）し、aria-busyと整合させる。
- 注意: textarea `rows="14"` の390px幅での表示は実機確認する（`min-height: 300px` が優先されるため影響は限定的の見込み）。
- 対象: `apps/web/index.html`, `apps/web/app.js`, `apps/web/styles.css`

#### C-05 URLバリデーション統一とエラーメッセージの具体化（価値:高 / 規模:M）

- 問題: (1) `invalid_host` 等のエラー文言が対応形式を明示していない。(2) `type="url"` のブラウザnative validation tooltipとサーバー側エラーでメッセージ体験が分裂し、tooltipの表示品質はOS/ブラウザ依存。
- 案: formに `novalidate` を設定し、client-side validatorでsubmit前に同期検証して `#error-message` へ統一表示。主要エラーに「形式例：https://x.com/username/status/1234567890」を補足。エラーコードは既存 `ERROR_MESSAGES` マップで一元管理し、server validatorと文言を同期。
- 注意: 長文エラーのモバイル折り返し（`.message` のword-break等）を確認。
- 対象: `apps/web/index.html`, `apps/web/app.js`, `apps/web/styles.css`

### PR2: 魚拓導線改善（CC-003）

#### C-04 魚拓セクションの説明・取得導線・初期表示を改善（価値:高 / 規模:M）

- 問題: (1) 魚拓を知らないユーザーに「なぜ・いつ使うのか」の説明がない。(2) セクションが取得成功後にしか出現せず、機能の存在に気づけない。(3) 別タブで取得→URLコピー→戻って貼り付けの手順が案内されていない。
- 案: 見出しを「魚拓URL（オプション）」へ変更し、「ポスト削除時など将来の参照用に、外部サイトで投稿スナップショットを取得して保存できます。リンクを開いて取得したURLを下の欄に貼り付けてください。（必須ではありません）」等の説明文を追加。常時表示化または「投稿URLを入力後に利用可」のplaceholder付き常設を検討。魚拓のサーバー取得は引き続き行わない（外部リンク提示のみ）。
- 注意: モバイル（390px・640px以下）での高さ増加。`styles.css` のmedia query対応とテスト追加が必要。
- 対象: `apps/web/index.html`, `apps/web/app.js`, `apps/web/styles.css`

#### C-13 魚拓URL保持とエラー後の回復フロー明確化（価値:低 / 規模:M）

- 問題: (1) 新しい投稿を取得すると入力済み魚拓URLが無言でクリアされる。(2) エラー発生時に `currentPost = null` で魚拓セクションごと消え、回復手順が分からない。
- 案: クリア前の簡易確認または「新投稿ごとに魚拓URLはリセットされます」の説明表示。エラー種別（形式エラー vs 一時的エラー）で状態リセットの扱いを分ける。localStorageへの保存はプライバシー上の理由で行わない。
- 注意: 確認ダイアログの多用はUX悪化。エラー種別ごとの仕様は `docs/requirements.md` と `docs/test-cases.md` を確認して決める。
- 対象: `apps/web/app.js`

### PR3: コピー体験改善（CC-004）

#### C-10 コピー成功/失敗フィードバックの視覚化と文言改善（価値:中 / 規模:M）

- 問題: (1) 「コピーしました。」表示が消えず、成功の実感が弱い。(2) clipboard API失敗時の「選択状態にしました。手動でコピーしてください。」が初心者に伝わらない。
- 案: 成功時は「コピーしました」を一時表示（またはボタンテキストの一時変更）で視覚化。失敗時は「下のテキストを選択して手動でコピーしてください」等の具体的指示へ改善。
- 注意: タイマー追加に伴うテスト整備。メッセージ長のモバイル折り返し確認。
- 対象: `apps/web/app.js`, `apps/web/styles.css`

#### C-11 コピー用テキストの用途説明とモバイルspacing調整（価値:中 / 規模:M）

- 問題: (1) 見出し「コピー用テキスト」だけでは用途（記事・チャットへの貼り付け、保存用）が伝わらない。(2) 640px以下で `.output-header` がcolumn化した際のspacingが不均一に見える可能性。
- 案: 見出し下に短い用途説明文を追加（段落は短く保つ）。640px以下のh2とボタンのspacingを調整。
- 対象: `apps/web/index.html`, `apps/web/styles.css`

### PR4: 出力形式拡張（CC-005）

#### C-07 出力形式の選択UI（プレーンテキスト/Markdown/日付形式）（価値:高 / 規模:M）

- 問題: 出力が「項目名：値」のプレーンテキスト固定で、Markdown用途や日本語日付表示に対応できない。`createdAt` はISO 8601のまま。
- 案: 「プレーンテキスト/Markdown」の形式選択（ラジオまたはセレクト）を追加し、`buildMarkdownCopyText(post, archiveUrl)` を実装。日付形式選択（ISO / 日本語 YYYY年MM月DD日）用に `formatCreatedAt(isoString, format)` を実装。形式変更時は既存 `refreshCopyText()` の即時更新を流用。
- 注意: ISO文字列はUTCのため、日本語形式では日付部分のみ抽出して時刻を省略する方針が妥当。Markdownの見出しレベル・項目順（既存順を踏襲）を実装前に確定。選択状態の記憶に投稿本文・URLを保存しない（保存するなら形式設定値のみ）。
- 対象: `apps/web/index.html`, `apps/web/app.js`, `apps/web/styles.css`

#### C-12 「未取得」項目の理由明示（価値:中 / 規模:M）

- 問題: 「未取得」がoEmbed fallbackの正常動作なのか障害なのか区別できない。特に `userNumericId` 未取得の理由が不明。
- 案: コピーテキストの機械可読性を保つため「未取得」表記は維持しつつ、UI上で `source` / `warnings` に基づく補足（oEmbed時「ユーザー数値IDはX API使用時のみ取得可能」等）を条件付き表示。`expandedUrls`（X API時に取得済み・oEmbedでは未返却）の活用はサーバー応答変更の要否を実装時に評価し、クライアント側で完結しない場合は見送る。
- 注意: 段階的実装（UI説明テキスト先行）。モバイルではhover不可のためツールチップでなく常時表示テキストを基本にする。
- 対象: `apps/web/index.html`, `apps/web/app.js`, `apps/web/styles.css`

### PR5: 入力寛容化・高コントラスト（CC-006）

#### C-09 URL貼り付け処理の寛容化とペースト異常の通知（価値:中 / 規模:M）

- 問題: (1) 魚拓URL貼り付けは空白・改行を含むと無言で「未取得」扱いになり、ユーザーに通知されない。(2) 投稿URL欄には同様のpaste処理がなく非対称。
- 案: 前後空白・改行のtrim（投稿URL/魚拓URL両方）。無効paste時は「魚拓URLに余分な文字が含まれています。URLだけを貼り付けてください。」等を `aria-live` 付きで表示。複数行ペーストのテストケースを追加。
- 注意: URL抽出ロジックを複雑化しすぎない。既存validatorとの競合を確認。
- 対象: `apps/web/index.html`, `apps/web/app.js`, `apps/web/app.test.js`, `apps/web/styles.css`

#### C-08 高コントラストモード（prefers-contrast）対応（価値:高 / 規模:M）

- 問題: `:root` の `color-scheme` がlight固定で、高コントラスト環境での視認性が保証されない。disabledボタンのコントラスト不足と重なるリスク。
- 案: `prefers-contrast: more` メディアクエリで高コントラストパレットを上書き（disabledボタン・エラー・リンク色など）。
- 注意: 実装前に現状のコントラスト比を計測。dark mode対応は今回のスコープ外であることをREADME等で明示するか実装時に判断。
- 対象: `apps/web/styles.css`

## 不採用候補（2件）

#### C-06 再取得ボタン・取得元情報の可視化（不採用）

- 理由: cache-breaking query paramによる再取得は `AGENTS.md` / README のcache-first方針と齟齬があり、例外化には人間判断が必要。`functions/api/extract.js` がquery param未対応のためクライアント側だけでは完結しない。
- 補足: source-messageの重要度別色分けなど一部要素は、将来cache方針の判断が出た後に再検討可能。

#### C-14 複数投稿のバッチ入力・出力（不採用）

- 理由: API応答スキーマ（単一投稿オブジェクト）とPages Functionsの単一URL受付設計に対する破壊的変更が必要で、レート制限（per IP 10/min、global 60/min）超過リスクも高い。MVP範囲外。

## 出典

- 4視点並行レビュー（32候補）→ 重複統合（14件）→ 禁止事項・実現性の敵対的検証（適合12件/不適合2件）の手順で作成。候補本文のコード行番号は2026-06-13時点のスナップショットであり、実装時に最新コードで再確認すること。
