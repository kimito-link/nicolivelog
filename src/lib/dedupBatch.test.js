import { describe, it, expect, vi, afterEach } from 'vitest';
import { createDedupAccumulator, batchAggregateByKey } from './dedupBatch.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('createDedupAccumulator', () => {
  it('新規アイテムを追加できる', () => {
    const acc = createDedupAccumulator((item) => item.id);
    expect(acc.add({ id: '1', name: 'a' })).toBe(true);
    expect(acc.add({ id: '2', name: 'b' })).toBe(true);
    expect(acc.size()).toBe(2);
  });

  it('重複キーは追加されない', () => {
    const acc = createDedupAccumulator((item) => item.id);
    acc.add({ id: '1', name: 'a' });
    expect(acc.add({ id: '1', name: 'b' })).toBe(false);
    expect(acc.size()).toBe(1);
  });

  it('flush() は蓄積分を返してクリアする', () => {
    const acc = createDedupAccumulator((item) => item.id);
    acc.add({ id: '1', name: 'a' });
    acc.add({ id: '2', name: 'b' });

    const flushed = acc.flush();
    expect(flushed).toHaveLength(2);
    expect(flushed[0]).toEqual({ id: '1', name: 'a' });
    expect(acc.size()).toBe(0);
  });

  it('flush 後は同じキーを再度追加できる', () => {
    const acc = createDedupAccumulator((item) => item.id);
    acc.add({ id: '1', name: 'a' });
    acc.flush();
    expect(acc.add({ id: '1', name: 'a2' })).toBe(true);
  });

  it('has() でキーの存在を確認', () => {
    const acc = createDedupAccumulator((item) => item.id);
    acc.add({ id: 'x', name: 'y' });
    expect(acc.has('x')).toBe(true);
    expect(acc.has('z')).toBe(false);
  });

  it('maxSize を超えると oldest が削除される', () => {
    const acc = createDedupAccumulator((item) => item.id, { maxSize: 2 });
    acc.add({ id: '1', name: 'a' });
    acc.add({ id: '2', name: 'b' });
    acc.add({ id: '3', name: 'c' });
    expect(acc.has('1')).toBe(false);
    expect(acc.has('2')).toBe(true);
    expect(acc.has('3')).toBe(true);
  });
});

describe('batchAggregateByKey', () => {
  it('キーごとにアイテムを集約する', () => {
    const items = [
      { userId: 'u1', text: 'hello' },
      { userId: 'u2', text: 'world' },
      { userId: 'u1', text: 'again' }
    ];
    const result = batchAggregateByKey(items, (i) => i.userId);
    expect(result.get('u1')).toHaveLength(2);
    expect(result.get('u2')).toHaveLength(1);
  });

  it('空配列は空 Map を返す', () => {
    const result = batchAggregateByKey([], (i) => i.id);
    expect(result.size).toBe(0);
  });

  it('keyFn が空文字を返すアイテムはスキップ', () => {
    const items = [
      { userId: '', text: 'anonymous' },
      { userId: 'u1', text: 'named' }
    ];
    const result = batchAggregateByKey(items, (i) => i.userId);
    expect(result.has('')).toBe(false);
    expect(result.size).toBe(1);
  });
});
