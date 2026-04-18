/**
 * 表示名（ニックネーム）の「強弱」判定。
 *
 * レイヤ: domain/ (pure)
 *
 * ニコ生には「未取得」「匿名」「ゲスト」「user12ABCd」のような占位文字列が多く流れてくる。
 * レーン / グリッドの tier 判定では、これらを「名前が取れている」と見做してはいけない。
 * ここで「名前が本当に取れているか」を 1 箇所で判定する。
 *
 * NOTE: 旧正本は `src/lib/supportGridDisplayTier.js` と
 *       `src/lib/nicoAnonymousDisplay.js` の両方にロジックが分散していた。
 *       Phase 1 でここに集約し、旧ファイルは re-export shim に落とす予定。
 */

import { isAnonymousStyleNicoUserId } from './identity.js';

/**
 * ニコの自動プレースホルダ名（`user12ABCd` 形式など）を検出する。
 * 本登録ユーザーでも、プロフィールを設定していないとこの形式が流れてくる。
 *
 * @param {string} nick
 * @returns {boolean}
 */
export function isNiconicoAutoUserPlaceholderNickname(nick) {
  const n = String(nick ?? '').trim();
  if (!n) return false;
  // user + 英数字（4-20 文字程度）の自動生成名
  return /^user[0-9A-Za-z]{4,20}$/i.test(n);
}

/**
 * 「プロフィールとして十分な強さ」の表示名か。
 * link / konta 昇格のしきい値として使われる。
 *
 * 弱いと判定する例:
 *   - 空 / 空白のみ
 *   - 'user12ABCd' のような自動生成名
 *   - '（未取得）' '(未取得)' '匿名' 'ゲスト' 'guest'
 *   - 匿名 ID ＋ 1 文字以下のニック（何かの誤取得の可能性が高い）
 *
 * @param {unknown} nick
 * @param {unknown} userId
 * @returns {boolean}
 */
export function isStrongNickname(nick, userId) {
  const n = String(nick ?? '').trim();
  if (!n) return false;
  if (isNiconicoAutoUserPlaceholderNickname(n)) return false;
  if (n === '（未取得）' || n === '(未取得)') return false;
  if (n === '匿名') return false;
  if (n === 'ゲスト' || /^guest$/i.test(n)) return false;
  if (isAnonymousStyleNicoUserId(userId) && n.length <= 1) return false;
  return true;
}
