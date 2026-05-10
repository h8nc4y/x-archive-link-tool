import { parseXPostUrl, XPostUrlValidationError } from "../../server/urlValidator.js";
import { fetchXPost, OEmbedClientError } from "../../server/oEmbedClient.js";
import { createRateLimiter } from "../../server/rateLimiter.js";

const MAX_BODY_BYTES = 1024;
const SECURITY_HEADERS = {
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin"
};
const rateLimiters = new Map();

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

function getClientIp(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
}

export async function handleExtractRequest(request, { env = {}, extractPost = fetchXPost, rateLimiter = getRateLimiter(env) } = {}) {
  if (request.method !== "POST") {
    return sendJson(405, { error: "Method not allowed." }, { allow: "POST" });
  }

  const rateLimitResult = rateLimiter.check(getClientIp(request));
  if (!rateLimitResult.allowed) {
    return sendJson(
      429,
      { error: "Rate limit exceeded.", code: "rate_limit_exceeded" },
      { "retry-after": String(rateLimitResult.retryAfterSeconds) }
    );
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return sendJson(415, { error: "Content-Type must be application/json." });
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

    return sendJson(200, await extractPost(parseXPostUrl(body.url)));
  } catch (error) {
    if (error instanceof XPostUrlValidationError) {
      return sendJson(400, { error: error.message, code: error.code });
    }

    if (error instanceof HttpError) {
      return sendJson(error.statusCode, { error: error.message });
    }

    if (error instanceof OEmbedClientError) {
      return sendJson(error.statusCode, { error: error.message, code: error.code });
    }

    return sendJson(500, { error: "Internal server error." });
  }
}

export function onRequest(context) {
  return handleExtractRequest(context.request, { env: context.env });
}
