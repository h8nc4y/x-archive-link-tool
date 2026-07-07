// 記録画像（任意機能）のアップロード共有ロジック。
// 2026-07-07 オーナー決定: imgur（新規Client-ID発行廃止）・RapidAPI（有料のみ）が
// どちらも不成立になったため、catbox.moe への匿名アップロードへ方式変更する。
// CORSの都合でブラウザから直接catboxへは投げられない（catbox.moeはCORSヘッダを
// 返さないため、fetchがブラウザ側でブロックされる）ので、必ずサーバー
// （Cloudflare Pages Functions / ローカルNode server）を経由して中継する。
//
// catbox.moeの匿名アップロードAPI仕様（2026-07時点、非公式ドキュメント準拠）:
// - POST https://catbox.moe/user/api.php
// - multipart/form-data で reqtype=fileupload と fileToUpload=<画像> を送る。
// - userhash は付けない（匿名アップロード。削除トークンの概念がない＝後から個別削除不可）。
// - 成功時のレスポンスはJSONではなく、プレーンテキストの直リンクURL1行だけが返る
//   （例: https://files.catbox.moe/xxxxxx.png）。
// - 失敗時もレスポンスはプレーンテキストのエラー文字列（HTTPステータス200のまま
//   エラーメッセージ本文を返すケースがあるため、本文がURL形式かどうかで成否を判定する）。

const CATBOX_UPLOAD_URL = "https://catbox.moe/user/api.php";
// catboxが返す直リンクの形式チェック。実際の成功レスポンスは常に files.catbox.moe 配下のため、
// それだけを許可する（catbox.moe直下まで許すと、将来catboxがエラーページのURLを
// catbox.moe/... 形式で返すようになった場合に誤って成功と判定するリスクがあるため避ける）。
const CATBOX_SUCCESS_URL_PATTERN = /^https:\/\/files\.catbox\.moe\/\S+$/;

const UPLOAD_ERROR_MESSAGES = new Map([
  ["upload_429", "アップロード先が混雑しています。時間を置いて再試行してください。"],
  ["upload_too_large", "画像サイズが大きすぎます。"],
  ["upload_unsupported_type", "PNG画像のみアップロードできます。"],
  ["upload_unreachable", "アップロード先に接続できませんでした。時間を置いて再試行してください。"],
  ["upload_invalid_request", "画像を選択してから再試行してください。"],
  ["upload_error", "アップロードに失敗しました。時間を置いて再試行してください。"]
]);

// 型付きアップロードエラーを生成する。statusCodeはCloudflare Functions/ローカルサーバー
// 両方のHTTPレスポンスに使うため、コード種別ごとに固定する。
export function createUploadError(code, statusCode = 502) {
  const error = new Error(UPLOAD_ERROR_MESSAGES.get(code) || UPLOAD_ERROR_MESSAGES.get("upload_error"));
  error.code = code;
  error.statusCode = statusCode;
  error.userMessage = error.message;
  return error;
}

// catbox.moeへ画像を匿名アップロードする共有ロジック。
// fetchFn/catboxUrl を引数化しているのは、テストで実catboxへ通信せずに
// レスポンス内容（成功URL・エラー文字列・429・fetch例外）を差し替えるため。
// 本番では既定値（globalThis.fetch / 実catbox URL）がそのまま使われる。
export async function uploadImageToCatbox(fileBlob, { fetchFn = globalThis.fetch, catboxUrl = CATBOX_UPLOAD_URL } = {}) {
  const formData = new FormData();
  formData.append("reqtype", "fileupload");
  // userhash は意図的に付けない（匿名アップロード。オーナー決定により削除トークン方式は採用しない）。
  formData.append("fileToUpload", fileBlob);

  let response;
  try {
    response = await fetchFn(catboxUrl, {
      method: "POST",
      body: formData
    });
  } catch {
    // ネットワーク到達不可・DNS失敗・Cloudflare Workersのegressブロックなどをまとめてここでcatchする。
    throw createUploadError("upload_unreachable", 502);
  }

  if (!response.ok) {
    throw createUploadError(response.status === 429 ? "upload_429" : "upload_error", response.status === 429 ? 429 : 502);
  }

  // catboxの成功レスポンスはJSONではなくプレーンテキストのURL1行。
  // 失敗時も200でエラー文字列を返すケースがあるため、本文の形式で成否を再判定する。
  let bodyText;
  try {
    bodyText = await response.text();
  } catch {
    throw createUploadError("upload_error", 502);
  }

  const trimmedBody = String(bodyText || "").trim();
  if (!CATBOX_SUCCESS_URL_PATTERN.test(trimmedBody)) {
    // URL不一致＝catboxがエラーメッセージ本文を200で返したケース。
    // 本文（エラー文字列）自体はログに残さず、型付きエラーへ丸める。
    throw createUploadError("upload_error", 502);
  }

  return { url: trimmedBody };
}

export function getUploadErrorMessage(code) {
  return UPLOAD_ERROR_MESSAGES.get(code) || UPLOAD_ERROR_MESSAGES.get("upload_error");
}
