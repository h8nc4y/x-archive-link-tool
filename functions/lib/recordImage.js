// 記録画像（任意機能）の共有定数・ユーティリティ。
// 2026-07-07 オーナー決定: catbox.moe中継（Cloudflare Workersのegress遮断で本番不可）から
// Cloudflare R2（オーナーのバケット、binding経由でアクセス。外部egress不要）へ再設計した。
// upload-image.js（アップロード）と i/[id].js（配信）の両方から参照する、
// Pages Functions配下の相対importで解決できる最小共有モジュール。

// 画像の保持期間。約7日でリンクを失効させる（一時共有リンクという商品仕様）。
// 2026-07-11 オーナーがR2 Object lifecycleを7日に設定したため、コード側TTLも7日へ統一。
// 配信側（i/[id].js）でuploadedAtからの経過をチェックしてbest-effort削除する一次防衛線であり、
// R2バケット側のObject lifecycleルール（オーナーが手動設定）による実削除が二次防衛線になる。
export const RECORD_IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// アップロード時に発行するidの形式。crypto.randomUUID()からハイフンを除いた32桁hexのみを許可する。
// 配信エンドポイントのpath paramをこの形式に限定することで、R2キーへの
// パストラバーサルやオブジェクト列挙の試行を早期に404へ丸める。
const IMAGE_ID_PATTERN = /^[a-f0-9]{32}$/;

export function isValidImageId(id) {
  return typeof id === "string" && IMAGE_ID_PATTERN.test(id);
}
