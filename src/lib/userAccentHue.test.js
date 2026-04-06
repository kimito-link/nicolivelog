import { describe, it, expect } from 'vitest';
import { UNKNOWN_USER_KEY } from './userRooms.js';
import { hueFromUserKey } from './userAccentHue.js';

describe('hueFromUserKey', () => {
  it('同じキーは同じ hue', () => {
    expect(hueFromUserKey('a:DrGpMc3qxk3QZ-bs')).toBe(
      hueFromUserKey('a:DrGpMc3qxk3QZ-bs')
    );
  });

  it('UNKNOWN と空は null', () => {
    expect(hueFromUserKey('')).toBeNull();
    expect(hueFromUserKey('   ')).toBeNull();
    expect(hueFromUserKey(UNKNOWN_USER_KEY)).toBeNull();
  });

  it('通常のキーは 0–359 の整数', () => {
    const h = hueFromUserKey('a:foo');
    expect(h).not.toBeNull();
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });

  it('異なる匿名 ID は通常 hue が異なる', () => {
    const a = hueFromUserKey('a:DrGpMc3qxk3QZ-bs');
    const b = hueFromUserKey('a:r1toEtTgn6icO_Y-');
    const c = hueFromUserKey('a:HjMRC5qHhZMvPtu_');
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(c).not.toBeNull();
    const set = new Set([a, b, c]);
    expect(set.size).toBe(3);
  });

  it('数値 userId 風も決定論的', () => {
    expect(hueFromUserKey('12345')).toBe(hueFromUserKey('12345'));
  });
});
