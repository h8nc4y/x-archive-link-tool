import test from "node:test";
import assert from "node:assert/strict";
import { formatSummary, isAllowedPostUrl, summarizePayload } from "./runProductionSmokeOnce.js";

test("isAllowedPostUrl accepts only direct x or twitter status URLs", () => {
  assert.equal(isAllowedPostUrl("https://x.com/example/status/1234567890"), true);
  assert.equal(isAllowedPostUrl("https://twitter.com/example/status/1234567890"), true);
  assert.equal(isAllowedPostUrl("http://x.com/example/status/1234567890"), false);
  assert.equal(isAllowedPostUrl("https://mobile.twitter.com/example/status/1234567890"), false);
  assert.equal(isAllowedPostUrl("https://x.com/example"), false);
  assert.equal(isAllowedPostUrl("https://x.com/example/status/not-a-number"), false);
});

test("summarizePayload returns safe aggregate values only", () => {
  const summary = summarizePayload(200, {
    source: "x-api-v2",
    cached: false,
    mediaUrls: ["do-not-print"],
    warnings: ["do-not-print"],
    username: "do-not-print",
    postId: "do-not-print",
    text: "do-not-print"
  });

  assert.deepEqual(summary, {
    status: 200,
    source: "x-api-v2",
    cached: "false",
    mediaUrlsCount: 1,
    warningsCount: 1,
    errorCode: "なし"
  });
});

test("formatSummary prints only allowed fields", () => {
  assert.deepEqual(
    formatSummary(
      {
        status: 200,
        source: "cache",
        cached: "true",
        mediaUrlsCount: 2,
        warningsCount: 0,
        errorCode: "なし"
      },
      "2026/05/21 14:00:00 JST"
    ),
    [
      "確認時刻: 2026/05/21 14:00:00 JST",
      "実行回数: 1/1",
      "HTTP status: 200",
      "source: cache",
      "cached: true",
      "mediaUrls件数: 2",
      "warnings件数: 0",
      "error code: なし"
    ]
  );
});
