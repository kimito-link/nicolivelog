import { describe, it, expect } from 'vitest';
import {
  countRecentActiveUsers,
  estimateConcurrentViewers,
  DEFAULT_WINDOW_MS,
  DEFAULT_MULTIPLIER
} from './concurrentEstimate.js';

describe('countRecentActiveUsers', () => {
  it('空 Map なら 0', () => {
    expect(countRecentActiveUsers(new Map(), Date.now())).toBe(0);
  });

  it('全員ウィンドウ内なら全員カウント', () => {
    const now = 1_000_000;
    const m = new Map([
      ['a', now - 1000],
      ['b', now - 2000],
      ['c', now - 3000]
    ]);
    expect(countRecentActiveUsers(m, now)).toBe(3);
  });

  it('ウィンドウ外のユーザーは除外', () => {
    const now = 1_000_000;
    const m = new Map([
      ['a', now - 1000],
      ['b', now - DEFAULT_WINDOW_MS - 1],
      ['c', now - DEFAULT_WINDOW_MS]
    ]);
    expect(countRecentActiveUsers(m, now)).toBe(2);
  });

  it('カスタムウィンドウ幅を指定', () => {
    const now = 100_000;
    const m = new Map([
      ['a', now - 500],
      ['b', now - 1500]
    ]);
    expect(countRecentActiveUsers(m, now, 1000)).toBe(1);
    expect(countRecentActiveUsers(m, now, 2000)).toBe(2);
  });

  it('windowMs が無効値なら DEFAULT_WINDOW_MS を使う', () => {
    const now = 1_000_000;
    const m = new Map([['a', now - 1000]]);
    expect(countRecentActiveUsers(m, now, -100)).toBe(1);
    expect(countRecentActiveUsers(m, now, 0)).toBe(1);
  });
});

describe('estimateConcurrentViewers', () => {
  it('アクティブユーザー × デフォルト乗数', () => {
    const r = estimateConcurrentViewers({ recentActiveUsers: 50 });
    expect(r.estimated).toBe(50 * DEFAULT_MULTIPLIER);
    expect(r.activeCommenters).toBe(50);
    expect(r.multiplier).toBe(DEFAULT_MULTIPLIER);
    expect(r.capped).toBe(false);
  });

  it('カスタム乗数', () => {
    const r = estimateConcurrentViewers({ recentActiveUsers: 20, multiplier: 15 });
    expect(r.estimated).toBe(300);
    expect(r.multiplier).toBe(15);
  });

  it('来場者数でキャップ', () => {
    const r = estimateConcurrentViewers({
      recentActiveUsers: 100,
      totalVisitors: 500,
      multiplier: 10
    });
    expect(r.estimated).toBe(500);
    expect(r.capped).toBe(true);
  });

  it('来場者数を超えなければキャップなし', () => {
    const r = estimateConcurrentViewers({
      recentActiveUsers: 10,
      totalVisitors: 5000,
      multiplier: 10
    });
    expect(r.estimated).toBe(100);
    expect(r.capped).toBe(false);
  });

  it('アクティブ 0 なら推定 0', () => {
    const r = estimateConcurrentViewers({ recentActiveUsers: 0 });
    expect(r.estimated).toBe(0);
    expect(r.activeCommenters).toBe(0);
  });

  it('totalVisitors が無効なら無視', () => {
    const r = estimateConcurrentViewers({
      recentActiveUsers: 10,
      totalVisitors: NaN
    });
    expect(r.estimated).toBe(100);
    expect(r.capped).toBe(false);
  });

  it('multiplier が無効ならデフォルト', () => {
    const r = estimateConcurrentViewers({
      recentActiveUsers: 5,
      multiplier: -1
    });
    expect(r.estimated).toBe(5 * DEFAULT_MULTIPLIER);
    expect(r.multiplier).toBe(DEFAULT_MULTIPLIER);
  });

  it('recentActiveUsers が小数の場合は切り捨て', () => {
    const r = estimateConcurrentViewers({ recentActiveUsers: 7.8 });
    expect(r.activeCommenters).toBe(7);
    expect(r.estimated).toBe(70);
  });
});
