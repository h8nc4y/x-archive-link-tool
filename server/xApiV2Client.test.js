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
  assert.equal(requestOptions.headers.authorization, "Bearer test-token");
  assert.equal(result.source, "x-api-v2");
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
    (error) => error instanceof XApiV2ClientError && error.code === "x_api_401" && !error.message.includes("secret")
  );
});
