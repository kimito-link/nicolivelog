import { describe, expect, it } from 'vitest';
import {
  mergeTrendArrays,
  parseTrendJsonArray,
  trimTrendByAgeAndCap,
  trendHasCountSamples,
  trendToSparklineArrays
} from './devMonitorTrendSession.js';

describe('devMonitorTrendSession', () => {
  it('trimTrendByAgeAndCap が上限と古さで切る', () => {
    const now = 1_000_000;
    const pts = [
      { t: now - 10, thumb: 1, idPct: 1, nick: 1, comment: 1 },
      { t: now - 8, thumb: 2, idPct: 2, nick: 2, comment: 2 },
      { t: now - 100_000, thumb: 9, idPct: 9, nick: 9, comment: 9 }
    ];
    const r = trimTrendByAgeAndCap(pts, 2, 50, now);
    expect(r.length).toBe(2);
    expect(r[0].thumb).toBe(1);
    expect(r[1].thumb).toBe(2);
  });

  it('mergeTrendArrays が結合して上限内に収める', () => {
    const now = Date.now();
    const a = [{ t: now - 1000, thumb: 1, idPct: 1, nick: 1, comment: 1 }];
    const b = [{ t: now - 500, thumb: 2, idPct: 2, nick: 2, comment: 2 }];
    const m = mergeTrendArrays(a, b);
    expect(m.length).toBe(2);
    expect(m[1].thumb).toBe(2);
  });

  it('parseTrendJsonArray', () => {
    expect(parseTrendJsonArray('')).toEqual([]);
    expect(parseTrendJsonArray('not json')).toEqual([]);
    expect(parseTrendJsonArray(JSON.stringify([{ t: 1 }]))).toEqual([{ t: 1 }]);
  });

  it('trendHasCountSamples', () => {
    expect(
      trendHasCountSamples([
        { t: 1, thumb: 0, idPct: 0, nick: 0, comment: 0, displayCount: 1 }
      ])
    ).toBe(true);
    expect(
      trendHasCountSamples([{ t: 1, thumb: 0, idPct: 0, nick: 0, comment: 0 }])
    ).toBe(false);
  });

  it('trendToSparklineArrays に display/storage が含まれる', () => {
    const ar = trendToSparklineArrays([
      {
        t: 1,
        thumb: 10,
        idPct: 20,
        nick: 30,
        comment: 40,
        displayCount: 5,
        storageCount: 6
      }
    ]);
    expect(ar.displaySeries).toEqual([5]);
    expect(ar.storageSeries).toEqual([6]);
  });
});
