import { fileURLToPath } from "node:url";
import { createServer } from "../server/extractServer.js";

const REQUIRED_KEYS = ["TEST_X_POST_URL"];
const SAFE_RESULT_KEYS = new Set(["accountName", "username", "userNumericId", "postId", "postUrl", "createdAt", "text", "mediaUrls"]);

export function getEnvPresence(env = process.env) {
  return {
    TEST_X_POST_URL: Boolean(env.TEST_X_POST_URL)
  };
}

export function formatEnvPresence(presence) {
  return [
    "tests are not run by this script",
    `env presence: TEST_X_POST_URL=${presence.TEST_X_POST_URL ? "set" : "missing"}`
  ];
}

export function getTopLevelKeys(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }

  return Object.keys(payload).filter((key) => SAFE_RESULT_KEYS.has(key)).sort();
}

export function formatResult(statusCode, payload) {
  return [`HTTP status: ${statusCode}`, `JSON top-level keys: ${getTopLevelKeys(payload).join(",")}`];
}

export function formatError(statusCode, payload) {
  const errorKind =
    payload && typeof payload.code === "string" && payload.code !== "missing_token"
      ? payload.code
      : `http_${statusCode}`;
  return [`HTTP status: ${statusCode}`, `error kind/status: ${errorKind}`];
}

async function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function main() {
  const presence = getEnvPresence();
  for (const line of formatEnvPresence(presence)) {
    console.log(line);
  }

  if (REQUIRED_KEYS.some((key) => !presence[key])) {
    console.log("manual oEmbed check: skipped");
    return;
  }

  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const { port } = server.address();
    const response = await postJson(`http://127.0.0.1:${port}/api/extract`, {
      url: process.env.TEST_X_POST_URL
    });
    const payload = await response.json().catch(() => ({}));
    const lines = response.ok ? formatResult(response.status, payload) : formatError(response.status, payload);

    for (const line of lines) {
      console.log(line);
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(() => {
    console.log("error kind/status: manual_check_failed");
    process.exitCode = 1;
  });
}
