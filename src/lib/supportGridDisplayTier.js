/**
 * 応援ユーザーの「表示の立ち位置」（LP モック・ユーザーレーン並びの共通ルール）
 */

import { isNiconicoAnonymousUserId } from './nicoAnonymousDisplay.js';
import {
  isHttpOrHttpsUrl,
  isWeakNiconicoUserIconHttpUrl
} from './supportGrowthTileSrc.js';

export const SUPPORT_GRID_TIER_RINK = 'rink';
export const SUPPORT_GRID_TIER_KONTA = 'konta';
export const SUPPORT_GRID_TIER_TANU = 'tanu';

/** @param {string} u */
function goodUserThumbUrl(u) {
  const s = String(u || '').trim();
  return isHttpOrHttpsUrl(s) && !isWeakNiconicoUserIconHttpUrl(s);
}

/**
 * 「プロフィールとして十分」な表示名か（匿名ラベル・未取得は段階を上げない）
 * @param {string} nick
 * @param {string} userId
 */
export function supportGridStrongNickname(nick, userId) {
  const n = String(nick ?? '').trim();
  if (!n) return false;
  if (n === '（未取得）' || n === '(未取得)') return false;
  if (n === '匿名') return false;
  if (isNiconicoAnonymousUserId(userId) && n.length <= 1) return false;
  return true;
}

/**
 * @param {{
 *   userId?: string|null,
 *   nickname?: string|null,
 *   httpAvatarCandidate?: string|null,
 *   storedAvatarUrl?: string|null,
 *   lpMockHasCustomAvatar?: boolean
 * }} p
 * @returns {'rink'|'konta'|'tanu'}
 */
export function supportGridDisplayTier(p) {
  const uid = String(p?.userId ?? '').trim();
  if (!uid) return SUPPORT_GRID_TIER_TANU;

  let hasThumb = false;
  if (p.lpMockHasCustomAvatar === true) hasThumb = true;
  else if (p.lpMockHasCustomAvatar === false) hasThumb = false;
  else {
    const httpCandidate = String(p.httpAvatarCandidate ?? '').trim();
    const rawAv = String(p.storedAvatarUrl ?? '').trim();
    hasThumb =
      goodUserThumbUrl(httpCandidate) || goodUserThumbUrl(rawAv);
  }

  const nick = String(p?.nickname ?? '').trim();
  const strongNick = supportGridStrongNickname(nick, uid);

  if (strongNick && hasThumb) return SUPPORT_GRID_TIER_RINK;
  if (strongNick || hasThumb) return SUPPORT_GRID_TIER_KONTA;
  return SUPPORT_GRID_TIER_TANU;
}
