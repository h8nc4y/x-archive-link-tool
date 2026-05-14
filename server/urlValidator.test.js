import test from "node:test";
import assert from "node:assert/strict";
import { XPostUrlValidationError, parseXPostUrl } from "./urlValidator.js";

test("parses valid x.com URL", () => {
  assert.deepEqual(parseXPostUrl("https://x.com/user/status/123"), {
    username: "user",
    postId: "123",
    canonicalUrl: "https://x.com/user/status/123"
  });
});

test("parses valid twitter.com URL without numeric conversion", () => {
  assert.deepEqual(parseXPostUrl("https://twitter.com/user_name/status/1234567890123456789"), {
    username: "user_name",
    postId: "1234567890123456789",
    canonicalUrl: "https://x.com/user_name/status/1234567890123456789"
  });
});

test("parses valid mobile.twitter.com URL and drops query", () => {
  assert.deepEqual(parseXPostUrl("https://mobile.twitter.com/User_123/status/123?s=20"), {
    username: "User_123",
    postId: "123",
    canonicalUrl: "https://x.com/User_123/status/123"
  });
});

test("parses i/web/status URL by postId", () => {
  assert.deepEqual(parseXPostUrl("https://x.com/i/web/status/123?s=20"), {
    username: "未取得",
    postId: "123",
    canonicalUrl: "https://x.com/i/web/status/123"
  });
});

test("rejects invalid URLs", () => {
  const invalidUrls = [
    "http://x.com/user/status/123",
    "https://x.com.evil.example/user/status/123",
    "https://x.com@evil.example/user/status/123",
    "https://x.com/user",
    "https://x.com/user/status/",
    "https://x.com/user/status/abc",
    "https://x.com/user/status/12345678901234567890",
    "https://t.co/abc",
    "file:///etc/passwd"
  ];

  for (const url of invalidUrls) {
    assert.throws(() => parseXPostUrl(url), XPostUrlValidationError, url);
  }
});

test("rejects noisy pasted URL text", () => {
  const noisyInputs = [
    "https://x.com/user/status/123 extra",
    "https://x.com/user/status/123\nhttps://x.com/user/status/456",
    "https://x.com/user/status/123\nextra"
  ];

  for (const input of noisyInputs) {
    assert.throws(() => parseXPostUrl(input), XPostUrlValidationError, input);
  }
});
