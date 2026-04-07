/**
 * ポップアップ「推定同時接続」カードでローディングを解除するかどうか。
 * 来場者 DOM のみ取得済み・liveId のみ確実、などでも無限スピナーを避ける。
 *
 * @param {object} p
 * @param {number} [p.recentActiveUsers]
 * @param {number|null|undefined} [p.officialViewerCount]
 * @param {number|null|undefined} [p.viewerCountFromDom]
 * @param {string} [p.liveId]
 * @returns {boolean}
 */
export function shouldShowConcurrentEstimate({
  recentActiveUsers,
  officialViewerCount,
  viewerCountFromDom,
  liveId
}) {
  const recent =
    typeof recentActiveUsers === 'number' && Number.isFinite(recentActiveUsers)
      ? recentActiveUsers
      : 0;
  if (recent > 0) return true;
  if (
    typeof officialViewerCount === 'number' &&
    Number.isFinite(officialViewerCount)
  ) {
    return true;
  }
  const vc = viewerCountFromDom;
  if (typeof vc === 'number' && Number.isFinite(vc) && vc >= 0) return true;
  return Boolean(String(liveId || '').trim());
}

/**
 * 上記で表示するが、来場者・公式 viewers・アクティブコメが揃っていない低データ状態か。
 *
 * @param {object} p
 * @param {number} [p.recentActiveUsers]
 * @param {number|null|undefined} [p.officialViewerCount]
 * @param {number|null|undefined} [p.viewerCountFromDom]
 * @returns {boolean}
 */
export function concurrentEstimateIsSparseSignal({
  recentActiveUsers,
  officialViewerCount,
  viewerCountFromDom
}) {
  const recent =
    typeof recentActiveUsers === 'number' && Number.isFinite(recentActiveUsers)
      ? recentActiveUsers
      : 0;
  if (recent > 0) return false;
  if (
    typeof officialViewerCount === 'number' &&
    Number.isFinite(officialViewerCount)
  ) {
    return false;
  }
  const vc = viewerCountFromDom;
  if (typeof vc === 'number' && Number.isFinite(vc) && vc >= 0) return false;
  return true;
}
