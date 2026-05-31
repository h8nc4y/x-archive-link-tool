import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_MARKDOWN_ROOTS = ["README.md", "AGENTS.md", "SECURITY.md", "docs"];

const IGNORED_DIRECTORIES = new Set([".git", ".codegraph", ".claude", "node_modules", "tmp"]);

function toRepoPath(rootDir, absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

function isMarkdownFile(filePath) {
  return filePath.toLowerCase().endsWith(".md");
}

export function collectMarkdownFiles(rootDir, roots = DEFAULT_MARKDOWN_ROOTS) {
  const files = [];

  function walk(absolutePath) {
    if (!fs.existsSync(absolutePath)) {
      return;
    }

    const stats = fs.statSync(absolutePath);
    if (stats.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(path.basename(absolutePath))) {
        return;
      }
      for (const child of fs.readdirSync(absolutePath).sort()) {
        walk(path.join(absolutePath, child));
      }
      return;
    }

    if (stats.isFile() && isMarkdownFile(absolutePath)) {
      files.push(absolutePath);
    }
  }

  for (const root of roots) {
    walk(path.join(rootDir, root));
  }

  return files.sort();
}

function normalizeDestination(rawHref) {
  const trimmed = rawHref.trim();
  if (trimmed.startsWith("<")) {
    const end = trimmed.indexOf(">");
    return end === -1 ? trimmed.slice(1) : trimmed.slice(1, end);
  }
  return trimmed.split(/\s+/)[0];
}

function isSkippedDestination(destination) {
  return (
    destination === "" ||
    destination.startsWith("#") ||
    destination.startsWith("//") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(destination)
  );
}

function stripAnchorAndQuery(destination) {
  const withoutAnchor = destination.split("#", 1)[0];
  return withoutAnchor.split("?", 1)[0];
}

function decodeDestination(destination) {
  try {
    return decodeURI(destination);
  } catch {
    return destination;
  }
}

export function extractMarkdownLinks(text) {
  const links = [];
  let inFence = false;
  let fenceMarker = null;
  const lines = text.split(/\r?\n/);
  const linkPattern = /\[[^\]\n]*\]\(([^)\n]+)\)/g;

  lines.forEach((line, index) => {
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1];
      } else if (fenceMatch[1] === fenceMarker) {
        inFence = false;
        fenceMarker = null;
      }
      return;
    }

    if (inFence) {
      return;
    }

    let match;
    linkPattern.lastIndex = 0;
    while ((match = linkPattern.exec(line)) !== null) {
      if (match.index > 0 && line[match.index - 1] === "!") {
        continue;
      }

      links.push({
        href: normalizeDestination(match[1]),
        line: index + 1,
        column: match.index + 1
      });
    }
  });

  return links;
}

function resolveLocalTarget(rootDir, sourceFile, href) {
  const targetPath = decodeDestination(stripAnchorAndQuery(href));
  const absoluteTarget = path.resolve(path.dirname(sourceFile), targetPath);
  const relativeTarget = path.relative(rootDir, absoluteTarget);

  return {
    absoluteTarget,
    relativeTarget: relativeTarget.split(path.sep).join("/"),
    outsideRepo: relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)
  };
}

export function validateMarkdownLinks(rootDir, options = {}) {
  const roots = options.roots ?? DEFAULT_MARKDOWN_ROOTS;
  const markdownFiles = collectMarkdownFiles(rootDir, roots);
  const checkedLinks = [];
  const skippedLinks = [];
  const brokenLinks = [];

  for (const sourceFile of markdownFiles) {
    const sourcePath = toRepoPath(rootDir, sourceFile);
    const text = fs.readFileSync(sourceFile, "utf8");
    for (const link of extractMarkdownLinks(text)) {
      const linkRecord = {
        sourcePath,
        line: link.line,
        column: link.column,
        href: link.href
      };

      if (isSkippedDestination(link.href)) {
        skippedLinks.push(linkRecord);
        continue;
      }

      const target = resolveLocalTarget(rootDir, sourceFile, link.href);
      const checkedRecord = {
        ...linkRecord,
        targetPath: target.relativeTarget
      };
      checkedLinks.push(checkedRecord);

      if (target.outsideRepo || !fs.existsSync(target.absoluteTarget)) {
        brokenLinks.push(checkedRecord);
      }
    }
  }

  return {
    ok: brokenLinks.length === 0,
    markdownFiles: markdownFiles.map((file) => toRepoPath(rootDir, file)),
    checkedLinks,
    skippedLinks,
    brokenLinks
  };
}

export function formatMarkdownLinkResults(result) {
  if (result.ok) {
    return [
      `OK markdown local links (${result.checkedLinks.length} checked, ${result.skippedLinks.length} skipped, ${result.markdownFiles.length} files)`
    ];
  }

  return [
    "NG markdown local links",
    ...result.brokenLinks.map((link) => `missing local target: ${link.sourcePath}:${link.line} -> ${link.href}`)
  ];
}

function getRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function main() {
  const result = validateMarkdownLinks(getRepoRoot());
  for (const line of formatMarkdownLinkResults(result)) {
    console.log(line);
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
