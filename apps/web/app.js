const ARCHIVE_URL_PATTERN = /^https:\/\/(?:megalodon\.jp|s[0-9]+\.megalodon\.jp)\/\S+$/;
const ERROR_MESSAGES = new Map([
  ["invalid_protocol", "httpsのXポストURLを入力してください。"],
  ["invalid_host", "対応しているURLは x.com または twitter.com のポストURLです。"],
  ["invalid_path", "XポストURLの形式を確認してください。"],
  ["invalid_username", "Xのユーザー名を含むポストURLを入力してください。"],
  ["invalid_post_id", "ポストIDを含むXポストURLを入力してください。"],
  ["rate_limit_exceeded", "アクセスが集中しています。少し時間を置いて再試行してください。"],
  ["oembed_404", "対象のポストを取得できませんでした。削除済み、非公開、または埋め込み不可の可能性があります。"],
  ["oembed_429", "取得先が混雑しています。少し時間を置いて再試行してください。"],
  ["oembed_5xx", "取得先で一時的な問題が発生しています。時間を置いて再試行してください。"],
  ["oembed_error", "ポスト情報を取得できませんでした。時間を置いて再試行してください。"],
  ["x_api_401", "X APIの認証設定に問題があります。管理者側の確認が必要です。"],
  ["x_api_402", "X APIの利用枠または課金設定により取得できません。管理者側の確認が必要です。"],
  ["x_api_403", "X APIの権限またはプラン設定により取得できません。管理者側の確認が必要です。"],
  ["x_api_404", "対象のポストを取得できませんでした。削除済み、非公開、または権限不足の可能性があります。"],
  ["x_api_429", "X APIの利用上限に達している可能性があります。時間を置いて再試行してください。"],
  ["x_api_5xx", "X API側で一時的な問題が発生しています。時間を置いて再試行してください。"],
  ["x_api_error", "X APIからポスト情報を取得できませんでした。時間を置いて再試行してください。"]
]);
const GENERIC_FETCH_ERROR_MESSAGE = "取得に失敗しました。時間を置いて再試行してください。";
const WARNING_MESSAGES = new Map([
  ["最新取得に失敗したため期限切れキャッシュを返しました。", "最新情報を取得できなかったため、古い可能性があるキャッシュを表示しています。"],
  ["公式API未使用のため画像URLを取得できない場合があります。", "画像URLを取得できない場合があります。"],
  ["media_urls_unavailable", "画像や動画の直接URLを取得できませんでした。"],
  ["media_direct_url_unavailable", "一部メディアの直接URLを取得できませんでした。"],
  ["media_metadata_missing", "一部メディア情報を取得できませんでした。"],
  ["X API provider failed; used oEmbed fallback.", "X APIで取得できなかったため、取得できる範囲の情報を表示しています。"]
]);

export function buildGyotakuUrl(postUrl) {
  return `https://gyo.tc/${postUrl}`;
}

export function getUserErrorMessage(payload) {
  const code = typeof payload?.code === "string" ? payload.code : "";
  return ERROR_MESSAGES.get(code) || GENERIC_FETCH_ERROR_MESSAGE;
}

function createUserFacingError(message) {
  const error = new Error(message);
  error.userMessage = message;
  return error;
}

export function getUserFacingErrorMessage(error) {
  return typeof error?.userMessage === "string" && error.userMessage
    ? error.userMessage
    : GENERIC_FETCH_ERROR_MESSAGE;
}

export function isValidArchiveUrl(value) {
  const rawValue = String(value || "");
  return !hasArchiveUrlPasteNoise(rawValue) && ARCHIVE_URL_PATTERN.test(rawValue);
}

export function hasArchiveUrlPasteNoise(value) {
  return /\s/.test(String(value || ""));
}

function formatMediaUrls(mediaUrls) {
  if (!Array.isArray(mediaUrls)) {
    return "なし";
  }

  const validUrls = [];
  for (const url of mediaUrls) {
    if (typeof url !== "string" || url.trim() === "") {
      continue;
    }

    const trimmedUrl = url.trim();
    if (!validUrls.includes(trimmedUrl)) {
      validUrls.push(trimmedUrl);
    }
  }

  return validUrls.length > 0 ? validUrls.join("\n") : "なし";
}

export function buildCopyText(post, archiveUrl = "") {
  const validArchiveUrl = isValidArchiveUrl(archiveUrl) ? archiveUrl.trim() : "未取得";
  const mediaUrls = formatMediaUrls(post.mediaUrls);
  const accountName = post.accountName || post.authorName || "未取得";
  const postUrl = post.postUrl || post.canonicalUrl || "未取得";
  const userNumericId = post.userNumericId || "未取得";
  const username = post.username || "";
  const accountId = username && username !== "未取得" ? `@${username}` : "未取得";
  const createdAt = post.createdAt || "未取得";
  const text = post.text || "未取得";

  return [
    `アカウント名：${accountName}`,
    `アカウントID：${accountId}`,
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

  for (const warning of Array.isArray(post.warnings) ? post.warnings : []) {
    const mappedWarning =
      WARNING_MESSAGES.get(warning) ||
      (String(warning).startsWith("X API provider failed with status ")
        ? "X APIで取得できなかったため、取得できる範囲の情報を表示しています。"
        : "");
    if (mappedWarning && !messages.includes(mappedWarning)) {
      messages.push(mappedWarning);
    }
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
        throw createUserFacingError(getUserErrorMessage(payload));
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
      setText(errorMessage, getUserFacingErrorMessage(error));
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
