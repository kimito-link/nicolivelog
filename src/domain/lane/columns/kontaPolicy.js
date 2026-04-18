/**
 * こん太段（konta）の配属 policy — 過渡状態 catchall。
 *
 * レイヤ: domain/ (pure)
 *
 * こん太段は「非匿名だが link の根拠がまだ揃っていない」応援を受け止める middle bucket。
 * 主にこういう状況で入る:
 *
 *   - 本登録 ID だが、まだ観測ソースが全く取れていない（観測 pipeline が走る前）
 *   - 本登録 ID で名前も取れていない（コメント 1 本目で名前取得に失敗）
 *
 * tanu / link のどちらの条件も満たさなかった非匿名ユーザーをここで受ける。
 * 匿名は tanuPolicy が先に吸収するので、この policy が true を返すのは
 * 「非匿名 + 観測不足 + 弱いニック」のケースに限られる。
 *
 * 将来の設計: data/acquirers/kontaColumnAcquirer.js が DOM ∪ stored の 2 ソースだけを
 * 試して link に昇格できるかを評価し、その結果として konta に落ちるかを決める。
 * そこまで到達したら、この policy は「acquirer が link 判定に失敗した非匿名」を
 * 機械的に落とすだけの役割になる。
 */

import { isAnonymousStyleNicoUserId } from '../../user/identity.js';
import { matchesLinkPolicy } from './linkPolicy.js';

/**
 * @typedef {import('./linkPolicy.js').LinkPolicyEntry} KontaPolicyEntry
 */

/**
 * このエントリがこん太段に入るべきか。
 * 匿名と link の両方に外れた「非匿名過渡状態」で true を返す。
 *
 * @param {KontaPolicyEntry|null|undefined} entry
 * @returns {boolean}
 */
export function matchesKontaPolicy(entry) {
  const uid = String(entry?.userId || '').trim();
  if (!uid) return false;
  if (isAnonymousStyleNicoUserId(uid)) return false; // tanu が優先
  if (matchesLinkPolicy(entry)) return false;        // link が優先
  return true; // 非匿名 + link 不成立 → こん太
}
