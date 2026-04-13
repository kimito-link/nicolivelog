import { describe, it, expect, vi } from 'vitest';
import { createAsyncGuard } from './asyncGuard.js';

describe('createAsyncGuard', () => {
  it('最初の呼び出しは即座に実行される', async () => {
    const fn = vi.fn().mockResolvedValue('done');
    const guarded = createAsyncGuard(fn);
    const result = await guarded('arg');
    expect(result).toBe('done');
    expect(fn).toHaveBeenCalledWith('arg');
  });

  it('実行中の再呼び出しは skipValue を返す', async () => {
    let resolve;
    const fn = vi.fn().mockReturnValue(new Promise(r => { resolve = r; }));
    const guarded = createAsyncGuard(fn, { skipValue: 'skipped' });

    const p1 = guarded();
    const p2 = guarded();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(await p2).toBe('skipped');

    resolve('first');
    expect(await p1).toBe('first');
  });

  it('skipValue 省略時は undefined を返す', async () => {
    let resolve;
    const fn = vi.fn().mockReturnValue(new Promise(r => { resolve = r; }));
    const guarded = createAsyncGuard(fn);

    guarded();
    const result = await guarded();
    expect(result).toBeUndefined();

    resolve('ok');
  });

  it('完了後は再度実行可能', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const guarded = createAsyncGuard(fn);

    await guarded('a');
    await guarded('b');

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('fn が失敗してもガードは解除される', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue('recovered');
    const guarded = createAsyncGuard(fn);

    await expect(guarded()).rejects.toThrow('boom');
    const result = await guarded();
    expect(result).toBe('recovered');
  });

  it('isRunning() は実行状態を返す', async () => {
    let resolve;
    const fn = vi.fn().mockReturnValue(new Promise(r => { resolve = r; }));
    const guarded = createAsyncGuard(fn);

    expect(guarded.isRunning()).toBe(false);
    const p = guarded();
    expect(guarded.isRunning()).toBe(true);

    resolve('done');
    await p;
    expect(guarded.isRunning()).toBe(false);
  });

  it('onSkip コールバックがスキップ時に呼ばれる', async () => {
    let resolve;
    const fn = vi.fn().mockReturnValue(new Promise(r => { resolve = r; }));
    const onSkip = vi.fn();
    const guarded = createAsyncGuard(fn, { onSkip });

    guarded();
    guarded('second');

    expect(onSkip).toHaveBeenCalledTimes(1);
    resolve('ok');
  });
});
