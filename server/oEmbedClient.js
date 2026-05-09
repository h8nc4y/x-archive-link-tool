const OEMBED_URL = "https://publish.x.com/oembed";

export class OEmbedClientError extends Error {
  constructor(message, code, statusCode, responseStatusCode) {
    super(message);
    this.name = "OEmbedClientError";
    this.code = code;
    this.statusCode = statusCode;
    this.responseStatusCode = responseStatusCode;
  }
}

function buildOEmbedUrl(postUrl) {
  const url = new URL(OEMBED_URL);
  url.searchParams.set("url", postUrl);
  url.searchParams.set("omit_script", "1");
  url.searchParams.set("dnt", "true");
  return url;
}

function mapOEmbedError(status) {
  if (status === 404) {
    return new OEmbedClientError("oEmbed post was not found.", "oembed_404", 404, status);
  }

  if (status === 429) {
    return new OEmbedClientError("oEmbed rate limit exceeded.", "oembed_429", 429, status);
  }

  if (status >= 500) {
    return new OEmbedClientError("oEmbed upstream error.", "oembed_5xx", 502, status);
  }

  return new OEmbedClientError("oEmbed request failed.", "oembed_error", 502, status);
}

export function normalizeOEmbedResponse(oembedResponse, parsedUrl) {
  const html = typeof oembedResponse?.html === "string" ? oembedResponse.html : "";

  return {
    accountName: typeof oembedResponse?.author_name === "string" ? oembedResponse.author_name : "未取得",
    username: parsedUrl.username,
    userNumericId: "未取得",
    postId: parsedUrl.postId,
    postUrl: parsedUrl.canonicalUrl,
    createdAt: extractPostDate(html, parsedUrl.postId),
    text: extractPostText(html),
    mediaUrls: []
  };
}

export function extractPostText(html) {
  const match = String(html || "").match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!match) {
    return "未取得";
  }

  return htmlToPlainText(match[1]);
}

export function extractPostDate(html, postId) {
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(String(html || ""))) !== null) {
    if (match[1].includes(`/status/${postId}`)) {
      return htmlToPlainText(match[2]);
    }
  }

  return "未取得";
}

function htmlToPlainText(html) {
  const text = String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  return text || "未取得";
}

export async function fetchXPost(parsedUrl, { fetchFn = globalThis.fetch } = {}) {
  if (typeof fetchFn !== "function") {
    throw new OEmbedClientError("Fetch function is not available.", "missing_fetch", 500);
  }

  const response = await fetchFn(buildOEmbedUrl(parsedUrl.canonicalUrl), {
    method: "GET",
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw mapOEmbedError(response.status);
  }

  return normalizeOEmbedResponse(await response.json(), parsedUrl);
}
