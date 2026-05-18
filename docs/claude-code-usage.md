# Claude Code利用手順

このリポジトリでは `AGENTS.md` を一次ルールとして使う。

`CLAUDE.md` はユーザー環境のグローバルignore対象になっているため、Git管理対象として追加しない。Claude Codeで作業する場合は、ローカルのignored `CLAUDE.md` に次の内容を置き、`AGENTS.md` を読み込ませる。

```text
@AGENTS.md
```

Claude Codeレビューや修正時も、本番 `/api/extract`、本番429確認、X API/oEmbed live通信、secret/token/OAuth/実データの読み取りは禁止する。Cloudflare操作は、明示許可がある場合でも原則として読み取り確認と静的URL確認に限定する。
