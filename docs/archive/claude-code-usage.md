# Claude Code利用手順

このリポジトリでは `AGENTS.md` を一次ルールとして使う。

`CLAUDE.md` はユーザー環境のグローバルignore対象になっているため、Git管理対象として追加しない。Claude Codeで作業する場合は、ローカルのignored `CLAUDE.md` に次の内容を置き、`AGENTS.md` を読み込ませる。

```text
@AGENTS.md
```

## 役割分離

- ChatGPTがレビュー仕分けの司令塔です。
- Claude Codeは独立したread-only reviewerです。Claudeの指摘はadvisoryであり、実装指示ではありません。
- Codexは、ChatGPTが `docs/AI_REVIEW_TRIAGE.md` で承認し、`docs/CODEX_TASKS.md` に実装対象として記録した作業だけを実装します。
- ローカルのignored `CLAUDE.md` は補助ファイルであり、tracked docsや `AGENTS.md` の代替source of truthではありません。

Claude Codeレビューや修正時も、本番 `/api/extract`、本番429確認、X API/oEmbed live通信、secret/token/OAuth/実データの読み取りは禁止する。Cloudflare操作は、明示許可がある場合でも原則として読み取り確認と静的URL確認に限定する。
