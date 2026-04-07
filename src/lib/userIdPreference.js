/**
 * コメント記録まわり: userId の「観測強度」（数字 ID を匿名系より優先する等）
 */

/**
 * @param {unknown} userId
 * @returns {0|1|2} 0=欠損 1=匿名系・ハッシュ等 2=数字5〜14桁（CDN 合成の対象）
 */
export function userIdObservationStrength(userId) {
  const s = String(userId ?? '').trim();
  if (!s) return 0;
  if (/^\d{5,14}$/.test(s)) return 2;
  return 1;
}

/**
 * マージ時: 強い userId を採用。同強度で不一致のときは tiePrefer で決める。
 *
 * @param {unknown} existing
 * @param {unknown} incoming
 * @param {'incoming'|'existing'} [tiePrefer]
 * @returns {string} 正規化済み（trim）。両方空なら ''。
 */
export function pickStrongerUserId(existing, incoming, tiePrefer = 'incoming') {
  const ex = String(existing ?? '').trim();
  const inc = String(incoming ?? '').trim();
  if (!inc) return ex;
  if (!ex) return inc;
  const se = userIdObservationStrength(ex);
  const si = userIdObservationStrength(inc);
  if (si > se) return inc;
  if (si < se) return ex;
  if (inc === ex) return ex;
  return tiePrefer === 'existing' ? ex : inc;
}

/**
 * enrichment: 行由来 uid と intercept 由来 uid を統合。放送者汚染時は行側を捨て intercept に寄せる。
 * 非汚染時は強度優先、同強度は row を優先。
 *
 * @param {unknown} rowUid
 * @param {unknown} interceptedUid
 * @param {boolean} rowLikelyContaminated
 * @returns {string|null}
 */
export function mergeUserIdForEnrichment(
  rowUid,
  interceptedUid,
  rowLikelyContaminated
) {
  const int = String(interceptedUid ?? '').trim();
  const row = String(rowUid ?? '').trim();

  if (rowLikelyContaminated) {
    if (int) return int;
    return row || null;
  }

  const dom = row;
  if (!dom && !int) return null;
  if (!dom) return int;
  if (!int) return dom;

  const sd = userIdObservationStrength(dom);
  const si = userIdObservationStrength(int);
  if (si > sd) return int;
  if (sd > si) return dom;
  return dom;
}
