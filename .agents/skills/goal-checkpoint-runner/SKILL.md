---
name: goal-checkpoint-runner
description: /goal、Goal、Done when、checkpoint形式の依頼を長時間の自律作業として進める。checkpoint完了では停止せず、停止条件に該当しない限り次の有用な作業へ進むときに使う。
---

# Goal Checkpoint Runner

- `/goal` は作業開始してよいタイミングでだけ使う。
- 計画、確認、読み取り専用調査だけの場合は `/goal` を使わない。
- Goal、Done when、checkpoint 形式の依頼は、実行可能な作業へ分解して順に進める。
- checkpoint 完了だけを停止理由にしない。差分、確認結果、未確認事項、残リスクを記録し、停止条件に該当しなければ次の有用な作業へ進む。
- 停止するのは、料金発生の可能性、secret/token/OAuth/credential/実データの外部送信、paid service操作、または sandbox/permission/usage-limit などで物理的に継続できない場合だけ。
- 外部操作でも、ユーザーが明示許可した GitHub branch/commit/push/PR/review/merge と Cloudflare無料枠内deploy/status確認/Browser検証は通常フローとして扱う。
