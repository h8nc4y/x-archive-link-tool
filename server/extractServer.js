import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseXPostUrl, XPostUrlValidationError } from "./urlValidator.js";
import { OEmbedClientError } from "./oEmbedClient.js";
import { createExtractPost } from "./extractService.js";
import { createRateLimiter } from "./rateLimiter.js";
import { XApiV2ClientError } from "./xApiV2Client.js";
import { handleUploadImageRequest } from "../functions/api/upload-image.js";

const MAX_BODY_BYTES = 1024;
const SECURITY_HEADERS = {
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://publish.x.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin"
};
const STATIC_FILES = new Map([
  ["/", { file: new URL("../apps/web/index.html", import.meta.url), contentType: "text/html; charset=utf-8" }],
  ["/index.html", { file: new URL("../apps/web/index.html", import.meta.url), contentType: "text/html; charset=utf-8" }],
  ["/privacy.html", { file: new URL("../apps/web/privacy.html", import.meta.url), contentType: "text/html; charset=utf-8" }],
  ["/styles.css", { file: new URL("../apps/web/styles.css", import.meta.url), contentType: "text/css; charset=utf-8" }],
  ["/app.js", { file: new URL("../apps/web/app.js", import.meta.url), contentType: "text/javascript; charset=utf-8" }]
]);

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function sendJson(res, statusCode, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    ...headers
  });
  res.end(body);
}

function sendBytes(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    "content-length": Buffer.byteLength(body),
    ...headers
  });
  res.end(body);
}

// Web標準 Response（functions/api/upload-image.js の戻り値）をNodeの
// http.ServerResponse へそのまま書き出すアダプタ。
async function writeWebResponse(res, webResponse) {
  const headers = {};
  for (const [key, value] of webResponse.headers.entries()) {
    headers[key] = value;
  }

  const bodyText = await webResponse.text();
  res.writeHead(webResponse.status, headers);
  res.end(bodyText);
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

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new HttpError(413, "Request body is too large.");
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

// アップロードAPI（multipart/form-data）専用。JSON APIと違い上限を大きく取り、
// functions/api/upload-image.js側と同じ5MBチェックはハンドラ側で別途行う。
const MAX_UPLOAD_BODY_BYTES = 8 * 1024 * 1024; // 8MB（5MB画像+multipart境界等の余白）

async function readRawBody(req, maxBytes) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new HttpError(413, "Request body is too large.");
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// Node.js標準の http.IncomingMessage（readable stream）を、Cloudflare Pages Functions
// と同じ Web標準 Request オブジェクトへ変換する。これにより、ローカル開発サーバーと
// functions/api/upload-image.js の handleUploadImageRequest が同じ request.formData() /
// request.headers.get() インターフェースを共有でき、実装の重複を避けられる。
async function toWebRequest(req, { maxBytes = MAX_UPLOAD_BODY_BYTES } = {}) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  const method = req.method || "GET";
  const requestInit = { method, headers };

  // Web標準のRequestは GET/HEAD に body を付けると例外を投げるため、
  // その場合は読み捨てずボディ自体を読まない（handleUploadImageRequest側で
  // メソッド不一致として405を返す想定のパス）。
  if (method !== "GET" && method !== "HEAD") {
    requestInit.body = await readRawBody(req, maxBytes);
  }

  return new Request(new URL(req.url || "/", "http://localhost"), requestInit);
}

export async function handleRequest(
  req,
  res,
  {
    extractPost = createExtractPost(),
    rateLimiter = null,
    uploadRateLimiter = undefined,
    logger = null,
    now = Date.now,
    staticFiles = STATIC_FILES,
    readFileFn = readFile
  } = {}
) {
  const startedAt = now();
  const requestUrl = new URL(req.url || "/", "http://localhost");
  const requestId = randomUUID();
  const respond = (statusCode, payload, headers = {}, errorCode = undefined) => {
    sendJson(res, statusCode, payload, headers);
    writeSafeLog(logger, {
      request_id: requestId,
      method: req.method,
      path: requestUrl.pathname,
      statusCode,
      durationMs: Math.max(0, now() - startedAt),
      errorCode
    });
  };

  try {
    if (req.method === "GET" && staticFiles.has(requestUrl.pathname)) {
      const staticFile = staticFiles.get(requestUrl.pathname);
      const body = await readFileFn(staticFile.file);
      sendBytes(res, 200, body, { "content-type": staticFile.contentType });
      writeSafeLog(logger, {
        request_id: requestId,
        method: req.method,
        path: requestUrl.pathname,
        statusCode: 200,
        durationMs: Math.max(0, now() - startedAt)
      });
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/healthz") {
      respond(200, { ok: true });
      return;
    }

    if (requestUrl.pathname === "/api/upload-image") {
      // multipart/form-data はNode標準のIncomingMessageでは扱いづらいため、
      // Cloudflare Pages Functionsと同じ Web標準 Request/Response インターフェースへ
      // 変換し、functions/api/upload-image.js のハンドラをそのまま再利用する
      // （R2 putロジックの重複実装を避ける）。ローカル開発サーバーにはR2 bindingが
      // 無いため、env に RECORD_IMAGE_BUCKET を渡さず、常に upload_not_configured（503）
      // へ自然に倒す。uploadRateLimiterはテストからrate limit判定をmockする差し替え口。
      const webRequest = await toWebRequest(req);
      const uploadOptions = { env: {}, logger };
      if (uploadRateLimiter !== undefined) {
        uploadOptions.rateLimiter = uploadRateLimiter;
      }
      const webResponse = await handleUploadImageRequest(webRequest, uploadOptions);
      await writeWebResponse(res, webResponse);
      return;
    }

    if (requestUrl.pathname !== "/api/extract") {
      respond(404, { error: "Not found." }, {}, "not_found");
      return;
    }

    if (req.method !== "POST") {
      respond(405, { error: "Method not allowed." }, { allow: "POST" }, "method_not_allowed");
      return;
    }

    if (rateLimiter) {
      const rateLimitResult = rateLimiter.check(req.socket?.remoteAddress || "unknown");
      if (!rateLimitResult.allowed) {
        respond(
          429,
          { error: "Rate limit exceeded.", code: "rate_limit_exceeded" },
          { "retry-after": String(rateLimitResult.retryAfterSeconds) },
          "rate_limit_exceeded"
        );
        return;
      }
    }

    if (!isJsonContentType(req.headers["content-type"])) {
      respond(415, { error: "Content-Type must be application/json." }, {}, "unsupported_content_type");
      return;
    }

    const body = await readJsonBody(req);
    if (
      body === null ||
      Array.isArray(body) ||
      typeof body !== "object" ||
      Object.keys(body).length !== 1 ||
      typeof body.url !== "string"
    ) {
      throw new HttpError(400, "Request body must be { \"url\": \"...\" }.");
    }

    const parsed = parseXPostUrl(body.url);
    respond(200, await extractPost(parsed));
  } catch (error) {
    if (error instanceof XPostUrlValidationError) {
      respond(400, { error: error.message, code: error.code }, {}, error.code);
      return;
    }

    if (error instanceof HttpError) {
      respond(error.statusCode, { error: error.message }, {}, `http_${error.statusCode}`);
      return;
    }

    if (error instanceof OEmbedClientError) {
      respond(error.statusCode, { error: error.message, code: error.code }, {}, error.code);
      return;
    }

    if (error instanceof XApiV2ClientError) {
      respond(error.statusCode, { error: error.message, code: error.code }, {}, error.code);
      return;
    }

    respond(500, { error: "Internal server error." }, {}, "internal_error");
  }
}

export function createServer(options = {}) {
  const rateLimiter =
    options.rateLimiter === undefined
      ? createRateLimiter({ env: options.env, now: options.now })
      : options.rateLimiter;
  const extractPost = options.extractPost || createExtractPost({ env: options.env, now: options.now });

  return http.createServer((req, res) => {
    handleRequest(req, res, { ...options, extractPost, rateLimiter });
  });
}

export function formatStartupError(error, port) {
  if (error?.code === "EADDRINUSE") {
    return `Port ${port} is already in use. Close the existing server or set PORT=${Number(port) + 1}.`;
  }

  const code = typeof error?.code === "string" ? error.code : "UNKNOWN";
  const message = typeof error?.message === "string" ? error.message : "Server startup failed.";
  return `Server startup failed (${code}): ${message}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || 3000);
  const server = createServer();
  server.on("error", (error) => {
    console.error(formatStartupError(error, port));
    process.exit(1);
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Server listening on http://127.0.0.1:${port}`);
  });
}
