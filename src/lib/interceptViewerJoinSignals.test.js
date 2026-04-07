import { describe, expect, it } from 'vitest';
import {
  collectViewerJoinUsersFromObject,
  dedupeViewerJoinUsersByUserId,
  walkJsonForViewerJoinUsers
} from './interceptViewerJoinSignals.js';

describe('interceptViewerJoinSignals', () => {
  it('joinUsers 配列から userId・表示名・アイコンを拾う', () => {
    const items = collectViewerJoinUsersFromObject({
      type: 'audienceUpdate',
      joinUsers: [
        { userId: '86255751', nickname: 'A', iconUrl: 'https://example.com/a.png' },
        { userId: '12345678', screenName: 'B' }
      ]
    });
    expect(items).toHaveLength(2);
    expect(items[0].userId).toBe('86255751');
    expect(items[0].nickname).toBe('A');
    expect(items[1].nickname).toBe('B');
  });

  it('type が入室系でない単独 audience は拾うが数値配列は拾わない', () => {
    expect(
      collectViewerJoinUsersFromObject({
        audience: [{ userId: '1', nickname: 'x' }]
      })
    ).toHaveLength(1);
    expect(
      collectViewerJoinUsersFromObject({
        audience: [1, 2, 3]
      })
    ).toHaveLength(0);
  });

  it('dedupeViewerJoinUsersByUserId で同一 userId をマージ', () => {
    const d = dedupeViewerJoinUsersByUserId([
      { userId: '1', nickname: '', iconUrl: 'https://x/u.jpg' },
      { userId: '1', nickname: 'LongName', iconUrl: '' }
    ]);
    expect(d).toHaveLength(1);
    expect(d[0].nickname).toBe('LongName');
    expect(d[0].iconUrl).toBe('https://x/u.jpg');
  });

  it('walkJsonForViewerJoinUsers がネストからも収集', () => {
    const all = walkJsonForViewerJoinUsers({
      outer: {
        data: {
          newViewers: [{ userId: '99', nickname: 'Z' }]
        }
      }
    });
    expect(all.some((x) => x.userId === '99')).toBe(true);
  });
});
