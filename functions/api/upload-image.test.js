import test from "node:test";
import assert from "node:assert/strict";
import { handleUploadImageRequest } from "./upload-image.js";

// 実R2へは一切通信しない。env.RECORD_IMAGE_BUCKET にmock bucketを注入して検証する。

function uploadRequest({ formData, method = "POST" } = {}) {
  const options = { method };
  if (formData) {
    options.body = formData;
  }
  return new Request("https://example.pages.dev/api/upload-image", options);
}

function pngFormData({ withImage = true, size = 100, type = "image/png" } = {}) {
  const formData = new FormData();
  if (withImage) {
    const bytes = new Uint8Array(size);
    formData.append("image", new Blob([bytes], { type }), "record.png");
  }
  return formData;
}

async function readJson(response) {
  return JSON.parse(await response.text());
}

function assertSecurityHeaders(response) {
  assert.equal(
    response.headers.get("content-security-policy"),
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://publish.x.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests"
  );
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
}

const allowRateLimiter = { check: () => ({ allowed: true, retryAfterSeconds: 0 }) };

// putが呼ばれたら成功する最小mock bucket。呼び出し引数の検証にも使う。
function createMockBucket({ put = async () => {} } = {}) {
  return { put };
}

test("returns 503 when RECORD_IMAGE_BUCKET binding is not configured", async () => {
  const response = await handleUploadImageRequest(uploadRequest({ formData: pngFormData() }), {
    env: {},
    rateLimiter: allowRateLimiter
  });

  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).code, "upload_not_configured");
  assertSecurityHeaders(response);
});

test("returns 400 when the image field is missing", async () => {
  let putCalled = false;
  const response = await handleUploadImageRequest(uploadRequest({ formData: pngFormData({ withImage: false }) }), {
    env: { RECORD_IMAGE_BUCKET: createMockBucket({ put: async () => { putCalled = true; } }) },
    rateLimiter: allowRateLimiter
  });

  assert.equal(response.status, 400);
  assert.equal((await readJson(response)).code, "upload_invalid_request");
  assert.equal(putCalled, false);
  assertSecurityHeaders(response);
});

test("returns 413 when the image exceeds 5MB", async () => {
  let putCalled = false;
  const response = await handleUploadImageRequest(
    uploadRequest({ formData: pngFormData({ size: 5 * 1024 * 1024 + 1 }) }),
    {
      env: { RECORD_IMAGE_BUCKET: createMockBucket({ put: async () => { putCalled = true; } }) },
      rateLimiter: allowRateLimiter
    }
  );

  assert.equal(response.status, 413);
  assert.equal((await readJson(response)).code, "upload_too_large");
  assert.equal(putCalled, false);
  assertSecurityHeaders(response);
});

test("returns 415 when the image type is not image/png", async () => {
  let putCalled = false;
  const response = await handleUploadImageRequest(
    uploadRequest({ formData: pngFormData({ type: "image/jpeg" }) }),
    {
      env: { RECORD_IMAGE_BUCKET: createMockBucket({ put: async () => { putCalled = true; } }) },
      rateLimiter: allowRateLimiter
    }
  );

  assert.equal(response.status, 415);
  assert.equal((await readJson(response)).code, "upload_unsupported_type");
  assert.equal(putCalled, false);
  assertSecurityHeaders(response);
});

test("returns 200 with a same-origin /i/{32hex} URL on success (R2 put mocked, no real network)", async () => {
  let putArgs = null;
  const bucket = createMockBucket({
    put: async (key, body, options) => {
      putArgs = { key, body, options };
    }
  });

  const response = await handleUploadImageRequest(uploadRequest({ formData: pngFormData() }), {
    env: { RECORD_IMAGE_BUCKET: bucket },
    rateLimiter: allowRateLimiter
  });

  assert.equal(response.status, 200);
  const payload = await readJson(response);
  assert.match(payload.url, /^https:\/\/example\.pages\.dev\/i\/[a-f0-9]{32}$/);
  assertSecurityHeaders(response);

  // putが正しい形式のキー・content-type・uploadedAt付きcustomMetadataで呼ばれたことを確認する。
  assert.ok(putArgs);
  assert.match(putArgs.key, /^[a-f0-9]{32}\.png$/);
  assert.equal(putArgs.options.httpMetadata.contentType, "image/png");
  assert.ok(putArgs.options.customMetadata.uploadedAt);
  assert.ok(Number.isFinite(Number(putArgs.options.customMetadata.uploadedAt)));
});

test("returns 502 when R2 put throws", async () => {
  const bucket = createMockBucket({
    put: async () => {
      throw new Error("R2 put failed");
    }
  });

  const response = await handleUploadImageRequest(uploadRequest({ formData: pngFormData() }), {
    env: { RECORD_IMAGE_BUCKET: bucket },
    rateLimiter: allowRateLimiter
  });

  assert.equal(response.status, 502);
  assert.equal((await readJson(response)).code, "upload_error");
  assertSecurityHeaders(response);
});

test("rejects unsupported methods", async () => {
  const response = await handleUploadImageRequest(uploadRequest({ method: "GET" }), {
    env: {},
    rateLimiter: allowRateLimiter
  });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
  assertSecurityHeaders(response);
});

test("returns 429 when the rate limiter rejects the request", async () => {
  const response = await handleUploadImageRequest(uploadRequest({ formData: pngFormData() }), {
    env: {},
    rateLimiter: { check: () => ({ allowed: false, retryAfterSeconds: 42 }) }
  });

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "42");
  assert.equal((await readJson(response)).code, "rate_limit_exceeded");
  assertSecurityHeaders(response);
});
