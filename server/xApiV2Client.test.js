import test from "node:test";
import assert from "node:assert/strict";
import { fetchXPostFromApi, normalizeXApiV2Response, XApiV2ClientError } from "./xApiV2Client.js";

const parsedUrl = {
  username: "source_user",
  postId: "123",
  canonicalUrl: "https://x.com/source_user/status/123"
};

function mockResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    async json() {
      return body;
    }
  };
}

test("fetchXPostFromApi requests X API v2 with injected bearer token", async () => {
  let requestUrl;
  let requestOptions;
  const result = await fetchXPostFromApi(parsedUrl, {
    bearerToken: "test-token",
    fetchFn: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return mockResponse(200, {
        data: { id: "123", text: "hello", author_id: "42" },
        includes: { users: [{ id: "42", name: "Example", username: "example" }] }
      });
    }
  });

  assert.equal(String(requestUrl).startsWith("https://api.x.com/2/tweets/123?"), true);
  assert.equal(requestUrl.searchParams.get("expansions"), "attachments.media_keys,author_id");
  assert.equal(requestUrl.searchParams.get("tweet.fields"), "created_at,entities,attachments,note_tweet");
  assert.equal(requestOptions.headers.authorization, "Bearer test-token");
  assert.equal(result.source, "x-api-v2");
  assert.equal(result.authorName, "Example");
  assert.equal(result.username, "example");
  assert.equal(result.canonicalUrl, "https://x.com/example/status/123");
});

test("normalizeXApiV2Response prefers note_tweet text for long-form posts", () => {
  const result = normalizeXApiV2Response(
    {
      data: {
        id: "123",
        text: "shortened long-form preview https://t.co/example",
        note_tweet: {
          text: "long-form body line 1\nlong-form body line 2\nlong-form body line 3"
        },
        author_id: "42",
        attachments: { media_keys: ["p1"] }
      },
      includes: {
        users: [{ id: "42", name: "Example", username: "example" }],
        media: [{ media_key: "p1", type: "photo", url: "https://media.example/one.jpg" }]
      }
    },
    parsedUrl
  );

  assert.equal(result.text, "long-form body line 1\nlong-form body line 2\nlong-form body line 3");
  assert.equal(result.text.includes("https://t.co/example"), false);
  assert.deepEqual(result.mediaUrls, ["https://media.example/one.jpg"]);
  assert.equal(result.source, "x-api-v2");
  assert.deepEqual(result.warnings, []);
});

test("normalizeXApiV2Response falls back to tweet text without note_tweet text", () => {
  const result = normalizeXApiV2Response(
    {
      data: {
        id: "123",
        text: "regular post text",
        note_tweet: { text: "" },
        author_id: "42"
      },
      includes: { users: [{ id: "42", name: "Example", username: "example" }] }
    },
    parsedUrl
  );

  assert.equal(result.text, "regular post text");
  assert.equal(result.authorName, "Example");
  assert.equal(result.username, "example");
});

test("normalizeXApiV2Response extracts photo media URLs", () => {
  const result = normalizeXApiV2Response(
    {
      data: {
        id: "123",
        text: "photos",
        author_id: "42",
        attachments: { media_keys: ["p1", "p2", "p3", "p4"] }
      },
      includes: {
        users: [{ id: "42", name: "Example", username: "example" }],
        media: [
          { media_key: "p1", type: "photo", url: "https://pbs.twimg.com/media/one.jpg" },
          { media_key: "p2", type: "photo", url: "https://pbs.twimg.com/media/two.jpg" },
          { media_key: "p3", type: "photo", url: "https://pbs.twimg.com/media/three.jpg" },
          { media_key: "p4", type: "photo", url: "https://pbs.twimg.com/media/four.jpg" }
        ]
      }
    },
    parsedUrl
  );

  assert.deepEqual(result.mediaUrls, [
    "https://pbs.twimg.com/media/one.jpg",
    "https://pbs.twimg.com/media/two.jpg",
    "https://pbs.twimg.com/media/three.jpg",
    "https://pbs.twimg.com/media/four.jpg"
  ]);
});

test("normalizeXApiV2Response uses username canonical URL when available", () => {
  const result = normalizeXApiV2Response(
    {
      data: { id: "123", text: "hello", author_id: "42" },
      includes: { users: [{ id: "42", name: "Example", username: "example" }] }
    },
    parsedUrl
  );

  assert.equal(result.canonicalUrl, "https://x.com/example/status/123");
});

test("normalizeXApiV2Response falls back to parsed canonical URL username", () => {
  const result = normalizeXApiV2Response(
    {
      data: { id: "123", text: "hello" },
      includes: {}
    },
    parsedUrl
  );

  assert.equal(result.canonicalUrl, "https://x.com/source_user/status/123");
});

test("normalizeXApiV2Response extracts a single photo media URL", () => {
  const result = normalizeXApiV2Response(
    {
      data: {
        id: "123",
        text: "photo",
        attachments: { media_keys: ["p1"] }
      },
      includes: {
        media: [{ media_key: "p1", type: "photo", url: "https://pbs.twimg.com/media/one.jpg" }]
      }
    },
    parsedUrl
  );

  assert.deepEqual(result.mediaUrls, ["https://pbs.twimg.com/media/one.jpg"]);
});


test("normalizeXApiV2Response chooses highest bitrate mp4 variant", () => {
  const result = normalizeXApiV2Response(
    {
      data: {
        id: "123",
        text: "video",
        attachments: { media_keys: ["v1"] }
      },
      includes: {
        media: [
          {
            media_key: "v1",
            type: "video",
            preview_image_url: "https://pbs.twimg.com/media/preview.jpg",
            variants: [
              { content_type: "video/mp4", bitrate: 256000, url: "https://video.twimg.com/low.mp4" },
              { content_type: "application/x-mpegURL", url: "https://video.twimg.com/playlist.m3u8" },
              { content_type: "video/mp4", bitrate: 832000, url: "https://video.twimg.com/high.mp4" }
            ]
          }
        ]
      }
    },
    parsedUrl
  );

  assert.deepEqual(result.mediaUrls, ["https://video.twimg.com/high.mp4"]);
  assert.equal(result.media[0].previewImageUrl, "https://pbs.twimg.com/media/preview.jpg");
});

test("normalizeXApiV2Response handles animated_gif mp4 variant", () => {
  const result = normalizeXApiV2Response(
    {
      data: {
        id: "123",
        text: "gif",
        attachments: { media_keys: ["g1"] }
      },
      includes: {
        media: [
          {
            media_key: "g1",
            type: "animated_gif",
            variants: [{ content_type: "video/mp4", url: "https://video.twimg.com/gif.mp4" }]
          }
        ]
      }
    },
    parsedUrl
  );

  assert.deepEqual(result.mediaUrls, ["https://video.twimg.com/gif.mp4"]);
});


test("fetchXPostFromApi maps token and upstream errors safely", async () => {
  await assert.rejects(
    () => fetchXPostFromApi(parsedUrl, { bearerToken: "secret", fetchFn: async () => mockResponse(401, {}) }),
    (error) =>
      error instanceof XApiV2ClientError &&
      error.code === "x_api_401" &&
      error.responseStatusCode === 401 &&
      error.errorType === "unauthorized" &&
      !error.message.includes("secret")
  );
});

test("fetchXPostFromApi keeps safe rate limit reset diagnostic", async () => {
  const response = mockResponse(429, {});
  response.headers = new Headers({ "x-rate-limit-reset": "1760000000" });

  await assert.rejects(
    () => fetchXPostFromApi(parsedUrl, { bearerToken: "secret", fetchFn: async () => response }),
    (error) =>
      error instanceof XApiV2ClientError &&
      error.code === "x_api_429" &&
      error.responseStatusCode === 429 &&
      error.errorType === "rate_limited" &&
      error.rateLimitReset === "1760000000" &&
      !JSON.stringify(error).includes("secret")
  );
});

test("fetchXPostFromApi maps 402 to payment required error", async () => {
  await assert.rejects(
    () => fetchXPostFromApi(parsedUrl, { bearerToken: "secret", fetchFn: async () => mockResponse(402, {}) }),
    (error) =>
      error instanceof XApiV2ClientError &&
      error.code === "x_api_402" &&
      error.statusCode === 402 &&
      error.responseStatusCode === 402 &&
      error.errorType === "payment_required" &&
      !JSON.stringify(error).includes("secret")
  );
});
