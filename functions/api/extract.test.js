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

function providerPost(parsed, overrides = {}) {
  return {
    id: parsed.postId,
    canonicalUrl: `https://x.com/i/web/status/${parsed.postId}`,
    authorName: "Example",
    username: parsed.username,
    userNumericId: "42",
    createdAt: "2026-05-10T00:00:00.000Z",
    text: "fixture text",
    expandedUrls: [],
    media: [],
    mediaUrls: [],
    warnings: [],
    ...overrides
  };
}

function createMockKv({ failGet = false, failPut = false } = {}) {
  const values = new Map();
  return {
    values,
    async get(key) {
      if (failGet) {
        throw new Error("kv get failed");
      }
      return values.get(key) || null;
    },
    async put(key, value) {
      if (failPut) {
        throw new Error("kv put failed");
      }
      values.set(key, value);
    }
  };
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

test("Cloudflare function uses KV cache hit without calling X API provider again", async () => {
  const kv = createMockKv();
  const env = { X_BEARER_TOKEN: "secret-token", X_POST_CACHE: kv };
  const body = { url: "https://x.com/user/status/91001" };
  let xApiCalls = 0;

  const options = {
    env,
    rateLimiter: { check: () => ({ allowed: true }) },
    xApiProvider: async (parsed) => {
      xApiCalls += 1;
      return providerPost(parsed, { mediaUrls: ["https://pbs.twimg.com/media/one.jpg"] });
    }
  };
  const first = await handleExtractRequest(jsonRequest({ body }), options);
  const second = await handleExtractRequest(jsonRequest({ body }), options);
  const firstPayload = await readJson(first);
  const secondPayload = await readJson(second);

  assert.equal(first.status, 200);
  assert.equal(firstPayload.source, "x-api-v2");
  assert.equal(firstPayload.cached, false);
  assert.equal(second.status, 200);
  assert.equal(secondPayload.source, "cache");
  assert.equal(secondPayload.cached, true);
  assert.equal(xApiCalls, 1);
  assert.equal(kv.values.has("post:91001"), true);
  assert.equal(JSON.stringify(secondPayload).includes("secret-token"), false);
  assert.equal(JSON.stringify(secondPayload).includes("Authorization"), false);
});

test("Cloudflare function continues origin path when KV get fails without public warning", async () => {
  const env = { X_BEARER_TOKEN: "secret-token", X_POST_CACHE: createMockKv({ failGet: true }) };
  let xApiCalls = 0;
  const response = await handleExtractRequest(jsonRequest({ body: { url: "https://x.com/user/status/91002" } }), {
    env,
    rateLimiter: { check: () => ({ allowed: true }) },
    xApiProvider: async (parsed) => {
      xApiCalls += 1;
      return providerPost(parsed);
    }
  });
  const payload = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(payload.source, "x-api-v2");
  assert.equal(xApiCalls, 1);
  assert.deepEqual(payload.warnings, []);
});

test("Cloudflare function returns origin result when KV set fails without public warning", async () => {
  const env = { X_BEARER_TOKEN: "secret-token", X_POST_CACHE: createMockKv({ failPut: true }) };
  const response = await handleExtractRequest(jsonRequest({ body: { url: "https://x.com/user/status/91003" } }), {
    env,
    rateLimiter: { check: () => ({ allowed: true }) },
    xApiProvider: async (parsed) => providerPost(parsed)
  });
  const payload = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(payload.source, "x-api-v2");
  assert.equal(payload.cached, false);
  assert.deepEqual(payload.warnings, []);
});

test("Cloudflare function treats malformed KV payload as cache miss without public warning", async () => {
  const kv = createMockKv();
  kv.values.set("post:91004", "{not-json");
  const env = { X_BEARER_TOKEN: "secret-token", X_POST_CACHE: kv };
  let xApiCalls = 0;
  const response = await handleExtractRequest(jsonRequest({ body: { url: "https://x.com/user/status/91004" } }), {
    env,
    rateLimiter: { check: () => ({ allowed: true }) },
    xApiProvider: async (parsed) => {
      xApiCalls += 1;
      return providerPost(parsed);
    }
  });
  const payload = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(payload.source, "x-api-v2");
  assert.equal(xApiCalls, 1);
  assert.deepEqual(payload.warnings, []);
});

test("Cloudflare function keeps in-memory cache fallback when KV binding is missing", async () => {
  const env = { X_BEARER_TOKEN: "secret-token" };
  const body = { url: "https://x.com/user/status/91005" };
  let xApiCalls = 0;
  const options = {
    env,
    rateLimiter: { check: () => ({ allowed: true }) },
    xApiProvider: async (parsed) => {
      xApiCalls += 1;
      return providerPost(parsed);
    }
  };

  const first = await handleExtractRequest(jsonRequest({ body }), options);
  const second = await handleExtractRequest(jsonRequest({ body }), options);
  const firstPayload = await readJson(first);
  const secondPayload = await readJson(second);

  assert.equal(first.status, 200);
  assert.equal(firstPayload.source, "x-api-v2");
  assert.equal(second.status, 200);
  assert.equal(secondPayload.source, "cache");
  assert.equal(xApiCalls, 1);
});
