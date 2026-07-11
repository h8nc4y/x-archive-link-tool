# CODEX_HANDOFF — Codex自律主開発ハンドオフ

最終更新: 2026/07/01 10:28 JST

このファイルは、Codex が `x-archive-link-tool` で自律的に開発を進めるためのリポジトリ内ハンドオフです。最新の優先順は、現在のユーザー指示、グローバルAGENTS.md、リポジトリの `AGENTS.md`、このファイル、`TASKS_BACKLOG.md` です。古い「mergeは人間だけ」「PR作成で停止」ルールは、2026-06-29時点のグローバル自走方針により停止条件ではありません。

---

## §1. Codexの役割

- Codex は主実装者として、タスク選定、設計確認、実装、テスト、セルフレビュー、コミット、push、PR作成/更新、merge、必要な範囲のブランチ整理まで自走する。
- レビューは Codex セルフレビューを既定とし、リスク・曖昧さ・専門判断・反復失敗がある場合だけ ChatGPT / Claude / GitHub review を使う。廃止済みの `agmsg` は復活させない。
- 停止するのは、課金・有料API、secret/OAuth/実データ・実素材の外部送信、実X投稿URLや本番 `/api/extract` を使うlive provider確認、製品要件変更、または権限/OAuth/usage-limit等で物理的に継続できない場合に限る。
- このリポジトリ固有のpost-release境界は維持する。本番API smoke、live X API/oEmbed、X Developer Portal、billing/credits、secret/token/OAuth、実データ読み取りは実行しない。
- GitHub PR mergeに伴うCloudflare Pagesの自動デプロイは通常のGitHub workflowとして扱う。直接のCloudflare write/deploy/config/rollbackは、明示タスクと無料・secret安全確認がない限り実行しない。

---

## §2. 現状確認の入口

着手前に次を実値で確認する。過去のPR番号やローカルbranch名を信用しない。

- `git status --short --branch`
- `git fetch --prune`
- `git log --oneline --decorate -10 origin/master`
- `gh pr list --state open --json number,title,headRefName,mergeable,mergeStateStatus,statusCheckRollup`
- `gh issue list --state open`
- `TASKS_BACKLOG.md` と `docs/ux-improvement-candidates.md`

ローカル `master` は遅れていることがある。merge済み判定は `origin/master` とGitHub PR状態で行う。未コミット変更があるworktreeは直接同期しない。

---

## §3. プロジェクト要点

- Node.js ESM。フロントは `apps/web/` の素のHTML/CSS/vanilla JS。
- API は Cloudflare Pages Functions の `functions/api/extract.js`。
- 公開先はCloudflare Pages。Production branchは `master`。
- テストは `node --test` / `npm.cmd test`。件数ではなく fail 0 を合格基準にする。
- post-release operationsの判断はIssue #42に集約されている。Codexは判断材料整理やrepo内docs整備はできるが、privacy/legal/support/billing/log retention/429 policyを勝手に決定しない。

---

## §4. 自走ループ

1. 状態確認: WIP、branch、remote、open PR、open issueを確認する。
2. タスク分類: docs/sdlc-workflow.mdがある場合はClass S/M/L/XLで分類し、必要なrequirements/design/test/handoffを更新する。
3. ブランチ: 既存WIPを避け、必要なら専用worktreeやtask branchを使う。
4. 実装: 小さく実装し、日本語firstのUI文言と必要なテストを追加する。
5. 検証: `npm.cmd test`、`npm.cmd run check:post-release-docs`、`git diff --check`を基本に、変更範囲に応じて追加する。
6. UI確認: Web UIを触った場合は390px、768px、1280px以上の実レンダリング、console/network、focus/hover/入力状態を確認する。本番APIやlive providerは呼ばない。
7. セルフレビュー: 禁止事項、a11y、レスポンシブ、XSS、cache-first、oEmbed fallback、ログ/secret漏えいを疑って直す。
8. GitHub: commit、push、PR作成/更新、merge、ブランチ整理まで進める。CIやmergeabilityは実測で確認する。
9. 記録: repo内handoffと中央devlogへ、今回の変更・検証・残課題を短く残す。

---

## §5. 停止条件

以下は実行前に止まる。

- 課金、有料API、X API credits消費、Workers AI等の有料モデル/クラウド実行。
- secret、token、OAuth、認証Cookie、実ユーザー/顧客データ、実X投稿本文・URL・メディア・アカウント情報の外部送信やログ記録。
- 本番 `/api/extract`、本番429確認、live X API/oEmbed、`smoke:production-once`、`manual:oembed-check`。
- X Developer Portal、billing/credits確認、Cloudflare dashboard/OAuthでの権限入力。
- 製品要件変更、出力スキーマ/API契約の破壊的変更、MVP外の別Web UI/iOS/DB/マイグレーション新設。
- 同じfailure classを3回修正しても改善しない場合。

GitHub PR merge、通常のGitHub Actions、ローカルテスト、repo内docs更新、静的UIのローカル/preview確認は、上記に当たらない限り停止条件ではない。

---

## §6. 常時禁止

- ユーザー入力URLをサーバーで直接fetchしない。validatorが生成した `canonicalXPostUrl` だけをX API v2または公式oEmbed endpointへ渡す。
- XのHTMLをスクレイピングしない。ブラウザ自動化でXを読まない。
- ウェブ魚拓をサーバーから取得しない。魚拓は外部リンクとして表示するだけ。
- OGP取得、短縮URL展開、メディアダウンロードをしない。
- 投稿本文、メディアURL、アカウント情報、postId、HTML本文、JSON valuesをログに残さない。
- 投稿本文をHTMLとして描画しない。
- X API Bearer Tokenをクライアントへ出さない。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth`、実データは読まない、表示しない、変更しない、コミットしない。

---

## §7. 検証基準

基本セット:

- `npm.cmd test`
- `npm.cmd run check:post-release-docs`
- `git diff --check`

PowerShellの実行ポリシーで `npm.ps1` が拒否されたら `npm.cmd` を使う。sandboxで `spawn EPERM` が出た場合は、権限のある経路で同じコマンドを再実行し、実測結果だけを報告する。未実行の検証は未確認と書く。

---

## §8. コミット・PR規約

- branch名は `feature/`, `fix/`, `docs/`, `test/`, `chore/` の短いkebab-case。
- commitはEnglish conventional prefix + 必要に応じて日本語補足。
- PR本文は Summary / 概要、Changes / 変更内容、Tests / 検証、Review notes / レビュー観点、Risks / 残リスク、Unknowns / 未確認事項、Cost impact / 費用影響を含める。
- 機微情報、実URL、投稿本文、token、local absolute path、raw logはPRやIssueに書かない。

---

## §9. セルフレビュー観点

- 禁止事項違反がないか。
- 出力スキーマ、cache-first、oEmbed fallback、warnings/sourceの意味を壊していないか。
- a11y: label、aria-live、focus、keyboard、contrast、色だけに依存しないフィードバック。
- レスポンシブ: 390/768/1280pxで横スクロール、重なり、タップしづらさがないか。
- エラー境界: 空入力、余分な空白/改行、連続取得、clipboard失敗、未取得項目。
- テスト: 追加挙動にテストがあるか、既存意図を壊していないか。

---

## §10. Web UIとデザイン判断

Web UI、HTML、CSS、client JSに触れる場合は、secretや実データを含まないqueryでModern Web Guidanceを必要最小限参照する。UI変更後は実レンダリングを確認する。

新しい配色、書体、ブランド表現、ビジュアル方向性の創出も Codex が担当する。§12 のブリーフは判断根拠と受け入れ基準を整理する内部メモとして使い、実レンダー検証まで完遂する。補助レビュー待ちだけを理由に停止しない。

---

## §11. バックログの扱い

一次情報は `TASKS_BACKLOG.md` と `docs/ux-improvement-candidates.md`。CC-IDとPR番号は固定対応ではない。報告やPR本文でPR番号を出す場合はGitHubの実値で確認する。

既知の大枠:

- CC-001〜CC-006: 完了済み。PR #51〜#58 で入力/エラー、魚拓導線、コピー体験、出力形式、入力寛容化、高コントラストを統合済み。
- CC-007 / HUM-001: Issue #42の判断材料整理と人間/ChatGPT判断待ち。Codexが扱えるのは外部通信なしのrepo内docs整備まで。
- CC-008: 軽量lint導入の検討。CI条件変更は検証可能な通常PRとして扱い、停止条件に当たる場合だけ止まる。

---

## §12. デザイン/相談ブリーフ雛形

    # 相談ブリーフ: <対象>
    日付: YYYY/MM/DD JST
    依頼元: Codex / リポジトリ x-archive-link-tool / ブランチ <branch>
    相談種別: デザイン / a11y / セキュリティ / 要件 / その他

    ## 背景
    - 何を変えたいか:
    - 関連候補ID/issue/PR:

    ## 制約
    - 素のHTML/CSS/vanilla JS。
    - 日本語first。
    - 本番API、live X API/oEmbed、secret、実URL、実データは使わない。

    ## ほしい判断
    1.
    2.

    ## Codexの暫定結論
    -

---

## §13. 外部レビュー依頼

外部レビューは必要なときだけ使う。依頼文には、対象diff、判断してほしい点、実行済み検証、未確認事項、停止条件への配慮を短く書く。secret、実URL、投稿本文、token、local absolute path、raw logは含めない。

---

## §14. 報告とdevlog

報告は現在の日本時間 `YYYY/MM/DD HH:MM:SS` から開始する。含めるものは、完了したタスク、branch、commit、push、PR/merge、検証、UI確認、git status、diff stat、未確認事項、残リスク、費用影響、次の一手。

中央devlogへはローカルVault内 `claude-dev-log/daily/YYYY-MM-DD.md` に直接追記する。書けない場合だけ、repo内 `docs\DEVLOG-inbox.md` または最終報告の「開発ログ報告（Obsidian用）」へフォールバックする。

---

## §15. クイックリファレンス

- テスト: `npm.cmd test`
- post-release docs guard: `npm.cmd run check:post-release-docs`
- ローカル起動: `$env:PORT="3000"; npm.cmd start` または `node server/extractServer.js`
- health check: `http://127.0.0.1:3000/healthz`
- PR一覧: `gh pr list --state open --json number,title,headRefName,mergeable,mergeStateStatus,statusCheckRollup`
- issue一覧: `gh issue list --state open`

本番smoke、live oEmbed、X API live、X Developer Portal、billing/credits、secret/OAuth、実URL/実データは停止条件として扱う。
