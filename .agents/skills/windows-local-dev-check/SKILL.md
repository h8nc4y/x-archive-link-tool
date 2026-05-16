---
name: windows-local-dev-check
description: Windows PowerShell前提で安全に検証コマンドを選ぶ。NodeやPythonプロジェクトのローカル確認方法を、既存scriptsと停止条件に沿って判断するときに使う。
---

# Windows Local Dev Check

- Windows PowerShell 前提で検証コマンドを選ぶ。
- Python プロジェクトでは `.\.venv\Scripts\python.exe -m pytest` を優先候補にする。
- Node プロジェクトでは `package.json` の `scripts` を確認してから `npm test`、`npm run build` などを候補にする。
- WSL を必須にしない。
- `rg` がなければ `Get-ChildItem` / `Select-String` を使う。
- 無料の通常 package install はユーザー方針で許可されている場合に停止しない。ただし、このリポジトリでは不要な依存追加を避ける。
- 実API、paid API/model、secret/credential/実データ外部送信、無料枠超過が疑われる外部操作は停止条件として扱う。
