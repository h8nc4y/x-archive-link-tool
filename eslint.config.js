// CC-008: 軽量lint導入（ESLint flat config）。
// 方針: eslint:recommended のみを土台にし、独自ルールの追加は最小限に保つ。
// スタイル系ルール（インデント・クォート等）は意図的に入れない。整形の議論より
// 「未定義変数・未使用変数・明らかなバグ」の検出だけを目的とする軽量構成。
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    // 依存・一時ファイル・生成物・エージェント用worktreeはlint対象外
    ignores: ["node_modules/", "tmp/", ".claude/"]
  },
  js.configs.recommended,
  {
    // すべてのJavaScriptに共通する構文と検出ルールだけをここで定義する。
    // 実行環境のglobalsは後続のpath別configで限定し、ブラウザやWorkersで
    // Node.js専用APIを誤用したときに no-undef が検出できる境界を維持する。
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      // 未使用の引数・変数は _ プレフィックスで意図的な無視を表現できるようにする
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  },
  {
    // Web UI本体はブラウザ専用。Node.jsで動く *.test.js はこの設定から除外し、
    // process / Buffer などを本番コードへ誤って持ち込めないようにする。
    files: ["apps/web/**/*.js"],
    ignores: ["apps/web/**/*.test.js"],
    languageOptions: {
      globals: { ...globals.browser }
    }
  },
  {
    // Cloudflare Pages Functions本体はWeb Worker相当の実行環境に限定する。
    // Node.jsで動く *.test.js は除外し、WorkersにないNode.js APIを検出する。
    files: ["functions/**/*.js"],
    ignores: ["functions/**/*.test.js"],
    languageOptions: {
      globals: { ...globals.worker }
    }
  },
  {
    // ローカルserver・保守script・lint設定・全testはNode.jsで実行する。
    // testを最後に分離することで、隣接する本番browser/WorkersコードへNode globalsを漏らさない。
    files: ["eslint.config.js", "server/**/*.js", "scripts/**/*.js", "**/*.test.js"],
    languageOptions: {
      globals: { ...globals.node }
    }
  }
];
