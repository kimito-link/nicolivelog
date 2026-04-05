import { describe, it, expect } from 'vitest';
import { ndgrChatsToMergeRows } from './ndgrChatRows.js';

describe('ndgrChatsToMergeRows', () => {
  it('raw_user_id と本文・番号で行を返す', () => {
    const rows = ndgrChatsToMergeRows([
      {
        no: 42,
        rawUserId: 86255751,
        hashedUserId: '',
        name: 'なまえ',
        content: 'こんにちは'
      }
    ]);
    expect(rows).toEqual([
      {
        commentNo: '42',
        text: 'こんにちは',
        userId: '86255751',
        nickname: 'なまえ'
      }
    ]);
  });

  it('hashed_user_id のみでも行を返す', () => {
    const rows = ndgrChatsToMergeRows([
      {
        no: 99,
        rawUserId: null,
        hashedUserId: 'abc123def456',
        name: '',
        content: 'test'
      }
    ]);
    expect(rows).toEqual([
      { commentNo: '99', text: 'test', userId: 'abc123def456' }
    ]);
  });

  it('rawUserId を数値 0 のときは hashed にフォールバック', () => {
    const rows = ndgrChatsToMergeRows([
      {
        no: 1,
        rawUserId: 0,
        hashedUserId: 'hashonly',
        name: '',
        content: 'x'
      }
    ]);
    expect(rows).toEqual([{ commentNo: '1', text: 'x', userId: 'hashonly' }]);
  });

  it('no が null のチャットは除外', () => {
    expect(
      ndgrChatsToMergeRows([
        {
          no: null,
          rawUserId: 1,
          hashedUserId: '',
          name: '',
          content: 'a'
        }
      ])
    ).toEqual([]);
  });

  it('本文が空（正規化後）のチャットは除外', () => {
    expect(
      ndgrChatsToMergeRows([
        {
          no: 1,
          rawUserId: 1,
          hashedUserId: '',
          name: '',
          content: '   \n  '
        }
      ])
    ).toEqual([]);
  });

  it('ユーザー ID が無いチャットは除外', () => {
    expect(
      ndgrChatsToMergeRows([
        {
          no: 5,
          rawUserId: null,
          hashedUserId: '',
          name: '',
          content: 'orphan'
        }
      ])
    ).toEqual([]);
  });

  it('nickname は空なら付けない', () => {
    const rows = ndgrChatsToMergeRows([
      {
        no: 7,
        rawUserId: 123,
        hashedUserId: '',
        name: '  ',
        content: 'hello'
      }
    ]);
    expect(rows).toEqual([{ commentNo: '7', text: 'hello', userId: '123' }]);
  });

  it('複数件を順に返す', () => {
    const rows = ndgrChatsToMergeRows([
      {
        no: 1,
        rawUserId: 10,
        hashedUserId: '',
        name: '',
        content: 'a'
      },
      {
        no: 2,
        rawUserId: null,
        hashedUserId: 'h2',
        name: 'b',
        content: 'b'
      }
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].commentNo).toBe('1');
    expect(rows[1].commentNo).toBe('2');
  });

  it('空配列・非配列は空配列', () => {
    expect(ndgrChatsToMergeRows([])).toEqual([]);
    expect(ndgrChatsToMergeRows(/** @type {any} */ (null))).toEqual([]);
  });
});
