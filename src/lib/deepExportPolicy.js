import { shouldSkipDeepHarvest } from './shouldSkipDeepHarvest.js';

/**
 * popup からの deep export 要求時に、仮想リスト走査を行うかを判定する。
 * P0 方針: NDGR が活性なら deep export 走査は抑止し、実行時も quietScroll を強制する。
 *
 * @param {{ deep: boolean, ndgrLastReceivedAt: number|null|undefined, now: number, thresholdMs: number }} opts
 * @returns {{ shouldRunSweep: boolean, quietScroll: true, skipReason: ''|'not_deep_request'|'ndgr_active' }}
 */
export function planDeepExportSweep(opts) {
  if (!opts.deep) {
    return {
      shouldRunSweep: false,
      quietScroll: true,
      skipReason: 'not_deep_request'
    };
  }
  if (
    shouldSkipDeepHarvest({
      ndgrLastReceivedAt: opts.ndgrLastReceivedAt,
      now: opts.now,
      thresholdMs: opts.thresholdMs
    })
  ) {
    return {
      shouldRunSweep: false,
      quietScroll: true,
      skipReason: 'ndgr_active'
    };
  }
  return {
    shouldRunSweep: true,
    quietScroll: true,
    skipReason: ''
  };
}
