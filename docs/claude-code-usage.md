# Claude Code利用手順

このリポジトリでは `AGENTS.md` を一次ルールとして使う。

`CLAUDE.md` はユーザー環境のグローバルignore対象になっているため、Git管理対象として追加しない。Claude Codeで作業する場合は、ローカルのignored `CLAUDE.md` に次の内容を置き、`AGENTS.md` を読み込ませる。

```text
@AGENTS.md
```

## 現行の開発・レビュー方針

- Codexが開発の主軸として、要件・デザイン・実装・レビュー・検証をend-to-endで担当します。
- Claude Code、ChatGPT、subagent、外部レビューは、必要時または明示依頼時の実行手段です。外部の指摘は主担当が検証して採否を決めます。
- `docs/AI_REVIEW_TRIAGE.md` と `docs/CODEX_TASKS.md` に残る旧レビューサイクルは履歴であり、現行作業の着手条件ではありません。
- ローカルのignored `CLAUDE.md` は補助ファイルであり、tracked docsや `AGENTS.md` の代替source of truthではありません。

Claude Codeレビューや修正時も、本番 `/api/extract`、本番429確認、X API/oEmbed live通信、secret/token/OAuth/実データの読み取りは禁止する。Cloudflare操作は、明示許可がある場合でも原則として読み取り確認と静的URL確認に限定する。
