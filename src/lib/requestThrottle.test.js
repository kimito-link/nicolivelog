import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRequestThrottle } from './requestThrottle.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('createRequestThrottle', () => {
  it('最初のリクエストは即座に実行される', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const throttled = createRequestThrottle(fn, { minIntervalMs: 1000 });
    const result = await throttled('a');
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('minIntervalMs 内の連続呼び出しは待機してから実行', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockResolvedValue('ok');
    const throttled = createRequestThrottle(fn, { minIntervalMs: 1000 });

    await throttled('first');
    const p2 = throttled('second');

    vi.advanceTimersByTime(1001);
    const result = await p2;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  it('minIntervalMs 経過後は即座に実行', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockResolvedValue('ok');
    const throttled = createRequestThrottle(fn, { minIntervalMs: 100 });

    await throttled('first');
    vi.advanceTimersByTime(150);
    const result = await throttled('second');

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('fn が失敗してもスロットルは継続', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('recovered');
    const throttled = createRequestThrottle(fn, { minIntervalMs: 0 });

    await expect(throttled('a')).rejects.toThrow('fail');
    const result = await throttled('b');
    expect(result).toBe('recovered');
  });

  it('pending() はキュー内の待機数を返す', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockResolvedValue('ok');
    const throttled = createRequestThrottle(fn, { minIntervalMs: 5000 });

    await throttled('first');
    throttled('second');
    throttled('third');

    expect(throttled.pending()).toBe(2);
    vi.advanceTimersByTime(5001);
    await vi.runAllTimersAsync();
  });
});
