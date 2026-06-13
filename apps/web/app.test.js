import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCopyText,
  buildGyotakuUrl,
  buildSourceMessage,
  getUserErrorMessage,
  getUserFacingErrorMessage,
  hasArchiveUrlPasteNoise,
  validatePostUrl
} from "./app.js";

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

test("buildCopyText keeps long post body without truncation", () => {
  const longText = Array.from({ length: 24 }, (_, index) => `long-form line ${index + 1}`).join("\n");
  const text = buildCopyText({
    ...basePost,
    text: longText
  });

  assert.match(text, new RegExp(`ポスト内容：\\n${longText}`));
  assert.equal(text.includes("long-form line 24"), true);
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

test("buildCopyText does not render @未取得 for missing username", () => {
  const text = buildCopyText({
    accountName: "Partial",
    postUrl: "https://x.com/i/web/status/123",
    mediaUrls: []
  });

  assert.match(text, /アカウントID：未取得/);
  assert.equal(text.includes("@未取得"), false);
});

test("buildCopyText does not render @未取得 for explicit unavailable username", () => {
  const text = buildCopyText({
    ...basePost,
    username: "未取得"
  });

  assert.match(text, /アカウントID：未取得/);
  assert.equal(text.includes("@未取得"), false);
});

test("buildSourceMessage describes cache and oEmbed source", () => {
  assert.equal(buildSourceMessage({ cached: true }), "キャッシュから表示しています。");
  assert.equal(buildSourceMessage({ source: "oembed" }), "公式API未使用のため画像URLを取得できない場合があります。");
});

test("buildSourceMessage maps warnings to Japanese user messages", () => {
  const message = buildSourceMessage({
    source: "stale-cache",
    warnings: [
      "最新取得に失敗したため期限切れキャッシュを返しました。",
      "media_urls_unavailable",
      "X API provider failed with status 402; used oEmbed fallback."
    ]
  });

  assert.match(message, /古い可能性があるキャッシュ/);
  assert.match(message, /画像や動画の直接URLを取得できませんでした/);
  assert.match(message, /X APIで取得できなかったため/);
});

test("getUserErrorMessage maps API codes to Japanese messages", () => {
  assert.equal(getUserErrorMessage({ code: "invalid_host" }), "対応しているURLは x.com または twitter.com のポストURLです。");
  assert.equal(getUserErrorMessage({ code: "x_api_402" }), "X APIの利用枠または課金設定により取得できません。管理者側の確認が必要です。");
  assert.equal(getUserErrorMessage({ code: "unknown_code" }), "取得に失敗しました。時間を置いて再試行してください。");
});

test("getUserFacingErrorMessage uses generic Japanese text for unexpected client errors", () => {
  const fallbackMessage = "取得に失敗しました。時間を置いて再試行してください。";

  assert.equal(getUserFacingErrorMessage(new TypeError("Failed to fetch")), fallbackMessage);
  assert.equal(getUserFacingErrorMessage(new SyntaxError("Unexpected token '<'")), fallbackMessage);
  assert.equal(getUserFacingErrorMessage(new Error("Something went wrong")), fallbackMessage);
});

test("getUserFacingErrorMessage preserves approved API error messages", () => {
  assert.equal(
    getUserFacingErrorMessage({ userMessage: "対応しているURLは x.com または twitter.com のポストURLです。" }),
    "対応しているURLは x.com または twitter.com のポストURLです。"
  );
});

function createElement(overrides = {}) {
  const listeners = new Map();
  const attributes = new Map();
  const classes = new Set();
  return {
    textContent: "",
    value: "",
    disabled: false,
    hidden: false,
    href: "",
    focusCount: 0,
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
      toggle(name, force) {
        const shouldHave = force === undefined ? !classes.has(name) : force;
        if (shouldHave) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
        return shouldHave;
      }
    },
    focus() {
      this.focusCount += 1;
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    dispatch(type, event = {}) {
      return listeners.get(type)?.({
        preventDefault() {},
        ...event
      });
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    select() {},
    ...overrides
  };
}

function restoreGlobal(name, previousValue) {
  if (previousValue === undefined) {
    delete globalThis[name];
    return;
  }

  globalThis[name] = previousValue;
}

// globalThis.navigator はNodeでは読み取り専用getterのため、defineProperty経由で差し替える。
function overrideNavigator(value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { value, configurable: true, writable: true });
  return previous;
}

function restoreNavigator(previousDescriptor) {
  if (previousDescriptor) {
    Object.defineProperty(globalThis, "navigator", previousDescriptor);
    return;
  }

  delete globalThis.navigator;
}

async function createDomAppHarness(fetchImpl) {
  const elements = {
    "#extract-form": createElement(),
    "#post-url": createElement({ value: "https://x.com/example_user/status/67890" }),
    "#submit-button": createElement({ textContent: "取得" }),
    "#error-message": createElement(),
    "#archive-section": createElement(),
    "#gyotaku-link": createElement(),
    "#archive-url": createElement(),
    "#archive-status": createElement(),
    "#copy-text": createElement(),
    "#copy-button": createElement({ disabled: true }),
    "#copy-hint": createElement(),
    "#copy-message": createElement(),
    "#source-message": createElement()
  };

  const previousDocument = globalThis.document;
  const previousFetch = globalThis.fetch;
  globalThis.document = {
    querySelector(selector) {
      return elements[selector] || null;
    }
  };
  globalThis.fetch = fetchImpl;

  await import(`./app.js?dom-harness=${Date.now()}-${Math.random()}`);

  return {
    elements,
    submit() {
      return elements["#extract-form"].dispatch("submit");
    },
    copy() {
      return elements["#copy-button"].dispatch("click");
    },
    cleanup() {
      restoreGlobal("document", previousDocument);
      restoreGlobal("fetch", previousFetch);
    }
  };
}

function createJsonResponse(payload, ok = true) {
  return {
    ok,
    json: async () => payload
  };
}

test("validatePostUrl accepts canonical and i/web/status URLs", () => {
  assert.deepEqual(validatePostUrl("https://x.com/example_user/status/67890"), { valid: true });
  assert.deepEqual(validatePostUrl("https://twitter.com/example_user/status/67890"), { valid: true });
  assert.deepEqual(validatePostUrl("https://x.com/i/web/status/67890"), { valid: true });
  assert.deepEqual(validatePostUrl(" https://x.com/example_user/status/67890 "), { valid: true });
});

test("validatePostUrl reports specific codes for invalid input", () => {
  assert.deepEqual(validatePostUrl(""), { valid: false, code: "invalid_input" });
  assert.deepEqual(validatePostUrl("not a url"), { valid: false, code: "invalid_url" });
  assert.deepEqual(validatePostUrl("http://x.com/example_user/status/67890"), { valid: false, code: "invalid_protocol" });
  assert.deepEqual(validatePostUrl("https://example.com/example_user/status/67890"), { valid: false, code: "invalid_host" });
  assert.deepEqual(validatePostUrl("https://x.com/example_user"), { valid: false, code: "invalid_path" });
  assert.deepEqual(validatePostUrl("https://x.com/invalid-name!/status/67890"), { valid: false, code: "invalid_username" });
  assert.deepEqual(validatePostUrl("https://x.com/example_user/status/abc"), { valid: false, code: "invalid_post_id" });
});

test("submit flow shows loading state while extract is pending", async () => {
  let resolveFetch;
  const pendingFetch = new Promise((resolve) => {
    resolveFetch = resolve;
  });
  const harness = await createDomAppHarness(() => pendingFetch);

  try {
    const submitPromise = harness.submit();

    assert.equal(harness.elements["#submit-button"].disabled, true);
    assert.equal(harness.elements["#submit-button"].textContent, "取得中…");
    assert.equal(harness.elements["#post-url"].disabled, true);
    assert.equal(harness.elements["#extract-form"].getAttribute("aria-busy"), "true");

    resolveFetch(createJsonResponse(basePost));
    await submitPromise;

    assert.equal(harness.elements["#submit-button"].disabled, false);
    assert.equal(harness.elements["#submit-button"].textContent, "取得");
    assert.equal(harness.elements["#post-url"].disabled, false);
    assert.equal(harness.elements["#extract-form"].getAttribute("aria-busy"), null);
  } finally {
    harness.cleanup();
  }
});

test("submit flow hides copy hint after a successful extract", async () => {
  const harness = await createDomAppHarness(() => Promise.resolve(createJsonResponse(basePost)));

  try {
    assert.equal(harness.elements["#copy-hint"].hidden, false);
    await harness.submit();

    assert.equal(harness.elements["#copy-button"].disabled, false);
    assert.equal(harness.elements["#copy-hint"].hidden, true);
  } finally {
    harness.cleanup();
  }
});

test("submit flow rejects invalid URLs on the client without fetching", async () => {
  let fetchCalls = 0;
  const harness = await createDomAppHarness(() => {
    fetchCalls += 1;
    return Promise.resolve(createJsonResponse(basePost));
  });
  harness.elements["#post-url"].value = "not a url";

  try {
    await harness.submit();

    assert.equal(fetchCalls, 0);
    assert.equal(
      harness.elements["#error-message"].textContent,
      "URLの形式を確認してください。例：https://x.com/username/status/1234567890"
    );
    assert.ok(harness.elements["#error-message"].focusCount >= 1);
    assert.equal(harness.elements["#gyotaku-link"].getAttribute("aria-disabled"), "true");
    assert.equal(harness.elements["#archive-url"].disabled, true);
  } finally {
    harness.cleanup();
  }
});

test("submit flow moves focus to the error message when the server returns an error", async () => {
  const harness = await createDomAppHarness(() =>
    Promise.resolve(createJsonResponse({ code: "oembed_404" }, false))
  );

  try {
    await harness.submit();

    assert.equal(
      harness.elements["#error-message"].textContent,
      "対象のポストを取得できませんでした。削除済み、非公開、または埋め込み不可の可能性があります。"
    );
    assert.ok(harness.elements["#error-message"].focusCount >= 1);
  } finally {
    harness.cleanup();
  }
});

test("archive link and input stay disabled until a post is extracted", async () => {
  const harness = await createDomAppHarness(() => Promise.resolve(createJsonResponse(basePost)));

  try {
    assert.equal(harness.elements["#gyotaku-link"].getAttribute("aria-disabled"), "true");
    assert.equal(harness.elements["#archive-url"].disabled, true);
    assert.match(harness.elements["#archive-status"].textContent, /取得すると/);

    await harness.submit();

    assert.equal(harness.elements["#gyotaku-link"].getAttribute("aria-disabled"), null);
    assert.equal(harness.elements["#archive-url"].disabled, false);
    assert.equal(
      harness.elements["#gyotaku-link"].href,
      "https://gyo.tc/https://x.com/example_user/status/67890"
    );
    assert.match(harness.elements["#archive-status"].textContent, /リセット/);
  } finally {
    harness.cleanup();
  }
});

test("archive link returns to disabled state after an error", async () => {
  let call = 0;
  const harness = await createDomAppHarness(() => {
    call += 1;
    return call === 1
      ? Promise.resolve(createJsonResponse(basePost))
      : Promise.resolve(createJsonResponse({ code: "oembed_429" }, false));
  });

  try {
    await harness.submit();
    assert.equal(harness.elements["#gyotaku-link"].getAttribute("aria-disabled"), null);

    await harness.submit();
    assert.equal(harness.elements["#gyotaku-link"].getAttribute("aria-disabled"), "true");
    assert.equal(harness.elements["#archive-url"].disabled, true);
  } finally {
    harness.cleanup();
  }
});

test("re-extracting the same post keeps the entered archive URL", async () => {
  const harness = await createDomAppHarness(() => Promise.resolve(createJsonResponse(basePost)));

  try {
    await harness.submit();
    harness.elements["#archive-url"].value = "https://megalodon.jp/2026-0509-0000-00/example";

    await harness.submit();

    assert.equal(
      harness.elements["#archive-url"].value,
      "https://megalodon.jp/2026-0509-0000-00/example"
    );
  } finally {
    harness.cleanup();
  }
});

test("extracting a different post resets the entered archive URL", async () => {
  let call = 0;
  const harness = await createDomAppHarness(() => {
    call += 1;
    return Promise.resolve(
      createJsonResponse(
        call === 1
          ? basePost
          : { ...basePost, postUrl: "https://x.com/example_user/status/99999" }
      )
    );
  });

  try {
    await harness.submit();
    harness.elements["#archive-url"].value = "https://megalodon.jp/2026-0509-0000-00/example";

    await harness.submit();

    assert.equal(harness.elements["#archive-url"].value, "");
  } finally {
    harness.cleanup();
  }
});

test("copy button reports success with a success style via the clipboard API", async () => {
  let written = "";
  const previousNavigator = overrideNavigator({ clipboard: { writeText: async (value) => { written = value; } } });
  const harness = await createDomAppHarness(() => Promise.resolve(createJsonResponse(basePost)));

  try {
    await harness.submit();
    await harness.copy();

    assert.equal(harness.elements["#copy-message"].textContent, "コピーしました。");
    assert.equal(harness.elements["#copy-message"].classList.contains("is-success"), true);
    assert.match(written, /アカウント名：Example/);
  } finally {
    harness.cleanup();
    restoreNavigator(previousNavigator);
  }
});

test("copy button gives manual instructions when the clipboard API is unavailable", async () => {
  const previousNavigator = overrideNavigator({});
  const harness = await createDomAppHarness(() => Promise.resolve(createJsonResponse(basePost)));

  try {
    await harness.submit();
    await harness.copy();

    assert.match(harness.elements["#copy-message"].textContent, /自動コピーできませんでした/);
    assert.match(harness.elements["#copy-message"].textContent, /Ctrl\+C/);
    assert.equal(harness.elements["#copy-message"].classList.contains("is-success"), false);
  } finally {
    harness.cleanup();
    restoreNavigator(previousNavigator);
  }
});

test("starting a new extract clears prior copy success feedback", async () => {
  const previousNavigator = overrideNavigator({ clipboard: { writeText: async () => {} } });
  const harness = await createDomAppHarness(() => Promise.resolve(createJsonResponse(basePost)));

  try {
    await harness.submit();
    await harness.copy();
    assert.equal(harness.elements["#copy-message"].classList.contains("is-success"), true);

    await harness.submit();
    assert.equal(harness.elements["#copy-message"].textContent, "");
    assert.equal(harness.elements["#copy-message"].classList.contains("is-success"), false);
  } finally {
    harness.cleanup();
    restoreNavigator(previousNavigator);
  }
});
