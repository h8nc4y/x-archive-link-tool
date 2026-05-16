---
name: safe-change-preflight
description: 変更前に対象範囲、危険操作、停止条件、検証方法を確認する。既存差分や未追跡ファイルがある状態で、安全に作業開始できるか判断するときに使う。
---

# Safe Change Preflight

- 作業前に `git status --short` を確認する。
- 未追跡ファイルや既存差分がある場合は、編集前に明示する。
- 変更対象ファイル、危険操作、停止条件、検証方法を短く整理する。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth`、実データは読まない、表示しない、変更しない、コミットしない。
- GitHub branch/commit/push/issue/PR/review/merge と Cloudflare無料枠内deploy/status確認/Browser検証は通常フローとして扱い、停止理由にしない。
- 停止するのは、料金発生の可能性、paid service操作、secret/credential/実データの外部送信、または sandbox/permission/usage-limit blocker がある場合だけ。
