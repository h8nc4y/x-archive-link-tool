import test from "node:test";
import assert from "node:assert/strict";
import { REQUIRED_DOCS, formatValidationResults, validateDocText } from "./verifyPostReleaseDocs.js";

const forbiddenTerms = ["token", "secret"];

test("validateDocText passes when sections and forbidden reminders are present", () => {
  const result = validateDocText("## A\n## B\n禁止: token secret", ["## A", "## B"], forbiddenTerms);

  assert.deepEqual(result, {
    ok: true,
    missingSections: [],
    missingForbiddenTerms: [],
    missingRequiredPhrases: []
  });
});

test("validateDocText reports missing sections and forbidden reminders", () => {
  const result = validateDocText("## A\n禁止: token", ["## A", "## B"], forbiddenTerms);

  assert.deepEqual(result, {
    ok: false,
    missingSections: ["## B"],
    missingForbiddenTerms: ["secret"],
    missingRequiredPhrases: []
  });
});

test("validateDocText reports missing required guardrail phrases", () => {
  const result = validateDocText("## A\n禁止: token", ["## A"], ["token"], [
    "Issue #42 is open",
    "Codex must not"
  ]);

  assert.deepEqual(result, {
    ok: false,
    missingSections: [],
    missingForbiddenTerms: [],
    missingRequiredPhrases: ["Issue #42 is open", "Codex must not"]
  });
});

test("formatValidationResults prints bounded status lines only", () => {
  const lines = formatValidationResults([
    { path: "docs/a.md", ok: true, missingSections: [], missingForbiddenTerms: [], missingRequiredPhrases: [] },
    {
      path: "docs/b.md",
      ok: false,
      missingSections: ["## Missing"],
      missingForbiddenTerms: ["token"],
      missingRequiredPhrases: ["Issue #42 is open"]
    }
  ]);

  assert.deepEqual(lines, [
    "OK docs/a.md",
    "NG docs/b.md",
    "missing section: ## Missing",
    "missing forbidden-term reminder: token",
    "missing required phrase: Issue #42 is open"
  ]);
});

test("required docs include Issue #42 decision packet guardrails", () => {
  const packet = REQUIRED_DOCS.find((doc) => doc.path === "docs/post-release-operations-decision-packet.md");

  assert.ok(packet);
  assert.deepEqual(packet.required, [
    "## Status",
    "## Issue #42 scope",
    "## Decision item summary",
    "## Codex prohibited work for Issue #42",
    "## Production smoke approval gate",
    "## Issue #42 close conditions",
    "## Why Issue #42 remained open until 2026-07-07"
  ]);
  assert.deepEqual(packet.requiredPhrases, [
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
  ]);
});
