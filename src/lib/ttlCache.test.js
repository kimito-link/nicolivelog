import { describe, it, expect, vi, afterEach } from 'vitest';
import { createTtlCache } from './ttlCache.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('createTtlCache', () => {
  it('set/get で値を保存・取得できる', () => {
    const c = createTtlCache({ ttlMs: 10_000 });
    c.set('key1', 'value1');
    expect(c.get('key1')).toBe('value1');
  });

  it('TTL 経過後は undefined を返す', () => {
    vi.useFakeTimers();
    const c = createTtlCache({ ttlMs: 5000 });
    c.set('key1', 'value1');
    expect(c.get('key1')).toBe('value1');

    vi.advanceTimersByTime(5001);
    expect(c.get('key1')).toBeUndefined();
  });

  it('TTL 経過前は値が残る', () => {
    vi.useFakeTimers();
    const c = createTtlCache({ ttlMs: 5000 });
    c.set('key1', 'value1');

    vi.advanceTimersByTime(4999);
    expect(c.get('key1')).toBe('value1');
  });

  it('has() は TTL を考慮する', () => {
    vi.useFakeTimers();
    const c = createTtlCache({ ttlMs: 1000 });
    c.set('k', 1);
    expect(c.has('k')).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(c.has('k')).toBe(false);
  });

  it('maxSize を超えると古い順に削除', () => {
    const c = createTtlCache({ ttlMs: 60_000, maxSize: 3 });
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    c.set('d', 4);
    expect(c.has('a')).toBe(false);
    expect(c.get('b')).toBe(2);
    expect(c.get('d')).toBe(4);
  });

  it('clear() で全エントリ削除', () => {
    const c = createTtlCache({ ttlMs: 60_000 });
    c.set('a', 1);
    c.set('b', 2);
    c.clear();
    expect(c.size()).toBe(0);
    expect(c.get('a')).toBeUndefined();
  });

  it('size() は有効なエントリ数を返す', () => {
    vi.useFakeTimers();
    const c = createTtlCache({ ttlMs: 1000 });
    c.set('a', 1);
    c.set('b', 2);
    expect(c.size()).toBe(2);
    vi.advanceTimersByTime(1001);
    expect(c.size()).toBe(0);
  });

  it('set で上書き時は TTL がリセットされる', () => {
    vi.useFakeTimers();
    const c = createTtlCache({ ttlMs: 1000 });
    c.set('k', 'old');
    vi.advanceTimersByTime(800);
    c.set('k', 'new');
    vi.advanceTimersByTime(800);
    expect(c.get('k')).toBe('new');
  });

  it('null/undefined も値として保存できる', () => {
    const c = createTtlCache({ ttlMs: 10_000 });
    c.set('n', null);
    c.set('u', undefined);
    expect(c.has('n')).toBe(true);
    expect(c.get('n')).toBeNull();
    expect(c.has('u')).toBe(true);
    expect(c.get('u')).toBeUndefined();
  });
});
