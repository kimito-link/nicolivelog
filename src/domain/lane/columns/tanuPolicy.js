/**
 * たぬ姉段（tanu）の配属 policy。
 *
 * レイヤ: domain/ (pure)
 *
 * **最優先ルール**: 匿名 ID（a:xxxx / ハッシュ風 ID）は強ニック・個人サムネ・
 * avatarObserved が揃っていても **必ず** たぬ姉段に落とす。レーン全体のどの
 * 他のポリシーよりも先に判定され、上書きされない。
 *
 * これは「非匿名ユーザーの応援が匿名の群れに埋もれない」ための UI 契約であって、
 * 過去に link / konta 段への匿名混入が繰り返し発生した（2024-2025）ので
 * ここで封印する。
 */

import { isAnonymousStyleNicoUserId } from '../../user/identity.js';

/**
 * @typedef {Object} LanePolicyEntry
 * @property {string} userId
 * @property {string} [nickname]
 * @property {string} [avatarUrl]
 * @property {boolean} [avatarObserved]
 */

/**
 * このエントリがたぬ姉段に入るべきか。
 *
 * @param {LanePolicyEntry|null|undefined} entry
 * @returns {boolean}
 */
export function matchesTanuPolicy(entry) {
  const uid = String(entry?.userId || '').trim();
  if (!uid) return false; // userId 空は 0（候補除外）、tanu にも入らない
  return isAnonymousStyleNicoUserId(uid);
}
