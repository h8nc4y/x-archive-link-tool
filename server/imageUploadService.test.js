import test from "node:test";
import assert from "node:assert/strict";
import { uploadImageToCatbox, createUploadError, getUploadErrorMessage } from "./imageUploadService.js";

// 実catboxへは一切通信しない。すべて fetchFn を差し替えたmockで検証する。

test("uploadImageToCatbox resolves the catbox URL on success (fetch mocked, no real network)", async () => {
  let calledUrl = "";
  let calledInit = null;
  const fetchFn = async (url, init) => {
    calledUrl = url;
    calledInit = init;
    return {
      ok: true,
      status: 200,
      text: async () => "https://files.catbox.moe/abc123.png"
    };
  };

  const result = await uploadImageToCatbox(new Blob(["dummy"]), { fetchFn, catboxUrl: "https://catbox.moe/user/api.php" });

  assert.equal(calledUrl, "https://catbox.moe/user/api.php");
  assert.equal(calledInit.method, "POST");
  assert.ok(calledInit.body instanceof FormData);
  assert.equal(calledInit.body.get("reqtype"), "fileupload");
  // 匿名アップロードのため userhash フィールドは付けない。
  assert.equal(calledInit.body.get("userhash"), null);
  assert.deepEqual(result, { url: "https://files.catbox.moe/abc123.png" });
});

test("uploadImageToCatbox trims surrounding whitespace from a successful response body", async () => {
  const fetchFn = async () => ({
    ok: true,
    status: 200,
    text: async () => "  https://files.catbox.moe/abc123.png\n"
  });

  const result = await uploadImageToCatbox(new Blob(["dummy"]), { fetchFn });
  assert.deepEqual(result, { url: "https://files.catbox.moe/abc123.png" });
});

test("uploadImageToCatbox throws upload_unreachable when fetch itself fails (network error, mocked)", async () => {
  const fetchFn = async () => {
    throw new TypeError("Failed to fetch");
  };

  await assert.rejects(
    uploadImageToCatbox(new Blob(["dummy"]), { fetchFn }),
    (error) => {
      assert.equal(error.code, "upload_unreachable");
      assert.equal(error.statusCode, 502);
      return true;
    }
  );
});

test("uploadImageToCatbox throws upload_error when catbox returns a non-URL body with HTTP 200 (mocked)", async () => {
  // catboxは失敗時もHTTP 200のまま、本文にエラー文字列だけを返すことがある。
  const fetchFn = async () => ({
    ok: true,
    status: 200,
    text: async () => "Error: something went wrong on our end."
  });

  await assert.rejects(
    uploadImageToCatbox(new Blob(["dummy"]), { fetchFn }),
    (error) => {
      assert.equal(error.code, "upload_error");
      assert.equal(error.statusCode, 502);
      return true;
    }
  );
});

test("uploadImageToCatbox throws upload_429 on HTTP 429 (mocked)", async () => {
  const fetchFn = async () => ({
    ok: false,
    status: 429,
    text: async () => "rate limited"
  });

  await assert.rejects(
    uploadImageToCatbox(new Blob(["dummy"]), { fetchFn }),
    (error) => {
      assert.equal(error.code, "upload_429");
      assert.equal(error.statusCode, 429);
      return true;
    }
  );
});

test("uploadImageToCatbox throws upload_error on other non-ok HTTP statuses (mocked)", async () => {
  const fetchFn = async () => ({
    ok: false,
    status: 500,
    text: async () => "internal error"
  });

  await assert.rejects(
    uploadImageToCatbox(new Blob(["dummy"]), { fetchFn }),
    (error) => {
      assert.equal(error.code, "upload_error");
      assert.equal(error.statusCode, 502);
      return true;
    }
  );
});

test("createUploadError attaches code, statusCode, and a Japanese userMessage", () => {
  const error = createUploadError("upload_too_large", 413);
  assert.equal(error.code, "upload_too_large");
  assert.equal(error.statusCode, 413);
  assert.match(error.userMessage, /画像サイズが大きすぎます/);
});

test("createUploadError falls back to a generic message for an unknown code", () => {
  const error = createUploadError("some_unmapped_code", 502);
  assert.match(error.userMessage, /アップロードに失敗しました/);
});

test("getUploadErrorMessage returns the mapped Japanese message for known codes", () => {
  assert.match(getUploadErrorMessage("upload_unsupported_type"), /PNG画像のみ/);
  assert.match(getUploadErrorMessage("unknown_code"), /アップロードに失敗しました/);
});
