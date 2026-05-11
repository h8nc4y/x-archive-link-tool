---
name: goal-checkpoint-runner
description: /goal、Goal、Done when、checkpoint形式の依頼を1 checkpointずつ進める。長い依頼を区切って進め、各checkpoint完了時に停止するときに使う。
---

# Goal Checkpoint Runner

- `/goal` は作業開始してよいタイミングでだけ使う。
- 計画、確認、読み取り専用調査だけの場合は `/goal` を使わない。
- Goal、Done when、checkpoint 形式の依頼は 1 checkpoint ずつ進める。
- 1 checkpoint が完了したら必ず停止し、差分、確認結果、未確認事項、残リスクを報告する。
- 外部操作や承認ポイントを越えない。
