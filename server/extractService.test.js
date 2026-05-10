import test from "node:test";
import assert from "node:assert/strict";
import { extractPostWithCache } from "./extractService.js";
import { createMemoryPostCache } from "./postCache.js";

const parsedUrl = {
  username: "source_user",
  postId: "123",
  canonicalUrl: "https://x.com/source_user/status/123"
};

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
  await cache.set("123", providerPost(), {
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

test("API failure returns stale cache with warning", async () => {
  const cache = createMemoryPostCache({ now: () => 2_000 });
  await cache.set("123", providerPost(), {
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

test("token value is never included in response", async () => {
  const result = await extractPostWithCache(parsedUrl, {
    env: { X_BEARER_TOKEN: "secret-token" },
    cache: createMemoryPostCache(),
    xApiProvider: async () => providerPost()
  });

  assert.equal(JSON.stringify(result).includes("secret-token"), false);
});
