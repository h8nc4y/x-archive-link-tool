# lint の CI 組み込み提案（CC-023）

最終更新: 2026/07/16 JST

状態: 提案確定、未実装。

採用判断: `docs/DECISION_LOG.md` の gate ①に従い、CI workflow の変更はオーナー承認後の別タスクで行う。

## 結論

既存の GitHub Actions に依存関係の固定導入と npm cache を追加し、現在のローカル標準 gate である `npm run check:all` を CI でも実行する案を推奨する。

変更対象は `.github/workflows/ci.yml` だけに限定し、Node.js 22、Actions の major version、trigger、`contents: read` 権限は維持する。

lint、227件の Node.js test、post-release docs guard を同じ script から実行するため、ローカルと CI の検証範囲がずれにくい。

## 現状の実測

2026/07/16 時点の `.github/workflows/ci.yml` は、pull request、`master` への push、手動実行を trigger にしている。

job は `actions/checkout@v5` と `actions/setup-node@v5` で Node.js 22 を用意した後、`npm test` だけを実行する。

`npm ci`、npm cache、`npm run lint`、`npm run check:post-release-docs` は workflow にない。

`package-lock.json` は lockfileVersion 3 で、ESLint 関連の devDependencies を固定している。

`package.json` には `lint` と `check:all` があるが、`packageManager` はないため、暗黙の cache 判定には依存しない。

GitHub API では `master` の branch protection は未設定で、repository ruleset も 0 件だった。

この外部状態は変更され得るため、実装直前に再確認する。

## 推奨する変更範囲

将来の実装タスクでは、次の差分だけを `.github/workflows/ci.yml` に加える。

1. `actions/setup-node@v5` に `cache: npm` と `cache-dependency-path: package-lock.json` を指定する。
2. 検証前に `npm ci` を実行し、lockfile どおりに devDependencies を導入する。
3. 現在の `npm test` step を `npm run check:all` に置き換える。
4. job の表示名を実行内容に合わせて `npm check:all` に変更する。

提案する完成形の主要部分は次のとおり。

~~~yaml
jobs:
  test:
    name: npm check:all
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5

      - name: Set up Node.js
        uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run all checks
        run: npm run check:all
~~~

job ID の `test` は維持する。

trigger と `permissions: contents: read` も変更しない。

## install step

`npm install` ではなく `npm ci` を使う。

`npm ci` は既存 lockfile と manifest の不整合を失敗として扱い、CI の依存解決を再現可能にする。

lint は devDependency の ESLint を必要とするため、`NODE_ENV=production` や `--omit=dev` は指定しない。

このタスクで package、lockfile、application code は変更しない。

## cache

`actions/setup-node` の組み込み npm cache を使う。

`cache-dependency-path` は root の `package-lock.json` を明示し、cache key の根拠を読み手に残す。

cache 対象は npm の global package data であり、`node_modules` ではない。

したがって、cache hit 時も `npm ci` は毎回実行する。

`actions/cache` を別 step で追加する必要はない。

## Actions と Node.js の version

今回の目的は lint を既存 CI に組み込むことであり、Actions major version の更新ではない。

そのため実装時も repository 現行の `actions/checkout@v5`、`actions/setup-node@v5`、Node.js 22 を維持する。

upstream の新 major への更新は、release note と runner 互換性を確認する別の保守タスクとして扱う。

## 検証方法

実装 PR では次をすべて実測する。

1. 変更前に branch protection と repository ruleset を再確認し、required check 名への影響がないことを確認する。
2. ローカルで `npm.cmd run check:all` を実行し、lint、tests、docs guard が成功することを確認する。
3. `git diff --check` を実行する。
4. GitHub Actions の pull request run で `Install dependencies` と `Run all checks` が成功することを確認する。
5. Actions log で `npm ci` が lockfile を使い、`check:all` が lint、test、docs guard の順に実行されたことを確認する。
6. merge 後の `master` でも同 workflow が成功することを確認する。

失敗経路の確認が必要な場合は、一時的な未定義変数をローカル作業ツリーへ置いて `npm.cmd run lint` の非0終了を確認し、必ず削除してから全 gate を再実行する。

意図的な失敗用ファイルは commit しない。

## 受け入れ条件

- clean runner で `npm ci` 後に lint が実行される。
- CI とローカルの標準 gate がともに `check:all` である。
- tests と post-release docs guard が従来どおり CI に含まれる。
- trigger、read-only 権限、Node.js 22、既存 Actions major versionが維持される。
- secret、X投稿URL、本番API、Cloudflare write、外部 provider 呼び出しを追加しない。
- CI が失敗した場合、log から lint、test、docs guard のどこで止まったか判別できる。

## リスクと戻し方

`npm ci` と lint の分だけ CI 時間は増える。

cache miss の初回は npm registry から lockfile 記載の package を取得するが、新しい SaaS、secret、paid resource は追加しない。

job 表示名の変更は required check 設定へ影響し得るため、実装直前の保護ルール再確認を必須とする。

問題が出た場合は `.github/workflows/ci.yml` の当該差分だけを revert し、従来の `npm test` job へ戻せる。

## 採用後の次タスク

オーナーが gate ①で採用を承認したら、新しい CC タスクを `TASKS_BACKLOG.md` に登録し、workflow 変更、PR検証、merge 後確認を行う。

承認前はこの提案を実装へ進めない。

## 参照した一次資料

- [GitHub Docs: Building and testing Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs?learn=continuous_integration)（2026/07/16確認）
- [actions/setup-node v5 README: npm caching](https://github.com/actions/setup-node/blob/v5/README.md#caching-global-packages-data)（2026/07/16確認）
- [npm Docs: npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/)（2026/07/16確認）
