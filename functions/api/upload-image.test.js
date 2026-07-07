import test from "node:test";
import assert from "node:assert/strict";
import { handleUploadImageRequest } from "./upload-image.js";

// 実catboxへは一切通信しない。uploadImage options（uploadImageToCatbox相当）をmockして検証する。

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

test("returns 400 when the image field is missing", async () => {
  const response = await handleUploadImageRequest(uploadRequest({ formData: pngFormData({ withImage: false }) }), {
    env: {},
    rateLimiter: allowRateLimiter,
    uploadImage: async () => {
      throw new Error("uploadImage should not run when image field is missing");
    }
  });

  assert.equal(response.status, 400);
  assert.equal((await readJson(response)).code, "upload_invalid_request");
  assertSecurityHeaders(response);
});

test("returns 413 when the image exceeds 5MB", async () => {
  const response = await handleUploadImageRequest(
    uploadRequest({ formData: pngFormData({ size: 5 * 1024 * 1024 + 1 }) }),
    {
      env: {},
      rateLimiter: allowRateLimiter,
      uploadImage: async () => {
        throw new Error("uploadImage should not run for oversized images");
      }
    }
  );

  assert.equal(response.status, 413);
  assert.equal((await readJson(response)).code, "upload_too_large");
  assertSecurityHeaders(response);
});

test("returns 415 when the image type is not image/png", async () => {
  const response = await handleUploadImageRequest(
    uploadRequest({ formData: pngFormData({ type: "image/jpeg" }) }),
    {
      env: {},
      rateLimiter: allowRateLimiter,
      uploadImage: async () => {
        throw new Error("uploadImage should not run for unsupported types");
      }
    }
  );

  assert.equal(response.status, 415);
  assert.equal((await readJson(response)).code, "upload_unsupported_type");
  assertSecurityHeaders(response);
});

test("returns 200 with the catbox URL on success (uploadImage mocked, no real network)", async () => {
  let receivedBlob = null;
  const response = await handleUploadImageRequest(uploadRequest({ formData: pngFormData() }), {
    env: {},
    rateLimiter: allowRateLimiter,
    uploadImage: async (image) => {
      receivedBlob = image;
      return { url: "https://files.catbox.moe/abc123.png" };
    }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), { url: "https://files.catbox.moe/abc123.png" });
  assert.ok(receivedBlob);
  assertSecurityHeaders(response);
});

test("propagates a typed upload error's statusCode and code", async () => {
  const response = await handleUploadImageRequest(uploadRequest({ formData: pngFormData() }), {
    env: {},
    rateLimiter: allowRateLimiter,
    uploadImage: async () => {
      const error = new Error("アップロード先が混雑しています。時間を置いて再試行してください。");
      error.code = "upload_429";
      error.statusCode = 429;
      throw error;
    }
  });

  assert.equal(response.status, 429);
  assert.equal((await readJson(response)).code, "upload_429");
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
    rateLimiter: { check: () => ({ allowed: false, retryAfterSeconds: 42 }) },
    uploadImage: async () => {
      throw new Error("uploadImage should not run when rate limited");
    }
  });

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "42");
  assert.equal((await readJson(response)).code, "rate_limit_exceeded");
  assertSecurityHeaders(response);
});
