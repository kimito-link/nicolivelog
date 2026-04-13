/**
 * NDGR flush を liveId 確定まで遅延するかを判定する純関数。
 * @param {{ recording: boolean, locationAllows: boolean, liveId: string|null|undefined }} opts
 * @returns {boolean}
 */
export function shouldDeferNdgrFlushUntilLiveId(opts) {
  const recording = Boolean(opts?.recording);
  const locationAllows = Boolean(opts?.locationAllows);
  const liveId = String(opts?.liveId || '').trim();
  return recording && locationAllows && !liveId;
}

/**
 * NDGR backlog を先頭優先で連結し、cap を超えた古い末尾を落とす。
 * @template T
 * @param {T[]} existing
 * @param {T[]} incoming
 * @param {number} cap
 * @returns {T[]}
 */
export function mergeNdgrBacklogWithCap(existing, incoming, cap) {
  const max = Number.isFinite(cap) ? Math.max(1, Math.floor(cap)) : 1;
  const merged = [...incoming, ...existing];
  if (merged.length <= max) return merged;
  return merged.slice(0, max);
}
