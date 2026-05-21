import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_TARGET_PATH = "tmp/approved-smoke-target.txt";
const PRODUCTION_EXTRACT_URL = "https://x-archive-link-tool.pages.dev/api/extract";
const TIMEOUT_MS = 10000;

export function isAllowedPostUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      return false;
    }
    if (!["x.com", "twitter.com"].includes(url.hostname.toLowerCase())) {
      return false;
    }
    return /^\/[A-Za-z0-9_]{1,15}\/status\/[0-9]{1,19}\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

export function readApprovedTarget(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length !== 1) {
    throw new Error("target_file_must_contain_one_line");
  }

  const target = lines[0].trim();
  if (!target || !isAllowedPostUrl(target)) {
    throw new Error("target_format_invalid");
  }

  return target;
}

export function summarizePayload(status, payload) {
  const isObject = payload && typeof payload === "object" && !Array.isArray(payload);
  const mediaUrls = isObject && Array.isArray(payload.mediaUrls) ? payload.mediaUrls : [];
  const warnings = isObject && Array.isArray(payload.warnings) ? payload.warnings : [];
  const source = isObject && typeof payload.source === "string" ? payload.source : "未確認";
  const cached = isObject && typeof payload.cached === "boolean" ? String(payload.cached) : "未確認";
  const errorCode = isObject && typeof payload.code === "string" ? payload.code : "";

  return {
    status,
    source,
    cached,
    mediaUrlsCount: mediaUrls.length,
    warningsCount: warnings.length,
    errorCode: errorCode || "なし"
  };
}

export function formatSummary(summary, checkedAt) {
  return [
    `確認時刻: ${checkedAt}`,
    "実行回数: 1/1",
    `HTTP status: ${summary.status}`,
    `source: ${summary.source}`,
    `cached: ${summary.cached}`,
    `mediaUrls件数: ${summary.mediaUrlsCount}`,
    `warnings件数: ${summary.warningsCount}`,
    `error code: ${summary.errorCode}`
  ];
}

async function postJsonOnce(url, target) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: target }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function getRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

async function main() {
  const repoRoot = getRepoRoot();
  const targetPath = path.join(repoRoot, DEFAULT_TARGET_PATH);
  if (!fs.existsSync(targetPath)) {
    console.log("smoke status: skipped");
    console.log("reason: target_missing");
    process.exitCode = 2;
    return;
  }

  let target;
  try {
    target = readApprovedTarget(targetPath);
  } catch (error) {
    console.log("smoke status: skipped");
    console.log(`reason: ${error.message}`);
    process.exitCode = 2;
    return;
  }

  try {
    const response = await postJsonOnce(PRODUCTION_EXTRACT_URL, target);
    const payload = await response.json().catch(() => ({}));
    const checkedAt = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    })
      .format(new Date())
      .replace(/\//g, "/");
    console.log("smoke status: completed");
    for (const line of formatSummary(summarizePayload(response.status, payload), `${checkedAt} JST`)) {
      console.log(line);
    }
  } catch {
    console.log("smoke status: failed");
    console.log("reason: request_failed");
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
