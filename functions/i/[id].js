import { RECORD_IMAGE_TTL_MS, isValidImageId } from "../lib/recordImage.js";

// 記録画像（任意機能）の配信エンドポイント。GET /i/{id} で /api/upload-image が
// R2へputした画像を返す。2026-07-07 オーナー決定によるR2移行の配信側。
// 画像単体配信のため、extract.js/upload-image.jsのアプリ全体向けCSPよりも
// さらに絞った最小CSP（img-srcのみ許可、他は全拒否＋sandbox）を使う。
const IMAGE_RESPONSE_HEADERS = {
  "content-type": "image/png",
  // TTL(3日)内で程々にキャッシュする。TTL超過後は404になるため、
  // ブラウザ/中間キャッシュに極端に長く残ってもrevalidateで404へ収束する。
  "cache-control": "public, max-age=3600",
  "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; img-src 'self'; sandbox"
};

// 404はプレーンテキストの最小応答にする。存在有無の情報漏えいを避けるため、
// 「不正なid形式」「未設定」「未存在」「期限切れ」のいずれも同じ404を返す。
function notFound() {
  return new Response("Not found.", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox"
    }
  });
}

export async function handleImageRequest(request, { env = {}, now = Date.now, params = {} } = {}) {
  const id = params.id;
  if (!isValidImageId(id)) {
    return notFound();
  }

  const bucket = env.RECORD_IMAGE_BUCKET;
  if (!bucket || typeof bucket.get !== "function") {
    return notFound();
  }

  const key = `${id}.png`;
  const object = await bucket.get(key);
  if (!object) {
    return notFound();
  }

  // uploadedAtが読めない/不正な場合は安全側に倒し、期限切れ扱いにする
  // （壊れたcustomMetadataを無期限配信してしまう方が事故のリスクが大きい）。
  const uploadedAt = Number(object.customMetadata?.uploadedAt);
  const isExpired = !Number.isFinite(uploadedAt) || now() - uploadedAt > RECORD_IMAGE_TTL_MS;

  if (isExpired) {
    // R2バケット側のObject lifecycleルール（オーナー設定）による実削除より前に
    // アクセスされた場合でも、ここでbest-effort削除して以降のアクセスも404にする。
    // 削除失敗（一時的なR2障害等）はレスポンスに影響させない。
    if (typeof bucket.delete === "function") {
      await bucket.delete(key).catch(() => {});
    }
    return notFound();
  }

  return new Response(object.body, { headers: IMAGE_RESPONSE_HEADERS });
}

export function onRequestGet(context) {
  return handleImageRequest(context.request, { env: context.env, params: context.params });
}
