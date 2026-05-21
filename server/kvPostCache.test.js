import test from "node:test";
import assert from "node:assert/strict";
import { createKvPostCache, getKvPostCacheKey } from "./kvPostCache.js";
import { buildPostCacheKey } from "./postCache.js";

function createMockKv() {
  const values = new Map();
  return {
    values,
    lastPut: null,
    async get(key) {
      return values.get(key) || null;
    },
    async put(key, value, options) {
      this.lastPut = { key, value, options };
      values.set(key, value);
    }
  };
}

const post = {
  id: "123",
  canonicalUrl: "https://x.com/i/web/status/123",
  authorName: "Example",
  username: "example",
  userNumericId: "42",
  createdAt: "2026-05-10T00:00:00.000Z",
  text: "fixture text",
  expandedUrls: [],
  media: [],
  mediaUrls: ["https://pbs.twimg.com/media/one.jpg"],
  source: "x-api-v2",
  cached: false,
  fetchedAt: "2026-05-10T00:00:00.000Z",
  cacheExpiresAt: "2026-06-09T00:00:00.000Z",
  warnings: []
};

test("KV post cache stores by normalized postId key with expiration TTL", async () => {
  const kv = createMockKv();
  const cache = createKvPostCache(kv, { now: () => 0, ttlMs: 30 * 24 * 60 * 60 * 1000 });

  const cacheKey = buildPostCacheKey("123");
  await cache.set(cacheKey, post, {
    ttlMs: 30 * 24 * 60 * 60 * 1000,
    fetchedAt: post.fetchedAt,
    expiresAt: post.cacheExpiresAt
  });
  const entry = await cache.get(cacheKey);

  assert.equal(kv.lastPut.key, `post:${cacheKey}`);
  assert.equal(kv.lastPut.options.expirationTtl, 30 * 24 * 60 * 60);
  assert.equal(getKvPostCacheKey(cacheKey), `post:${cacheKey}`);
  assert.deepEqual(entry.post.mediaUrls, ["https://pbs.twimg.com/media/one.jpg"]);
  assert.equal(entry.metadata.fetchedAt, post.fetchedAt);
});

test("KV post cache misses legacy unversioned keys", async () => {
  const kv = createMockKv();
  const cache = createKvPostCache(kv, { now: () => 0 });
  kv.values.set(
    "post:123",
    JSON.stringify({
      post,
      metadata: { fetchedAt: post.fetchedAt, cacheExpiresAt: post.cacheExpiresAt }
    })
  );

  assert.equal(await cache.get(buildPostCacheKey("123")), null);
});

test("KV post cache treats malformed payload as cache miss", async () => {
  const kv = createMockKv();
  kv.values.set(getKvPostCacheKey(buildPostCacheKey("123")), "{not-json");
  const cache = createKvPostCache(kv, { now: () => 0 });

  assert.equal(await cache.get(buildPostCacheKey("123")), null);
});

test("KV post cache treats expired payload as miss unless stale is allowed", async () => {
  const kv = createMockKv();
  const cache = createKvPostCache(kv, { now: () => 2_000 });
  const cacheKey = buildPostCacheKey("123");
  await cache.set(cacheKey, post, {
    ttlMs: 1,
    fetchedAt: "1970-01-01T00:00:00.000Z",
    expiresAt: "1970-01-01T00:00:00.001Z"
  });

  assert.equal(await cache.get(cacheKey), null);
  assert.notEqual(await cache.get(cacheKey, { allowStale: true }), null);
});
