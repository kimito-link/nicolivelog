import { describe, it, expect } from 'vitest';
import {
  buildCommentTickerNameHref,
  canLinkCommentTickerName
} from './commentTickerNameLink.js';

describe('canLinkCommentTickerName', () => {
  it('数値 ID はリンク可能', () => {
    expect(canLinkCommentTickerName('12345678')).toBe(true);
    expect(canLinkCommentTickerName('98765')).toBe(true);
  });

  it('a:xxxxx 形式の匿名 ID はリンク不可', () => {
    expect(canLinkCommentTickerName('a:ABC123')).toBe(false);
  });

  it('ハッシュ風の長い英数 ID はリンク不可', () => {
    expect(canLinkCommentTickerName('k1j2h3g4f5d6s7a8')).toBe(false);
  });

  it('空・null・undefined はリンク不可', () => {
    expect(canLinkCommentTickerName('')).toBe(false);
    expect(canLinkCommentTickerName(null)).toBe(false);
    expect(canLinkCommentTickerName(undefined)).toBe(false);
    expect(canLinkCommentTickerName('   ')).toBe(false);
  });
});

describe('buildCommentTickerNameHref', () => {
  it('数値 ID から niconico ユーザーページ URL を組み立てる', () => {
    expect(buildCommentTickerNameHref('12345678')).toBe(
      'https://www.nicovideo.jp/user/12345678'
    );
  });

  it('匿名 ID では空文字を返す', () => {
    expect(buildCommentTickerNameHref('a:foo')).toBe('');
    expect(buildCommentTickerNameHref('k1j2h3g4f5d6s7a8')).toBe('');
  });

  it('空・null では空文字を返す', () => {
    expect(buildCommentTickerNameHref('')).toBe('');
    expect(buildCommentTickerNameHref(null)).toBe('');
  });

  it('前後空白は trim される', () => {
    expect(buildCommentTickerNameHref('  12345  ')).toBe(
      'https://www.nicovideo.jp/user/12345'
    );
  });
});
