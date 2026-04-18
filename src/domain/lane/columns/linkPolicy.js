/**
 * りんく段（link）の配属 policy。
 *
 * レイヤ: domain/ (pure)
 *
 * りんく段は「応援のうち個人性が強く確定した層」を並べるコーナー。
 * 次のいずれかを満たす **非匿名** ユーザーを link 段に配属する:
 *
 *   1. avatarObservationKinds に実観測ソースが 1 つ以上含まれる
 *      （DOM / NDGR entry / NDGR map / stored / live-api いずれでも可）
 *   2. 「非合成の個人 URL」が判定できている（URL の形から個人と分かる）
 *   3. 強い表示名（isStrongNickname）が取れている — ID + 名前で「誰か確定」と看做す
 *
 * 過去の退行を封じる契約:
 *   - 匿名 ID は上記のどれが揃っていても link に入れてはいけない（tanuPolicy が優先）
 *   - ニコ生の大多数の個人サムネが合成 canonical URL で流れる事情を踏まえ、
 *     「非合成 URL があるかどうか」だけを見る旧仕様は link 段を空にしてしまう。
 *     このため `avatarObservationKinds` を別次元の根拠として並列に扱う。
 *
 * 将来、列ごとの取得器（data/acquirers/linkColumnAcquirer.js）が観測ソースを
 * 集めた上でここに渡す流れになる。現行実装では単一 boolean の `avatarObserved`
 * から `kinds.size>=1` に射影する shim が data/ 側に入る。
 */

import { isAnonymousStyleNicoUserId } from '../../user/identity.js';
import { isStrongNickname } from '../../user/nickname.js';

/**
 * @typedef {Object} LinkPolicyEntry
 * @property {string} userId
 * @property {string} [nickname]
 * @property {string} [avatarUrl]                   表示用 URL（合成 canonical でも可）
 * @property {boolean} [avatarObserved]             single-boolean の互換フィールド
 * @property {ReadonlySet<string>|string[]} [avatarObservationKinds]  新設計: 観測ソース集合
 * @property {boolean} [hasNonCanonicalPersonalUrl] 外部 CDN 等の「明確に非合成」URL があるか
 */

/**
 * このエントリがりんく段に入るべきか。
 *
 * @param {LinkPolicyEntry|null|undefined} entry
 * @returns {boolean}
 */
export function matchesLinkPolicy(entry) {
  const uid = String(entry?.userId || '').trim();
  if (!uid) return false;
  if (isAnonymousStyleNicoUserId(uid)) return false; // 匿名は tanu が吸収

  // 根拠 1: 観測ソース集合（新設計）。互換のため single-boolean も見る
  const kinds = entry?.avatarObservationKinds;
  const observedAny =
    (kinds instanceof Set && kinds.size > 0) ||
    (Array.isArray(kinds) && kinds.length > 0) ||
    Boolean(entry?.avatarObserved);
  if (observedAny) return true;

  // 根拠 2: 非合成の個人 URL が判定済み
  if (entry?.hasNonCanonicalPersonalUrl) return true;

  // 根拠 3: 強い表示名（ID + 名前で「誰か確定」）
  if (isStrongNickname(entry?.nickname, uid)) return true;

  return false;
}
