import test from "node:test";
import assert from "node:assert/strict";
import { handleExtractRequest } from "./extract.js";
import { extractPostWithCache } from "../../server/extractService.js";
import { createMemoryPostCache } from "../../server/postCache.js";
import { XApiV2ClientError } from "../../server/xApiV2Client.js";

function jsonRequest({ method = "POST", body = { url: "https://x.com/user/status/123" }, headers = {} } = {}) {
  const options = {
    method,
    headers: {
      "content-type": "application/json",
      ...headers
    }
  };

  if (method !== "GET" && method !== "HEAD") {
    options.body = JSON.stringify(body);
  }

  return new Request("https://example.pages.dev/api/extract", options);
}

async function readJson(response) {
  return JSON.parse(await response.text());
}

function assertSecurityHeaders(response) {
  assert.equal(
    response.headers.get("content-security-policy"),
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests"
  );
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
}

test("Cloudflare function POST /api/extract returns normalized response without token", async () => {
  const response = await handleExtractRequest(jsonRequest(), {
    env: {},
    rateLimiter: { check: () => ({ allowed: true }) },
    extractPost: async (parsed) => ({
      accountName: "Example User",
      username: parsed.username,
      userNumericId: "未取得",
      postId: parsed.postId,
      postUrl: parsed.canonicalUrl,
      createdAt: "未取得",
      text: "未取得",
      mediaUrls: []
    })
  });

  assert.equal(response.status, 200);
  assertSecurityHeaders(response);
  assert.deepEqual(await readJson(response), {
    accountName: "Example User",
    username: "user",
    userNumericId: "未取得",
    postId: "123",
    postUrl: "https://x.com/user/status/123",
    createdAt: "未取得",
    text: "未取得",
    mediaUrls: []
  });
});

test("Cloudflare function rejects unsupported method", async () => {
  const response = await handleExtractRequest(jsonRequest({ method: "GET", body: undefined }), {
    rateLimiter: { check: () => ({ allowed: true }) }
  });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
  assertSecurityHeaders(response);
});

test("Cloudflare function rejects invalid URL", async () => {
  const response = await handleExtractRequest(jsonRequest({ body: { url: "https://t.co/abc" } }), {
    rateLimiter: { check: () => ({ allowed: true }) }
  });

  assert.equal(response.status, 400);
  assert.equal((await readJson(response)).code, "invalid_host");
  assertSecurityHeaders(response);
});

test("Cloudflare function rejects oversized body", async () => {
  const response = await handleExtractRequest(
    jsonRequest({ body: { url: `https://x.com/${"a".repeat(1100)}/status/123` } }),
    { rateLimiter: { check: () => ({ allowed: true }) } }
  );

  assert.equal(response.status, 413);
  assertSecurityHeaders(response);
});

test("Cloudflare function rate limit returns 429", async () => {
  const response = await handleExtractRequest(jsonRequest(), {
    rateLimiter: { check: () => ({ allowed: false, retryAfterSeconds: 60 }) }
  });

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "60");
  assertSecurityHeaders(response);
});

test("Cloudflare function returns oEmbed fallback instead of 502 when X API provider fails", async () => {
  const response = await handleExtractRequest(jsonRequest(), {
    env: { X_BEARER_TOKEN: "secret-token" },
    rateLimiter: { check: () => ({ allowed: true }) },
    extractPost: (parsed) =>
      extractPostWithCache(parsed, {
        env: { X_BEARER_TOKEN: "secret-token" },
        cache: createMemoryPostCache(),
        xApiProvider: async () => {
          throw new Error("x api failed");
        },
        oEmbedProvider: async () => ({
          accountName: "Fallback User",
          username: "user",
          userNumericId: "未取得",
          postId: "123",
          postUrl: "https://x.com/user/status/123",
          createdAt: "未取得",
          text: "未取得",
          mediaUrls: []
        })
      })
  });
  const payload = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(payload.source, "oembed");
  assert.equal(payload.warnings.includes("X API provider failed; used oEmbed fallback."), true);
  assert.equal(JSON.stringify(payload).includes("secret-token"), false);
  assertSecurityHeaders(response);
});

test("Cloudflare function exposes only safe X API failure status in fallback warning", async () => {
  const response = await handleExtractRequest(jsonRequest(), {
    env: { X_BEARER_TOKEN: "secret-token" },
    rateLimiter: { check: () => ({ allowed: true }) },
    extractPost: (parsed) =>
      extractPostWithCache(parsed, {
        env: { X_BEARER_TOKEN: "secret-token" },
        cache: createMemoryPostCache(),
        xApiProvider: async () => {
          throw new XApiV2ClientError("safe upstream failure", "x_api_403", 502, 403);
        },
        oEmbedProvider: async () => ({
          accountName: "Fallback User",
          username: "user",
          userNumericId: "未取得",
          postId: "123",
          postUrl: "https://x.com/user/status/123",
          createdAt: "未取得",
          text: "未取得",
          mediaUrls: []
        })
      })
  });
  const payload = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(payload.source, "oembed");
  assert.equal(payload.warnings.includes("X API provider failed with status 403; used oEmbed fallback."), true);
  assert.equal(JSON.stringify(payload).includes("secret-token"), false);
  assert.equal(JSON.stringify(payload).includes("Authorization"), false);
  assertSecurityHeaders(response);
});
