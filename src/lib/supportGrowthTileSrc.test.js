import { describe, it, expect } from 'vitest';
import {
  isHttpOrHttpsUrl,
  niconicoDefaultUserIconUrl,
  resolveSupportGrowthTileSrc,
  pickUserLaneDisplayTileSrc,
  userLaneDedupeKey
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

describe('pickUserLaneDisplayTileSrc', () => {
  const def = 'images/yukkuri-link.png';

  it('https 候補ならその URL', () => {
    expect(pickUserLaneDisplayTileSrc('https://cdn.example/a.jpg', def)).toBe(
      'https://cdn.example/a.jpg'
    );
  });

  it('http 候補も採用', () => {
    expect(pickUserLaneDisplayTileSrc('http://x.test/b.png', def)).toBe('http://x.test/b.png');
  });

  it('空・相対のみなら既定タイル', () => {
    expect(pickUserLaneDisplayTileSrc('', def)).toBe(def);
    expect(pickUserLaneDisplayTileSrc('images/x.png', def)).toBe(def);
    expect(pickUserLaneDisplayTileSrc('/abs/x.png', def)).toBe(def);
  });

  it('候補が http でなく default も空なら空', () => {
    expect(pickUserLaneDisplayTileSrc('', '')).toBe('');
    expect(pickUserLaneDisplayTileSrc('rel.png', '')).toBe('');
  });
});

describe('userLaneDedupeKey', () => {
  it('userId が最優先', () => {
    expect(
      userLaneDedupeKey({
        userId: 'a:foo',
        avatarHttpCandidate: 'https://x/a.jpg',
        stableId: 'id-1'
      })
    ).toBe('u:a:foo');
  });

  it('userId なしで http サムネがあればそれでキー', () => {
    expect(
      userLaneDedupeKey({
        userId: '',
        avatarHttpCandidate: 'https://cdn.example/u.png',
        stableId: 's1'
      })
    ).toBe('t:https://cdn.example/u.png');
  });

  it('userId も http も無ければ stableId', () => {
    expect(
      userLaneDedupeKey({
        userId: '  ',
        avatarHttpCandidate: '',
        stableId: 'legacy:abc'
      })
    ).toBe('s:legacy:abc');
  });

  it('http でない候補は stableId へフォールバック', () => {
    expect(
      userLaneDedupeKey({
        userId: '',
        avatarHttpCandidate: 'images/x.png',
        stableId: 'st99'
      })
    ).toBe('s:st99');
  });

  it('すべて空なら空（レーン除外）', () => {
    expect(
      userLaneDedupeKey({ userId: '', avatarHttpCandidate: '', stableId: '' })
    ).toBe('');
    expect(
      userLaneDedupeKey({ userId: '', avatarHttpCandidate: '  ', stableId: '' })
    ).toBe('');
  });
});
