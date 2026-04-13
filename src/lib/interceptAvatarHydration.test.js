import { describe, expect, it } from 'vitest';
import { hydrateInterceptAvatarMapFromProfile } from './interceptAvatarHydration.js';

describe('hydrateInterceptAvatarMapFromProfile', () => {
  it('profile の強い avatar を intercept map へ補完する', () => {
    const map = new Map();
    const profile = {
      '12345678': {
        updatedAt: Date.now(),
        avatarUrl: 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/1234/12345678.jpg'
      }
    };
    const added = hydrateInterceptAvatarMapFromProfile(map, profile);
    expect(added).toBe(1);
    expect(map.get('12345678')).toContain('/12345678.jpg');
  });

  it('既存キーは上書きしない', () => {
    const map = new Map([['12345678', 'https://cdn.example/existing.jpg']]);
    const profile = {
      '12345678': {
        updatedAt: Date.now(),
        avatarUrl: 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/1234/12345678.jpg'
      }
    };
    const added = hydrateInterceptAvatarMapFromProfile(map, profile);
    expect(added).toBe(0);
    expect(map.get('12345678')).toBe('https://cdn.example/existing.jpg');
  });

  it('weak/default avatar は補完しない', () => {
    const map = new Map();
    const profile = {
      '12345678': {
        updatedAt: Date.now(),
        avatarUrl: 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg'
      }
    };
    const added = hydrateInterceptAvatarMapFromProfile(map, profile);
    expect(added).toBe(0);
    expect(map.size).toBe(0);
  });

  it('allowedUserIds 指定時は live 内 userId のみ補完', () => {
    const map = new Map();
    const profile = {
      '11111111': {
        updatedAt: Date.now(),
        avatarUrl: 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/1111/11111111.jpg'
      },
      '22222222': {
        updatedAt: Date.now(),
        avatarUrl: 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/2222/22222222.jpg'
      }
    };
    const added = hydrateInterceptAvatarMapFromProfile(
      map,
      profile,
      new Set(['11111111'])
    );
    expect(added).toBe(1);
    expect(map.has('11111111')).toBe(true);
    expect(map.has('22222222')).toBe(false);
  });
});
