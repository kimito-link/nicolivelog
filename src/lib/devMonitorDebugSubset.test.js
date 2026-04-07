import { describe, it, expect } from 'vitest';
import { pickDevMonitorDebugSubset } from './devMonitorDebugSubset.js';

describe('pickDevMonitorDebugSubset', () => {
  it('空・非オブジェクトは空オブジェクト', () => {
    expect(pickDevMonitorDebugSubset(null)).toEqual({});
    expect(pickDevMonitorDebugSubset(undefined)).toEqual({});
    expect(pickDevMonitorDebugSubset(/** @type {any} */ ('x'))).toEqual({});
  });

  it('許可キーのみ残し gridKids 等は落とす', () => {
    const sub = pickDevMonitorDebugSubset({
      ndgr: 's=1 c=2 d=3',
      intercept: 400,
      gridKids: [{ txt: '秘密のコメント' }],
      deepSample: { txt: 'もっと秘密' }
    });
    expect(sub.ndgr).toBe('s=1 c=2 d=3');
    expect(sub.intercept).toBe(400);
    expect(sub).not.toHaveProperty('gridKids');
    expect(sub).not.toHaveProperty('deepSample');
  });

  it('harvestPipeline をそのまま通す', () => {
    const hp = { runCount: 3, lastRowCount: 120, harvestRunning: false };
    const sub = pickDevMonitorDebugSubset({
      intercept: 1,
      harvestPipeline: hp
    });
    expect(sub.harvestPipeline).toEqual(hp);
  });
});
