import { describe, it, expect } from 'vitest';
import {
  summarizeStoredCommentAvatarStats,
  summarizeStoredCommentProfileGaps
} from './devMonitorAvatarStats.js';

describe('summarizeStoredCommentAvatarStats', () => {
  it('空・非配列はゼロ埋め', () => {
    expect(summarizeStoredCommentAvatarStats(null)).toEqual({
      total: 0,
      withHttpAvatar: 0,
      withoutHttpAvatar: 0,
      syntheticDefaultAvatar: 0,
      numericUserId: 0,
      nonNumericUserId: 0,
      missingUserId: 0,
      withNickname: 0,
      withoutNickname: 0
    });
  });

  it('CDN 推定 URL と数字 userId の組み合わせを synthetic に数える', () => {
    const uid = '86255751';
    const syn =
      'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/8625/86255751.jpg';
    const s = summarizeStoredCommentAvatarStats([
      { userId: uid, avatarUrl: syn, nickname: 'あり' },
      {
        userId: uid,
        avatarUrl:
          'https://secure-dcdn.cdn.nimg.jp/nicovideo/images/usericon/square_96/86255751.jpg'
      },
      { userId: 'a:hash', avatarUrl: '' },
      { userId: null, avatarUrl: '' }
    ]);
    expect(s.total).toBe(4);
    expect(s.withHttpAvatar).toBe(2);
    expect(s.withoutHttpAvatar).toBe(2);
    expect(s.syntheticDefaultAvatar).toBe(1);
    expect(s.numericUserId).toBe(2);
    expect(s.nonNumericUserId).toBe(1);
    expect(s.missingUserId).toBe(1);
    expect(s.withNickname).toBe(1);
    expect(s.withoutNickname).toBe(3);
  });
});

describe('summarizeStoredCommentProfileGaps', () => {
  it('userId 欠損行はクロス集計に含めない', () => {
    expect(summarizeStoredCommentProfileGaps(null)).toEqual({
      numericUidWithHttpAvatar: 0,
      numericUidWithoutHttpAvatar: 0,
      anonStyleUidWithHttpAvatar: 0,
      anonStyleUidWithoutHttpAvatar: 0,
      numericWithNickname: 0,
      numericWithoutNickname: 0,
      anonWithNickname: 0,
      anonWithoutNickname: 0
    });
  });

  it('数字IDと匿名系で av・nick を分ける', () => {
    const syn =
      'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/1/12345.jpg';
    const g = summarizeStoredCommentProfileGaps([
      { userId: '12345', nickname: 'A', avatarUrl: syn },
      { userId: '12345', nickname: '', avatarUrl: '' },
      { userId: 'a:x', nickname: 'B', avatarUrl: 'https://x.test/i.png' },
      { userId: 'a:y', nickname: '', avatarUrl: '' },
      { userId: '', nickname: '', avatarUrl: '' }
    ]);
    expect(g.numericUidWithHttpAvatar).toBe(1);
    expect(g.numericUidWithoutHttpAvatar).toBe(1);
    expect(g.anonStyleUidWithHttpAvatar).toBe(1);
    expect(g.anonStyleUidWithoutHttpAvatar).toBe(1);
    expect(g.numericWithNickname).toBe(1);
    expect(g.numericWithoutNickname).toBe(1);
    expect(g.anonWithNickname).toBe(1);
    expect(g.anonWithoutNickname).toBe(1);
  });
});
