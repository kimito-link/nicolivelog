import { describe, it, expect, vi } from 'vitest';
import { safeOptional, safeOptionalSync, withFallback } from './safeOptional.js';

describe('safeOptional', () => {
  it('成功時は結果を返す', async () => {
    const fn = vi.fn().mockResolvedValue('data');
    const result = await safeOptional(fn, 'arg1');
    expect(result).toBe('data');
    expect(fn).toHaveBeenCalledWith('arg1');
  });

  it('失敗時は null を返す', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('network'));
    const result = await safeOptional(fn, 'arg1');
    expect(result).toBeNull();
  });

  it('onError コールバックが失敗時に呼ばれる', async () => {
    const onError = vi.fn();
    const fn = vi.fn().mockRejectedValue(new Error('oops'));
    await safeOptional(fn, 'x', { onError });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});

describe('safeOptionalSync', () => {
  it('成功時は結果を返す', () => {
    expect(safeOptionalSync(() => 42)).toBe(42);
  });

  it('例外時は null を返す', () => {
    expect(safeOptionalSync(() => { throw new Error('sync fail'); })).toBeNull();
  });
});

describe('withFallback', () => {
  it('成功時は結果を返す', async () => {
    const fn = vi.fn().mockResolvedValue('real');
    const result = await withFallback(fn, 'default');
    expect(result).toBe('real');
  });

  it('失敗時はフォールバック値を返す', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await withFallback(fn, 'fallback');
    expect(result).toBe('fallback');
  });

  it('フォールバック関数も受け取れる', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await withFallback(fn, () => 'computed');
    expect(result).toBe('computed');
  });
});
