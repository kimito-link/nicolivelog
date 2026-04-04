/**
 * 直近のアクティブコメンターから同時接続数を推定する純関数モジュール。
 *
 * ニコ生では視聴者の一定割合しかコメントしない。
 * 直近 N 分間のユニークコメンター数に乗数を掛けることで
 * おおまかな同時接続数を見積もる。
 */

/** @type {number} */
export const DEFAULT_WINDOW_MS = 5 * 60 * 1000;

/** @type {number} */
export const DEFAULT_MULTIPLIER = 10;

/**
 * タイムスタンプ付き userId Map から、指定ウィンドウ内のアクティブユーザー数を返す。
 *
 * @param {ReadonlyMap<string, number>} userTimestamps  userId → lastSeenAt (ms)
 * @param {number} now  現在時刻 (ms)
 * @param {number} [windowMs]  ウィンドウ幅 (ms)。省略時 5 分
 * @returns {number} ウィンドウ内のユニークユーザー数
 */
export function countRecentActiveUsers(userTimestamps, now, windowMs) {
  const w = typeof windowMs === 'number' && windowMs > 0 ? windowMs : DEFAULT_WINDOW_MS;
  const cutoff = now - w;
  let count = 0;
  for (const ts of userTimestamps.values()) {
    if (ts >= cutoff) count++;
  }
  return count;
}

/**
 * 推定同時接続数を計算する。
 *
 * @param {object} params
 * @param {number} params.recentActiveUsers  直近ウィンドウ内のユニークコメンター数
 * @param {number} [params.totalVisitors]    来場者数（上限キャップに使う）
 * @param {number} [params.multiplier]       乗数（省略時 10）
 * @returns {{ estimated: number, activeCommenters: number, multiplier: number, capped: boolean }}
 */
export function estimateConcurrentViewers({
  recentActiveUsers,
  totalVisitors,
  multiplier
}) {
  const m = typeof multiplier === 'number' && multiplier > 0 ? multiplier : DEFAULT_MULTIPLIER;
  const active = typeof recentActiveUsers === 'number' && recentActiveUsers >= 0
    ? Math.floor(recentActiveUsers)
    : 0;

  let estimated = active * m;
  let capped = false;

  if (
    typeof totalVisitors === 'number' &&
    Number.isFinite(totalVisitors) &&
    totalVisitors > 0 &&
    estimated > totalVisitors
  ) {
    estimated = totalVisitors;
    capped = true;
  }

  return { estimated, activeCommenters: active, multiplier: m, capped };
}
