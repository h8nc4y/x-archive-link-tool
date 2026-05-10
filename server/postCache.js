export const DEFAULT_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function createMemoryPostCache({ now = Date.now } = {}) {
  const entries = new Map();

  return {
    async get(postId, { allowStale = false } = {}) {
      const entry = entries.get(String(postId));
      if (!entry) {
        return null;
      }

      if (!allowStale && entry.expiresAt <= now()) {
        return null;
      }

      return {
        post: { ...entry.post },
        metadata: { ...entry.metadata },
        expiresAt: entry.expiresAt
      };
    },

    async set(postId, post, metadata = {}) {
      const ttlMs = Number.isFinite(metadata.ttlMs) ? metadata.ttlMs : DEFAULT_CACHE_TTL_MS;
      const fetchedAt = metadata.fetchedAt || new Date(now()).toISOString();
      const expiresAt = metadata.expiresAt || new Date(now() + ttlMs).toISOString();
      entries.set(String(postId), {
        post: { ...post },
        metadata: {
          ...metadata,
          fetchedAt,
          cacheExpiresAt: expiresAt
        },
        expiresAt: Date.parse(expiresAt)
      });
    }
  };
}
