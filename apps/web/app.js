// 貼り付け欄は、下の魚拓リンクで提示する各サービスの結果URLだけを許可する。
// 追加サービス（Wayback / archive.today / gyo.tc / twtr）をリンクした以上、
// それらの結果URLを弾かないようホスト許可リストをそろえる。
// archive.today は保存後に複数TLDのミラー（.today/.ph/.is/.md/.vn/.li/.fo）へ
// リダイレクトするため、結果URLを弾かないようミラーTLD群をまとめて許可する。
const ARCHIVE_URL_PATTERN =
  /^https:\/\/(?:(?:s[0-9]+\.)?megalodon\.jp|gyo\.tc|web\.archive\.org|archive\.(?:today|ph|is|md|vn|li|fo)|twtr\.satoru\.net)\/\S+$/;
const POST_URL_ALLOWED_HOSTS = new Set(["x.com", "twitter.com", "mobile.twitter.com"]);
const POST_URL_USERNAME_PATTERN = /^[A-Za-z0-9_]{1,15}$/;
const POST_URL_POST_ID_PATTERN = /^[0-9]{1,19}$/;
const ERROR_MESSAGES = new Map([
  ["invalid_input", "XポストURLを入力してください。"],
  ["invalid_url", "URLの形式を確認してください。例：https://x.com/username/status/1234567890"],
  ["invalid_protocol", "httpsのXポストURLを入力してください。"],
  ["invalid_host", "対応しているURLは x.com または twitter.com のポストURLです。"],
  ["invalid_path", "XポストURLの形式を確認してください。"],
  ["invalid_username", "Xのユーザー名を含むポストURLを入力してください。"],
  ["invalid_post_id", "ポストIDを含むXポストURLを入力してください。"],
  ["rate_limit_exceeded", "アクセスが集中しています。少し時間を置いて再試行してください。"],
  ["oembed_404", "対象のポストを取得できませんでした。削除済み、非公開、または埋め込み不可の可能性があります。"],
  ["oembed_429", "取得先が混雑しています。少し時間を置いて再試行してください。"],
  ["oembed_5xx", "取得先で一時的な問題が発生しています。時間を置いて再試行してください。"],
  ["oembed_unreachable", "取得先に接続できませんでした。時間を置いて再試行してください。"],
  ["oembed_invalid_response", "取得先から想定外の応答がありました。時間を置いて再試行してください。"],
  ["oembed_error", "ポスト情報を取得できませんでした。時間を置いて再試行してください。"],
  ["x_api_401", "X APIの認証設定に問題があります。管理者側の確認が必要です。"],
  ["x_api_402", "X APIの利用枠または課金設定により取得できません。管理者側の確認が必要です。"],
  ["x_api_403", "X APIの権限またはプラン設定により取得できません。管理者側の確認が必要です。"],
  ["x_api_404", "対象のポストを取得できませんでした。削除済み、非公開、または権限不足の可能性があります。"],
  ["x_api_429", "X APIの利用上限に達している可能性があります。時間を置いて再試行してください。"],
  ["x_api_5xx", "X API側で一時的な問題が発生しています。時間を置いて再試行してください。"],
  ["x_api_unreachable", "X APIに接続できませんでした。時間を置いて再試行してください。"],
  ["x_api_invalid_response", "X APIから想定外の応答がありました。時間を置いて再試行してください。"],
  ["x_api_error", "X APIからポスト情報を取得できませんでした。時間を置いて再試行してください。"]
]);
const GENERIC_FETCH_ERROR_MESSAGE = "取得に失敗しました。時間を置いて再試行してください。";
const LOADING_SUBMIT_LABEL = "取得中…";
const POST_URL_PASTE_EXTRA_TEXT_MESSAGE = "XポストURLに余分な文字が含まれています。URLだけを貼り付けてください。";
const ARCHIVE_URL_PASTE_EXTRA_TEXT_MESSAGE = "魚拓URLに余分な文字が含まれています。URLだけを貼り付けてください。";
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

// ===== 記録画像（任意機能）: canvasでカード風PNGを生成する =====
// 2026-07-07 オーナー承認。実際の投稿の見た目や添付メディアは含まず、
// 取得済みのテキスト情報だけを描画するため、Xの利用規約・キャプチャ禁止事項に抵触しない。

// imgur匿名アップロード用のClient-ID。空文字のままなら機能は無効化される
// （imgur Developer Portalでの登録・承認はオーナー作業のため、別PRで設定する）。
const IMGUR_CLIENT_ID = "";

// 全角文字は半角の2倍幅として扱う簡易的な折返し重み。
// canvasのmeasureTextに依存すると環境依存になり決定的なテストが書けないため、
// 文字コード帯で全角/半角を判定する固定ロジックにする。
function isFullWidthChar(char) {
  const codePoint = char.codePointAt(0) || 0;
  // 大まかな全角範囲: ひらがな/カタカナ/CJK統合漢字/全角記号/絵文字等。
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    codePoint >= 0x1f300
  );
}

function charWeight(char) {
  return isFullWidthChar(char) ? 1 : 0.5;
}

// 日本語対応の簡易折返し。改行は保持したまま、各行を maxChars 相当の重みごとに分割する。
export function wrapTextForCanvas(text, maxChars) {
  const limit = Number.isFinite(maxChars) && maxChars > 0 ? maxChars : 1;
  const sourceLines = String(text ?? "").split("\n");
  const resultLines = [];

  for (const sourceLine of sourceLines) {
    if (sourceLine === "") {
      resultLines.push("");
      continue;
    }

    let currentLine = "";
    let currentWeight = 0;

    for (const char of sourceLine) {
      const weight = charWeight(char);
      if (currentLine !== "" && currentWeight + weight > limit) {
        resultLines.push(currentLine);
        currentLine = "";
        currentWeight = 0;
      }
      currentLine += char;
      currentWeight += weight;
    }

    resultLines.push(currentLine);
  }

  return resultLines;
}

// 記録画像に描く行データを組み立てる。値が「未取得」でもそのまま表示する。
export function buildPostImageLines(post, options = {}) {
  const accountName = post?.accountName || post?.authorName || "未取得";
  const username = post?.username && post.username !== "未取得" ? `@${post.username}` : "@未取得";
  const header = `${accountName} ${username}`;

  const bodyText = post?.text || "未取得";
  const body = wrapTextForCanvas(bodyText, 24);

  const postUrl = post?.postUrl || post?.canonicalUrl || "未取得";
  const createdAt = post?.createdAt || "未取得";
  const now = typeof options.now === "string" && options.now ? options.now : "未取得";

  const meta = [
    `投稿日：${createdAt}`,
    `ポストURL：${postUrl}`,
    `取得日時：${now}`,
    "x-archive-link-tool で作成"
  ];

  return { header, body, meta };
}

const IMAGE_WIDTH = 1200;
const IMAGE_DEVICE_PIXEL_RATIO = 2;
const IMAGE_COLORS = {
  background: "#ffffff",
  topBar: "#0f766e",
  text: "#1b232c",
  muted: "#566570",
  line: "#d8dfdb"
};
const IMAGE_FONT_FAMILY = "Arial, 'Hiragino Kaku Gothic ProN', 'Yu Gothic', Meiryo, sans-serif";

// ポスト情報をカード風PNGとしてcanvasへ描画する。本文はfillTextのみを使い、
// HTMLとして描画しない（禁止事項: oEmbed html等をHTMLレンダリングしない、の延長で徹底する）。
export function renderPostImage(post, options = {}) {
  const lines = buildPostImageLines(post, options);

  const topBarHeight = 8;
  const paddingX = 48;
  const headerTop = 40;
  const headerHeight = 28 + 8 + 22 + 24; // アカウント名 + 間隔 + username + 下マージン
  const bodyLineHeight = 26 * 1.6;
  const bodyTop = headerTop + headerHeight + 24; // 罫線分の余白込み
  const bodyHeight = Math.max(lines.body.length, 1) * bodyLineHeight;
  const metaTop = bodyTop + bodyHeight + 24;
  const metaLineHeight = 20 * 1.6;
  const metaHeight = lines.meta.length * metaLineHeight;
  const footerHeight = 48;
  const totalHeight = metaTop + metaHeight + footerHeight;

  const canvas = document.createElement("canvas");
  const ratio = IMAGE_DEVICE_PIXEL_RATIO;
  canvas.width = IMAGE_WIDTH * ratio;
  canvas.height = totalHeight * ratio;
  canvas.style.width = `${IMAGE_WIDTH}px`;
  canvas.style.height = `${totalHeight}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }

  ctx.scale(ratio, ratio);

  // 背景
  ctx.fillStyle = IMAGE_COLORS.background;
  ctx.fillRect(0, 0, IMAGE_WIDTH, totalHeight);

  // 上辺ティールバー
  ctx.fillStyle = IMAGE_COLORS.topBar;
  ctx.fillRect(0, 0, IMAGE_WIDTH, topBarHeight);

  // ヘッダー: アカウント名(太字28px) + @username(22px補助色)
  ctx.fillStyle = IMAGE_COLORS.text;
  ctx.font = `bold 28px ${IMAGE_FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.fillText(lines.header.split(" @")[0] || lines.header, paddingX, headerTop);

  ctx.fillStyle = IMAGE_COLORS.muted;
  ctx.font = `22px ${IMAGE_FONT_FAMILY}`;
  const usernamePart = lines.header.includes(" @") ? `@${lines.header.split(" @").slice(1).join(" @")}` : "";
  ctx.fillText(usernamePart, paddingX, headerTop + 28 + 8);

  // 罫線（ヘッダー下）
  ctx.strokeStyle = IMAGE_COLORS.line;
  ctx.beginPath();
  ctx.moveTo(paddingX, headerTop + headerHeight - 12);
  ctx.lineTo(IMAGE_WIDTH - paddingX, headerTop + headerHeight - 12);
  ctx.stroke();

  // 本文
  ctx.fillStyle = IMAGE_COLORS.text;
  ctx.font = `26px ${IMAGE_FONT_FAMILY}`;
  lines.body.forEach((line, index) => {
    ctx.fillText(line, paddingX, bodyTop + index * bodyLineHeight);
  });

  // 罫線（本文下）
  ctx.strokeStyle = IMAGE_COLORS.line;
  ctx.beginPath();
  ctx.moveTo(paddingX, metaTop - 12);
  ctx.lineTo(IMAGE_WIDTH - paddingX, metaTop - 12);
  ctx.stroke();

  // メタ4行
  ctx.fillStyle = IMAGE_COLORS.muted;
  ctx.font = `20px ${IMAGE_FONT_FAMILY}`;
  lines.meta.forEach((line, index) => {
    ctx.fillText(line, paddingX, metaTop + index * metaLineHeight);
  });

  // フッター右下にツール名
  ctx.fillStyle = IMAGE_COLORS.muted;
  ctx.font = `16px ${IMAGE_FONT_FAMILY}`;
  ctx.textAlign = "right";
  ctx.fillText("x-archive-link-tool", IMAGE_WIDTH - paddingX, totalHeight - footerHeight + 16);
  ctx.textAlign = "left";

  return canvas;
}

// imgurへの匿名アップロード。ユーザーのボタン操作からのみ呼ばれる想定。
// 実imgur APIへは、Client-IDが空文字の間は呼び出し自体をUI側で無効化して到達させない。
export async function uploadImageToImgur(blob, clientId = IMGUR_CLIENT_ID) {
  const formData = new FormData();
  formData.append("image", blob);

  let response;
  try {
    response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: { Authorization: `Client-ID ${clientId}` },
      body: formData
    });
  } catch {
    throw createImgurError("imgur_unreachable");
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw createImgurError("imgur_invalid_response");
  }

  if (!response.ok || !payload?.success) {
    throw createImgurError(response.status === 429 ? "imgur_429" : "imgur_error");
  }

  return {
    link: typeof payload?.data?.link === "string" ? payload.data.link : "",
    deletehash: typeof payload?.data?.deletehash === "string" ? payload.data.deletehash : ""
  };
}

const IMGUR_ERROR_MESSAGES = new Map([
  ["imgur_429", "imgurが混雑しています。時間を置いて再試行してください。"],
  ["imgur_unreachable", "アップロードに失敗しました。時間を置いて再試行してください。"],
  ["imgur_invalid_response", "アップロードに失敗しました。時間を置いて再試行してください。"],
  ["imgur_error", "アップロードに失敗しました。時間を置いて再試行してください。"]
]);

function createImgurError(code) {
  const error = new Error(IMGUR_ERROR_MESSAGES.get(code) || IMGUR_ERROR_MESSAGES.get("imgur_error"));
  error.userMessage = error.message;
  error.code = code;
  return error;
}

// 魚拓サービスの一覧。どれかが落ちても代替が残るよう複数を併記する。
// gyo.tc / Wayback / archive.today は canonical URL を末尾に付けるprefix型。
// twtr.satoru.net は GET フォーム（mode=check + url）のため、同じパラメータを
// query に付けた deep link にする（2026-07-07 実挙動確認済み: URLが自動で処理される）。
// サーバーからは取得せず、外部リンクとして開くだけ。
export function buildArchiveServiceLinks(postUrl) {
  const target = String(postUrl || "");
  return [
    { id: "gyotaku-link", label: "ウェブ魚拓（gyo.tc）で魚拓を取る", href: buildGyotakuUrl(target) },
    { id: "wayback-link", label: "Wayback Machine（archive.org）で保存する", href: `https://web.archive.org/save/${target}` },
    { id: "archivetoday-link", label: "archive.today で保存・確認する", href: `https://archive.ph/newest/${target}` },
    { id: "twtr-link", label: "Twitter魚拓（twtr.satoru.net）で画像魚拓を取る", href: `https://twtr.satoru.net/?mode=check&url=${encodeURIComponent(target)}` }
  ];
}

// server/urlValidator.js の parseXPostUrl と同じ判定を、例外ではなくコードで返す。
// クライアント側で先に検証し、ブラウザ標準tooltipと分裂しない統一メッセージを出すために使う。
export function validatePostUrl(input) {
  if (typeof input !== "string" || input.trim() === "") {
    return { valid: false, code: "invalid_input" };
  }

  const trimmedInput = input.trim();
  if (/\s/.test(trimmedInput)) {
    return { valid: false, code: "invalid_url" };
  }

  let url;
  try {
    url = new URL(trimmedInput);
  } catch {
    return { valid: false, code: "invalid_url" };
  }

  if (url.protocol !== "https:") {
    return { valid: false, code: "invalid_protocol" };
  }

  if (!POST_URL_ALLOWED_HOSTS.has(url.hostname)) {
    return { valid: false, code: "invalid_host" };
  }

  const parts = url.pathname.split("/");
  if (parts.length === 5 && parts[0] === "" && parts[1] === "i" && parts[2] === "web" && parts[3] === "status") {
    if (!POST_URL_POST_ID_PATTERN.test(parts[4])) {
      return { valid: false, code: "invalid_post_id" };
    }

    // /i/web/status/ 形式にはusernameが含まれないため、canonicalUrlも同形式で組み立てる。
    // ブラウザ直接oEmbedフォールバック（fetchOEmbedDirect）はこのcanonicalUrlをそのまま使う。
    return {
      valid: true,
      username: null,
      postId: parts[4],
      canonicalUrl: `https://x.com/i/web/status/${parts[4]}`
    };
  }

  if (parts.length !== 4 || parts[0] !== "" || parts[2] !== "status") {
    return { valid: false, code: "invalid_path" };
  }

  if (!POST_URL_USERNAME_PATTERN.test(parts[1])) {
    return { valid: false, code: "invalid_username" };
  }

  if (!POST_URL_POST_ID_PATTERN.test(parts[3])) {
    return { valid: false, code: "invalid_post_id" };
  }

  return {
    valid: true,
    username: parts[1],
    postId: parts[3],
    canonicalUrl: `https://x.com/${parts[1]}/status/${parts[3]}`
  };
}

// 以下3関数は server/oEmbedClient.js の同名ロジックの意図的な複製。
// ブラウザは server 配下のモジュールを import できない（Cloudflare Pages Functions と
// 静的アセットが別ランタイムで、クライアントバンドルに server コードを混在させたくない）ため、
// oembed_unreachable 時のブラウザ直接フォールバック用にロジックだけをここへ複製する。
// server側のextractPostText/extractPostDate/htmlToPlainTextを変更した場合はこちらも同期すること。
export function extractPostText(html) {
  const match = String(html || "").match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!match) {
    return "未取得";
  }

  return htmlToPlainText(match[1]);
}

export function extractPostDate(html, postId) {
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(String(html || ""))) !== null) {
    if (match[1].includes(`/status/${postId}`)) {
      return htmlToPlainText(match[2]);
    }
  }

  return "未取得";
}

export function htmlToPlainText(html) {
  const text = String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#([0-9]+);/g, (_match, codePoint) => {
      const value = Number(codePoint);
      return Number.isInteger(value) && value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, codePoint) => {
      const value = Number.parseInt(codePoint, 16);
      return Number.isInteger(value) && value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : "";
    })
    .replace(/\s+/g, " ")
    .trim();

  return text || "未取得";
}

function mapOEmbedDirectError(status) {
  if (status === 404) {
    return "oembed_404";
  }

  if (status === 429) {
    return "oembed_429";
  }

  return "oembed_error";
}

// server の /api/extract が oembed_unreachable（Cloudflare Workers からの fetch が
// X側のIP遮断で失敗するケース）を返したときだけ、ブラウザから直接 publish.x.com の
// 公式oEmbed endpointを叩くフォールバック。2026-07-07 オーナー承認（ゲート④・設計A）。
// カスタムヘッダを付けない単純リクエスト（simple request）にしてCORS preflightを避ける。
// publish.x.comはOrigin付きGETへaccess-control-allow-originをエコーすることを確認済み。
export async function fetchOEmbedDirect(validated) {
  const oembedUrl = new URL("https://publish.x.com/oembed");
  oembedUrl.searchParams.set("url", validated.canonicalUrl);
  oembedUrl.searchParams.set("omit_script", "1");
  oembedUrl.searchParams.set("dnt", "true");

  let response;
  try {
    response = await fetch(oembedUrl.toString(), { method: "GET" });
  } catch {
    throw createUserFacingError(getUserErrorMessage({ code: "oembed_unreachable" }));
  }

  if (!response.ok) {
    throw createUserFacingError(getUserErrorMessage({ code: mapOEmbedDirectError(response.status) }));
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw createUserFacingError(getUserErrorMessage({ code: "oembed_invalid_response" }));
  }

  const html = typeof payload?.html === "string" ? payload.html : "";

  return {
    accountName: typeof payload?.author_name === "string" ? payload.author_name : "未取得",
    username: validated.username || "未取得",
    userNumericId: "未取得",
    postId: validated.postId,
    postUrl: validated.canonicalUrl,
    createdAt: extractPostDate(html, validated.postId),
    text: extractPostText(html),
    mediaUrls: [],
    source: "oembed-direct",
    cached: false
  };
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

// 貼り付け時だけ前後の空白・改行を許容し、URL内部の空白は本文混入として扱う。
function normalizePastedUrlText(value) {
  const rawText = String(value || "");
  const trimmedText = rawText.trim();

  return {
    value: trimmedText,
    changed: trimmedText !== rawText,
    hasExtraText: /\s/.test(trimmedText)
  };
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

export function formatCreatedAt(isoString, format = "iso") {
  const fallback = isoString || "未取得";
  if (format !== "japanese") {
    return fallback;
  }

  // ISO 8601はUTC文字列として扱い、タイムゾーン変換で日付がずれないよう日付部分だけを使う。
  const match = typeof isoString === "string" ? isoString.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  return match ? `${match[1]}年${match[2]}月${match[3]}日` : fallback;
}

function getCopyValues(post, archiveUrl, options = {}) {
  const dateFormat = options.dateFormat === "japanese" ? "japanese" : "iso";
  const validArchiveUrl = isValidArchiveUrl(archiveUrl) ? archiveUrl.trim() : "未取得";
  const username = post.username || "";

  // 表示用の「未取得」はコピー先で機械的に読めるよう維持し、UI側の補足文で理由を補う。
  return {
    accountName: post.accountName || post.authorName || "未取得",
    accountId: username && username !== "未取得" ? `@${username}` : "未取得",
    userNumericId: post.userNumericId || "未取得",
    postUrl: post.postUrl || post.canonicalUrl || "未取得",
    createdAt: formatCreatedAt(post.createdAt, dateFormat),
    text: post.text || "未取得",
    mediaUrls: formatMediaUrls(post.mediaUrls),
    archiveUrl: validArchiveUrl
  };
}

export function buildCopyText(post, archiveUrl = "", options = {}) {
  const values = getCopyValues(post, archiveUrl, options);

  return [
    `アカウント名：${values.accountName}`,
    `アカウントID：${values.accountId}`,
    `ユーザー数値ID：${values.userNumericId}`,
    `ポストURL：${values.postUrl}`,
    `ポスト投稿日：${values.createdAt}`,
    "",
    "ポスト内容：",
    values.text,
    "",
    "メディアURL：",
    values.mediaUrls,
    "",
    "魚拓URL：",
    values.archiveUrl
  ].join("\n");
}

export function buildMarkdownCopyText(post, archiveUrl = "", options = {}) {
  const values = getCopyValues(post, archiveUrl, options);

  return [
    `- アカウント名：${values.accountName}`,
    `- アカウントID：${values.accountId}`,
    `- ユーザー数値ID：${values.userNumericId}`,
    `- ポストURL：${values.postUrl}`,
    `- ポスト投稿日：${values.createdAt}`,
    "",
    "## ポスト内容",
    values.text,
    "",
    "## メディアURL",
    values.mediaUrls,
    "",
    "## 魚拓URL",
    values.archiveUrl
  ].join("\n");
}

function buildCopyTextForOptions(post, archiveUrl = "", options = {}) {
  return options.format === "markdown"
    ? buildMarkdownCopyText(post, archiveUrl, options)
    : buildCopyText(post, archiveUrl, options);
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
    if (!post.userNumericId || post.userNumericId === "未取得") {
      messages.push("ユーザー数値IDはX API使用時のみ取得できます。");
    }
  }

  if (post.source === "oembed-direct") {
    messages.push(
      "サーバー経由で取得できなかったため、ブラウザから公式oEmbed（publish.x.com）へ直接アクセスして取得しました。画像・動画の直接URLとユーザー数値IDは取得できません。"
    );
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
  const postUrlPasteMessage = document.querySelector("#post-url-paste-message");
  const archiveSection = document.querySelector("#archive-section");
  const gyotakuLink = document.querySelector("#gyotaku-link");
  // 魚拓リンクはgyo.tcに加えWayback/archive.today/twtrを併記する。
  // 追加リンクはnull安全に扱い、要素が無いDOMでも既存挙動を壊さない。
  const archiveLinkElements = {
    "gyotaku-link": gyotakuLink,
    "wayback-link": document.querySelector("#wayback-link"),
    "archivetoday-link": document.querySelector("#archivetoday-link"),
    "twtr-link": document.querySelector("#twtr-link")
  };
  const archiveInput = document.querySelector("#archive-url");
  const archiveStatus = document.querySelector("#archive-status");
  const formatPlain = document.querySelector("#format-plain");
  const formatMarkdown = document.querySelector("#format-markdown");
  const dateIso = document.querySelector("#date-iso");
  const dateJapanese = document.querySelector("#date-japanese");
  const copyText = document.querySelector("#copy-text");
  const copyButton = document.querySelector("#copy-button");
  const copyHint = document.querySelector("#copy-hint");
  const copyMessage = document.querySelector("#copy-message");
  const sourceMessage = document.querySelector("#source-message");
  // 記録画像（任意機能）関連のDOM要素。存在しないDOM（旧テストハーネス等）でも
  // null安全に扱い、既存機能を壊さない。
  const imageCreateButton = document.querySelector("#image-create-button");
  const imagePreview = document.querySelector("#image-preview");
  const imageDownloadLink = document.querySelector("#image-download-link");
  const imageUploadButton = document.querySelector("#image-upload-button");
  const imageUploadHint = document.querySelector("#image-upload-hint");
  const imageUrlOutput = document.querySelector("#image-url-output");
  const imageUrlCopyButton = document.querySelector("#image-url-copy-button");
  const imageDeleteHint = document.querySelector("#image-delete-hint");
  const imageMessage = document.querySelector("#image-message");
  let currentPost = null;
  // 取得済みポストのキー（postUrl）。同じポストの再取得では魚拓URLを保持し、別ポストではリセットする。
  let currentPostKey = "";
  let postInputHasInvalidPaste = false;
  let archiveInputHasInvalidPaste = false;
  // プレビューimg用のobjectURL。別ポスト取得やページ離脱前に解放してメモリリークを防ぐ。
  let currentImageObjectUrl = "";
  const ARCHIVE_STATUS_IDLE = "先にXポストURLを取得すると、魚拓リンクと貼り付け欄が使えるようになります。";
  const ARCHIVE_STATUS_ACTIVE = "別のXポストを取得すると、入力した魚拓URLはリセットされます。";
  const submitButtonLabel = submitButton?.textContent || "取得";

  if (
    !form ||
    !urlInput ||
    !submitButton ||
    !errorMessage ||
    !archiveSection ||
    !gyotakuLink ||
    !archiveInput ||
    !formatPlain ||
    !formatMarkdown ||
    !dateIso ||
    !dateJapanese ||
    !copyText ||
    !copyButton ||
    !copyMessage ||
    !sourceMessage
  ) {
    return;
  }

  function getCopyOptions() {
    return {
      format: formatMarkdown.checked ? "markdown" : "plain",
      dateFormat: dateJapanese.checked ? "japanese" : "iso"
    };
  }

  function setPostUrlPasteMessage(message) {
    if (!postUrlPasteMessage) {
      return;
    }

    setText(postUrlPasteMessage, message);
    postUrlPasteMessage.hidden = !message;
  }

  function setArchiveStatus(message, isError = false) {
    if (!archiveStatus) {
      return;
    }

    setText(archiveStatus, message);
    if (archiveStatus.classList) {
      archiveStatus.classList.toggle("error", isError === true);
    }
  }

  function getDefaultArchiveStatus() {
    return currentPost ? ARCHIVE_STATUS_ACTIVE : ARCHIVE_STATUS_IDLE;
  }

  function refreshCopyText() {
    if (!currentPost) {
      copyText.value = "";
      copyButton.disabled = true;
      setText(sourceMessage, "");
      if (copyHint) {
        copyHint.hidden = false;
        copyButton.setAttribute("aria-describedby", "copy-hint");
      }
      return;
    }

    copyText.value = buildCopyTextForOptions(
      currentPost,
      archiveInputHasInvalidPaste ? "" : archiveInput.value,
      getCopyOptions()
    );
    copyButton.disabled = false;
    setText(sourceMessage, buildSourceMessage(currentPost));
    if (copyHint) {
      copyHint.hidden = true;
      copyButton.removeAttribute("aria-describedby");
    }
  }

  function setLoadingState(isLoading) {
    submitButton.disabled = isLoading;
    urlInput.disabled = isLoading;
    submitButton.textContent = isLoading ? LOADING_SUBMIT_LABEL : submitButtonLabel;
    if (isLoading) {
      form.setAttribute("aria-busy", "true");
      return;
    }

    form.removeAttribute("aria-busy");
  }

  // 魚拓セクションは常時表示し、ポスト取得前は魚拓リンクと入力欄を無効化する。
  // currentPostKey は保持したまま無効化するので、同じポストの再取得後に魚拓URLを残せる。
  function refreshArchiveState() {
    if (currentPost) {
      const postUrl = currentPost.postUrl || currentPost.canonicalUrl;
      for (const link of buildArchiveServiceLinks(postUrl)) {
        const element = archiveLinkElements[link.id];
        if (!element) {
          continue;
        }
        element.href = link.href;
        element.removeAttribute("aria-disabled");
      }
      archiveInput.disabled = false;
      setArchiveStatus(ARCHIVE_STATUS_ACTIVE);
      return;
    }

    // twtr.satoru.net はpost非依存（サイトトップ固定）だが、「先にポストを取得してから
    // 魚拓へ進む」UXの一貫性を優先し、他リンクと同じく取得前は無効化する。
    for (const link of buildArchiveServiceLinks("")) {
      const element = archiveLinkElements[link.id];
      if (!element) {
        continue;
      }
      element.removeAttribute("href");
      element.setAttribute("aria-disabled", "true");
    }
    archiveInput.disabled = true;
    setArchiveStatus(ARCHIVE_STATUS_IDLE);
  }

  // 記録画像セクションを初期状態へ戻す。objectURLは明示的に解放してメモリリークを防ぐ。
  function resetImageState() {
    if (currentImageObjectUrl) {
      URL.revokeObjectURL(currentImageObjectUrl);
      currentImageObjectUrl = "";
    }

    if (imagePreview) {
      imagePreview.src = "";
      imagePreview.hidden = true;
    }

    if (imageDownloadLink) {
      imageDownloadLink.href = "";
      imageDownloadLink.hidden = true;
    }

    if (imageUrlOutput) {
      imageUrlOutput.value = "";
    }

    if (imageUrlCopyButton) {
      imageUrlCopyButton.hidden = true;
    }

    if (imageDeleteHint) {
      setText(imageDeleteHint, "");
    }

    if (imageMessage) {
      setText(imageMessage, "");
    }

    if (imageCreateButton) {
      imageCreateButton.disabled = !currentPost;
    }

    // アップロードボタンは、Client-ID未設定の間は常にdisabledのままにする。
    if (imageUploadButton) {
      imageUploadButton.disabled = true;
    }
  }

  function showError(message) {
    currentPost = null;
    refreshArchiveState();
    refreshCopyText();
    resetImageState();
    setText(errorMessage, message);
    errorMessage.focus();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setText(errorMessage, "");
    setCopyFeedback("", false);

    if (postInputHasInvalidPaste) {
      showError(getUserErrorMessage({ code: "invalid_url" }));
      return;
    }

    const submittedUrl = urlInput.value.trim();
    const validation = validatePostUrl(submittedUrl);
    if (!validation.valid) {
      showError(getUserErrorMessage({ code: validation.code }));
      return;
    }

    setLoadingState(true);

    try {
      let response = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: submittedUrl })
      });
      let payload = await response.json();

      if (!response.ok && payload?.code === "oembed_unreachable") {
        // Cloudflare Workers からの fetch がX側のIP遮断で失敗するケースだけ、
        // ブラウザから公式oEmbedへ直接アクセスするフォールバックを試す（2026-07-07 ゲート④承認）。
        payload = await fetchOEmbedDirect(validation);
        // fetchOEmbedDirect は成功時は通常オブジェクトを返し、失敗時はuserMessage付きErrorをthrowするため、
        // ここに到達した時点で response は成功扱いとして良い（後続のresponse.okチェックを通す）。
        response = { ok: true };
      }

      if (!response.ok) {
        throw createUserFacingError(getUserErrorMessage(payload));
      }

      const newPostKey = payload.postUrl || payload.canonicalUrl || "";
      const isDifferentPost = newPostKey !== currentPostKey;
      if (isDifferentPost) {
        // 別のポストに切り替わったときだけ、前のポスト向けに入力した魚拓URLをリセットする。
        archiveInput.value = "";
        archiveInputHasInvalidPaste = false;
      }
      currentPostKey = newPostKey;
      currentPost = payload;
      refreshArchiveState();
      refreshCopyText();
      if (isDifferentPost) {
        // 画像プレビュー・アップロードURL表示も別ポストでは意味を持たないためリセットする。
        // resetImageStateはcurrentPostの有無で作成ボタンのdisabledを決めるため、
        // currentPost設定後に呼ぶ（＝ここでは常に作成ボタンが有効化される）。
        resetImageState();
      } else if (imageCreateButton) {
        // 同じポストの再取得では画像プレビューは維持しつつ、作成ボタンだけ有効状態を保証する。
        imageCreateButton.disabled = false;
      }
    } catch (error) {
      showError(getUserFacingErrorMessage(error));
    } finally {
      setLoadingState(false);
    }
  });

  urlInput.addEventListener("paste", (event) => {
    const pastedText = event.clipboardData?.getData("text") || "";
    const normalized = normalizePastedUrlText(pastedText);
    if (!normalized.changed && !normalized.hasExtraText) {
      postInputHasInvalidPaste = false;
      setPostUrlPasteMessage("");
      return;
    }

    event.preventDefault();
    urlInput.value = normalized.value;
    postInputHasInvalidPaste = normalized.hasExtraText;
    setPostUrlPasteMessage(normalized.hasExtraText ? POST_URL_PASTE_EXTRA_TEXT_MESSAGE : "");
  });

  urlInput.addEventListener("input", () => {
    postInputHasInvalidPaste = false;
    setPostUrlPasteMessage("");
  });

  archiveInput.addEventListener("paste", (event) => {
    const pastedText = event.clipboardData?.getData("text") || "";
    const normalized = normalizePastedUrlText(pastedText);
    if (!normalized.changed && !normalized.hasExtraText) {
      setArchiveStatus(getDefaultArchiveStatus());
      return;
    }

    event.preventDefault();
    archiveInput.value = normalized.value;
    archiveInputHasInvalidPaste = normalized.hasExtraText;
    setArchiveStatus(
      normalized.hasExtraText ? ARCHIVE_URL_PASTE_EXTRA_TEXT_MESSAGE : getDefaultArchiveStatus(),
      normalized.hasExtraText
    );
    refreshCopyText();
  });

  archiveInput.addEventListener("input", () => {
    archiveInputHasInvalidPaste = false;
    setArchiveStatus(getDefaultArchiveStatus());
    refreshCopyText();
  });

  // 出力設定は取得済みデータを再利用してtextareaだけを更新し、外部APIやサーバー再取得を発生させない。
  for (const optionInput of [formatPlain, formatMarkdown, dateIso, dateJapanese]) {
    optionInput.addEventListener("change", refreshCopyText);
  }

  function setCopyFeedback(message, isSuccess) {
    setText(copyMessage, message);
    if (copyMessage.classList) {
      copyMessage.classList.toggle("is-success", isSuccess === true);
    }
  }

  copyButton.addEventListener("click", async () => {
    if (!copyText.value) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText.value);
        setCopyFeedback("コピーしました。", true);
        return;
      }
    } catch {
      // Fall through to manual selection.
    }

    copyText.select();
    setCopyFeedback(
      "自動コピーできませんでした。テキストを選択したので、コピー操作（Windowsは Ctrl+C、Macは Cmd+C）でコピーしてください。",
      false
    );
  });

  function setImageMessage(message) {
    if (imageMessage) {
      setText(imageMessage, message);
    }
  }

  if (imageCreateButton) {
    imageCreateButton.addEventListener("click", () => {
      if (!currentPost) {
        return;
      }

      setImageMessage("");

      try {
        // 取得日時は表示用にJST相当をローカル時刻文字列で組み立てる（サーバー往復なし）。
        const now = new Date().toLocaleString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
        const canvas = renderPostImage(currentPost, { now });

        canvas.toBlob((blob) => {
          if (!blob) {
            setImageMessage("画像の生成に失敗しました。時間を置いて再試行してください。");
            return;
          }

          if (currentImageObjectUrl) {
            URL.revokeObjectURL(currentImageObjectUrl);
          }
          currentImageObjectUrl = URL.createObjectURL(blob);

          if (imagePreview) {
            imagePreview.src = currentImageObjectUrl;
            imagePreview.hidden = false;
          }

          if (imageDownloadLink) {
            const postId = currentPost.postId || "post";
            imageDownloadLink.href = currentImageObjectUrl;
            imageDownloadLink.setAttribute("download", `x-post-record-${postId}.png`);
            imageDownloadLink.hidden = false;
          }

          // Client-ID設定済みのときだけアップロードボタンを有効化する。
          if (imageUploadButton) {
            imageUploadButton.disabled = IMGUR_CLIENT_ID === "";
          }
        }, "image/png");
      } catch {
        setImageMessage("画像の生成に失敗しました。時間を置いて再試行してください。");
      }
    });
  }

  if (imageUploadHint) {
    setText(
      imageUploadHint,
      IMGUR_CLIENT_ID === ""
        ? "アップロード機能は準備中です（imgur Client-ID 設定後に有効になります）。"
        : ""
    );
  }

  if (imageUploadButton) {
    imageUploadButton.addEventListener("click", async () => {
      if (!currentImageObjectUrl) {
        return;
      }

      setImageMessage("");
      imageUploadButton.disabled = true;

      try {
        // objectURLからBlobを取り出す（ローカルメモリ上の参照であり、外部通信は発生しない）。
        const blobResponse = await fetch(currentImageObjectUrl);
        const blob = await blobResponse.blob();
        const result = await uploadImageToImgur(blob);

        if (imageUrlOutput) {
          imageUrlOutput.value = result.link;
        }
        if (imageUrlCopyButton) {
          imageUrlCopyButton.hidden = false;
        }
        if (imageDeleteHint && result.deletehash) {
          setText(
            imageDeleteHint,
            `削除用コード: ${result.deletehash}（削除ページ: https://imgur.com/delete/${result.deletehash}）`
          );
        }
      } catch (error) {
        setImageMessage(getUserFacingErrorMessage(error));
      } finally {
        imageUploadButton.disabled = IMGUR_CLIENT_ID === "";
      }
    });
  }

  if (imageUrlCopyButton) {
    imageUrlCopyButton.addEventListener("click", async () => {
      if (!imageUrlOutput?.value) {
        return;
      }

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(imageUrlOutput.value);
          setImageMessage("URLをコピーしました。");
          return;
        }
      } catch {
        // Fall through to manual selection.
      }

      imageUrlOutput.select();
      setImageMessage("自動コピーできませんでした。テキストを選択したので、コピー操作でコピーしてください。");
    });
  }

  // 初期表示で魚拓リンク・入力欄を無効状態に揃える。
  refreshArchiveState();
  resetImageState();
}

if (typeof document !== "undefined") {
  setupApp();
}
