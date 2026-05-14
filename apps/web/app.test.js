import test from "node:test";
import assert from "node:assert/strict";
import { buildCopyText, buildGyotakuUrl, buildSourceMessage, hasArchiveUrlPasteNoise } from "./app.js";

const basePost = {
  accountName: "Example",
  username: "example_user",
  userNumericId: "12345",
  postId: "67890",
  postUrl: "https://x.com/example_user/status/67890",
  createdAt: "2026-05-09T00:00:00.000Z",
  text: "plain post text",
  mediaUrls: []
};

test("buildCopyText includes media URLs", () => {
  const text = buildCopyText({
    ...basePost,
    mediaUrls: ["https://pbs.twimg.com/media/one.jpg", "https://video.twimg.com/two.mp4"]
  });

  assert.match(text, /メディアURL：\nhttps:\/\/pbs\.twimg\.com\/media\/one\.jpg\nhttps:\/\/video\.twimg\.com\/two\.mp4/);
});

test("buildCopyText uses なし without media URLs", () => {
  const text = buildCopyText(basePost);

  assert.match(text, /メディアURL：\nなし/);
});

test("buildCopyText ignores blank or non-string media URL values", () => {
  const text = buildCopyText({
    ...basePost,
    mediaUrls: [null, undefined, "", "  ", " https://pbs.twimg.com/media/one.jpg "]
  });

  assert.match(text, /メディアURL：\nhttps:\/\/pbs\.twimg\.com\/media\/one\.jpg/);
  assert.equal(text.includes("undefined"), false);
  assert.equal(text.includes("null"), false);
});

test("buildCopyText deduplicates media URL values", () => {
  const text = buildCopyText({
    ...basePost,
    mediaUrls: [
      "https://pbs.twimg.com/media/one.jpg",
      " https://pbs.twimg.com/media/one.jpg ",
      "https://video.twimg.com/two.mp4"
    ]
  });

  assert.match(text, /メディアURL：\nhttps:\/\/pbs\.twimg\.com\/media\/one\.jpg\nhttps:\/\/video\.twimg\.com\/two\.mp4/);
  assert.equal(text.match(/https:\/\/pbs\.twimg\.com\/media\/one\.jpg/g).length, 1);
});

test("buildCopyText includes valid archive URL", () => {
  const text = buildCopyText(basePost, "https://s1.megalodon.jp/2026-0509-0000-00/example");

  assert.match(text, /魚拓URL：\nhttps:\/\/s1\.megalodon\.jp\/2026-0509-0000-00\/example/);
});

test("buildCopyText uses 未取得 for invalid archive URL", () => {
  const text = buildCopyText(basePost, "https://example.com/archive");

  assert.match(text, /魚拓URL：\n未取得/);
});

test("buildCopyText rejects archive URL with trailing injected text", () => {
  const text = buildCopyText(basePost, "https://megalodon.jp/2026-0509-0000-00/example\nextra");

  assert.match(text, /魚拓URL：\n未取得/);
});

test("buildCopyText rejects archive URL with surrounding whitespace", () => {
  const text = buildCopyText(basePost, " https://megalodon.jp/2026-0509-0000-00/example ");

  assert.match(text, /魚拓URL：\n未取得/);
});

test("hasArchiveUrlPasteNoise detects whitespace in pasted archive URL text", () => {
  assert.equal(hasArchiveUrlPasteNoise("https://megalodon.jp/2026-0509-0000-00/example"), false);
  assert.equal(hasArchiveUrlPasteNoise("https://megalodon.jp/2026-0509-0000-00/example\nextra"), true);
  assert.equal(hasArchiveUrlPasteNoise("https://megalodon.jp/2026-0509-0000-00/example extra"), true);
});

test("buildGyotakuUrl uses gyo.tc prefix", () => {
  assert.equal(buildGyotakuUrl(basePost.postUrl), "https://gyo.tc/https://x.com/example_user/status/67890");
});

test("buildCopyText does not add HTML markup around API fields", () => {
  const text = buildCopyText({
    ...basePost,
    text: "<script>alert(1)</script>"
  });

  assert.equal(text.includes("<p>"), false);
  assert.equal(text.includes("<br>"), false);
  assert.match(text, /ポスト内容：\n<script>alert\(1\)<\/script>/);
});

test("buildCopyText supports new API response aliases", () => {
  const text = buildCopyText({
    authorName: "Alias User",
    username: "alias_user",
    canonicalUrl: "https://x.com/i/web/status/123",
    createdAt: "未取得",
    text: "alias text",
    mediaUrls: []
  });

  assert.match(text, /アカウント名：Alias User/);
  assert.match(text, /ポストURL：https:\/\/x\.com\/i\/web\/status\/123/);
});

test("buildCopyText falls back for missing optional API fields", () => {
  const text = buildCopyText({
    accountName: "Partial",
    username: "partial_user",
    postUrl: "https://x.com/partial_user/status/123",
    mediaUrls: []
  });

  assert.match(text, /ポスト投稿日：未取得/);
  assert.match(text, /ポスト内容：\n未取得/);
  assert.equal(text.includes("undefined"), false);
});

test("buildSourceMessage describes cache and oEmbed source", () => {
  assert.equal(buildSourceMessage({ cached: true }), "キャッシュから表示しています。");
  assert.equal(buildSourceMessage({ source: "oembed" }), "公式API未使用のため画像URLを取得できない場合があります。");
});
