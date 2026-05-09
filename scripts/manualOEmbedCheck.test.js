import test from "node:test";
import assert from "node:assert/strict";
import { formatEnvPresence, formatError, formatResult, getEnvPresence, getTopLevelKeys } from "./manualOEmbedCheck.js";

test("getEnvPresence returns only set or missing booleans", () => {
  assert.deepEqual(getEnvPresence({ TEST_X_POST_URL: "" }), {
    TEST_X_POST_URL: false
  });
});

test("formatEnvPresence does not include env values", () => {
  const lines = formatEnvPresence({ TEST_X_POST_URL: false });

  assert.deepEqual(lines, [
    "tests are not run by this script",
    "env presence: TEST_X_POST_URL=missing"
  ]);
});

test("getTopLevelKeys returns safe sorted keys only", () => {
  const keys = getTopLevelKeys({
    text: "do not print",
    username: "do_not_print",
    mediaUrls: ["do not print"],
    postId: "do_not_print",
    postUrl: "do_not_print",
    userNumericId: "do_not_print",
    accountName: "do_not_print",
    createdAt: "do_not_print",
    extra: "ignore"
  });

  assert.deepEqual(keys, ["accountName", "createdAt", "mediaUrls", "postId", "postUrl", "text", "userNumericId", "username"]);
});

test("formatResult prints status and keys only", () => {
  const lines = formatResult(200, {
    username: "do_not_print",
    text: "do_not_print"
  });

  assert.deepEqual(lines, ["HTTP status: 200", "JSON top-level keys: text,username"]);
});

test("formatError prints status and error kind only", () => {
  assert.deepEqual(formatError(404, { code: "oembed_404", error: "do not print" }), [
    "HTTP status: 404",
    "error kind/status: oembed_404"
  ]);
});

test("formatError does not surface legacy missing_token code", () => {
  assert.deepEqual(formatError(500, { code: "missing_token", error: "do not print" }), [
    "HTTP status: 500",
    "error kind/status: http_500"
  ]);
});
