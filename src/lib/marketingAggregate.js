/**
 * @typedef {import('./commentRecord.js').StoredComment} StoredComment
 */

/**
 * @typedef {{
 *   userId: string,
 *   nickname: string,
 *   avatarUrl: string,
 *   count: number,
 *   firstAt: number,
 *   lastAt: number
 * }} UserCommentProfile
 */

/**
 * @typedef {{
 *   minute: number,
 *   count: number,
 *   uniqueUsers: number
 * }} TimelineBucket
 */

/**
 * @typedef {{
 *   liveId: string,
 *   totalComments: number,
 *   uniqueUsers: number,
 *   avgCommentsPerUser: number,
 *   medianCommentsPerUser: number,
 *   peakMinute: number,
 *   peakMinuteCount: number,
 *   durationMinutes: number,
 *   commentsPerMinute: number,
 *   topUsers: UserCommentProfile[],
 *   timeline: TimelineBucket[],
 *   segmentCounts: { heavy: number, mid: number, light: number, once: number },
 *   segmentPcts: { heavy: number, mid: number, light: number, once: number },
 *   hourDistribution: number[]
 * }} MarketingReport
 */

/**
 * StoredComment の配列からマーケティング分析用の集計を行う。
 * @param {StoredComment[]} comments
 * @param {string} liveId
 * @returns {MarketingReport}
 */
export function aggregateMarketingReport(comments, liveId) {
  const filtered = comments.filter(
    (c) => c.liveId === liveId && c.text && c.text.trim()
  );

  /** @type {Map<string, UserCommentProfile>} */
  const userMap = new Map();
  const timestamps = [];

  for (const c of filtered) {
    const uid = c.userId || `anon:${(c.commentNo || c.id || '').slice(0, 12)}`;
    const t = c.capturedAt || 0;
    timestamps.push(t);

    const existing = userMap.get(uid);
    if (existing) {
      existing.count++;
      if (!existing.nickname && c.nickname) existing.nickname = c.nickname;
      if (!existing.avatarUrl && c.avatarUrl) existing.avatarUrl = c.avatarUrl;
      if (t < existing.firstAt) existing.firstAt = t;
      if (t > existing.lastAt) existing.lastAt = t;
    } else {
      userMap.set(uid, {
        userId: uid,
        nickname: c.nickname || '',
        avatarUrl: c.avatarUrl || '',
        count: 1,
        firstAt: t,
        lastAt: t
      });
    }
  }

  const users = [...userMap.values()];
  users.sort((a, b) => b.count - a.count);
  const counts = users.map((u) => u.count).sort((a, b) => a - b);
  const median =
    counts.length === 0
      ? 0
      : counts.length % 2 === 1
        ? counts[Math.floor(counts.length / 2)]
        : (counts[counts.length / 2 - 1] + counts[counts.length / 2]) / 2;

  const minT = timestamps.length ? Math.min(...timestamps) : 0;
  const maxT = timestamps.length ? Math.max(...timestamps) : 0;
  const durationMs = maxT - minT;
  const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

  /** @type {Map<number, { count: number, uids: Set<string> }>} */
  const bucketMap = new Map();
  for (const c of filtered) {
    const t = c.capturedAt || 0;
    const minute = Math.floor((t - minT) / 60000);
    const uid = c.userId || `anon:${(c.commentNo || '').slice(0, 12)}`;
    let b = bucketMap.get(minute);
    if (!b) {
      b = { count: 0, uids: new Set() };
      bucketMap.set(minute, b);
    }
    b.count++;
    b.uids.add(uid);
  }

  /** @type {TimelineBucket[]} */
  const timeline = [];
  let peakMinute = 0;
  let peakMinuteCount = 0;
  for (let m = 0; m <= durationMinutes; m++) {
    const b = bucketMap.get(m);
    const count = b ? b.count : 0;
    const uniqueUsers = b ? b.uids.size : 0;
    timeline.push({ minute: m, count, uniqueUsers });
    if (count > peakMinuteCount) {
      peakMinute = m;
      peakMinuteCount = count;
    }
  }

  const heavy = users.filter((u) => u.count >= 10).length;
  const mid = users.filter((u) => u.count >= 4 && u.count < 10).length;
  const light = users.filter((u) => u.count >= 2 && u.count < 4).length;
  const once = users.filter((u) => u.count === 1).length;
  const total = Math.max(1, users.length);

  /** @type {number[]} */
  const hourDistribution = new Array(24).fill(0);
  for (const t of timestamps) {
    const h = new Date(t).getHours();
    hourDistribution[h]++;
  }

  return {
    liveId,
    totalComments: filtered.length,
    uniqueUsers: users.length,
    avgCommentsPerUser:
      users.length > 0 ? Math.round((filtered.length / users.length) * 10) / 10 : 0,
    medianCommentsPerUser: median,
    peakMinute,
    peakMinuteCount,
    durationMinutes,
    commentsPerMinute:
      Math.round((filtered.length / durationMinutes) * 10) / 10,
    topUsers: users.slice(0, 30),
    timeline,
    segmentCounts: { heavy, mid, light, once },
    segmentPcts: {
      heavy: Math.round((heavy / total) * 1000) / 10,
      mid: Math.round((mid / total) * 1000) / 10,
      light: Math.round((light / total) * 1000) / 10,
      once: Math.round((once / total) * 1000) / 10
    },
    hourDistribution
  };
}
