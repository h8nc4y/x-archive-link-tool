import test from "node:test";
import assert from "node:assert/strict";
import { RECORD_IMAGE_TTL_MS, isValidImageId } from "./recordImage.js";

test("RECORD_IMAGE_TTL_MS is exactly 3 days", () => {
  assert.equal(RECORD_IMAGE_TTL_MS, 3 * 24 * 60 * 60 * 1000);
});

test("isValidImageId accepts a 32-digit lowercase hex string", () => {
  assert.equal(isValidImageId("1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"), true);
});

test("isValidImageId rejects uppercase hex", () => {
  assert.equal(isValidImageId("1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D"), false);
});

test("isValidImageId rejects a UUID with hyphens", () => {
  assert.equal(isValidImageId("1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"), false);
});

test("isValidImageId rejects short/long strings", () => {
  assert.equal(isValidImageId("1a2b3c"), false);
  assert.equal(isValidImageId("1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6dff"), false);
});

test("isValidImageId rejects path traversal attempts", () => {
  assert.equal(isValidImageId("../../etc/passwd"), false);
});

test("isValidImageId rejects non-string input", () => {
  assert.equal(isValidImageId(undefined), false);
  assert.equal(isValidImageId(null), false);
  assert.equal(isValidImageId(12345), false);
});
