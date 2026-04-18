/**
 * 応援ユーザーレーンの tier（段）決定。
 *
 * レイヤ: domain/ (pure)
 *
 * 3 つの列 policy を所定の優先順位で評価するだけの薄いディスパッチャ。
 * tier 値（0/1/2/3）は既存 UI との互換のため現行の表記をそのまま保つ:
 *
 *   3 = link  （りんく段）
 *   2 = konta （こん太段）
 *   1 = tanu  （たぬ姉段）
 *   0 = 候補から除外（userId 空など）
 *
 * 新設計の方針として **列ごとのロジックは `columns/*Policy.js` に閉じ込める**。
 * この関数は「どの policy を先に評価するか」と「policy 結果 → 数値 tier」の
 * 変換しか責務を持たない。将来 link を 2 列化する等の UI 変更が入っても、
 * この 1 ファイルだけで優先順位を書き換えれば済む。
 *
 * 過去の退行を封じる契約（docs/lane-architecture-redesign.md §2.2）:
 *   - tanu policy は最優先で評価される（匿名は他段に上げない）
 *   - link policy は tanu で弾かれなかった非匿名に対して最初に判定される
 *   - konta policy は link に入らなかった非匿名の catchall
 *
 * NOTE: 旧正本は `src/lib/storyUserLaneRowModel.js` にあった。現在はこちらが
 *       正本で、向こうは re-export shim（Phase 5 で削除予定）。
 */

import { matchesLinkPolicy } from './columns/linkPolicy.js';
import { matchesKontaPolicy } from './columns/kontaPolicy.js';
import { matchesTanuPolicy } from './columns/tanuPolicy.js';

/**
 * @typedef {import('./columns/linkPolicy.js').LinkPolicyEntry} TierEntry
 */

/**
 * エントリを 0/1/2/3 の tier 値に射影する。
 *
 * @param {TierEntry|null|undefined} entry
 * @returns {0|1|2|3}
 */
export function resolveLaneTier(entry) {
  const uid = String(entry?.userId || '').trim();
  if (!uid) return 0;
  // 順序固定: tanu → link → konta
  if (matchesTanuPolicy(entry)) return 1;
  if (matchesLinkPolicy(entry)) return 3;
  if (matchesKontaPolicy(entry)) return 2;
  // どの policy にも当たらないケースは理論上存在しない（= 非匿名で observed/url/nick
  // すべて無い → kontaPolicy が true を返すべき）が、防御的に tanu に落とす
  return 1;
}
