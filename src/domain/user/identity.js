/**
 * ニコ生ユーザー ID の「匿名性」判定と関連アイデンティティ・ユーティリティ。
 *
 * レイヤ: domain/ (pure)
 *
 * ニコ生のユーザー ID は大きく 3 形式に分かれる:
 *   - 数値 ID（`^\d{5,14}$`）— 本登録アカウント。プロフィール・個人サムネが期待できる
 *   - `a:` 接頭辞 — ニコ運営が割り振る匿名（a:）ID。プロフィールは期待できない
 *   - ハッシュ風 — 10〜26 文字の英数字 / `_` / `-` のみ。運営が割り振る別種匿名
 *
 * レーンの階段付け（りんく/こん太/たぬ姉）はこの判定に依存するため、
 * ここの規則が動くと UI 挙動が丸ごとズレる。正規表現を変えるときは必ず
 * `src/domain/lane/columns/*Policy.js` の対応テストと合わせて追うこと。
 *
 * NOTE: 旧正本は `src/lib/supportGrowthTileSrc.js` にあった。現在はこちらが正本で、
 *       向こうは re-export shim（Phase 5 で削除予定）。
 */

/**
 * userId が匿名・疑似匿名扱いか（= 本登録の数値 ID でないか）。
 *
 * - 空文字は true（= 非個人扱い。レーンでは「候補に入れない」判定に使われる）
 * - 5〜14 桁の純数字のみ false（= 本登録）
 * - `a:` で始まる文字列は true（ニコ運営の匿名割当）
 * - 10〜26 文字の英数 / `_` / `-` のみの文字列は true（別種匿名）
 * - 上記いずれにも合わないパターン（例: 日本語混じり）も true（安全側）
 *
 * @param {unknown} userId
 * @returns {boolean}
 */
export function isAnonymousStyleNicoUserId(userId) {
  const s = String(userId || '').trim();
  if (!s) return true;
  if (/^\d{5,14}$/.test(s)) return false;
  if (/^a:/i.test(s)) return true;
  if (/^[a-zA-Z0-9_-]{10,26}$/.test(s)) return true;
  return true;
}

/**
 * 本登録の数値 ID か（= `!isAnonymousStyleNicoUserId`）。
 * レーンの link / konta 段に入る前提の判定に使う。
 *
 * @param {unknown} userId
 * @returns {boolean}
 */
export function isNumericNicoUserId(userId) {
  return !isAnonymousStyleNicoUserId(userId);
}
