const X_API_TWEET_URL = "https://api.x.com/2/tweets/";

export class XApiV2ClientError extends Error {
  constructor(message, code, statusCode, responseStatusCode, { errorType, rateLimitReset } = {}) {
    super(message);
    this.name = "XApiV2ClientError";
    this.code = code;
    this.statusCode = statusCode;
    this.responseStatusCode = responseStatusCode;
    this.errorType = errorType;
    this.rateLimitReset = rateLimitReset;
  }
}

function buildTweetUrl(postId) {
  const url = new URL(`${X_API_TWEET_URL}${postId}`);
  url.searchParams.set("expansions", "attachments.media_keys,author_id");
  url.searchParams.set("media.fields", "url,preview_image_url,variants,type,width,height,alt_text,duration_ms");
  url.searchParams.set("tweet.fields", "created_at,entities,attachments");
  url.searchParams.set("user.fields", "username,name");
  return url;
}

function readRateLimitReset(response) {
  const value = response?.headers?.get?.("x-rate-limit-reset");
  return /^[0-9]+$/.test(String(value || "")) ? value : undefined;
}

function mapXApiError(response) {
  const status = response.status;
  const diagnostics = {
    rateLimitReset: readRateLimitReset(response)
  };

  if (status === 401) {
    return new XApiV2ClientError("X API authentication failed.", "x_api_401", 502, status, {
      ...diagnostics,
      errorType: "unauthorized"
    });
  }

  if (status === 402) {
    return new XApiV2ClientError("X API payment or credits are required.", "x_api_402", 402, status, {
      ...diagnostics,
      errorType: "payment_required"
    });
  }

  if (status === 403) {
    return new XApiV2ClientError("X API access was denied.", "x_api_403", 502, status, {
      ...diagnostics,
      errorType: "forbidden"
    });
  }

  if (status === 404) {
    return new XApiV2ClientError("X API post was not found.", "x_api_404", 404, status, {
      ...diagnostics,
      errorType: "not_found"
    });
  }

  if (status === 429) {
    return new XApiV2ClientError("X API rate limit exceeded.", "x_api_429", 429, status, {
      ...diagnostics,
      errorType: "rate_limited"
    });
  }

  if (status >= 500) {
    return new XApiV2ClientError("X API upstream error.", "x_api_5xx", 502, status, {
      ...diagnostics,
      errorType: "upstream_error"
    });
  }

  return new XApiV2ClientError("X API request failed.", "x_api_error", 502, status, {
    ...diagnostics,
    errorType: "request_failed"
  });
}

function buildCanonicalUrl(postId, username) {
  return username ? `https://x.com/${username}/status/${postId}` : `https://x.com/i/web/status/${postId}`;
}

function getBestVideoUrl(variants = []) {
  return variants
    .filter((variant) => variant?.content_type === "video/mp4" && typeof variant.url === "string")
    .sort((a, b) => (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0))[0]?.url;
}

function normalizeMedia(mediaItem, warnings) {
  const media = {
    mediaKey: mediaItem.media_key,
    type: mediaItem.type,
    url: typeof mediaItem.url === "string" ? mediaItem.url : undefined,
    previewImageUrl: typeof mediaItem.preview_image_url === "string" ? mediaItem.preview_image_url : undefined,
    width: mediaItem.width,
    height: mediaItem.height,
    altText: mediaItem.alt_text,
    durationMs: mediaItem.duration_ms
  };

  if (Array.isArray(mediaItem.variants)) {
    media.variants = mediaItem.variants
      .filter((variant) => typeof variant?.url === "string")
      .map((variant) => ({
        url: variant.url,
        contentType: variant.content_type,
        bitrate: variant.bitrate
      }));
  }

  if (mediaItem.type === "photo" && typeof mediaItem.url === "string") {
    return { media, mediaUrl: mediaItem.url };
  }

  if (mediaItem.type === "video" || mediaItem.type === "animated_gif") {
    const bestVideoUrl = getBestVideoUrl(mediaItem.variants);
    if (bestVideoUrl) {
      return { media, mediaUrl: bestVideoUrl };
    }
  }

  if (mediaItem.type && !media.url && !media.previewImageUrl) {
    warnings.push("media_direct_url_unavailable");
  }

  return { media, mediaUrl: null };
}

function normalizeExpandedUrls(urls = []) {
  return urls.map((item) => ({
    url: item.url,
    expandedUrl: item.expanded_url,
    unwoundUrl: item.unwound_url,
    displayUrl: item.display_url
  }));
}

export function normalizeXApiV2Response(payload, parsedUrl) {
  const tweet = payload?.data || {};
  const users = Array.isArray(payload?.includes?.users) ? payload.includes.users : [];
  const mediaItems = Array.isArray(payload?.includes?.media) ? payload.includes.media : [];
  const author = users.find((user) => user.id === tweet.author_id) || {};
  const username = typeof author.username === "string" ? author.username : parsedUrl.username;
  const mediaByKey = new Map(mediaItems.map((item) => [item.media_key, item]));
  const mediaKeys = Array.isArray(tweet?.attachments?.media_keys) ? tweet.attachments.media_keys : [];
  const warnings = [];
  const media = [];
  const mediaUrls = [];

  for (const mediaKey of mediaKeys) {
    const mediaItem = mediaByKey.get(mediaKey);
    if (!mediaItem) {
      warnings.push("media_metadata_missing");
      continue;
    }

    const normalized = normalizeMedia(mediaItem, warnings);
    media.push(normalized.media);
    if (normalized.mediaUrl && !mediaUrls.includes(normalized.mediaUrl)) {
      mediaUrls.push(normalized.mediaUrl);
    }
  }

  if (mediaKeys.length > 0 && mediaUrls.length === 0) {
    warnings.push("media_urls_unavailable");
  }

  return {
    id: String(tweet.id || parsedUrl.postId),
    canonicalUrl: buildCanonicalUrl(tweet.id || parsedUrl.postId, username),
    authorName: typeof author.name === "string" ? author.name : "未取得",
    username,
    userNumericId: typeof author.id === "string" ? author.id : "未取得",
    createdAt: typeof tweet.created_at === "string" ? tweet.created_at : "未取得",
    text: typeof tweet.text === "string" ? tweet.text : "未取得",
    expandedUrls: normalizeExpandedUrls(tweet?.entities?.urls || []),
    media,
    mediaUrls,
    source: "x-api-v2",
    warnings
  };
}

export async function fetchXPostFromApi(parsedUrl, { bearerToken, fetchFn = globalThis.fetch } = {}) {
  if (!bearerToken) {
    throw new XApiV2ClientError("X API bearer token is not configured.", "missing_x_bearer_token", 500);
  }

  if (typeof fetchFn !== "function") {
    throw new XApiV2ClientError("Fetch function is not available.", "missing_fetch", 500);
  }

  const response = await fetchFn(buildTweetUrl(parsedUrl.postId), {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${bearerToken}`
    }
  });

  if (!response.ok) {
    throw mapXApiError(response);
  }

  return normalizeXApiV2Response(await response.json(), parsedUrl);
}
