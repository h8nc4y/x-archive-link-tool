import test from "node:test";
import assert from "node:assert/strict";
import { extractPostWithCache } from "./extractService.js";
import { buildPostCacheKey, createMemoryPostCache, DEFAULT_CACHE_TTL_MS } from "./postCache.js";
import { XApiV2ClientError } from "./xApiV2Client.js";

const parsedUrl = {
  username: "source_user",
  postId: "123",
  canonicalUrl: "https://x.com/source_user/status/123"
};

const EXPECTED_DEGRADED_FALLBACK_CACHE_TTL_MS = 60 * 60 * 1000;

function createRecordingCache() {
  const sets = [];

  return {
    sets,
    async get() {
      return null;
    },
    async set(key, post, metadata) {
      sets.push({ key, post, metadata });
    }
  };
}

function providerPost(overrides = {}) {
  return {
    id: "123",
    canonicalUrl: "https://x.com/i/web/status/123",
    authorName: "Example",
    username: "example",
    userNumericId: "42",
    createdAt: "2026-05-10T00:00:00.000Z",
    text: "fixture text",
    expandedUrls: [],
    media: [],
    mediaUrls: [],
    source: "x-api-v2",
    warnings: [],
    ...overrides
  };
}

test("cache hit does not call X API provider", async () => {
  const cache = createMemoryPostCache({ now: () => 0 });
  await cache.set(buildPostCacheKey("123"), providerPost(), {
    fetchedAt: "2026-05-10T00:00:00.000Z",
    expiresAt: "2026-06-09T00:00:00.000Z"
  });
  let calls = 0;

  const result = await extractPostWithCache(parsedUrl, {
    env: { X_BEARER_TOKEN: "token" },
    cache,
    xApiProvider: async () => {
      calls += 1;
      return providerPost();
    }
  });

  assert.equal(calls, 0);
  assert.equal(result.source, "cache");
  assert.equal(result.cached, true);
});

test("legacy unversioned cache entry is ignored after long-form text support", async () => {
  const cache = createMemoryPostCache({ now: () => 0 });
  await cache.set("123", providerPost({ text: "shortened preview https://t.co/example" }), {
    fetchedAt: "2026-05-10T00:00:00.000Z",
    expiresAt: "2026-06-09T00:00:00.000Z"
  });
  let calls = 0;

  const result = await extractPostWithCache(parsedUrl, {
    env: { X_BEARER_TOKEN: "token" },
    cache,
    xApiProvider: async () => {
      calls += 1;
      return providerPost({
        text: "full long-form body line 1\nfull long-form body line 2",
        mediaUrls: ["https://pbs.twimg.com/media/one.jpg"]
      });
    }
  });

  assert.equal(calls, 1);
  assert.equal(result.source, "x-api-v2");
  assert.equal(result.cached, false);
  assert.equal(result.text, "full long-form body line 1\nfull long-form body line 2");
  assert.equal(result.text.includes("https://t.co/example"), false);
  assert.deepEqual(result.mediaUrls, ["https://pbs.twimg.com/media/one.jpg"]);
});

test("cache miss calls X API provider once and stores result", async () => {
  const cache = createMemoryPostCache({ now: () => 0 });
  let calls = 0;

  const first = await extractPostWithCache(parsedUrl, {
    env: { X_BEARER_TOKEN: "token" },
    cache,
    xApiProvider: async () => {
      calls += 1;
      return providerPost({ mediaUrls: ["https://pbs.twimg.com/media/one.jpg"] });
    }
  });
  const second = await extractPostWithCache(parsedUrl, {
    env: { X_BEARER_TOKEN: "token" },
    cache,
    xApiProvider: async () => {
      calls += 1;
      return providerPost();
    }
  });

  assert.equal(calls, 1);
  assert.equal(first.source, "x-api-v2");
  assert.equal(first.cached, false);
  assert.equal(second.source, "cache");
  assert.deepEqual(second.mediaUrls, ["https://pbs.twimg.com/media/one.jpg"]);
});

test("X API success stores normal result with default cache TTL", async () => {
  const cache = createRecordingCache();

  const result = await extractPostWithCache(parsedUrl, {
    env: { X_BEARER_TOKEN: "test-token" },
    cache,
    now: () => 0,
    xApiProvider: async () => providerPost({ mediaUrls: ["https://pbs.twimg.com/media/one.jpg"] })
  });

  assert.equal(result.source, "x-api-v2");
  assert.equal(result.cached, false);
  assert.equal(cache.sets.length, 1);
  assert.equal(cache.sets[0].metadata.ttlMs, DEFAULT_CACHE_TTL_MS);
  assert.equal(cache.sets[0].metadata.expiresAt, "1970-01-31T00:00:00.000Z");
  assert.equal(result.cacheExpiresAt, "1970-01-31T00:00:00.000Z");
  assert.equal(JSON.stringify(result).includes("test-token"), false);
});

test("missing X_BEARER_TOKEN uses oEmbed fallback and caches result", async () => {
  const cache = createMemoryPostCache({ now: () => 0 });
  let oembedCalls = 0;

  const result = await extractPostWithCache(parsedUrl, {
    env: {},
    cache,
    oEmbedProvider: async () => {
      oembedCalls += 1;
      return {
        accountName: "oEmbed User",
        username: "source_user",
        userNumericId: "未取得",
        postId: "123",
        postUrl: "https://x.com/source_user/status/123",
        createdAt: "未取得",
        text: "未取得",
        mediaUrls: []
      };
    }
  });

  assert.equal(oembedCalls, 1);
  assert.equal(result.source, "oembed");
  assert.equal(result.authorName, "oEmbed User");
  assert.deepEqual(result.mediaUrls, []);
  assert.equal(result.warnings.includes("公式API未使用のため画像URLを取得できない場合があります。"), true);
});

test("missing X_BEARER_TOKEN oEmbed primary stores normal result with default cache TTL", async () => {
  const cache = createRecordingCache();

  const result = await extractPostWithCache(parsedUrl, {
    env: {},
    cache,
    now: () => 0,
    oEmbedProvider: async () => ({
      accountName: "oEmbed User",
      username: "source_user",
      userNumericId: "未取得",
      postId: "123",
      postUrl: "https://x.com/source_user/status/123",
      createdAt: "未取得",
      text: "未取得",
      mediaUrls: []
    })
  });

  assert.equal(result.source, "oembed");
  assert.equal(result.cached, false);
  assert.equal(cache.sets.length, 1);
  assert.equal(cache.sets[0].metadata.ttlMs, DEFAULT_CACHE_TTL_MS);
  assert.equal(cache.sets[0].metadata.expiresAt, "1970-01-31T00:00:00.000Z");
  assert.equal(result.cacheExpiresAt, "1970-01-31T00:00:00.000Z");
});

test("API failure returns stale cache with warning", async () => {
  const cache = createMemoryPostCache({ now: () => 2_000 });
  await cache.set(buildPostCacheKey("123"), providerPost(), {
    ttlMs: 1,
    fetchedAt: "1970-01-01T00:00:00.000Z",
    expiresAt: "1970-01-01T00:00:00.001Z"
  });

  const result = await extractPostWithCache(parsedUrl, {
    env: { X_BEARER_TOKEN: "token" },
    cache,
    xApiProvider: async () => {
      throw new Error("upstream failed");
    }
  });

  assert.equal(result.source, "stale-cache");
  assert.equal(result.cached, true);
  assert.equal(result.warnings.includes("最新取得に失敗したため期限切れキャッシュを返しました。"), true);
});

test("X API failure without stale cache falls back to oEmbed without leaking token", async () => {
  const result = await extractPostWithCache(parsedUrl, {
    env: { X_BEARER_TOKEN: "secret-token" },
    cache: createMemoryPostCache(),
    xApiProvider: async () => {
      throw new Error("x api failed");
    },
    oEmbedProvider: async () => ({
      accountName: "Fallback User",
      username: "source_user",
      userNumericId: "未取得",
      postId: "123",
      postUrl: "https://x.com/source_user/status/123",
      createdAt: "未取得",
      text: "未取得",
      mediaUrls: []
    })
  });

  assert.equal(result.source, "oembed");
  assert.equal(result.cached, false);
  assert.equal(result.authorName, "Fallback User");
  assert.equal(result.warnings.includes("X API provider failed; used oEmbed fallback."), true);
  assert.equal(JSON.stringify(result).includes("secret-token"), false);
});

test("X API failure oEmbed fallback stores degraded result with short TTL", async () => {
  const cache = createRecordingCache();

  const result = await extractPostWithCache(parsedUrl, {
    env: { X_BEARER_TOKEN: "test-token" },
    cache,
    now: () => 0,
    xApiProvider: async () => {
      throw new Error("x api failed");
    },
    oEmbedProvider: async () => ({
      accountName: "Fallback User",
      username: "source_user",
      userNumericId: "未取得",
      postId: "123",
      postUrl: "https://x.com/source_user/status/123",
      createdAt: "未取得",
      text: "未取得",
      mediaUrls: []
    })
  });

  assert.equal(result.source, "oembed");
  assert.equal(result.cached, false);
  assert.equal(cache.sets.length, 1);
  assert.equal(cache.sets[0].metadata.ttlMs, EXPECTED_DEGRADED_FALLBACK_CACHE_TTL_MS);
  assert.equal(cache.sets[0].metadata.expiresAt, "1970-01-01T01:00:00.000Z");
  assert.equal(result.cacheExpiresAt, "1970-01-01T01:00:00.000Z");
  assert.equal(JSON.stringify(result).includes("test-token"), false);
  assert.equal(JSON.stringify(cache.sets).includes("test-token"), false);
});

for (const status of [401, 403, 429]) {
  test(`X API ${status} failure falls back with safe status warning`, async () => {
    const result = await extractPostWithCache(parsedUrl, {
      env: { X_BEARER_TOKEN: "secret-token" },
      cache: createMemoryPostCache(),
      xApiProvider: async () => {
        throw new XApiV2ClientError("safe upstream failure", `x_api_${status}`, 502, status);
      },
      oEmbedProvider: async () => ({
        accountName: "Fallback User",
        username: "source_user",
        userNumericId: "未取得",
        postId: "123",
        postUrl: "https://x.com/source_user/status/123",
        createdAt: "未取得",
        text: "未取得",
        mediaUrls: []
      })
    });

    assert.equal(result.source, "oembed");
    assert.equal(result.cached, false);
    assert.equal(result.warnings.includes(`X API provider failed with status ${status}; used oEmbed fallback.`), true);
    assert.equal(JSON.stringify(result).includes("secret-token"), false);
    assert.equal(JSON.stringify(result).includes("Authorization"), false);
  });
}

test("X API 402 failure falls back with safe status warning", async () => {
  const result = await extractPostWithCache(parsedUrl, {
    env: { X_BEARER_TOKEN: "secret-token" },
    cache: createMemoryPostCache(),
    xApiProvider: async () => {
      throw new XApiV2ClientError("payment required", "x_api_402", 402, 402);
    },
    oEmbedProvider: async () => ({
      accountName: "Fallback User",
      username: "source_user",
      userNumericId: "未取得",
      postId: "123",
      postUrl: "https://x.com/source_user/status/123",
      createdAt: "未取得",
      text: "未取得",
      mediaUrls: []
    })
  });

  assert.equal(result.source, "oembed");
  assert.equal(result.warnings.includes("X API provider failed with status 402; used oEmbed fallback."), true);
  assert.equal(JSON.stringify(result).includes("secret-token"), false);
});

test("token value is never included in response", async () => {
  const result = await extractPostWithCache(parsedUrl, {
    env: { X_BEARER_TOKEN: "secret-token" },
    cache: createMemoryPostCache(),
    xApiProvider: async () => providerPost()
  });

  assert.equal(JSON.stringify(result).includes("secret-token"), false);
});
