import { parseXPostUrl, XPostUrlValidationError } from "../../server/urlValidator.js";
import { OEmbedClientError } from "../../server/oEmbedClient.js";
import { extractPostWithCache } from "../../server/extractService.js";
import { createMemoryPostCache } from "../../server/postCache.js";
import { createKvPostCache } from "../../server/kvPostCache.js";
import { createRateLimiter } from "../../server/rateLimiter.js";
import { XApiV2ClientError } from "../../server/xApiV2Client.js";

const MAX_BODY_BYTES = 1024;
const SECURITY_HEADERS = {
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin"
};
const rateLimiters = new Map();
const postCaches = new Map();
const kvPostCaches = new WeakMap();

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function sendJson(status, payload, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "content-type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() || "unknown";
}

function writeSafeLog(logger, entry) {
  if (!logger) {
    return;
  }

  const safeEntry = {
    request_id: entry.request_id,
    method: entry.method,
    path: entry.path,
    statusCode: entry.statusCode,
    durationMs: entry.durationMs,
    errorCode: entry.errorCode
  };

  if (typeof logger === "function") {
    logger(safeEntry);
    return;
  }

  if (typeof logger.info === "function") {
    logger.info(safeEntry);
  }
}

function isJsonContentType(value) {
  if (!value) {
    return false;
  }

  return value.split(";")[0].trim().toLowerCase() === "application/json";
}

async function readJsonBody(request) {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new HttpError(413, "Request body is too large.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

function getRateLimiter(env = {}) {
  const key = `${env.RATE_LIMIT_PER_IP_PER_MINUTE || ""}:${env.RATE_LIMIT_GLOBAL_PER_MINUTE || ""}`;
  let rateLimiter = rateLimiters.get(key);
  if (!rateLimiter) {
    rateLimiter = createRateLimiter({ env });
    rateLimiters.set(key, rateLimiter);
  }
  return rateLimiter;
}

function isKvPostCacheBinding(value) {
  return value && typeof value === "object" && typeof value.get === "function" && typeof value.put === "function";
}

function getPostCache(env = {}) {
  if (isKvPostCacheBinding(env.X_POST_CACHE)) {
    let kvCache = kvPostCaches.get(env.X_POST_CACHE);
    if (!kvCache) {
      kvCache = createKvPostCache(env.X_POST_CACHE);
      kvPostCaches.set(env.X_POST_CACHE, kvCache);
    }
    return kvCache;
  }

  const key = `${env.X_BEARER_TOKEN ? "x-api-v2" : "oembed"}:${env.RATE_LIMIT_PER_IP_PER_MINUTE || ""}:${env.RATE_LIMIT_GLOBAL_PER_MINUTE || ""}`;
  let cache = postCaches.get(key);
  if (!cache) {
    cache = createMemoryPostCache();
    postCaches.set(key, cache);
  }
  return cache;
}

function readHeaderCandidate(value) {
  const candidate = String(value || "").trim();
  return candidate || undefined;
}

function readForwardedForCandidate(value) {
  return readHeaderCandidate(String(value || "").split(",")[0]);
}

function getClientIp(request) {
  return (
    readHeaderCandidate(request.headers.get("cf-connecting-ip")) ||
    readForwardedForCandidate(request.headers.get("x-forwarded-for")) ||
    "unknown"
  );
}

export async function handleExtractRequest(
  request,
  { env = {}, extractPost = null, rateLimiter = getRateLimiter(env), xApiProvider, oEmbedProvider, logger = null, now = Date.now } = {}
) {
  const startedAt = now();
  const requestUrl = new URL(request.url);
  const requestId = createRequestId();
  const respond = (status, payload, headers = {}, errorCode = undefined) => {
    writeSafeLog(logger, {
      request_id: requestId,
      method: request.method,
      path: requestUrl.pathname,
      statusCode: status,
      durationMs: Math.max(0, now() - startedAt),
      errorCode
    });
    return sendJson(status, payload, headers);
  };

  if (request.method !== "POST") {
    return respond(405, { error: "Method not allowed." }, { allow: "POST" }, "method_not_allowed");
  }

  const rateLimitResult = rateLimiter.check(getClientIp(request));
  if (!rateLimitResult.allowed) {
    return respond(
      429,
      { error: "Rate limit exceeded.", code: "rate_limit_exceeded" },
      { "retry-after": String(rateLimitResult.retryAfterSeconds) },
      "rate_limit_exceeded"
    );
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return respond(415, { error: "Content-Type must be application/json." }, {}, "unsupported_content_type");
  }

  try {
    const body = await readJsonBody(request);
    if (
      body === null ||
      Array.isArray(body) ||
      typeof body !== "object" ||
      Object.keys(body).length !== 1 ||
      typeof body.url !== "string"
    ) {
      throw new HttpError(400, 'Request body must be { "url": "..." }.');
    }

    const parsed = parseXPostUrl(body.url);
    const extractor =
      extractPost ||
      ((postUrl) =>
        extractPostWithCache(postUrl, {
          env,
          cache: getPostCache(env),
          xApiProvider,
          oEmbedProvider
        }));
    return respond(200, await extractor(parsed));
  } catch (error) {
    if (error instanceof XPostUrlValidationError) {
      return respond(400, { error: error.message, code: error.code }, {}, error.code);
    }

    if (error instanceof HttpError) {
      return respond(error.statusCode, { error: error.message }, {}, `http_${error.statusCode}`);
    }

    if (error instanceof OEmbedClientError) {
      return respond(error.statusCode, { error: error.message, code: error.code }, {}, error.code);
    }

    if (error instanceof XApiV2ClientError) {
      return respond(error.statusCode, { error: error.message, code: error.code }, {}, error.code);
    }

    return respond(500, { error: "Internal server error." }, {}, "internal_error");
  }
}

export function onRequest(context) {
  return handleExtractRequest(context.request, { env: context.env, logger: console });
}
