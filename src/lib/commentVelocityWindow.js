/**
 * 直近ウィンドウ内のコメント件数と「件/分」換算（純関数）
 */

/**
 * @param {readonly { capturedAt?: number }[]} entries
 * @param {number} nowMs
 * @param {number} windowMs
 * @returns {number}
 */
export function countCommentsInWindowMs(entries, nowMs, windowMs) {
  if (!Array.isArray(entries) || windowMs <= 0) return 0;
  const now =
    typeof nowMs === 'number' && Number.isFinite(nowMs) ? nowMs : Date.now();
  const cutoff = now - windowMs;
  let n = 0;
  for (const e of entries) {
    const t =
      e && typeof e === 'object' && typeof e.capturedAt === 'number'
        ? e.capturedAt
        : 0;
    if (t >= cutoff && t <= now) n += 1;
  }
  return n;
}

/**
 * @param {number} count
 * @param {number} windowMs
 * @returns {number}
 */
export function commentsPerMinuteFromWindow(count, windowMs) {
  if (windowMs <= 0) return 0;
  const c =
    typeof count === 'number' && Number.isFinite(count) && count >= 0
      ? count
      : 0;
  return (c * 60_000) / windowMs;
}
