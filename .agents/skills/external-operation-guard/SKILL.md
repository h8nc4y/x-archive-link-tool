---
name: external-operation-guard
description: 外部副作用のある操作を、料金・secret・実データ・権限blockerだけで止める。GitHub通常開発フローとCloudflare無料枠内操作は承認済みとして扱う。
---

# External Operation Guard

- GitHub branch/commit/push/issue/PR/review/merge は、このリポジトリの通常開発フローとして停止せず進める。
- Cloudflare無料枠内または既存契約内のpreview/staging/production deploy、status確認、ログ確認、rollback準備・実行は停止せず進める。
- 停止するのは、料金発生の可能性、paid plan変更、paid API/model/SaaS操作、secret/token/OAuth/credential/実データの外部送信、または sandbox/permission/login/usage-limit で物理的に継続できない場合だけ。
- `.env`、`data/`、`secrets`、`credentials`、`token`、`OAuth`、実データは読まない、表示しない、変更しない、コミットしない。
- 停止時は exact operation、必要性、副作用、free/local/mock alternative、JPY概算、価格根拠、承認文言、承認後の安全な次コマンドを報告する。
- 承認前に実行可能な代替確認があれば、ローカルまたは読み取り専用範囲で実施する。
