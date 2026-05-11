---
name: external-operation-guard
description: 外部副作用のある操作を承認ゲートで止める。外部ネットワーク、実API、push、deploy、依存追加、秘密情報、実データ操作が必要になったときに使う。
---

# External Operation Guard

- 外部ネットワーク、実API、GitHub push、Cloudflare deploy、依存追加、秘密情報、実データ操作を承認ゲートで止める。
- 必要になった場合は、必要性、副作用、代替案、ユーザー承認が必要な操作を報告して停止する。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth`、実データは読まない。
- 承認前に実行可能な代替確認があれば、読み取り専用かつローカル範囲で実施する。
