import { describe, expect, it } from 'vitest';
import { resolveWatchUrlFromTabAndStash } from './popupWatchUrlResolve.js';

describe('resolveWatchUrlFromTabAndStash', () => {
  it('アクティブタブが watch のときその URL を優先する', () => {
    const tab = { url: 'https://live.nicovideo.jp/watch/lv123' };
    expect(
      resolveWatchUrlFromTabAndStash(tab, 'https://live.nicovideo.jp/watch/lv999')
    ).toEqual({
      url: 'https://live.nicovideo.jp/watch/lv123',
      fromActiveTab: true
    });
  });

  it('タブが watch でなければストレージの watch URL を使う', () => {
    const tab = { url: 'https://www.google.com/' };
    const stash = 'https://live.nicovideo.jp/watch/lv888';
    expect(resolveWatchUrlFromTabAndStash(tab, stash)).toEqual({
      url: stash,
      fromActiveTab: false
    });
  });

  it('どちらも無効なら空文字・fromActiveTab は true', () => {
    expect(resolveWatchUrlFromTabAndStash(undefined, '')).toEqual({
      url: '',
      fromActiveTab: true
    });
    expect(
      resolveWatchUrlFromTabAndStash({ url: 'about:blank' }, null)
    ).toEqual({
      url: '',
      fromActiveTab: true
    });
  });

  it('ストレージが非文字列なら無視する', () => {
    const tab = { url: 'https://example.com/' };
    expect(resolveWatchUrlFromTabAndStash(tab, { not: 'string' })).toEqual({
      url: '',
      fromActiveTab: true
    });
  });
});
