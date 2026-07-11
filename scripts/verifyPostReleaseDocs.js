import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatMarkdownLinkResults, validateMarkdownLinks } from "./verifyMarkdownLinks.js";

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
  },
  {
    path: "docs/post-release-operations-decision-packet.md",
    required: [
      "## Status",
      "## Issue #42 scope",
      "## Decision item summary",
      "## Codex prohibited work for Issue #42",
      "## Production smoke approval gate",
      "## Issue #42 close conditions",
      "## Why Issue #42 remained open until 2026-07-07"
    ],
    requiredPhrases: [
      "Issue #42 was closed on 2026-07-07",
      "human or ChatGPT decisions",
      "privacy and legal review",
      "support contact and support scope",
      "billing, X API credits",
      "log retention and Cloudflare Functions log handling",
      "429 policy",
      "production smoke approval boundaries",
      "incident ownership",
      "Codex must not",
      "Close Issue #42 while human decisions remain incomplete",
      "production `/api/extract`",
      "live X API",
      "live oEmbed",
      "real X URL",
      "Cloudflare write/deploy",
      "secret/OAuth",
      "real data"
    ],
    forbiddenTerms: [
      "real X URL",
      "post ID",
      "username",
      "post text",
      "media URL",
      "raw JSON",
      "token",
      "secret",
      "OAuth",
      "Authorization header"
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

export function validateDocText(
  text,
  requiredSections,
  forbiddenTerms = REQUIRED_FORBIDDEN_TERMS,
  requiredPhrases = []
) {
  const missingSections = requiredSections.filter((section) => !text.includes(section));
  const missingForbiddenTerms = forbiddenTerms.filter((term) => !text.includes(term));
  const missingRequiredPhrases = requiredPhrases.filter((phrase) => !text.includes(phrase));

  return {
    ok: missingSections.length === 0 && missingForbiddenTerms.length === 0 && missingRequiredPhrases.length === 0,
    missingSections,
    missingForbiddenTerms,
    missingRequiredPhrases
  };
}

export function validatePostReleaseDocs(rootDir, docs = REQUIRED_DOCS) {
  return docs.map((doc) => {
    const text = readDoc(rootDir, doc.path);
    return {
      path: doc.path,
      ...validateDocText(text, doc.required, doc.forbiddenTerms ?? REQUIRED_FORBIDDEN_TERMS, doc.requiredPhrases ?? [])
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
    for (const phrase of result.missingRequiredPhrases ?? []) {
      lines.push(`missing required phrase: ${phrase}`);
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

  const markdownLinkResult = validateMarkdownLinks(getRepoRoot());
  for (const line of formatMarkdownLinkResults(markdownLinkResult)) {
    console.log(line);
  }

  if (results.some((result) => !result.ok) || !markdownLinkResult.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
