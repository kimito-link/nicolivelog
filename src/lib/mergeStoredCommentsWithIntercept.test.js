import { describe, expect, it } from 'vitest';
import { mergeStoredCommentsWithIntercept } from './mergeStoredCommentsWithIntercept.js';

describe('mergeStoredCommentsWithIntercept', () => {
  it('commentNo一致で userId/nickname/avatar を後補完できる', () => {
    const existing = [
      { commentNo: '101', text: 'a', userId: 'a:hash1', nickname: '匿名' }
    ];
    const interceptItems = [
      { no: '101', uid: '12345678', name: 'るあ', av: 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/12345678.jpg' }
    ];
    const out = mergeStoredCommentsWithIntercept(existing, interceptItems);
    expect(out.patched).toBe(1);
    expect(out.next[0].userId).toBe('12345678');
    expect(out.next[0].nickname).toBe('るあ');
    expect(out.next[0].avatarUrl).toContain('/usericon/12345678');
    expect(out.next[0].avatarObserved).toBe(true);
  });

  it('intercept重複は非空値を保って統合する', () => {
    const existing = [{ commentNo: '9', text: 'x', userId: null }];
    const interceptItems = [
      { no: '9', uid: '777', name: '', av: '' },
      { no: '9', uid: '', name: 'abc', av: 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/777.jpg' }
    ];
    const out = mergeStoredCommentsWithIntercept(existing, interceptItems);
    expect(out.patched).toBe(1);
    expect(out.next[0].userId).toBe('777');
    expect(out.next[0].nickname).toBe('abc');
    expect(out.next[0].avatarUrl).toContain('/usericon/777');
  });

  it('一致しない commentNo は変更しない', () => {
    const existing = [{ commentNo: '1', text: 'x', userId: 'a:x' }];
    const interceptItems = [{ no: '2', uid: '99', name: 'n', av: '' }];
    const out = mergeStoredCommentsWithIntercept(existing, interceptItems);
    expect(out.patched).toBe(0);
    expect(out.next).toEqual(existing);
  });
});
