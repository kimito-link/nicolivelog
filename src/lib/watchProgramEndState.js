/**
 * 視聴ページ文言から「番組終了状態」を推定する。
 * @param {unknown} text
 * @returns {boolean}
 */
export function isWatchProgramEndedText(text) {
  const s = String(text || '').trim();
  if (!s) return false;
  return /(公開終了|放送は終了|番組は終了|次回の放送をお楽しみ|タイムシフト)/.test(s);
}

/**
 * 配信終了後の一括 deep harvest を実行すべきか判定する純関数。
 * @param {{
 *   recording: boolean,
 *   liveId: string|null|undefined,
 *   locationAllows: boolean,
 *   endedDetected: boolean,
 *   lastTriggeredLiveId: string|null|undefined
 * }} p
 * @returns {boolean}
 */
export function shouldRunEndedBulkHarvest(p) {
  if (!p?.recording) return false;
  if (!p?.locationAllows) return false;
  if (!p?.endedDetected) return false;
  const liveId = String(p?.liveId || '').trim();
  if (!liveId) return false;
  const last = String(p?.lastTriggeredLiveId || '').trim();
  return liveId !== last;
}
