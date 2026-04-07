/**
 * ポップアップ「開発・テスト用 監視」用: watch スナップショット _debug から
 * 数値・カウンタのみ抽出（DOM 本文サンプル等は除外して PII リスクを下げる）
 *
 * @param {Record<string, unknown>|null|undefined} raw
 * @returns {Record<string, unknown>}
 */
export function pickDevMonitorDebugSubset(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const o = /** @type {Record<string, unknown>} */ (raw);
  return {
    wsViewerCount: o.wsViewerCount,
    wsCommentCount: o.wsCommentCount,
    wsAge: o.wsAge,
    intercept: o.intercept,
    harvestPipeline: o.harvestPipeline,
    embeddedVC: o.embeddedVC,
    programBeginAtMs: o.programBeginAtMs,
    embeddedBeginAt: o.embeddedBeginAt,
    edProgramKeys: o.edProgramKeys,
    poll: o.poll,
    dom: o.dom,
    pi: o.pi,
    piEnq: o.piEnq,
    piPost: o.piPost,
    piWs: o.piWs,
    piFetch: o.piFetch,
    piXhr: o.piXhr,
    piPhase: o.piPhase,
    fbScans: o.fbScans,
    fbFound: o.fbFound,
    fbRows: o.fbRows,
    fbProbe: o.fbProbe,
    fbStep: o.fbStep,
    fbAttempts: o.fbAttempts,
    fbErr: o.fbErr,
    fetchLog: o.fetchLog,
    fetchOther: o.fetchOther,
    ndgr: o.ndgr,
    ndgrLdStream: o.ndgrLdStream,
    commentTypeVisibleSample: o.commentTypeVisibleSample
  };
}
