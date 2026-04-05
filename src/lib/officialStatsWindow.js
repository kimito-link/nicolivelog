import { calcCommentCaptureRatio } from './concurrentEstimate.js';

/**
 * @typedef {{
 *   at?: number|null,
 *   statisticsComments?: number|null,
 *   recordedComments?: number|null
 * }} OfficialCommentSample
 */

/**
 * @typedef {{
 *   previousStatisticsComments: number,
 *   currentStatisticsComments: number,
 *   receivedCommentsDelta: number,
 *   statisticsCommentsDelta: number,
 *   captureRatio: number,
 *   sampleWindowMs: number
 * }} OfficialCommentSummary
 */

/**
 * official statistics.comments と保存済みコメント件数の履歴から、
 * 比較可能な 2 点を選んで captureRatio 用サマリを返す。
 *
 * @param {object} params
 * @param {OfficialCommentSample[]|null|undefined} params.history
 * @param {number} [params.nowMs]
 * @param {number} [params.targetWindowMs]
 * @param {number} [params.minWindowMs]
 * @returns {OfficialCommentSummary|null}
 */
export function summarizeOfficialCommentHistory({
  history,
  nowMs,
  targetWindowMs = 60 * 1000,
  minWindowMs = 15 * 1000
}) {
  if (!Array.isArray(history) || history.length < 2) return null;

  const now =
    typeof nowMs === 'number' && Number.isFinite(nowMs)
      ? nowMs
      : Date.now();
  const valid = history
    .map((sample) => ({
      at: Number(sample?.at),
      statisticsComments: Number(sample?.statisticsComments),
      recordedComments: Number(sample?.recordedComments)
    }))
    .filter(
      (sample) =>
        Number.isFinite(sample.at) &&
        sample.at <= now &&
        Number.isFinite(sample.statisticsComments) &&
        sample.statisticsComments >= 0 &&
        Number.isFinite(sample.recordedComments) &&
        sample.recordedComments >= 0
    )
    .sort((a, b) => a.at - b.at);

  if (valid.length < 2) return null;

  const current = valid[valid.length - 1];
  let previous = null;
  for (let i = valid.length - 2; i >= 0; i -= 1) {
    const candidate = valid[i];
    const windowMs = current.at - candidate.at;
    if (!(windowMs >= minWindowMs)) continue;
    previous = candidate;
    if (windowMs >= targetWindowMs) break;
  }
  if (!previous) return null;

  const statisticsCommentsDelta = Math.max(
    0,
    current.statisticsComments - previous.statisticsComments
  );
  const receivedCommentsDelta = Math.max(
    0,
    current.recordedComments - previous.recordedComments
  );

  return {
    previousStatisticsComments: previous.statisticsComments,
    currentStatisticsComments: current.statisticsComments,
    receivedCommentsDelta,
    statisticsCommentsDelta,
    captureRatio: calcCommentCaptureRatio({
      previousStatisticsComments: previous.statisticsComments,
      currentStatisticsComments: current.statisticsComments,
      receivedCommentsDelta
    }),
    sampleWindowMs: Math.max(0, current.at - previous.at)
  };
}
