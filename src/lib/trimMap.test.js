import { describe, it, expect } from 'vitest';
import { trimMapToMax } from './trimMap.js';

describe('trimMapToMax', () => {
  it('max 以下なら何もしない', () => {
    const m = new Map([['a', 1], ['b', 2]]);
    trimMapToMax(m, 5);
    expect(m.size).toBe(2);
  });

  it('max を超えたら先頭から削除', () => {
    const m = new Map([['a', 1], ['b', 2], ['c', 3], ['d', 4]]);
    trimMapToMax(m, 2);
    expect(m.size).toBe(2);
    expect(m.has('a')).toBe(false);
    expect(m.has('b')).toBe(false);
    expect(m.has('c')).toBe(true);
    expect(m.has('d')).toBe(true);
  });

  it('ちょうど max なら削除しない', () => {
    const m = new Map([['a', 1], ['b', 2]]);
    trimMapToMax(m, 2);
    expect(m.size).toBe(2);
  });

  it('max=0 で全削除', () => {
    const m = new Map([['a', 1], ['b', 2]]);
    trimMapToMax(m, 0);
    expect(m.size).toBe(0);
  });

  it('空 Map は何もしない', () => {
    const m = new Map();
    trimMapToMax(m, 5);
    expect(m.size).toBe(0);
  });
});
