import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLatestSnapshot } from './latestSnapshot.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('createLatestSnapshot', () => {
  it('push した最新の値を processFn に渡す', async () => {
    vi.useFakeTimers();
    const processFn = vi.fn();
    const snap = createLatestSnapshot(processFn, { debounceMs: 100 });

    snap.push('a');
    snap.push('b');
    snap.push('c');

    vi.advanceTimersByTime(101);

    expect(processFn).toHaveBeenCalledTimes(1);
    expect(processFn).toHaveBeenCalledWith('c');
  });

  it('debounce 期間中の中間値は破棄される', async () => {
    vi.useFakeTimers();
    const processFn = vi.fn();
    const snap = createLatestSnapshot(processFn, { debounceMs: 200 });

    snap.push('1');
    vi.advanceTimersByTime(50);
    snap.push('2');
    vi.advanceTimersByTime(50);
    snap.push('3');
    vi.advanceTimersByTime(201);

    expect(processFn).toHaveBeenCalledTimes(1);
    expect(processFn).toHaveBeenCalledWith('3');
  });

  it('debounce 経過後の新しい push は新しいバッチ', async () => {
    vi.useFakeTimers();
    const processFn = vi.fn();
    const snap = createLatestSnapshot(processFn, { debounceMs: 100 });

    snap.push('batch1');
    vi.advanceTimersByTime(101);

    snap.push('batch2');
    vi.advanceTimersByTime(101);

    expect(processFn).toHaveBeenCalledTimes(2);
    expect(processFn).toHaveBeenNthCalledWith(1, 'batch1');
    expect(processFn).toHaveBeenNthCalledWith(2, 'batch2');
  });

  it('cancel() でペンディングの処理をキャンセル', () => {
    vi.useFakeTimers();
    const processFn = vi.fn();
    const snap = createLatestSnapshot(processFn, { debounceMs: 100 });

    snap.push('data');
    snap.cancel();
    vi.advanceTimersByTime(200);

    expect(processFn).not.toHaveBeenCalled();
  });

  it('latest() は最後に push された値を返す', () => {
    const snap = createLatestSnapshot(() => {}, { debounceMs: 100 });
    expect(snap.latest()).toBeUndefined();
    snap.push('a');
    snap.push('b');
    expect(snap.latest()).toBe('b');
  });

  it('push が無ければ processFn は呼ばれない', () => {
    vi.useFakeTimers();
    const processFn = vi.fn();
    createLatestSnapshot(processFn, { debounceMs: 100 });
    vi.advanceTimersByTime(200);
    expect(processFn).not.toHaveBeenCalled();
  });
});
