import { describe, expect, it } from 'vitest';
import { planDeepExportSweep } from './deepExportPolicy.js';

describe('planDeepExportSweep', () => {
  const NOW = 1_000_000;

  it('deep=false なら走査しない', () => {
    expect(
      planDeepExportSweep({
        deep: false,
        ndgrLastReceivedAt: NOW - 10_000,
        now: NOW,
        thresholdMs: 60_000
      })
    ).toEqual({
      shouldRunSweep: false,
      quietScroll: true,
      skipReason: 'not_deep_request'
    });
  });

  it('deep=true かつ NDGR が活性なら走査しない', () => {
    expect(
      planDeepExportSweep({
        deep: true,
        ndgrLastReceivedAt: NOW - 10_000,
        now: NOW,
        thresholdMs: 60_000
      })
    ).toEqual({
      shouldRunSweep: false,
      quietScroll: true,
      skipReason: 'ndgr_active'
    });
  });

  it('deep=true かつ NDGR が古ければ走査する（quietScroll固定）', () => {
    expect(
      planDeepExportSweep({
        deep: true,
        ndgrLastReceivedAt: NOW - 120_000,
        now: NOW,
        thresholdMs: 60_000
      })
    ).toEqual({
      shouldRunSweep: true,
      quietScroll: true,
      skipReason: ''
    });
  });
});
