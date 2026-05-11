---
name: windows-local-dev-check
description: Windows PowerShell前提で安全に検証コマンドを選ぶ。NodeやPythonプロジェクトのローカル確認方法を、依存追加やネットワークなしで判断するときに使う。
---

# Windows Local Dev Check

- Windows PowerShell 前提で検証コマンドを選ぶ。
- Python プロジェクトでは `.\.venv\Scripts\python.exe -m pytest` を優先候補にする。
- Node プロジェクトでは `package.json` の `scripts` を確認してから `npm test`、`npm run build` などを候補にする。
- WSL を必須にしない。
- `rg` がなければ `Get-ChildItem` / `Select-String` を使う。
- `pip install`、`npm install`、ネットワーク、実APIは明示承認なしに実行しない。
