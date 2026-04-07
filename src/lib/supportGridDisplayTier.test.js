import { describe, it, expect } from 'vitest';
import {
  SUPPORT_GRID_TIER_RINK,
  SUPPORT_GRID_TIER_KONTA,
  SUPPORT_GRID_TIER_TANU,
  supportGridDisplayTier,
  supportGridStrongNickname
} from './supportGridDisplayTier.js';

describe('supportGridStrongNickname', () => {
  it('空・未取得・匿名は弱い', () => {
    expect(supportGridStrongNickname('', '1')).toBe(false);
    expect(supportGridStrongNickname('（未取得）', '1')).toBe(false);
    expect(supportGridStrongNickname('匿名', 'a:abc')).toBe(false);
  });

  it('通常の表示名は強い', () => {
    expect(supportGridStrongNickname('nora', '88210441')).toBe(true);
  });

  it('匿名IDで1文字は弱い', () => {
    expect(supportGridStrongNickname('K', 'a:longEnoughSuffixHere')).toBe(false);
  });
});

describe('supportGridDisplayTier', () => {
  it('ID なしは tanu', () => {
    expect(
      supportGridDisplayTier({
        userId: '',
        nickname: 'x',
        httpAvatarCandidate: 'https://x/u.jpg'
      })
    ).toBe(SUPPORT_GRID_TIER_TANU);
  });

  it('強いニック + 良いサムネは rink', () => {
    expect(
      supportGridDisplayTier({
        userId: '88210441',
        nickname: 'nora',
        httpAvatarCandidate: 'https://example.com/u.jpg'
      })
    ).toBe(SUPPORT_GRID_TIER_RINK);
  });

  it('強いニックのみは konta', () => {
    expect(
      supportGridDisplayTier({
        userId: '123',
        nickname: 'たろう',
        httpAvatarCandidate: ''
      })
    ).toBe(SUPPORT_GRID_TIER_KONTA);
  });

  it('サムネのみ（匿名ニック）は konta', () => {
    expect(
      supportGridDisplayTier({
        userId: 'a:abcdefghijklmnop',
        nickname: '匿名',
        httpAvatarCandidate: 'https://example.com/u.jpg'
      })
    ).toBe(SUPPORT_GRID_TIER_KONTA);
  });

  it('弱いニックかつサムネなしは tanu', () => {
    expect(
      supportGridDisplayTier({
        userId: '715502',
        nickname: '匿名',
        httpAvatarCandidate: ''
      })
    ).toBe(SUPPORT_GRID_TIER_TANU);
  });

  it('LP モック用フラグでサムネ有無を固定できる', () => {
    expect(
      supportGridDisplayTier({
        userId: '1',
        nickname: '匿名',
        lpMockHasCustomAvatar: true
      })
    ).toBe(SUPPORT_GRID_TIER_KONTA);
    expect(
      supportGridDisplayTier({
        userId: '1',
        nickname: '匿名',
        lpMockHasCustomAvatar: false
      })
    ).toBe(SUPPORT_GRID_TIER_TANU);
  });

  it('ニコの弱い usericon URL はサムネ未所持扱い', () => {
    expect(
      supportGridDisplayTier({
        userId: '9',
        nickname: 'x',
        httpAvatarCandidate:
          'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/xx.jpg'
      })
    ).toBe(SUPPORT_GRID_TIER_KONTA);
  });
});
