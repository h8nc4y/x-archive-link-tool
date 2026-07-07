import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMarkdownCopyText,
  buildCopyText,
  buildGyotakuUrl,
  buildArchiveServiceLinks,
  buildPostImageLines,
  buildSourceMessage,
  extractPostDate,
  extractPostText,
  formatCreatedAt,
  getUserErrorMessage,
  getUserFacingErrorMessage,
  hasArchiveUrlPasteNoise,
  isValidArchiveUrl,
  uploadRecordImage,
  validatePostUrl,
  wrapTextForCanvas
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

test("formatCreatedAt keeps ISO text or formats only the UTC date in Japanese", () => {
  assert.equal(formatCreatedAt("2026-05-09T00:00:00.000Z", "iso"), "2026-05-09T00:00:00.000Z");
  assert.equal(formatCreatedAt("2026-05-09T23:59:59.000Z", "japanese"), "2026年05月09日");
  assert.equal(formatCreatedAt("", "japanese"), "未取得");
});

test("buildCopyText can show the post date in Japanese date format", () => {
  const text = buildCopyText(basePost, "", { dateFormat: "japanese" });

  assert.match(text, /ポスト投稿日：2026年05月09日/);
});

test("buildMarkdownCopyText formats the same fields for Markdown paste targets", () => {
  const text = buildMarkdownCopyText(
    basePost,
    "https://megalodon.jp/2026-0509-0000-00/example",
    { dateFormat: "japanese" }
  );

  assert.match(text, /^- アカウント名：Example/m);
  assert.match(text, /^- アカウントID：@example_user/m);
  assert.match(text, /^- ポスト投稿日：2026年05月09日/m);
  assert.match(text, new RegExp("^## ポスト内容\\nplain post text", "m"));
  assert.match(text, new RegExp("^## 魚拓URL\\nhttps://megalodon\\.jp/2026-0509-0000-00/example", "m"));
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

test("buildArchiveServiceLinks returns the four archive services with correct hrefs", () => {
  const links = buildArchiveServiceLinks(basePost.postUrl);
  assert.deepEqual(
    links.map((link) => link.id),
    ["gyotaku-link", "wayback-link", "archivetoday-link", "twtr-link"]
  );
  const byId = Object.fromEntries(links.map((link) => [link.id, link.href]));
  assert.equal(byId["gyotaku-link"], "https://gyo.tc/https://x.com/example_user/status/67890");
  assert.equal(byId["wayback-link"], "https://web.archive.org/save/https://x.com/example_user/status/67890");
  assert.equal(byId["archivetoday-link"], "https://archive.ph/newest/https://x.com/example_user/status/67890");
  // twtr.satoru.net は GET フォーム相当の deep link（mode=check + url、urlはエンコード）。
  assert.equal(
    byId["twtr-link"],
    "https://twtr.satoru.net/?mode=check&url=https%3A%2F%2Fx.com%2Fexample_user%2Fstatus%2F67890"
  );
  for (const link of links) {
    assert.equal(typeof link.label, "string");
    assert.ok(link.label.length > 0);
  }
});

test("isValidArchiveUrl accepts each linked service host and rejects others", () => {
  assert.equal(isValidArchiveUrl("https://megalodon.jp/2026-0509-0000-00/example"), true);
  assert.equal(isValidArchiveUrl("https://s1.megalodon.jp/2026-0509-0000-00/example"), true);
  assert.equal(isValidArchiveUrl("https://gyo.tc/abcdef"), true);
  assert.equal(isValidArchiveUrl("https://web.archive.org/web/20260504/https://x.com/a/status/1"), true);
  assert.equal(isValidArchiveUrl("https://archive.ph/newest/https://x.com/a/status/1"), true);
  assert.equal(isValidArchiveUrl("https://archive.today/abcd1"), true);
  // 許可外ホスト・非httpsは拒否する。
  assert.equal(isValidArchiveUrl("https://evil.example/2026/example"), false);
  assert.equal(isValidArchiveUrl("http://megalodon.jp/2026-0509-0000-00/example"), false);
  assert.equal(isValidArchiveUrl("https://megalodon.jp"), false);
  assert.equal(isValidArchiveUrl("https://megalodon.jp/with space"), false);
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
  assert.equal(
    buildSourceMessage({ source: "oembed", userNumericId: "未取得" }),
    "公式API未使用のため画像URLを取得できない場合があります。 ユーザー数値IDはX API使用時のみ取得できます。"
  );
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
  const { initialAttributes = {}, ...elementOverrides } = overrides;
  const listeners = new Map();
  const attributes = new Map(Object.entries(initialAttributes));
  const classes = new Set();
  return {
    textContent: "",
    value: "",
    disabled: false,
    hidden: false,
    // 実DOMの <a>.href は href属性を反映する。mockでもプロパティ代入と
    // setAttribute/removeAttribute が同じ attributes マップを共有させ、
    // 「有効化=プロパティ代入 / 無効化=removeAttribute」を実DOMと同じ観測にする。
    // これにより無効化ループの removeAttribute("href") 欠落を回帰として検出できる。
    get href() {
      return attributes.has("href") ? attributes.get("href") : "";
    },
    set href(value) {
      attributes.set("href", String(value));
    },
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
    ...elementOverrides
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
    "#post-url-paste-message": createElement(),
    "#archive-section": createElement(),
    "#gyotaku-link": createElement(),
    "#wayback-link": createElement(),
    "#archivetoday-link": createElement(),
    "#twtr-link": createElement(),
    "#archive-url": createElement(),
    "#archive-status": createElement(),
    "#format-plain": createElement({ checked: true }),
    "#format-markdown": createElement({ checked: false }),
    "#date-iso": createElement({ checked: true }),
    "#date-japanese": createElement({ checked: false }),
    "#copy-text": createElement(),
    "#copy-button": createElement({ disabled: true, initialAttributes: { "aria-describedby": "copy-hint" } }),
    "#copy-hint": createElement(),
    "#copy-message": createElement(),
    "#source-message": createElement(),
    "#image-create-button": createElement({ disabled: true }),
    "#image-preview": createElement({ hidden: true }),
    "#image-download-link": createElement({ hidden: true }),
    "#image-upload-button": createElement({ disabled: true }),
    "#image-url-output": createElement(),
    "#image-url-copy-button": createElement({ hidden: true }),
    "#image-message": createElement()
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
    change(selector) {
      return elements[selector].dispatch("change");
    },
    copy() {
      return elements["#copy-button"].dispatch("click");
    },
    createImage() {
      return elements["#image-create-button"].dispatch("click");
    },
    cleanup() {
      restoreGlobal("document", previousDocument);
      restoreGlobal("fetch", previousFetch);
    }
  };
}

function createJsonResponse(payload, ok = true, status = ok ? 200 : 404) {
  return {
    ok,
    status,
    json: async () => payload
  };
}

function pasteText(element, text) {
  let prevented = false;
  element.dispatch("paste", {
    clipboardData: {
      getData: () => text
    },
    preventDefault() {
      prevented = true;
    }
  });
  return prevented;
}

test("validatePostUrl accepts canonical and i/web/status URLs", () => {
  assert.deepEqual(validatePostUrl("https://x.com/example_user/status/67890"), {
    valid: true,
    username: "example_user",
    postId: "67890",
    canonicalUrl: "https://x.com/example_user/status/67890"
  });
  assert.deepEqual(validatePostUrl("https://twitter.com/example_user/status/67890"), {
    valid: true,
    username: "example_user",
    postId: "67890",
    canonicalUrl: "https://x.com/example_user/status/67890"
  });
  assert.deepEqual(validatePostUrl("https://x.com/i/web/status/67890"), {
    valid: true,
    username: null,
    postId: "67890",
    canonicalUrl: "https://x.com/i/web/status/67890"
  });
  assert.deepEqual(validatePostUrl(" https://x.com/example_user/status/67890 "), {
    valid: true,
    username: "example_user",
    postId: "67890",
    canonicalUrl: "https://x.com/example_user/status/67890"
  });
});

test("extractPostText pulls the first <p> element and decodes entities", () => {
  assert.equal(
    extractPostText("<blockquote><p>hello &amp; world &#39;test&#39;</p></blockquote>"),
    "hello & world 'test'"
  );
  assert.equal(extractPostText(""), "未取得");
  assert.equal(extractPostText("<blockquote>no paragraph here</blockquote>"), "未取得");
});

test("extractPostDate finds the anchor linking to the post status and decodes its text", () => {
  const html =
    '<blockquote><p>dummy text</p>&mdash; Example User (@example_user) ' +
    '<a href="https://twitter.com/example_user/status/67890">May 9, 2026</a></blockquote>';
  assert.equal(extractPostDate(html, "67890"), "May 9, 2026");
  assert.equal(extractPostDate(html, "99999"), "未取得");
  assert.equal(extractPostDate("", "67890"), "未取得");
});

test("validatePostUrl reports specific codes for invalid input", () => {
  assert.deepEqual(validatePostUrl(""), { valid: false, code: "invalid_input" });
  assert.deepEqual(validatePostUrl("not a url"), { valid: false, code: "invalid_url" });
  assert.deepEqual(validatePostUrl("http://x.com/example_user/status/67890"), { valid: false, code: "invalid_protocol" });
  assert.deepEqual(validatePostUrl("https://example.com/example_user/status/67890"), { valid: false, code: "invalid_host" });
  assert.deepEqual(validatePostUrl("https://x.com/example_user"), { valid: false, code: "invalid_path" });
  assert.deepEqual(validatePostUrl("https://x.com/invalid-name!/status/67890"), { valid: false, code: "invalid_username" });
  assert.deepEqual(validatePostUrl("https://x.com/example_user/status/abc"), { valid: false, code: "invalid_post_id" });
  assert.deepEqual(validatePostUrl("https://x.com/example_user/status/67890\n余分な本文"), {
    valid: false,
    code: "invalid_url"
  });
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
    assert.equal(harness.elements["#copy-button"].getAttribute("aria-describedby"), null);
  } finally {
    harness.cleanup();
  }
});

test("output settings update the generated copy text without a new fetch", async () => {
  let fetchCalls = 0;
  const harness = await createDomAppHarness(() => {
    fetchCalls += 1;
    return Promise.resolve(createJsonResponse(basePost));
  });

  try {
    await harness.submit();
    assert.equal(fetchCalls, 1);
    assert.match(harness.elements["#copy-text"].value, /アカウント名：Example/);
    assert.match(harness.elements["#copy-text"].value, /ポスト投稿日：2026-05-09T00:00:00.000Z/);

    harness.elements["#format-plain"].checked = false;
    harness.elements["#format-markdown"].checked = true;
    await harness.change("#format-markdown");
    assert.match(harness.elements["#copy-text"].value, new RegExp("^## ポスト内容\\nplain post text", "m"));

    harness.elements["#date-iso"].checked = false;
    harness.elements["#date-japanese"].checked = true;
    await harness.change("#date-japanese");
    assert.match(harness.elements["#copy-text"].value, /^- ポスト投稿日：2026年05月09日/m);
    assert.equal(fetchCalls, 1);
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

test("post URL paste trims surrounding whitespace before submitting", async () => {
  let requestBody = "";
  const harness = await createDomAppHarness((_url, options) => {
    requestBody = options.body;
    return Promise.resolve(createJsonResponse(basePost));
  });

  try {
    const prevented = pasteText(harness.elements["#post-url"], "\n https://x.com/example_user/status/67890 \r\n");

    assert.equal(prevented, true);
    assert.equal(harness.elements["#post-url"].value, "https://x.com/example_user/status/67890");
    assert.equal(harness.elements["#post-url-paste-message"].textContent, "");

    await harness.submit();

    assert.equal(JSON.parse(requestBody).url, "https://x.com/example_user/status/67890");
  } finally {
    harness.cleanup();
  }
});

test("post URL paste warns when extra text remains after trimming", async () => {
  let fetchCalls = 0;
  const harness = await createDomAppHarness(() => {
    fetchCalls += 1;
    return Promise.resolve(createJsonResponse(basePost));
  });

  try {
    const prevented = pasteText(harness.elements["#post-url"], "https://x.com/example_user/status/67890\n余分な本文");

    assert.equal(prevented, true);
    assert.equal(harness.elements["#post-url"].value, "https://x.com/example_user/status/67890\n余分な本文");
    assert.equal(
      harness.elements["#post-url-paste-message"].textContent,
      "XポストURLに余分な文字が含まれています。URLだけを貼り付けてください。"
    );

    await harness.submit();

    assert.equal(fetchCalls, 0);
    assert.equal(
      harness.elements["#error-message"].textContent,
      "URLの形式を確認してください。例：https://x.com/username/status/1234567890"
    );
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

test("oembed_unreachable triggers a browser-direct oEmbed fallback that succeeds", async () => {
  const requestedUrls = [];
  const harness = await createDomAppHarness((url) => {
    requestedUrls.push(String(url));
    if (requestedUrls.length === 1) {
      // 1回目: /api/extract がWorkers遮断でoembed_unreachableを返す想定。
      return Promise.resolve(createJsonResponse({ code: "oembed_unreachable" }, false));
    }

    // 2回目: ブラウザから publish.x.com へ直接アクセスした想定のダミーoEmbed応答。
    return Promise.resolve(
      createJsonResponse({
        author_name: "Example Dummy",
        html: '<blockquote><p>direct fallback text</p>&mdash; Example Dummy (@example_user) ' +
          '<a href="https://twitter.com/example_user/status/67890">May 9, 2026</a></blockquote>'
      })
    );
  });

  try {
    await harness.submit();

    assert.equal(requestedUrls.length, 2);
    assert.equal(requestedUrls[0], "/api/extract");
    assert.match(requestedUrls[1], /^https:\/\/publish\.x\.com\/oembed\?/);
    assert.match(harness.elements["#copy-text"].value, /direct fallback text/);
    assert.match(harness.elements["#copy-text"].value, /アカウント名：Example Dummy/);
    assert.match(harness.elements["#source-message"].textContent, /直接アクセス/);
  } finally {
    harness.cleanup();
  }
});

test("oembed_unreachable fallback surfaces the oembed_404 message when the direct fetch also fails", async () => {
  let call = 0;
  const harness = await createDomAppHarness(() => {
    call += 1;
    if (call === 1) {
      return Promise.resolve(createJsonResponse({ code: "oembed_unreachable" }, false));
    }

    return Promise.resolve(createJsonResponse({}, false));
  });

  try {
    await harness.submit();

    assert.equal(call, 2);
    assert.equal(
      harness.elements["#error-message"].textContent,
      "対象のポストを取得できませんでした。削除済み、非公開、または埋め込み不可の可能性があります。"
    );
  } finally {
    harness.cleanup();
  }
});

test("archive link and input stay disabled until a post is extracted", async () => {
  const harness = await createDomAppHarness(() => Promise.resolve(createJsonResponse(basePost)));

  try {
    for (const id of ["#gyotaku-link", "#wayback-link", "#archivetoday-link", "#twtr-link"]) {
      assert.equal(harness.elements[id].getAttribute("aria-disabled"), "true");
    }
    assert.equal(harness.elements["#archive-url"].disabled, true);
    assert.match(harness.elements["#archive-status"].textContent, /取得すると/);

    await harness.submit();

    for (const id of ["#gyotaku-link", "#wayback-link", "#archivetoday-link", "#twtr-link"]) {
      assert.equal(harness.elements[id].getAttribute("aria-disabled"), null);
    }
    assert.equal(harness.elements["#archive-url"].disabled, false);
    assert.equal(
      harness.elements["#gyotaku-link"].href,
      "https://gyo.tc/https://x.com/example_user/status/67890"
    );
    assert.equal(
      harness.elements["#wayback-link"].href,
      "https://web.archive.org/save/https://x.com/example_user/status/67890"
    );
    assert.equal(
      harness.elements["#archivetoday-link"].href,
      "https://archive.ph/newest/https://x.com/example_user/status/67890"
    );
    assert.match(harness.elements["#archive-status"].textContent, /リセット/);
  } finally {
    harness.cleanup();
  }
});

test("archive URL paste trims surrounding whitespace and keeps the archive URL usable", async () => {
  const harness = await createDomAppHarness(() => Promise.resolve(createJsonResponse(basePost)));

  try {
    await harness.submit();

    const prevented = pasteText(
      harness.elements["#archive-url"],
      "\r\n https://megalodon.jp/2026-0509-0000-00/example \n"
    );

    assert.equal(prevented, true);
    assert.equal(harness.elements["#archive-url"].value, "https://megalodon.jp/2026-0509-0000-00/example");
    assert.match(harness.elements["#copy-text"].value, /魚拓URL：\nhttps:\/\/megalodon\.jp\/2026-0509-0000-00\/example/);
    assert.match(harness.elements["#archive-status"].textContent, /リセット/);
  } finally {
    harness.cleanup();
  }
});

test("archive URL paste warns and excludes extra pasted text from copy output", async () => {
  const harness = await createDomAppHarness(() => Promise.resolve(createJsonResponse(basePost)));

  try {
    await harness.submit();

    const prevented = pasteText(
      harness.elements["#archive-url"],
      "https://megalodon.jp/2026-0509-0000-00/example\n余分な本文"
    );

    assert.equal(prevented, true);
    assert.equal(
      harness.elements["#archive-status"].textContent,
      "魚拓URLに余分な文字が含まれています。URLだけを貼り付けてください。"
    );
    assert.match(harness.elements["#copy-text"].value, /魚拓URL：\n未取得/);
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
    for (const id of ["#gyotaku-link", "#wayback-link", "#archivetoday-link", "#twtr-link"]) {
      assert.equal(harness.elements[id].getAttribute("aria-disabled"), "true");
      // 無効化ではhref属性を実際に除去して非ナビゲート状態にする（有効化はプロパティ代入）。
      // 属性を検証することで、無効化ループのremoveAttribute("href")欠落を回帰として捕捉する。
      assert.equal(harness.elements[id].getAttribute("href"), null);
    }
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

// ===== 記録画像（任意機能） =====

test("wrapTextForCanvas splits full-width Japanese text at the given weight limit", () => {
  // 全角10文字ちょうど（重み10）はmaxChars=10ぴったりに収まり、分割されない。
  assert.deepEqual(wrapTextForCanvas("あいうえおかきくけこ", 10), ["あいうえおかきくけこ"]);

  // 全角11文字（重み11）はmaxChars=10を超えるため、10文字目と11文字目の間で改行される。
  assert.deepEqual(wrapTextForCanvas("あいうえおかきくけこさ", 10), ["あいうえおかきくけこ", "さ"]);
});

test("wrapTextForCanvas preserves explicit newlines as separate lines", () => {
  assert.deepEqual(wrapTextForCanvas("1行目\n2行目", 10), ["1行目", "2行目"]);
  // 空行（連続する改行）もそのまま保持する。
  assert.deepEqual(wrapTextForCanvas("1行目\n\n3行目", 10), ["1行目", "", "3行目"]);
});

test("wrapTextForCanvas treats half-width characters as half weight", () => {
  // 半角20文字（重み10）はmaxChars=10ぴったりに収まり、分割されない。
  const halfWidth = "0123456789abcdefghi9";
  assert.equal(halfWidth.length, 20);
  assert.deepEqual(wrapTextForCanvas(halfWidth, 10), [halfWidth]);

  // 半角21文字（重み10.5）はmaxChars=10を超えるため分割される。
  const overLimit = `${halfWidth}x`;
  const wrapped = wrapTextForCanvas(overLimit, 10);
  assert.equal(wrapped.length, 2);
  assert.equal(wrapped.join(""), overLimit);
});

test("buildPostImageLines assembles header, wrapped body, and meta lines", () => {
  const lines = buildPostImageLines(basePost, { now: "2026-07-07 12:00" });

  assert.equal(lines.header, "Example @example_user");
  assert.deepEqual(lines.body, wrapTextForCanvas("plain post text", 24));
  assert.deepEqual(lines.meta, [
    "投稿日：2026-05-09T00:00:00.000Z",
    "ポストURL：https://x.com/example_user/status/67890",
    "取得日時：2026-07-07 12:00",
    "x-archive-link-tool で作成"
  ]);
});

test("buildPostImageLines passes through 未取得 values without throwing", () => {
  const lines = buildPostImageLines(
    {
      accountName: "未取得",
      username: "未取得",
      postUrl: "未取得",
      createdAt: "未取得",
      text: "未取得"
    },
    { now: "未取得" }
  );

  assert.equal(lines.header, "未取得 @未取得");
  assert.deepEqual(lines.body, ["未取得"]);
  assert.deepEqual(lines.meta, [
    "投稿日：未取得",
    "ポストURL：未取得",
    "取得日時：未取得",
    "x-archive-link-tool で作成"
  ]);
});

test("uploadRecordImage posts to /api/upload-image and resolves the same-origin /i/{id} URL on success (fetch mocked, no real network)", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/upload-image");
    assert.equal(init.method, "POST");
    assert.ok(init.body instanceof FormData);
    return {
      ok: true,
      status: 200,
      json: async () => ({ url: "https://example.pages.dev/i/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d" })
    };
  };

  try {
    const result = await uploadRecordImage(new Blob(["dummy"]));
    assert.deepEqual(result, { url: "https://example.pages.dev/i/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d" });
  } finally {
    restoreGlobal("fetch", previousFetch);
  }
});

test("uploadRecordImage throws a Japanese-friendly hint when R2 binding is not configured (fetch mocked, no real network)", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    json: async () => ({ code: "upload_not_configured" })
  });

  try {
    await assert.rejects(
      uploadRecordImage(new Blob(["dummy"])),
      /アップロード機能は準備中です/
    );
  } finally {
    restoreGlobal("fetch", previousFetch);
  }
});

test("uploadRecordImage throws a Japanese-friendly error on rate limit (fetch mocked, no real network)", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ code: "upload_429" })
  });

  try {
    await assert.rejects(
      uploadRecordImage(new Blob(["dummy"])),
      /アップロード先が混雑しています/
    );
  } finally {
    restoreGlobal("fetch", previousFetch);
  }
});

test("uploadRecordImage throws a generic Japanese error on other failures (fetch mocked, no real network)", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 502,
    json: async () => ({ code: "upload_error" })
  });

  try {
    await assert.rejects(
      uploadRecordImage(new Blob(["dummy"])),
      /アップロードに失敗しました/
    );
  } finally {
    restoreGlobal("fetch", previousFetch);
  }
});

test("uploadRecordImage throws an unreachable error when fetch itself fails (network error, mocked)", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  try {
    await assert.rejects(
      uploadRecordImage(new Blob(["dummy"])),
      /アップロード先に接続できませんでした/
    );
  } finally {
    restoreGlobal("fetch", previousFetch);
  }
});

// DOMハーネスによる記録画像UIの検証。canvas APIはNode環境に無いため、
// renderPostImage自体の呼び出し（#image-create-buttonのclickハンドラ内部）はここでは検証せず、
// ボタンのenable/disableとポスト切り替え時のリセット動作だけを確認する。
// renderPostImage・canvas描画・toBlobの実挙動はブラウザ（Preview/Chrome MCP）検証に委ねる。
test("image create button is disabled until a post is fetched, then enabled", async () => {
  const harness = await createDomAppHarness(() => Promise.resolve(createJsonResponse(basePost)));

  try {
    assert.equal(harness.elements["#image-create-button"].disabled, true);

    await harness.submit();

    assert.equal(harness.elements["#image-create-button"].disabled, false);
  } finally {
    harness.cleanup();
  }
});

test("image create button is disabled again after a failed extract", async () => {
  const harness = await createDomAppHarness(() =>
    Promise.resolve(createJsonResponse({ code: "oembed_404" }, false))
  );

  try {
    await harness.submit();

    assert.equal(harness.elements["#image-create-button"].disabled, true);
    assert.equal(harness.elements["#image-message"].textContent, "");
  } finally {
    harness.cleanup();
  }
});

test("switching to a different post resets the image preview and upload URL state", async () => {
  let call = 0;
  const harness = await createDomAppHarness(() => {
    call += 1;
    const payload =
      call === 1
        ? basePost
        : { ...basePost, postUrl: "https://x.com/other_user/status/99999", postId: "99999" };
    return Promise.resolve(createJsonResponse(payload));
  });

  try {
    await harness.submit();
    // 1回目取得後は作成ボタンが有効。画像URL欄などは初期状態のまま。
    assert.equal(harness.elements["#image-create-button"].disabled, false);
    harness.elements["#image-url-output"].value = "https://example.pages.dev/i/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d";
    harness.elements["#image-url-copy-button"].hidden = false;

    await harness.submit();
    // 別ポスト取得でリセットされる。
    assert.equal(harness.elements["#image-url-output"].value, "");
    assert.equal(harness.elements["#image-url-copy-button"].hidden, true);
    assert.equal(harness.elements["#image-create-button"].disabled, false);
  } finally {
    harness.cleanup();
  }
});
