import { isAnonymousStyleNicoUserId } from './supportGrowthTileSrc.js';

/**
 * 最新コメントティッカーの名前部分に、ニコ動ユーザーページへのリンクを張るかの判定。
 * 数値 ID を持つアカウント（非匿名・非ハッシュ系）のときだけ true。
 *
 * @param {string | null | undefined} userId
 * @returns {boolean}
 */
export function canLinkCommentTickerName(userId) {
  const s = String(userId || '').trim();
  if (!s) return false;
  return !isAnonymousStyleNicoUserId(s);
}

/**
 * 有効な数値 ID のとき niconico のユーザーページ URL を返す。
 * 匿名・ハッシュ系・空のときは空文字。
 *
 * @param {string | null | undefined} userId
 * @returns {string}
 */
export function buildCommentTickerNameHref(userId) {
  if (!canLinkCommentTickerName(userId)) return '';
  const s = String(userId || '').trim();
  // userId 側の英数字のみが通る前提（isAnonymousStyleNicoUserId で数値 ID しか通過しない）
  return `https://www.nicovideo.jp/user/${encodeURIComponent(s)}`;
}
