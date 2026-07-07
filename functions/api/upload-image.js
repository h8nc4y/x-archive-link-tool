import { uploadImageToCatbox, createUploadError } from "../../server/imageUploadService.js";
import { createRateLimiter } from "../../server/rateLimiter.js";

// 記録画像アップロードの上限。既定は極端に大きい画像を弾く安全マージン。
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPE = "image/png";

// extract.js と同じ最小限のセキュリティヘッダー構成。
// connect-src から api.imgur.com は既に削除済み（別PRで反映）で、ここでは追加しない。
const SECURITY_HEADERS = {
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://publish.x.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin"
};

const rateLimiters = new Map();

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

// アップロード先URL・画像内容・応答本文は一切ログに残さない。
// extract.js と同じ安全な構造化項目（method/path/statusCode/durationMs/errorCode）のみ。
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

// extract.js の getRateLimiter と同じ設計。env値ごとにrate limiterインスタンスを使い回す。
function getRateLimiter(env = {}) {
  const key = `upload:${env.UPLOAD_RATE_LIMIT_PER_IP_PER_MINUTE || ""}:${env.UPLOAD_RATE_LIMIT_GLOBAL_PER_MINUTE || ""}`;
  let rateLimiter = rateLimiters.get(key);
  if (!rateLimiter) {
    // アップロード専用のrate limit環境変数を、createRateLimiterが読む
    // RATE_LIMIT_PER_IP_PER_MINUTE / RATE_LIMIT_GLOBAL_PER_MINUTE 名にマッピングする。
    // 既定値はアップロード用に extract.js より厳しめ（3/分・20/分）にする。
    const mappedEnv = {
      RATE_LIMIT_PER_IP_PER_MINUTE: env.UPLOAD_RATE_LIMIT_PER_IP_PER_MINUTE || "3",
      RATE_LIMIT_GLOBAL_PER_MINUTE: env.UPLOAD_RATE_LIMIT_GLOBAL_PER_MINUTE || "20"
    };
    rateLimiter = createRateLimiter({ env: mappedEnv });
    rateLimiters.set(key, rateLimiter);
  }
  return rateLimiter;
}

export async function handleUploadImageRequest(
  request,
  { env = {}, uploadImage = uploadImageToCatbox, rateLimiter = getRateLimiter(env), logger = null, now = Date.now } = {}
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

  // rate limit判定。extract.jsと同じ429応答形式（retry-afterヘッダー付き）にそろえる。
  const rateLimitResult = rateLimiter.check(getClientIp(request));
  if (!rateLimitResult.allowed) {
    return respond(
      429,
      { error: "Rate limit exceeded.", code: "rate_limit_exceeded" },
      { "retry-after": String(rateLimitResult.retryAfterSeconds) },
      "rate_limit_exceeded"
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return respond(400, { error: "Request body must be multipart/form-data.", code: "upload_invalid_request" }, {}, "upload_invalid_request");
  }

  const image = formData.get("image");
  if (!image || typeof image.arrayBuffer !== "function") {
    return respond(400, { error: "image field is required.", code: "upload_invalid_request" }, {}, "upload_invalid_request");
  }

  if (typeof image.size === "number" && image.size > MAX_IMAGE_BYTES) {
    return respond(413, { error: "Image is too large.", code: "upload_too_large" }, {}, "upload_too_large");
  }

  if (typeof image.type === "string" && image.type !== "" && image.type !== ALLOWED_IMAGE_TYPE) {
    return respond(415, { error: "Only image/png is supported.", code: "upload_unsupported_type" }, {}, "upload_unsupported_type");
  }

  try {
    // catboxは無設定（APIキー・binding不要）で常時動作するため、not_configured経路は無い。
    const result = await uploadImage(image, {});
    return respond(200, { url: result.url });
  } catch (error) {
    const code = typeof error?.code === "string" ? error.code : "upload_error";
    const statusCode = typeof error?.statusCode === "number" ? error.statusCode : 502;
    return respond(statusCode, { error: error?.message || "Upload failed.", code }, {}, code);
  }
}

// extract.js の onRequest と同じパターン。全メソッドをここで受け、
// handleUploadImageRequest内のメソッドチェックで405（セキュリティヘッダー付き）を返す。
// onRequestPostのみをexportする書き方だと、GET等をCloudflare自体が
// セキュリティヘッダー無しの応答で処理してしまい、extract.jsと一貫しなくなるため避ける。
export function onRequest(context) {
  return handleUploadImageRequest(context.request, { env: context.env, logger: console });
}

// createUploadError を re-export しておくと、テストや将来の拡張で型付きエラー生成を
// このモジュール経由でも扱える（imageUploadService.js が正の定義元）。
export { createUploadError };
