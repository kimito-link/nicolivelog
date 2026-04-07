import { isHttpOrHttpsUrl } from './supportGrowthTileSrc.js';
import {
  accentColorForSlot,
  accentSlotFromUserKey
} from './userSupportGridAccent.js';
import {
  UNKNOWN_USER_KEY,
  shortUserKeyDisplay,
  displayUserLabel
} from './userRooms.js';
import { anonymousNicknameFallback } from './nicoAnonymousDisplay.js';

/**
 * @typedef {{ userKey: string, nickname: string, count: number, avatarUrl?: string }} TopSupportRankRoom
 */

/**
 * @typedef {{
 *   count: number,
 *   isUnknown: boolean,
 *   placeNumber: number | null,
 *   hasAccent: boolean,
 *   accentColorCss: string | null,
 *   thumbSrc: string,
 *   thumbNeedsNoReferrer: boolean,
 *   idTitle: string,
 *   idShort: string,
 *   nameLine: string,
 *   fullLabelForTitle: string
 * }} TopSupportRankLineModel
 */

/**
 * 応援ランキングストリップ1行分の表示モデル（DOM・HTML エスケープなし）。
 *
 * @param {TopSupportRankRoom[]} stripRooms
 * @param {{ defaultThumbSrc: string, colorScheme?: 'light'|'dark' }} opts
 * @returns {TopSupportRankLineModel[]}
 */
export function topSupportRankLineModels(stripRooms, opts) {
  const defaultThumb = String(opts?.defaultThumbSrc || '').trim();
  const colorScheme = opts?.colorScheme === 'dark' ? 'dark' : 'light';
  const rooms = Array.isArray(stripRooms) ? stripRooms : [];
  let knownRank = 0;

  return rooms.map((r) => {
    const userKey = String(r?.userKey ?? '');
    const isUnknown = userKey === UNKNOWN_USER_KEY;
    if (!isUnknown) knownRank += 1;
    const placeNumber = isUnknown ? null : knownRank;

    const rawAv = String(r?.avatarUrl || '').trim();
    const thumbSrc = isHttpOrHttpsUrl(rawAv) ? rawAv : defaultThumb;
    const thumbNeedsNoReferrer = isHttpOrHttpsUrl(thumbSrc);

    const idTitle = isUnknown ? '' : String(r.userKey);
    const idShort = isUnknown
      ? '—'
      : shortUserKeyDisplay(userKey) || String(userKey);

    const nickRaw = String(r?.nickname || '').trim();
    const nameLine = isUnknown
      ? '—'
      : anonymousNicknameFallback(userKey, nickRaw) || '（未取得）';

    const fullLabelForTitle = displayUserLabel(userKey, r?.nickname);

    let hasAccent = false;
    let accentColorCss = null;
    if (!isUnknown) {
      const slot = accentSlotFromUserKey(userKey);
      const col = slot != null ? accentColorForSlot(slot, colorScheme) : null;
      if (col) {
        hasAccent = true;
        accentColorCss = col;
      }
    }

    return {
      count: Math.max(0, Number(r?.count) || 0),
      isUnknown,
      placeNumber,
      hasAccent,
      accentColorCss,
      thumbSrc,
      thumbNeedsNoReferrer,
      idTitle,
      idShort,
      nameLine,
      fullLabelForTitle
    };
  });
}
