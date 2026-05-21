import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_DOCS = [
  {
    path: "docs/post-release-operations-checklist.md",
    required: [
      "## 残タスクの分類",
      "## Codexへ渡してよい安全な情報",
      "## 記録禁止情報",
      "## 本番API smokeへ進む条件"
    ]
  },
  {
    path: "docs/production-smoke-runbook.md",
    required: [
      "## 実行前提",
      "## 人間承認条件",
      "## 承認文言",
      "## 429確認時の扱い",
      "## 禁止記録項目"
    ]
  },
  {
    path: "docs/post-release-human-verification-template.md",
    required: [
      "## 1. X Developer Portal / Billing",
      "## 2. Privacy / Legal / Support",
      "## 3. KV / Incident",
      "## 4. Production API Smoke Approval",
      "## 6. 禁止記録項目"
    ]
  },
  {
    path: "docs/incident-and-kv-failure-runbook.md",
    required: [
      "## 暫定停止の判断",
      "## ユーザー告知の文案",
      "## ログ確認",
      "## KV障害時の判断手順",
      "## 復旧後確認"
    ]
  }
];

export const REQUIRED_FORBIDDEN_TERMS = [
  "実X投稿URL",
  "postId",
  "username",
  "投稿本文",
  "media URL",
  "raw JSON values",
  "token",
  "secret",
  "OAuth",
  "Authorization header"
];

export function readDoc(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

export function validateDocText(text, requiredSections, forbiddenTerms = REQUIRED_FORBIDDEN_TERMS) {
  const missingSections = requiredSections.filter((section) => !text.includes(section));
  const missingForbiddenTerms = forbiddenTerms.filter((term) => !text.includes(term));

  return {
    ok: missingSections.length === 0 && missingForbiddenTerms.length === 0,
    missingSections,
    missingForbiddenTerms
  };
}

export function validatePostReleaseDocs(rootDir, docs = REQUIRED_DOCS) {
  return docs.map((doc) => {
    const text = readDoc(rootDir, doc.path);
    return {
      path: doc.path,
      ...validateDocText(text, doc.required)
    };
  });
}

export function formatValidationResults(results) {
  const lines = [];

  for (const result of results) {
    if (result.ok) {
      lines.push(`OK ${result.path}`);
      continue;
    }

    lines.push(`NG ${result.path}`);
    for (const section of result.missingSections) {
      lines.push(`missing section: ${section}`);
    }
    for (const term of result.missingForbiddenTerms) {
      lines.push(`missing forbidden-term reminder: ${term}`);
    }
  }

  return lines;
}

function getRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function main() {
  const results = validatePostReleaseDocs(getRepoRoot());
  for (const line of formatValidationResults(results)) {
    console.log(line);
  }

  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
