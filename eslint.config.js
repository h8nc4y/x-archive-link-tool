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
    // 既定はNode.js実行（server/・scripts/・各テストは node --test で動く）
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node }
    },
    rules: {
      // 未使用の引数・変数は _ プレフィックスで意図的な無視を表現できるようにする
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  },
  {
    // Web UI（apps/web/）はブラウザで動く。app.test.js は node --test から
    // app.js を import するため、node グローバルも併せて許可する。
    files: ["apps/web/**/*.js"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    }
  },
  {
    // Cloudflare Pages Functions は Workers 実行環境（Service Worker 相当の
    // グローバル: Response / Request / caches 等）。テストは node --test で動く。
    files: ["functions/**/*.js"],
    languageOptions: {
      globals: { ...globals.serviceworker, ...globals.node }
    }
  }
];
