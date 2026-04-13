/**
 * コメント取り込みパイプラインの構造化デバッグログ（純関数フォーマッタ）。
 * content-entry の persistCommentRowsImpl から呼ばれ、
 * 「どの段で何件変化したか」を追跡できるようにする。
 */

export const PIPELINE_LOG_PREFIX = '[comment-pipeline]';

/**
 * @param {'start'|'merge'|'commit'|'done'|'skip'} phase
 * @param {Record<string, unknown>} data
 * @returns {string}
 */
export function formatPipelinePhase(phase, data) {
  const p = PIPELINE_LOG_PREFIX;
  switch (phase) {
    case 'start':
      return `${p} 開始: liveId=${data.liveId}, existing=${data.existingCount}, incoming=${data.incomingCount}`;
    case 'merge':
      return `${p} マージ: +${data.added}件追加, touched=${data.storageTouched}`;
    case 'commit':
      return `${p} 保存: ${data.keysWritten}キー`;
    case 'done':
      return `${p} 完了: 合計${data.totalCount}件 (${data.elapsedMs}ms)`;
    case 'skip':
      return `${p} スキップ: ${data.reason}`;
    default:
      return `${p} ${phase}: ${JSON.stringify(data)}`;
  }
}
