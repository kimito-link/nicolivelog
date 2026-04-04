/** @vitest-environment happy-dom */
import { describe, it, expect } from 'vitest';
import {
  extractLiveIdFromDom,
  isNicoVideoJpHost
} from './broadcastUrl.js';

describe('isNicoVideoJpHost', () => {
  it('サブドメインを許可', () => {
    expect(isNicoVideoJpHost('https://live.nicovideo.jp/watch/lv1')).toBe(true);
    expect(isNicoVideoJpHost('https://embed.nicovideo.jp/')).toBe(true);
  });

  it('無効・空は false', () => {
    expect(isNicoVideoJpHost('')).toBe(false);
    expect(isNicoVideoJpHost('about:blank')).toBe(false);
  });
});

describe('extractLiveIdFromDom', () => {
  it('watch リンクから lv を取得', () => {
    document.body.innerHTML =
      '<div><a href="https://live.nicovideo.jp/watch/lv999">x</a></div>';
    expect(extractLiveIdFromDom(document)).toBe('lv999');
  });

  it('embed パスから取得', () => {
    document.body.innerHTML = '<a href="/embed/lv888">e</a>';
    expect(extractLiveIdFromDom(document)).toBe('lv888');
  });

  it('og:url をフォールバック', () => {
    document.body.innerHTML = '';
    document.head.innerHTML =
      '<meta property="og:url" content="https://live.nicovideo.jp/watch/lv777">';
    expect(extractLiveIdFromDom(document)).toBe('lv777');
  });

  it('該当なしは null', () => {
    document.head.innerHTML = '';
    document.body.innerHTML = '<p>no links</p>';
    expect(extractLiveIdFromDom(document)).toBeNull();
  });
});
