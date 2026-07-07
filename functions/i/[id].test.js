import test from "node:test";
import assert from "node:assert/strict";
import { handleImageRequest } from "./[id].js";
import { RECORD_IMAGE_TTL_MS } from "../lib/recordImage.js";

const VALID_ID = "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d";

function makeRequest(id) {
  return new Request(`https://example.pages.dev/i/${id}`);
}

async function readText(response) {
  return response.text();
}

test("returns 404 for an invalid id format", async () => {
  const response = await handleImageRequest(makeRequest("not-a-valid-id"), {
    env: { RECORD_IMAGE_BUCKET: { get: async () => { throw new Error("should not be called"); } } },
    params: { id: "not-a-valid-id" }
  });

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("returns 404 when RECORD_IMAGE_BUCKET binding is not configured", async () => {
  const response = await handleImageRequest(makeRequest(VALID_ID), {
    env: {},
    params: { id: VALID_ID }
  });

  assert.equal(response.status, 404);
});

test("returns 404 when the object does not exist in R2", async () => {
  const bucket = { get: async () => null };
  const response = await handleImageRequest(makeRequest(VALID_ID), {
    env: { RECORD_IMAGE_BUCKET: bucket },
    params: { id: VALID_ID }
  });

  assert.equal(response.status, 404);
});

test("returns 200 with image/png content within the TTL", async () => {
  const now = Date.now();
  const bucket = {
    get: async (key) => {
      assert.equal(key, `${VALID_ID}.png`);
      return {
        body: "dummy-png-bytes",
        customMetadata: { uploadedAt: String(now - 1000) }
      };
    }
  };

  const response = await handleImageRequest(makeRequest(VALID_ID), {
    env: { RECORD_IMAGE_BUCKET: bucket },
    params: { id: VALID_ID },
    now: () => now
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("content-security-policy"), "default-src 'none'; img-src 'self'; sandbox");
  assert.equal(await readText(response), "dummy-png-bytes");
});

test("returns 404 and deletes the object when the TTL has expired", async () => {
  const now = Date.now();
  const uploadedAt = now - RECORD_IMAGE_TTL_MS - 1000;
  let deleteCalledWith = null;
  const bucket = {
    get: async () => ({
      body: "expired-png-bytes",
      customMetadata: { uploadedAt: String(uploadedAt) }
    }),
    delete: async (key) => {
      deleteCalledWith = key;
    }
  };

  const response = await handleImageRequest(makeRequest(VALID_ID), {
    env: { RECORD_IMAGE_BUCKET: bucket },
    params: { id: VALID_ID },
    now: () => now
  });

  assert.equal(response.status, 404);
  assert.equal(deleteCalledWith, `${VALID_ID}.png`);
});

test("treats missing/invalid uploadedAt metadata as expired (fail safe)", async () => {
  const bucket = {
    get: async () => ({ body: "bytes", customMetadata: {} }),
    delete: async () => {}
  };

  const response = await handleImageRequest(makeRequest(VALID_ID), {
    env: { RECORD_IMAGE_BUCKET: bucket },
    params: { id: VALID_ID }
  });

  assert.equal(response.status, 404);
});

test("does not fail the response when delete throws on an expired object", async () => {
  const now = Date.now();
  const uploadedAt = now - RECORD_IMAGE_TTL_MS - 1000;
  const bucket = {
    get: async () => ({
      body: "expired-png-bytes",
      customMetadata: { uploadedAt: String(uploadedAt) }
    }),
    delete: async () => {
      throw new Error("R2 delete failed");
    }
  };

  const response = await handleImageRequest(makeRequest(VALID_ID), {
    env: { RECORD_IMAGE_BUCKET: bucket },
    params: { id: VALID_ID },
    now: () => now
  });

  assert.equal(response.status, 404);
});
