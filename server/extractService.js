import { fetchXPost as fetchOEmbedPost } from "./oEmbedClient.js";
import { fetchXPostFromApi } from "./xApiV2Client.js";
import { buildPostCacheKey, createMemoryPostCache, DEFAULT_CACHE_TTL_MS, POST_EXTRACT_CACHE_VERSION } from "./postCache.js";

const OEMBED_MEDIA_WARNING = "公式API未使用のため画像URLを取得できない場合があります。";
const STALE_CACHE_WARNING = "最新取得に失敗したため期限切れキャッシュを返しました。";
const X_API_FALLBACK_WARNING = "X API provider failed; used oEmbed fallback.";
const DEGRADED_OEMBED_FALLBACK_CACHE_TTL_MS = 60 * 60 * 1000;

function getXApiFallbackWarning(error) {
  if (Number.isInteger(error?.responseStatusCode)) {
    return `X API provider failed with status ${error.responseStatusCode}; used oEmbed fallback.`;
  }

  return X_API_FALLBACK_WARNING;
}

function nowIso(now) {
  return new Date(now()).toISOString();
}

function expiresAtIso(fetchedAt, ttlMs) {
  return new Date(Date.parse(fetchedAt) + ttlMs).toISOString();
}

function addLegacyFields(post) {
  return {
    ...post,
    accountName: post.accountName || post.authorName || "未取得",
    postId: post.postId || post.id,
    postUrl: post.postUrl || post.canonicalUrl
  };
}

function normalizeProviderPost(post, parsedUrl, { source, fetchedAt, ttlMs, cached = false, warnings = [] }) {
  const id = String(post.id || post.postId || parsedUrl.postId);
  const canonicalUrl = post.canonicalUrl || post.postUrl || parsedUrl.canonicalUrl;
  const mergedWarnings = [...new Set([...(post.warnings || []), ...warnings])];

  return addLegacyFields({
    id,
    canonicalUrl,
    authorName: post.authorName || post.accountName || "未取得",
    username: post.username || parsedUrl.username,
    userNumericId: post.userNumericId || "未取得",
    createdAt: post.createdAt || "未取得",
    text: post.text || "未取得",
    expandedUrls: Array.isArray(post.expandedUrls) ? post.expandedUrls : [],
    media: Array.isArray(post.media) ? post.media : [],
    mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
    source,
    cached,
    fetchedAt,
    cacheExpiresAt: expiresAtIso(fetchedAt, ttlMs),
    warnings: mergedWarnings
  });
}

function fromCached(entry, source) {
  return addLegacyFields({
    ...entry.post,
    source,
    cached: true,
    fetchedAt: entry.metadata.fetchedAt,
    cacheExpiresAt: entry.metadata.cacheExpiresAt
  });
}

async function cachePost(cache, postId, post, ttlMs) {
  await cache.set(buildPostCacheKey(postId), post, {
    cacheVersion: POST_EXTRACT_CACHE_VERSION,
    ttlMs,
    fetchedAt: post.fetchedAt,
    expiresAt: post.cacheExpiresAt
  });
}

async function getCachedPost(cache, postId, options) {
  try {
    return await cache.get(buildPostCacheKey(postId), options);
  } catch {
    return null;
  }
}

async function setCachedPost(cache, postId, post, ttlMs) {
  try {
    await cachePost(cache, postId, post, ttlMs);
  } catch {
    // Cache is an optimization layer; origin success must not fail the request.
  }
}

export async function extractPostWithCache(
  parsedUrl,
  {
    env = process.env,
    cache,
    now = Date.now,
    ttlMs = DEFAULT_CACHE_TTL_MS,
    xApiProvider = fetchXPostFromApi,
    oEmbedProvider = fetchOEmbedPost
  } = {}
) {
  const postCache = cache || createMemoryPostCache({ now });
  const cached = await getCachedPost(postCache, parsedUrl.postId);
  if (cached) {
    return fromCached(cached, "cache");
  }

  const token = typeof env.X_BEARER_TOKEN === "string" ? env.X_BEARER_TOKEN.trim() : "";
  const fetchedAt = nowIso(now);

  try {
    const providerPost = token
      ? await xApiProvider(parsedUrl, { bearerToken: token })
      : await oEmbedProvider(parsedUrl);
    const source = token ? "x-api-v2" : "oembed";
    const warnings = token ? [] : [OEMBED_MEDIA_WARNING];
    const normalized = normalizeProviderPost(providerPost, parsedUrl, {
      source,
      fetchedAt,
      ttlMs,
      warnings
    });
    await setCachedPost(postCache, parsedUrl.postId, normalized, ttlMs);
    return normalized;
  } catch (error) {
    const stale = await getCachedPost(postCache, parsedUrl.postId, { allowStale: true });
    if (stale) {
      const stalePost = fromCached(stale, "stale-cache");
      stalePost.warnings = [...new Set([...(stalePost.warnings || []), STALE_CACHE_WARNING])];
      return stalePost;
    }

    if (token) {
      const fallbackPost = await oEmbedProvider(parsedUrl);
      const fallbackTtlMs = DEGRADED_OEMBED_FALLBACK_CACHE_TTL_MS;
      const normalized = normalizeProviderPost(fallbackPost, parsedUrl, {
        source: "oembed",
        fetchedAt,
        ttlMs: fallbackTtlMs,
        warnings: [OEMBED_MEDIA_WARNING, getXApiFallbackWarning(error)]
      });
      await setCachedPost(postCache, parsedUrl.postId, normalized, fallbackTtlMs);
      return normalized;
    }

    throw error;
  }
}

export function createExtractPost(options = {}) {
  const cache = options.cache || createMemoryPostCache({ now: options.now });
  return (parsedUrl) => extractPostWithCache(parsedUrl, { ...options, cache });
}
