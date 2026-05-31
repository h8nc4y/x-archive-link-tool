import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  extractMarkdownLinks,
  formatMarkdownLinkResults,
  validateMarkdownLinks
} from "./verifyMarkdownLinks.js";

function withFixture(files, callback) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "markdown-links-"));
  try {
    for (const [relativePath, text] of Object.entries(files)) {
      const absolutePath = path.join(rootDir, relativePath);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, text, "utf8");
    }
    return callback(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
}

test("extractMarkdownLinks ignores code blocks and image links", () => {
  const links = extractMarkdownLinks([
    "[real](docs/ok.md)",
    "![image](docs/image.png)",
    "```",
    "[ignored](docs/missing.md)",
    "```"
  ].join("\n"));

  assert.deepEqual(links.map((link) => link.href), ["docs/ok.md"]);
});

test("validateMarkdownLinks passes existing local markdown links", () => {
  const result = withFixture(
    {
      "README.md": "[Doc](docs/guide.md)",
      "docs/guide.md": "[Back](../README.md)"
    },
    (rootDir) => validateMarkdownLinks(rootDir, { roots: ["README.md", "docs"] })
  );

  assert.equal(result.ok, true);
  assert.equal(result.brokenLinks.length, 0);
  assert.equal(result.checkedLinks.length, 2);
});

test("validateMarkdownLinks reports missing local markdown links", () => {
  const result = withFixture(
    {
      "README.md": "[Missing](docs/missing.md)"
    },
    (rootDir) => validateMarkdownLinks(rootDir, { roots: ["README.md"] })
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.brokenLinks.map((link) => link.href), ["docs/missing.md"]);
  assert.deepEqual(formatMarkdownLinkResults(result), [
    "NG markdown local links",
    "missing local target: README.md:1 -> docs/missing.md"
  ]);
});

test("validateMarkdownLinks skips external, mail, phone, and fragment-only links", () => {
  const result = withFixture(
    {
      "README.md": [
        "[External](https://example.com/path)",
        "[Mail](mailto:owner@example.com)",
        "[Phone](tel:+81000000000)",
        "[Fragment](#local-heading)"
      ].join("\n")
    },
    (rootDir) => validateMarkdownLinks(rootDir, { roots: ["README.md"] })
  );

  assert.equal(result.ok, true);
  assert.equal(result.checkedLinks.length, 0);
  assert.equal(result.skippedLinks.length, 4);
});

test("validateMarkdownLinks checks only file existence for anchor links", () => {
  const result = withFixture(
    {
      "README.md": "[With anchor](docs/guide.md#section)",
      "docs/guide.md": "# Different heading"
    },
    (rootDir) => validateMarkdownLinks(rootDir, { roots: ["README.md", "docs"] })
  );

  assert.equal(result.ok, true);
  assert.equal(result.brokenLinks.length, 0);
  assert.equal(result.checkedLinks.length, 1);
});
