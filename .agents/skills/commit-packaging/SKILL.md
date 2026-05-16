---
name: commit-packaging
description: commit可能な変更一式を整理し、必要なら対象ファイルだけをstageしてcommitする。push/PR/mergeはユーザー方針で許可されている場合に通常フローとして進める。
---

# Commit Packaging

- commit 可能な変更一式を整理する。
- `git add .` は禁止する。対象ファイルだけを明示してstageする。
- unrelated user changes を混ぜない。
- commit message は English conventional prefix + English summary を基本にし、必要に応じて日本語補足を入れる。
- commit message の最後に `Co-authored-by: Codex <noreply@openai.com>` を1回だけ含める。
- ユーザーまたはAGENTS.mdが許可している場合、commit、push、PR作成・更新、mergeまで通常開発フローとして進める。
- 変更要約、検証結果、未確認事項、残リスク、commit/push/PR/merge状況を報告する。
