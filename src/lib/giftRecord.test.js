import { describe, it, expect } from 'vitest';
import { mergeGiftUsers } from './giftRecord.js';

describe('mergeGiftUsers', () => {
  it('空の existing に incoming を追加', () => {
    const { next, added, storageTouched } = mergeGiftUsers([], [
      { userId: '12345', nickname: 'ギフター' }
    ]);
    expect(next).toHaveLength(1);
    expect(added).toHaveLength(1);
    expect(next[0].userId).toBe('12345');
    expect(next[0].nickname).toBe('ギフター');
    expect(typeof next[0].capturedAt).toBe('number');
    expect(storageTouched).toBe(true);
  });

  it('同じ userId は重複追加しない', () => {
    const existing = [
      { userId: '12345', nickname: 'A', capturedAt: 1000 }
    ];
    const { next, added, storageTouched } = mergeGiftUsers(existing, [
      { userId: '12345', nickname: 'A' }
    ]);
    expect(next).toHaveLength(1);
    expect(added).toHaveLength(0);
    expect(storageTouched).toBe(false);
  });

  it('既存にニックネームが無ければ incoming で補完', () => {
    const existing = [
      { userId: '12345', nickname: '', capturedAt: 1000 }
    ];
    const { next, storageTouched } = mergeGiftUsers(existing, [
      { userId: '12345', nickname: '新名前' }
    ]);
    expect(next[0].nickname).toBe('新名前');
    expect(storageTouched).toBe(true);
  });

  it('既存にニックネームがあれば上書きしない', () => {
    const existing = [
      { userId: '12345', nickname: '既存名', capturedAt: 1000 }
    ];
    const { next, storageTouched } = mergeGiftUsers(existing, [
      { userId: '12345', nickname: '別名前' }
    ]);
    expect(next[0].nickname).toBe('既存名');
    expect(storageTouched).toBe(false);
  });

  it('userId が空の incoming はスキップ', () => {
    const { next, added } = mergeGiftUsers([], [
      { userId: '', nickname: 'A' },
      { userId: '  ', nickname: 'B' }
    ]);
    expect(next).toHaveLength(0);
    expect(added).toHaveLength(0);
  });

  it('複数ユーザーをまとめて追加', () => {
    const { next, added, storageTouched } = mergeGiftUsers([], [
      { userId: '100', nickname: 'A' },
      { userId: '200', nickname: 'B' },
      { userId: '100', nickname: 'A2' }
    ]);
    expect(next).toHaveLength(2);
    expect(added).toHaveLength(2);
    expect(next.map((u) => u.userId)).toEqual(['100', '200']);
    expect(storageTouched).toBe(true);
  });

  it('incoming が空なら何もしない', () => {
    const existing = [
      { userId: '1', nickname: 'x', capturedAt: 1 }
    ];
    const { next, added, storageTouched } = mergeGiftUsers(existing, []);
    expect(next).toHaveLength(1);
    expect(added).toHaveLength(0);
    expect(storageTouched).toBe(false);
  });
});
