import { describe, it, expect } from 'vitest';
import { summarizeRecordedCommenters } from './liveCommenterStats.js';

describe('summarizeRecordedCommenters', () => {
  it('空配列', () => {
    expect(summarizeRecordedCommenters([])).toEqual({
      totalComments: 0,
      uniqueKnownUserIds: 0,
      commentsWithoutUserId: 0,
      distinctAvatarUrls: 0
    });
  });

  it('userId ありは distinct で数える', () => {
    const r = summarizeRecordedCommenters([
      { userId: '111' },
      { userId: '222' },
      { userId: '111' }
    ]);
    expect(r.totalComments).toBe(3);
    expect(r.uniqueKnownUserIds).toBe(2);
    expect(r.commentsWithoutUserId).toBe(0);
    expect(r.distinctAvatarUrls).toBe(0);
  });

  it('null / 空文字 / 空白のみは未取得として数える', () => {
    const r = summarizeRecordedCommenters([
      { userId: null },
      { userId: '' },
      { userId: '   ' },
      { userId: '99' }
    ]);
    expect(r.totalComments).toBe(4);
    expect(r.uniqueKnownUserIds).toBe(1);
    expect(r.commentsWithoutUserId).toBe(3);
    expect(r.distinctAvatarUrls).toBe(0);
  });

  it('文字列化してトリムしてから distinct', () => {
    const r = summarizeRecordedCommenters([
      { userId: '  42  ' },
      { userId: 42 }
    ]);
    expect(r.uniqueKnownUserIds).toBe(1);
    expect(r.commentsWithoutUserId).toBe(0);
    expect(r.distinctAvatarUrls).toBe(0);
  });

  it('userId が無くても https avatarUrl の種類数を数える', () => {
    const r = summarizeRecordedCommenters([
      { userId: null, avatarUrl: 'https://x.test/a.png' },
      { userId: null, avatarUrl: 'https://x.test/a.png' },
      { userId: null, avatarUrl: 'https://x.test/b.png' }
    ]);
    expect(r.uniqueKnownUserIds).toBe(0);
    expect(r.distinctAvatarUrls).toBe(2);
  });
});
