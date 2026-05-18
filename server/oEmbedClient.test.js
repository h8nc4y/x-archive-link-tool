import test from "node:test";
import assert from "node:assert/strict";
import { fetchXPost, normalizeOEmbedResponse, OEmbedClientError } from "./oEmbedClient.js";

const parsedUrl = {
  username: "source_user",
  postId: "123",
  canonicalUrl: "https://x.com/source_user/status/123"
};

function mockResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    }
  };
}

test("fetchXPost requests oEmbed without bearer token and normalizes response", async () => {
  let requestUrl;
  let requestOptions;
  const fetchFn = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return mockResponse(200, {
      author_name: "Example User",
      html:
        '<blockquote class="twitter-tweet"><p lang="ja">hello &amp; goodbye</p>&mdash; Example <a href="https://x.com/source_user/status/123">May 9, 2026</a></blockquote>'
    });
  };

  const result = await fetchXPost(parsedUrl, { fetchFn });

  assert.equal(String(requestUrl).startsWith("https://publish.x.com/oembed?"), true);
  assert.equal(requestUrl.searchParams.get("url"), parsedUrl.canonicalUrl);
  assert.equal(requestUrl.searchParams.get("omit_script"), "1");
  assert.equal(requestUrl.searchParams.get("dnt"), "true");
  assert.equal(requestOptions.headers.authorization, undefined);
  assert.deepEqual(result, {
    accountName: "Example User",
    username: "source_user",
    userNumericId: "未取得",
    postId: "123",
    postUrl: "https://x.com/source_user/status/123",
    createdAt: "May 9, 2026",
    text: "hello & goodbye",
    mediaUrls: []
  });
});

test("normalizeOEmbedResponse extracts plain text from oEmbed HTML", () => {
  const result = normalizeOEmbedResponse(
    {
      author_name: "Example User",
      html:
        '<blockquote><p>first line<br>second line <a href="https://t.co/example">link</a></p><a href="https://x.com/source_user/status/123">May 9, 2026</a></blockquote>'
    },
    parsedUrl
  );

  assert.equal(result.accountName, "Example User");
  assert.equal(result.text, "first line second line link");
  assert.equal(result.createdAt, "May 9, 2026");
  assert.deepEqual(result.mediaUrls, []);
});

test("normalizeOEmbedResponse decodes numeric character references", () => {
  const result = normalizeOEmbedResponse(
    {
      html: "<blockquote><p>&#12371;&#12435;&#12395;&#12385;&#12399;&#12290;</p></blockquote>"
    },
    parsedUrl
  );

  assert.equal(result.text, "こんにちは。");
});

test("normalizeOEmbedResponse never returns script HTML and keeps media empty", () => {
  const result = normalizeOEmbedResponse(
    {
      author_name: "Example User",
      html: '<blockquote><p>safe<script>alert("x")</script> text</p></blockquote>'
    },
    parsedUrl
  );

  assert.equal(result.text, "safe text");
  assert.equal(result.text.includes("<script>"), false);
  assert.equal(result.userNumericId, "未取得");
  assert.deepEqual(result.mediaUrls, []);
});

test("missing author returns 未取得 account name", () => {
  const result = normalizeOEmbedResponse({}, parsedUrl);

  assert.equal(result.accountName, "未取得");
  assert.equal(result.username, "source_user");
});

for (const [status, code] of [
  [404, "oembed_404"],
  [429, "oembed_429"],
  [500, "oembed_5xx"]
]) {
  test(`fetchXPost maps ${status} to clear oEmbed error`, async () => {
    await assert.rejects(
      () => fetchXPost(parsedUrl, { fetchFn: async () => mockResponse(status, {}) }),
      (error) => error instanceof OEmbedClientError && error.code === code
    );
  });
}
