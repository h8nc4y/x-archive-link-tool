---
name: review-before-done
description: 完了報告前に差分、検証結果、未確認事項、残リスクを点検する。作業を止める前に混入物や確認漏れを確認するときに使う。
---

# Review Before Done

- 完了前に `git diff --stat` と `git diff --name-only` を確認する。
- 変更ファイル、主な変更、検証結果、未確認事項、残リスクを整理する。
- 秘密情報、実データ、不要なファイル、生成物が混入していないか確認する。
- テストを実行しない場合は理由を明記する。
- commit、push、deploy を行っていないことを確認して報告する。
