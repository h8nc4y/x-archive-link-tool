import test from "node:test";
import assert from "node:assert/strict";
import { formatValidationResults, validateDocText } from "./verifyPostReleaseDocs.js";

const forbiddenTerms = ["token", "secret"];

test("validateDocText passes when sections and forbidden reminders are present", () => {
  const result = validateDocText("## A\n## B\n禁止: token secret", ["## A", "## B"], forbiddenTerms);

  assert.deepEqual(result, {
    ok: true,
    missingSections: [],
    missingForbiddenTerms: []
  });
});

test("validateDocText reports missing sections and forbidden reminders", () => {
  const result = validateDocText("## A\n禁止: token", ["## A", "## B"], forbiddenTerms);

  assert.deepEqual(result, {
    ok: false,
    missingSections: ["## B"],
    missingForbiddenTerms: ["secret"]
  });
});

test("formatValidationResults prints bounded status lines only", () => {
  const lines = formatValidationResults([
    { path: "docs/a.md", ok: true, missingSections: [], missingForbiddenTerms: [] },
    { path: "docs/b.md", ok: false, missingSections: ["## Missing"], missingForbiddenTerms: ["token"] }
  ]);

  assert.deepEqual(lines, [
    "OK docs/a.md",
    "NG docs/b.md",
    "missing section: ## Missing",
    "missing forbidden-term reminder: token"
  ]);
});
