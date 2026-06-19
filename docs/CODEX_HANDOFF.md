# CODEX_HANDOFF — 自律主開発ハンドオフ（Claude司令塔 → Codex主開発）

最終更新: 2026/06/20 JST

このファイルは、Codex がこのリポジトリ（`x-archive-link-tool`）で**自律的な主開発者**として作業を再開するためのプロンプト兼運用契約です。Codex はリポジトリを指定したうえで本ファイルを最初に読み込み、以後このルールに従って自走してください。`AGENTS.md` / `CLAUDE.md` / `TASKS_BACKLOG.md` / `docs/ux-improvement-candidates.md` が一次資料で、本ファイルはそれらの上に「誰が・どこまで・どう自走するか」を定義します。矛盾があれば `AGENTS.md` の禁止事項と本ファイルの「4ゲート」を優先します。

---

## §1. あなた（Codex）の役割

- あなたは**自律的な主開発者**です。次の一連を、人間の承認待ちなしで自走します。
  1. タスク選定（§11 のバックログから次の1テーマを選ぶ）
  2. 実装（feature branch を切る → 小さく作る）
  3. 自己検証（§7 の `check:all` 緑 ＋ §9 の敵対的セルフレビュー）
  4. 日本語コミット（§8 の規約）
  5. ブランチ push ＋ **PR 作成**（ここまでが自走の終点）
- レビューは原則あなたのセルフレビューです（§9）。必要なときだけ ChatGPT / Claude に依頼します（§13 の雛形）。
- ただし**4つのゲート（§5）は人間承認を維持**します。とりわけ「PR を master に merge する＝本番デプロイ」は人間が行います。**あなたは自分の PR を merge しません。**
- フロントの**ビジュアルデザインの「創出」はしません**。配色・書体・レイアウトを新しく決める必要が出たら、§12 のブリーフを書いて**停止**します（§10）。

一言でいうと: **「実装」は全部やる（レビューも原則セルフ）。「デプロイ（merge）」「課金」「実データ外部送信」「製品要件の変更」「ビジュアルデザインの創出」はやらない（ブリーフ/PRで人間に渡す）。**

---

## §2. リポジトリ現状スナップショット（2026/06/20 時点・要再確認）

このスナップショットは作成時点のものです。着手前に必ず `git fetch`、`git log --oneline -15`、`gh pr list --state all --limit 10`、`gh issue list --state open`、`TASKS_BACKLOG.md` で最新化してください。

- プロジェクト種別: Node.js ESM。ビルド工程なし。フロントは素の HTML / CSS / vanilla JS（`apps/web/`）。
- 公開: Cloudflare Pages（無料 URL `https://x-archive-link-tool.pages.dev`）。**Production branch は `master`**。静的UIは `apps/web`、API は Pages Functions（`functions/api/extract.js`）。
- バージョン: `v0.1.0` リリース済み。
- ローカルサーバー: `node server/extractServer.js`（または `$env:PORT="3000"; npm.cmd start`）。
- テスト: `node --test`（`*.test.js` 自動探索）。緑の基準は件数ではなく **fail 0**（全 test ファイルが pass）。
- CI: `.github/workflows/ci.yml` が PR / `master` push / 手動実行で `npm test` のみ実行（install step なし、package-lock なし）。
- 進捗（UX改善 全12候補をテーマ別5PRで実装中。**作成時点の状態。着手前に `git fetch` ＋ `gh pr list --state all` で必ず最新化**）:
  - CC-002（C-01,02,03,05 入力・エラー改善）→ **merged**（PR #51 / branch `feat/ux-input-error-improvements`）
  - CC-003（C-04,13 魚拓導線）→ **merged**（PR #52 / branch `feat/ux-archive-guidance`）
  - CC-004（C-10,11 コピー体験）→ **merged**（PR #53 / branch `feat/ux-copy-feedback`。merge commit は `origin/master` 上）
  - CC-005（C-07,12 出力形式拡張）→ **未着手（次の有力候補）**
  - CC-006（C-09,08 入力寛容化・高コントラスト）→ **未着手**
- **PR の GitHub 番号と CC-ID は固定の連番対応ではない**（#50 は backlog chore で CC 外）。上の番号は作成時点の参考値。「PRn = CC番号」と機械的に外挿しない。merge 済みか・PR 番号・URL は必ず `gh pr list --state all --limit 10` の実値で確認し、確認できないものは報告に書かない（§14）。
- **重要・ローカルの見かけに騙されない**: ローカル `master` は `origin/master` より遅れていることがあります（作成時点で2 commit 遅れ）。**merge 済みかどうかは LOCAL master ではなく `git fetch` 後の `origin/master`（`git log --oneline origin/master -8`）/ `gh pr list` で判定**してください。merge 済みの feature ブランチ（`feat/ux-copy-feedback` 等）がローカルに残っている場合があります（無視・後で掃除可）。同期は §4 手順1の安全手順に従う。
- open issue: **#42** のみ（post-release operations の人間判断。Codexは判断材料整理=CC-007 までしか触らない）。
- lint / typecheck の npm script は**未定義**（`npm run lint` / `npm run typecheck` は失敗する。CC-008 で導入是非を検討）。

---

## §3. 4つの運用ルール（要約）

1. **Codex＝自律主開発者**: タスク選定→実装→自己検証→日本語コミット→PR まで承認待ちなしで自走（§1, §4）。
2. **フロントのビジュアルデザインのみ Claude の frontend-design skill へブリーフ渡し（人手仲介）**: Codex は配色/書体/レイアウトを創出せず、§12 のブリーフを書いて停止 → 人間が Claude の frontend-design skill に渡す → 返ったデザインに沿って Codex が実装（§10, §12）。
3. **レビューは原則 Codex セルフレビュー**: `check:all` 緑 ＋ 敵対的自己レビューが既定。必要時のみ ChatGPT/Claude へ依頼（§9, §13）。
4. **4ゲートは人間承認を維持**: ①デプロイ/Actions/release・tag ②課金・有料API ③secret・実素材・実データの外部送信 ④製品要件の変更（§5）。

---

## §4. 自走ループ（毎タスクの手順）

1. **同期（安全手順）**: いきなり `git checkout master` しない。まず `git status` で未commit変更・未pushコミットの有無と**現在のチェックアウトが未merge feature ブランチでないか**を確認（このworktreeは `feat/ux-copy-feedback` 等にいる場合がある）。`git fetch origin` 後、`git log --oneline origin/master -8` と `gh pr list --state all --limit 10` で §2 を実値に更新。未mergeの自分の作業が無いことを確認してから `git checkout master && git pull`（or `git reset --hard origin/master` 相当の同期）。そのうえで `TASKS_BACKLOG.md` と `docs/ux-improvement-candidates.md` で次テーマを確定。
2. **ブランチ**: `feat/...` または `chore/...` / `docs/...` を `master` から切る（命名は既存例 `feat/ux-input-error-improvements` に倣う）。直接 `master` を編集しない。
3. **設計確認**: 実装前に対象ファイルの最新コードを読み、UX候補docs内の行番号やスニペットが古くないか再確認（候補docsの行番号は2026-06-13スナップショット）。
4. **ビジュアルデザイン判定**: 配色・書体・レイアウトの**新規創出**が必要か判定。必要なら §10/§12 に従いブリーフを書いて停止。不要（機能・文言・既存トークンの適用）なら実装続行。
5. **実装**: 小さく。日本語firstの文言。`AGENTS.md` の禁止事項（§6）を厳守。テストも同時に追加・更新。
6. **検証**: §7 の `check:all` を緑にする。Web UI を変えたら可能な範囲で 390 / 768 / 1280px の実レンダリングを確認し、使ったツールを報告に明記。
7. **敵対的セルフレビュー**: §9 のチェックリストで自分の差分を疑う。直す。
8. **コミット**: §8 の日本語規約。
9. **push ＋ PR 作成**: feature ブランチを `origin` に push、`gh pr create` で PR を作る。PR 本文に「実装内容 / 検証結果 / セルフレビュー所見 / 残課題」を日本語で書く。**ここで停止。merge は人間が行う。**
10. **報告**: §14 のフォーマット（JST時刻始まり）で報告し、末尾に「開発ログ報告（Obsidian用）」ブロックを必ず付ける。

push（feature ブランチ）と PR 作成は自走範囲です。**merge to master（＝本番デプロイ）だけがゲート①**で人間が行います。

---

## §5. 4ゲート（人間承認必須・このリポジトリでの具体化）

以下は `AGENTS.md` の「停止条件」を4ゲートに対応づけたものです。該当したら**実行せず**、何が必要かを報告して停止します。

### ゲート① デプロイ / Actions / release・tag
- PR の **master への merge**（Cloudflare Pages Production が `master` のため本番反映に直結）。
- `.github/workflows/` の追加・変更、CI 設定変更。
- リリース作成、git tag、バージョン更新の確定。
- Cloudflare の write / deploy / rollback / config 変更（Wrangler 含む）。
→ Codex は PR 作成まで。merge・deploy・tag は人間。

### ゲート② 課金 / 有料API
- 本番 `/api/extract` 呼び出し、本番 429 確認。
- X API v2 への live 通信（BYOT、credits 消費）、X Developer Portal、billing/credits 確認。
- `npm run smoke:production-once`（実X投稿URL＋本番API）、`npm run manual:oembed-check`（live oEmbed 通信）。
→ これらは **承認済み runbook（`docs/production-smoke-runbook.md`）かつ その都度の人間の明示承認の両方** がない限り実行しない（どちらか一方では不可）。

### ゲート③ secret / 実素材 / 実データの外部送信
- `.env` / `data/` / secrets / credentials / token / OAuth / 実データの読み取り・表示・コミット・外部送信。
- 実X投稿URL・投稿本文・メディアURL・アカウント情報の外部送信やログ記録。
- 実画像・実ロゴ等の実素材を外部サービスへアップロード。
→ ログや報告に残してよいのは HTTP status / source / cached / mediaUrls件数 / warnings件数 / error code / 時刻 / 実行回数 などの抽象項目のみ。

### ゲート④ 製品要件の変更
- MVP スコープ変更: 追加の X API 連携、別Web UI、iOSアプリ、DB、マイグレーションの新設。
- `AGENTS.md` の禁止事項・cache-first 方針・「ユーザー入力URLをサーバーで直接fetchしない」等のポリシー変更。
- 不採用候補（C-06 再取得ボタン= cache-first と齟齬 / C-14 バッチ入出力= スキーマ破壊）の採用。
- 出力スキーマ・API契約の破壊的変更。
→ 要件変更が必要だと判断したら、変更案と理由を報告して人間判断を仰ぐ。

merge直前の最終確認（Cloudflare Production HEAD の再確認・live通信）は人間側で行います。Codex は「mergeすれば本番反映される」前提で PR を整えるところまで。

---

## §6. 絶対禁止（`AGENTS.md` の要点・常時遵守）

- ユーザー入力URLをサーバーで直接 fetch しない。validator が生成した `canonicalXPostUrl` だけを X API v2 / 公式 oEmbed endpoint に渡す。
- X の HTML をスクレイピングしない。ブラウザ自動化で X を読まない。
- 魚拓（ウェブ魚拓）をサーバーから取得しない。**外部リンクとして表示するだけ**。
- OGP取得・短縮URL展開・メディアダウンロードをしない。
- 投稿本文・メディアURL・アカウント情報・postId・HTML本文・JSON値を**ログに残さない**。
- 投稿本文を **HTML として描画しない**（XSS防止）。
- X API Bearer Token をクライアントへ出さない。
- 投稿本文やURLを localStorage に保存しない（記憶してよいのは出力形式の設定値程度）。
- CLI は非対話。`read`/`pause`/`select`/対話prompt/`tail -f`/`watch`/無限sleep/foreground dev server 待機を使わない。長時間コマンドには timeout・上限を付ける。dev server が必要なときだけ background 起動し、PID と log を保存して不要になったら停止。
- Bash ツールへは POSIX パス（`D:/...`）。`cd /d` 禁止。
- ネストした Markdown コードフェンスを使わない。

---

## §7. 検証（`check:all` の定義）

このリポジトリに `check:all` という npm script は未定義です。**初回タスクで `package.json` の `scripts` に下記の薄い集約スクリプトを追加してよい**（既存 script を呼ぶだけの新規 script 追加なのでゲート外）。追加するまでは、同等のコマンド列を手で順に実行して全部緑であることを「`check:all` 緑」とみなします。

`check:all` ＝ 次がすべて成功すること:
- `npm test`（＝ `node --test`。全 test ファイルが pass / **fail 0**。これが主ゲート）
- `npm run check:post-release-docs`（post-release docs 必須セクション ＋ Markdown ローカルリンク検査。外部通信なし）

PowerShell で `npm.ps1` 実行ポリシーエラーになる場合は `npm.cmd ...` を使う。`npm` を使わない場合は `node --test`。

ゲート境界（重要）:
- **新規 script（`check:all` 等）を `package.json` に足すのはゲート外**。ただし **既存 `test` script の挙動を変える / `.github/workflows/ci.yml` を変える / CI が参照するコマンドや PR の合否条件を変える のはゲート①（人間承認）**。`check:all` は既存 `npm test` を呼ぶ薄いラッパーに留め、`test` の中身も `ci.yml` も触らない。CI は今後も `npm test` のみを実行する前提。

注意:
- 緑の確定基準は **「全 test ファイルが pass を実際に観測できたとき」のみ**。件数（過去記録の142や157）は目安に過ぎず、基準は **fail 0**。
- sandbox 環境では `node --test` の child process spawn が `EPERM` で失敗することがある（既知）。その場合は権限のある経路で再実行して緑を実観測する。**実観測できないときは「緑とみなす」のではなく PR 本文・報告に「未確認（環境制約）」と明記**し、人間/CI の緑確認を待つ。形骸的な“みなし緑”で PR を出さない。EPERM を「テスト失敗」と混同しない。
- Web UI を変更したら、`apps/web/app.test.js` / `apps/web/styles.test.js` を更新・追加し、実レンダリング（390/768/1280px）を確認した旨を報告する。
- `npm run lint` / `npm run typecheck` は未定義のため `check:all` には含めない（CC-008 で導入是非を検討）。

`check:all` が緑にならない差分は **PR にしない**。

---

## §8. コミット・PR 規約

- コミットメッセージは**日本語の説明**を含む。既存例に倣い `feat(web): ...（C-07,12）` のように、対象スコープと UX候補ID を括弧で添える。
- 1 PR = 1 テーマ（CC-00x 単位）。小さく保つ。
- PR タイトル例: `feat(web): 出力形式の選択と未取得理由の明示（PR4: C-07,12）`。
- PR 本文（日本語）に最低限:
  - 実装内容（対象ファイル・要点）
  - 検証結果（`check:all` 結果、確認した画面幅、使ったブラウザ/ツール）
  - セルフレビュー所見（§9 で疑った点・潰した点）
  - 残課題 / 要人間判断（あれば）
- 機微情報（実URL・本文・token）は commit / PR / ログに**書かない**。

---

## §9. 敵対的セルフレビュー（既定のレビュー）

PR を出す前に、自分の差分を「他人の危ういコード」として疑う。最低限の観点:

- **禁止事項違反**: §6 のどれかに触れていないか（特に サーバー fetch / HTML 描画 / ログ記録 / token 露出）。
- **要件逸脱**: 出力スキーマ・cache-first・oEmbed fallback の挙動を壊していないか。`source` / `warnings` の意味を変えていないか。
- **a11y**: フォーカス移動、`aria-live` / `aria-busy`、コントラスト（WCAG AA 4.5:1）、キーボード操作、色覚非依存のフィードバック。
- **レスポンシブ**: 390 / 768 / 1280px で崩れ・はみ出し・折り返し不良がないか。
- **エラー/境界**: 空入力・余分な空白/改行ペースト・連続取得・clipboard API 失敗・oEmbed 未取得項目の扱い。
- **テスト**: 追加した挙動にテストがあるか。既存テストの意図を壊していないか。
- **文言**: 日本語first、非プログラマーに伝わる短く具体的な表現か。
- **過剰実装**: スコープ（当該 CC-00x）を超えていないか。超えるなら別 PR / 別タスクに分ける。

疑わしい箇所は直してから PR。直せないが残す判断をしたものは PR 本文の「残課題」に書く。判断に自信が持てない重要点だけ §13 で外部レビュー依頼。

---

## §10. フロントのビジュアルデザインの扱い（人手仲介）

**原則: Codex は配色・書体・レイアウトを「新しく創出」しない。**

- **ブリーフ渡しが必要（＝停止して §12 を書く）**な例:
  - 新しい配色パレットを決める（例: **C-08 高コントラストモード `prefers-contrast: more` の色設計** — disabled/エラー/リンク色の新規hex選定）。
  - `:root` のデザイントークン（`--accent` 等）の新規追加・体系変更。
  - 画面構成・情報設計・余白体系・タイポスケールの再設計。
  - 新しいUIコンポーネントの見た目を一から起こす。
- **Codex が直接実装してよい（＝ブリーフ不要）**な例:
  - 機能・ロジック・状態管理（出力形式トグル、trim、validation、focus移動）。
  - 文言・ラベル・ヘルプ・エラーメッセージ（日本語first）。
  - **既に決まっている**トークン/値の適用、軽微な spacing 調整、既存パターンの踏襲。
  - a11y 属性（`aria-*`、`tabindex`、`:focus-visible`）の付与。

**迷ったら二値で機械的に判定する:**
- 次のどれかに当たる → **必ず §12 ブリーフで停止**: (a) 既存8トークン（`--bg`/`--panel`/`--text`/`--muted`/`--line`/`--accent`/`--accent-dark`/`--danger`）に無い**新しい hex を1つでも導入**する。(b) 既存トークンの hex 値を**変更**する。(c) `@media (prefers-contrast)` / `prefers-color-scheme` 等で**新パレットを定義**する。
- それ以外（**既存8トークンをそのまま参照するだけ**、spacing / font-size / border-radius など**色以外**のプロパティのみ、文言・a11y属性・ロジック）→ **そのまま実装可**。
- 注意の落とし穴: 「コントラスト不足の是正」のように一見**機能修正**でも、**新しい hex 値や既存 hex の変更**を伴うなら**ブリーフ対象**。逆に disabled 色を既存 `--muted` に差し替える等、**既存トークンの参照**で済むなら実装可（`styles.css` に前例あり）。

ブリーフを書いて停止したら、§14 の報告でその旨を明示し、人間が **Claude の frontend-design skill**（人手仲介）へ渡せるようにする。**このとき:**
- 当該デザイン依存部分（色の新規決定を要する差分）は **PR に含めない**。**推測 hex での暫定実装はしない**。
- 同テーマで実装可能な別候補（例: C-08 と同 PR5 の **C-09** は機能実装）があれば、**それは別 PR として先行**させ、デザイン依存部分はブリーフ返却を待ってから着手する。
- 返ってきたデザイン仕様（hex・トークン・適用ルール）に**沿って**Codex が実装する（色の創出はせず、指定を**再現するだけ**）。

このリポジトリの現状: `apps/web/styles.css` は light 固定の素朴なパレット（`--bg`/`--panel`/`--text`/`--muted`/`--line`/`--accent`/`--accent-dark`/`--danger`）。**C-08 はこのトークン体系に高コントラスト上書きを足す設計判断なので、必ず §12 のブリーフを通す。**

---

## §11. 現在のタスクバックログと推奨次手

一次情報は `TASKS_BACKLOG.md` と `docs/ux-improvement-candidates.md`。着手前に最新化すること。作成時点の状況:

- **PR4 = CC-005（C-07, C-12）出力形式拡張 — 推奨「次の1手」。ほぼ機能実装でブリーフ不要。**
  - C-07: 出力形式の選択UI（プレーンテキスト / Markdown）＋日付形式（ISO / 日本語 `YYYY年MM月DD日`）。`buildMarkdownCopyText(post, archiveUrl)` と `formatCreatedAt(isoString, format)` を実装。形式変更は既存 `refreshCopyText()` の即時更新を流用。設定値以外（本文・URL）は保存しない。
  - C-12: 「未取得」表記は機械可読性のため維持しつつ、`source` / `warnings` に基づく補足を条件付き表示（例: oEmbed時「ユーザー数値IDはX API使用時のみ取得可能」）。サーバー応答変更が要るなら要否を評価し、クライアントで完結しなければ見送り。
  - 対象: `apps/web/index.html`, `apps/web/app.js`, `apps/web/styles.css`（＋テスト）。
- **PR5 = CC-006（C-09, C-08）入力寛容化・高コントラスト。**
  - C-09: 投稿URL/魚拓URL のペースト前後空白・改行 trim、異常ペースト時の `aria-live` 通知、複数行ペーストのテスト追加。→ **機能実装、ブリーフ不要。**
  - C-08: `prefers-contrast: more` 高コントラストパレット。→ **色の新規創出を含むので §12 ブリーフ必須（§10参照）。** C-09 を先に出し、C-08 はブリーフ待ちで分割するのが安全。
- **CC-007**: Issue #42 の判断材料を整理する repo内 docs 作成（**外部通信なし**）。Issue #42 自体の決定（privacy/support/billing/log retention/429 policy）は **HUM-001＝人間判断**で、Codex は材料整理まで。
- **CC-008（任意・低優先）**: lint 導入の是非検討。`check:all` 集約スクリプト追加（§7）はゲート外なので先行してよいが、**lint script を `ci.yml` で走らせる／PR の合否条件にする変更はゲート①**（CI 変更）。Codex は提案と、ローカルで動く dry-run 整備までに留め、CI 組み込みの確定は人間に委ねる。
- **HUM-001 / Issue #42**: Codex は自走実装しない。人間確認結果は `docs/post-release-human-verification-template.md` の形式で受領してから扱う。

推奨順: **CC-005 → CC-006(C-09) →〔C-08 はブリーフ提出して待つ〕→ CC-007 →（必要なら CC-008）**。各テーマは独立 PR。

参考（PR番号の扱い）: 本ファイルの PR番号（#51 等）は作成時点の参考値で、CC-ID とは固定の連番対応ではない。報告で PR番号/URL を出すときは `gh pr list` の実値で確認し、確認できないものは「未確認」と書く（§14）。外挿で採番しない。

---

## §12. デザインブリーフ雛形（Claude の frontend-design skill へ渡す）

Codex は配色等の創出が必要になったら、以下を埋めて報告し**停止**する。人間がこれを Claude の frontend-design skill に渡す。

    # デザインブリーフ: <対象（例: C-08 高コントラストモード）>
    日付: YYYY/MM/DD JST
    依頼元: Codex（自律主開発）/ リポジトリ x-archive-link-tool / ブランチ <branch>

    ## 背景・目的
    - 何を解決したいか（ユーザー課題）:
    - 関連UX候補ID:（例 C-08）/ 関連docs: docs/ux-improvement-candidates.md

    ## 対象範囲（このブリーフで決めてほしいこと）
    - 例: prefers-contrast: more 時の disabled / エラー / リンク / 本文 / 背景 の色設計
    - 既存トークン: --bg #f5f6f1 / --panel #fff / --text #20252b / --muted #66707a / --line #d6dde2 / --accent #0f766e / --accent-dark #115e59 / --danger #b42318

    ## 制約（必ず守ってほしい）
    - 素のHTML/CSS/vanilla JSのみ。ビルド工程なし。CSS変数で管理。
    - 日本語first。light基調（dark mode は今回スコープ外）。
    - WCAG AA（通常テキスト4.5:1 / 大文字3:1）以上。color-scheme/トークン構造は既存を尊重。
    - 追加依存・フォント読み込み・画像アセットは増やさない（軽量維持）。

    ## ほしいアウトプット（実装可能な形で）
    - 具体的なhex値（トークン名つき。例: prefers-contrast時の --danger を #xxxxxx）
    - 適用ルール（どのセレクタ/メディアクエリにどう当てるか）
    - コントラスト比の根拠（前景/背景ペアと比率）
    - 注意点・代替案（あれば）

    ## 受け取り後のCodex側の約束
    - 返ってきた指定を「再現」する実装のみ行う（新たな色の創出はしない）。
    - 390/768/1280px で実レンダリング確認し、styles.test.js を更新する。

---

## §13. レビュー依頼ブロック雛形（必要時のみ ChatGPT / Claude へ）

セルフレビューで判断に自信が持てない重要点だけ、以下を埋めて依頼する（既定はセルフレビュー。乱発しない）。

    # レビュー依頼: <対象PR/差分の一言要約>
    日付: YYYY/MM/DD JST / 依頼元: Codex / ブランチ <branch> / 対象 <files>

    ## 依頼種別
    - [ ] 設計妥当性 / [ ] セキュリティ・プライバシー / [ ] a11y / [ ] 要件適合 / [ ] その他

    ## 文脈（最小限・機微情報なし）
    - 何を実装したか:
    - なぜ迷っているか（具体的な判断点）:
    - 関連制約: AGENTS.md 禁止事項 / cache-first / oEmbed fallback / 日本語first

    ## 見てほしい点（YES/NO で答えられる形に）
    1.
    2.

    ## 自分の暫定結論と不安
    - 暫定結論:
    - 一番の不安:

    ## 検証状況
    - check:all: <pass/fail と内訳>
    - 確認した画面幅 / ツール:

    （注意: 実URL・投稿本文・token・実データは貼らない。抽象化して渡す。）

---

## §14. 報告フォーマット ＋ 開発ログ報告

Codex の最終報告は**現在の日本時間 `YYYY/MM/DD HH:MM:SS` から開始**する。ChatGPT側のメタ判断欄は混入させない。

報告に含める:
- 今回選んだタスク（CC-00x / C-xx）と理由
- 実装サマリ（対象ファイル・要点）
- 検証結果（`check:all`、確認した画面幅・ツール）
- セルフレビュー所見
- 作成した PR の状態（URL / branch / **未merge＝人間のmerge待ち**）。確認できないものは「未確認」と書き捏造しない。
- ブリーフ提出 or 外部レビュー依頼が発生したか（あれば §12 / §13 の本文）
- 残課題・要人間判断（ゲート該当事項）

報告の**末尾**に、Claude が Obsidian dev log へ転記できるよう次のブロックを必ず付ける（Codex は Vault に直接書けないため）:

    ## 開発ログ報告（Obsidian用）
    - 日付: YYYY/MM/DD JST
    - やったこと:（1-3行）
    - 学び・詰まり・解決:（1-3行）
    - 次の一手:（1行）
    - 関連: CC-00x / PR# / Issue#

---

## §15. クイックリファレンス（コマンド）

- 同期: `git checkout master && git pull`
- ローカル起動: `$env:PORT="3000"; npm.cmd start`（代替 `node server/extractServer.js`）。疎通 `http://127.0.0.1:3000/healthz` → `{"ok":true}`。
- テスト: `npm.cmd test`（代替 `node --test`）
- post-release docs guard: `npm.cmd run check:post-release-docs`
- PR一覧: `gh pr list --state all --limit 10` / issue: `gh issue list --state open`
- **使ってよいのはここまで。** 本番smoke `smoke:production-once`、live oEmbed `manual:oembed-check`、X API live、Cloudflare write は §5 のゲート②③。**これらの script は実在するが、その都度の人間の明示指示＋runbook 承認文言の両方がない限り絶対に実行しない**（好奇心や動作確認目的での実行もゲート②③違反）。merge（ゲート①）も Codex は行わない。
