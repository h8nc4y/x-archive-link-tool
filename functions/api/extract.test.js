import test from "node:test";
import assert from "node:assert/strict";
import { handleExtractRequest } from "./extract.js";
import { extractPostWithCache } from "../../server/extractService.js";
import { buildPostCacheKey, createMemoryPostCache } from "../../server/postCache.js";
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

test("Cloudflare function rejects invalid JSON", async () => {
  const response = await handleExtractRequest(
    new Request("https://example.pages.dev/api/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{"
    }),
    { rateLimiter: { check: () => ({ allowed: true }) } }
  );

  assert.equal(response.status, 400);
  assertSecurityHeaders(response);
});

test("Cloudflare function rejects unsupported content type", async () => {
  const response = await handleExtractRequest(
    jsonRequest({
      headers: { "content-type": "text/plain" },
      body: { url: "https://x.com/user/status/123" }
    }),
    { rateLimiter: { check: () => ({ allowed: true }) } }
  );

  assert.equal(response.status, 415);
  assertSecurityHeaders(response);
});

test("Cloudflare function accepts JSON content type with charset", async () => {
  const response = await handleExtractRequest(jsonRequest({ headers: { "content-type": "application/json; charset=utf-8" } }), {
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
});

test("Cloudflare function rejects unexpected request body shapes", async () => {
  let extractCalls = 0;
  const invalidBodies = [
    null,
    [],
    { url: "https://x.com/user/status/123", extra: true },
    { url: 123 }
  ];

  for (const body of invalidBodies) {
    const response = await handleExtractRequest(jsonRequest({ body }), {
      rateLimiter: { check: () => ({ allowed: true }) },
      extractPost: async () => {
        extractCalls += 1;
        throw new Error("extractPost should not run for invalid request bodies");
      }
    });

    assert.equal(response.status, 400);
    assert.equal((await readJson(response)).error, 'Request body must be { "url": "..." }.');
    assertSecurityHeaders(response);
  }

  assert.equal(extractCalls, 0);
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

test("Cloudflare function uses Cloudflare connecting IP for rate limiting", async () => {
  let checkedIp;
  const response = await handleExtractRequest(
    jsonRequest({
      headers: {
        "cf-connecting-ip": "203.0.113.10",
        "x-forwarded-for": "198.51.100.20"
      }
    }),
    {
      env: {},
      rateLimiter: {
        check(ip) {
          checkedIp = ip;
          return { allowed: true };
        }
      },
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
    }
  );

  assert.equal(response.status, 200);
  assert.equal(checkedIp, "203.0.113.10");
});

test("Cloudflare function uses forwarded IP when Cloudflare connecting IP is absent", async () => {
  let checkedIp;
  const response = await handleExtractRequest(
    jsonRequest({
      headers: {
        "x-forwarded-for": "198.51.100.20"
      }
    }),
    {
      env: {},
      rateLimiter: {
        check(ip) {
          checkedIp = ip;
          return { allowed: true };
        }
      },
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
    }
  );

  assert.equal(response.status, 200);
  assert.equal(checkedIp, "198.51.100.20");
});

test("Cloudflare function rate limit response does not include sensitive values", async () => {
  const response = await handleExtractRequest(jsonRequest(), {
    env: { X_BEARER_TOKEN: "not-a-real-token-value" },
    rateLimiter: { check: () => ({ allowed: false, retryAfterSeconds: 60 }) }
  });
  const serialized = JSON.stringify(await readJson(response));

  assert.equal(response.status, 429);
  assert.equal(serialized.includes("not-a-real-token-value"), false);
  assert.equal(serialized.includes("Authorization"), false);
  assert.equal(serialized.includes("https://x.com/user/status/123"), false);
  assert.equal(serialized.includes("mediaUrls"), false);
});

test("Cloudflare function writes only safe structured log fields", async () => {
  const logs = [];
  const response = await handleExtractRequest(jsonRequest(), {
    env: { X_BEARER_TOKEN: "secret-token" },
    logger: (entry) => logs.push(entry),
    now: () => 1000,
    rateLimiter: { check: () => ({ allowed: true }) },
    extractPost: async (parsed) => ({
      accountName: "Sensitive Name",
      username: parsed.username,
      userNumericId: "42",
      postId: parsed.postId,
      postUrl: parsed.canonicalUrl,
      createdAt: "未取得",
      text: "Sensitive body",
      mediaUrls: ["https://pbs.twimg.com/media/secret.jpg"]
    })
  });
  const serialized = JSON.stringify(logs);

  assert.equal(response.status, 200);
  assert.equal(logs.length, 1);
  assert.equal(typeof logs[0].request_id, "string");
  assert.equal(logs[0].method, "POST");
  assert.equal(logs[0].path, "/api/extract");
  assert.equal(logs[0].statusCode, 200);
  assert.equal(logs[0].durationMs, 0);
  assert.equal(serialized.includes("secret-token"), false);
  assert.equal(serialized.includes("Sensitive body"), false);
  assert.equal(serialized.includes("secret.jpg"), false);
  assert.equal(serialized.includes("user/status/123"), false);
  assert.equal(serialized.includes("Authorization"), false);
});

test("Cloudflare function logs safe error code", async () => {
  const logs = [];
  const response = await handleExtractRequest(jsonRequest({ body: { url: "https://t.co/abc" } }), {
    logger: (entry) => logs.push(entry),
    rateLimiter: { check: () => ({ allowed: true }) }
  });

  assert.equal(response.status, 400);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].errorCode, "invalid_host");
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
  assert.equal(kv.values.has(`post:${buildPostCacheKey("91001")}`), true);
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
  kv.values.set(`post:${buildPostCacheKey("91004")}`, "{not-json");
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
