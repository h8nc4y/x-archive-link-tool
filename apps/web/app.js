const ARCHIVE_URL_PATTERN = /^https:\/\/(?:megalodon\.jp|s[0-9]+\.megalodon\.jp)\/\S+$/;

export function buildGyotakuUrl(postUrl) {
  return `https://gyo.tc/${postUrl}`;
}

export function isValidArchiveUrl(value) {
  return ARCHIVE_URL_PATTERN.test(String(value || "").trim());
}

export function hasArchiveUrlPasteNoise(value) {
  return /\s/.test(String(value || ""));
}

export function buildCopyText(post, archiveUrl = "") {
  const validArchiveUrl = isValidArchiveUrl(archiveUrl) ? archiveUrl.trim() : "未取得";
  const mediaUrls = Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 ? post.mediaUrls.join("\n") : "なし";
  const accountName = post.accountName || post.authorName || "未取得";
  const postUrl = post.postUrl || post.canonicalUrl || "未取得";
  const userNumericId = post.userNumericId || "未取得";
  const username = post.username || "未取得";
  const createdAt = post.createdAt || "未取得";
  const text = post.text || "未取得";

  return [
    `アカウント名：${accountName}`,
    `アカウントID：@${username}`,
    `ユーザー数値ID：${userNumericId}`,
    `ポストURL：${postUrl}`,
    `ポスト投稿日：${createdAt}`,
    "",
    "ポスト内容：",
    text,
    "",
    "メディアURL：",
    mediaUrls,
    "",
    "魚拓URL：",
    validArchiveUrl
  ].join("\n");
}

export function buildSourceMessage(post) {
  if (!post) {
    return "";
  }

  const messages = [];
  if (post.cached || post.source === "cache" || post.source === "stale-cache") {
    messages.push("キャッシュから表示しています。");
  }

  if (post.source === "oembed") {
    messages.push("公式API未使用のため画像URLを取得できない場合があります。");
  }

  return messages.join(" ");
}

function setText(element, value) {
  element.textContent = value;
}

function setupApp() {
  const form = document.querySelector("#extract-form");
  const urlInput = document.querySelector("#post-url");
  const submitButton = document.querySelector("#submit-button");
  const errorMessage = document.querySelector("#error-message");
  const archiveSection = document.querySelector("#archive-section");
  const gyotakuLink = document.querySelector("#gyotaku-link");
  const archiveInput = document.querySelector("#archive-url");
  const copyText = document.querySelector("#copy-text");
  const copyButton = document.querySelector("#copy-button");
  const copyMessage = document.querySelector("#copy-message");
  const sourceMessage = document.querySelector("#source-message");
  let currentPost = null;
  let archiveInputHasInvalidPaste = false;

  if (
    !form ||
    !urlInput ||
    !submitButton ||
    !errorMessage ||
    !archiveSection ||
    !gyotakuLink ||
    !archiveInput ||
    !copyText ||
    !copyButton ||
    !copyMessage ||
    !sourceMessage
  ) {
    return;
  }

  function refreshCopyText() {
    if (!currentPost) {
      copyText.value = "";
      copyButton.disabled = true;
      setText(sourceMessage, "");
      return;
    }

    copyText.value = buildCopyText(currentPost, archiveInputHasInvalidPaste ? "" : archiveInput.value);
    copyButton.disabled = false;
    setText(sourceMessage, buildSourceMessage(currentPost));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setText(errorMessage, "");
    setText(copyMessage, "");
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: urlInput.value })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "取得に失敗しました。");
      }

      currentPost = payload;
      archiveInput.value = "";
      archiveInputHasInvalidPaste = false;
      gyotakuLink.href = buildGyotakuUrl(payload.postUrl || payload.canonicalUrl);
      archiveSection.hidden = false;
      refreshCopyText();
    } catch (error) {
      currentPost = null;
      archiveSection.hidden = true;
      refreshCopyText();
      setText(errorMessage, error.message || "取得に失敗しました。");
    } finally {
      submitButton.disabled = false;
    }
  });

  archiveInput.addEventListener("paste", (event) => {
    const pastedText = event.clipboardData?.getData("text") || "";
    if (!hasArchiveUrlPasteNoise(pastedText)) {
      return;
    }

    event.preventDefault();
    archiveInput.value = pastedText.trim();
    archiveInputHasInvalidPaste = true;
    refreshCopyText();
  });

  archiveInput.addEventListener("input", () => {
    archiveInputHasInvalidPaste = false;
    refreshCopyText();
  });

  copyButton.addEventListener("click", async () => {
    if (!copyText.value) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText.value);
        setText(copyMessage, "コピーしました。");
        return;
      }
    } catch {
      // Fall through to manual selection.
    }

    copyText.select();
    setText(copyMessage, "選択状態にしました。手動でコピーしてください。");
  });
}

if (typeof document !== "undefined") {
  setupApp();
}
