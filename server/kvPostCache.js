import { DEFAULT_CACHE_TTL_MS } from "./postCache.js";

const KV_KEY_PREFIX = "post:";

export function getKvPostCacheKey(postId) {
  return `${KV_KEY_PREFIX}${String(postId)}`;
}

function cloneObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function parseCachePayload(raw) {
  if (!raw) {
    return null;
  }

  if (typeof raw === "object") {
    return raw;
  }

  if (typeof raw !== "string") {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function createKvPostCache(kv, { now = Date.now, ttlMs = DEFAULT_CACHE_TTL_MS } = {}) {
  if (!kv || typeof kv.get !== "function" || typeof kv.put !== "function") {
    throw new TypeError("Cloudflare KV binding with get and put is required.");
  }

  return {
    async get(postId, { allowStale = false } = {}) {
      const payload = parseCachePayload(await kv.get(getKvPostCacheKey(postId)));
      if (!payload || !payload.post || !payload.metadata) {
        return null;
      }

      const metadata = cloneObject(payload.metadata);
      const expiresAt = Date.parse(metadata.cacheExpiresAt);
      if (!Number.isFinite(expiresAt)) {
        return null;
      }

      if (!allowStale && expiresAt <= now()) {
        return null;
      }

      return {
        post: cloneObject(payload.post),
        metadata,
        expiresAt
      };
    },

    async set(postId, post, metadata = {}) {
      const ttl = Number.isFinite(metadata.ttlMs) ? metadata.ttlMs : ttlMs;
      const fetchedAt = metadata.fetchedAt || new Date(now()).toISOString();
      const cacheExpiresAt = metadata.expiresAt || metadata.cacheExpiresAt || new Date(now() + ttl).toISOString();
      const expirationTtl = Math.max(1, Math.ceil(ttl / 1000));
      const payload = JSON.stringify({
        post: cloneObject(post),
        metadata: {
          ...metadata,
          fetchedAt,
          cacheExpiresAt
        }
      });

      await kv.put(getKvPostCacheKey(postId), payload, { expirationTtl });
    }
  };
}
