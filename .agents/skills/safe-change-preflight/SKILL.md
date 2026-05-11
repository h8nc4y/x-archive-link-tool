---
name: safe-change-preflight
description: 変更前に対象範囲、危険操作、承認ポイント、検証方法を確認する。既存差分や未追跡ファイルがある状態で、安全に作業開始できるか判断するときに使う。
---

# Safe Change Preflight

- 作業前に `git status --short` を確認する。
- 未追跡ファイルや既存差分がある場合は、編集前に明示する。
- 変更対象ファイル、危険操作、承認ポイント、検証方法を短く整理する。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth`、実データは読まない。
- 外部ネットワーク、依存追加、実API、push、deploy が必要な場合は停止して承認を求める。
