import { describe, it, expect } from 'vitest';
import {
  isHttpOrHttpsUrl,
  niconicoDefaultUserIconUrl,
  resolveSupportGrowthTileSrc
} from './supportGrowthTileSrc.js';

describe('isHttpOrHttpsUrl', () => {
  it('https を許可', () => {
    expect(isHttpOrHttpsUrl('https://cdn.example/nicoaccount/usericon/1.jpg')).toBe(
      true
    );
  });
  it('http を許可', () => {
    expect(isHttpOrHttpsUrl('http://x.test/a.png')).toBe(true);
  });
  it('相対パスは不可', () => {
    expect(isHttpOrHttpsUrl('/path/x.png')).toBe(false);
  });
  it('空は不可', () => {
    expect(isHttpOrHttpsUrl('')).toBe(false);
  });
});

describe('niconicoDefaultUserIconUrl', () => {
  it('数字IDから CDN パスを返す（小さいIDはバケット1）', () => {
    expect(niconicoDefaultUserIconUrl('10999')).toBe(
      'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/1/10999.jpg'
    );
  });

  it('大きいIDは floor(id/10000) をバケットに', () => {
    expect(niconicoDefaultUserIconUrl('86255751')).toBe(
      'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/8625/86255751.jpg'
    );
  });

  it('短すぎる・非数字は空', () => {
    expect(niconicoDefaultUserIconUrl('1234')).toBe('');
    expect(niconicoDefaultUserIconUrl('abc')).toBe('');
  });
});

describe('resolveSupportGrowthTileSrc', () => {
  const rink = 'images/default-rink.png';

  it('entryAvatarUrl が https なら最優先', () => {
    expect(
      resolveSupportGrowthTileSrc({
        entryAvatarUrl: 'https://u.example/icon.jpg',
        isOwnPosted: true,
        viewerAvatarUrl: 'https://me.example/me.jpg',
        defaultSrc: rink
      })
    ).toBe('https://u.example/icon.jpg');
  });

  it('自分投稿で entry なしなら viewerAvatarUrl', () => {
    expect(
      resolveSupportGrowthTileSrc({
        entryAvatarUrl: '',
        isOwnPosted: true,
        viewerAvatarUrl: 'https://me.example/me.jpg',
        defaultSrc: rink
      })
    ).toBe('https://me.example/me.jpg');
  });

  it('他人投稿は viewer を使わない（userId も無ければ default）', () => {
    expect(
      resolveSupportGrowthTileSrc({
        entryAvatarUrl: '',
        userId: null,
        isOwnPosted: false,
        viewerAvatarUrl: 'https://me.example/me.jpg',
        defaultSrc: rink
      })
    ).toBe(rink);
  });

  it('他人で DOM アイコン無しでも数字 userId があれば既定 usericon', () => {
    expect(
      resolveSupportGrowthTileSrc({
        entryAvatarUrl: '',
        userId: '12345678',
        isOwnPosted: false,
        viewerAvatarUrl: 'https://me.example/me.jpg',
        defaultSrc: rink
      })
    ).toBe(
      'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/1234/12345678.jpg'
    );
  });

  it('他人で entry にアイコンがあれば採用', () => {
    expect(
      resolveSupportGrowthTileSrc({
        entryAvatarUrl: 'https://other.example/o.png',
        isOwnPosted: false,
        viewerAvatarUrl: 'https://me.example/me.jpg',
        defaultSrc: rink
      })
    ).toBe('https://other.example/o.png');
  });

  it('自分投稿で viewer も無ければ default', () => {
    expect(
      resolveSupportGrowthTileSrc({
        entryAvatarUrl: '',
        isOwnPosted: true,
        viewerAvatarUrl: '',
        defaultSrc: rink
      })
    ).toBe(rink);
  });
});
