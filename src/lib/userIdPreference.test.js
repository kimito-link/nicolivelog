import { describe, it, expect } from 'vitest';
import {
  userIdObservationStrength,
  pickStrongerUserId,
  mergeUserIdForEnrichment
} from './userIdPreference.js';

describe('userIdObservationStrength', () => {
  it('空は 0', () => {
    expect(userIdObservationStrength('')).toBe(0);
    expect(userIdObservationStrength('   ')).toBe(0);
  });
  it('5〜14桁数字は 2', () => {
    expect(userIdObservationStrength('12345')).toBe(2);
    expect(userIdObservationStrength('86255751')).toBe(2);
  });
  it('a: やハッシュは 1', () => {
    expect(userIdObservationStrength('a:x')).toBe(1);
    expect(userIdObservationStrength('AbCdEfGhIjKlMnOpQrStUv')).toBe(1);
  });
});

describe('pickStrongerUserId', () => {
  it('片方空ならもう片方', () => {
    expect(pickStrongerUserId('', '86255751')).toBe('86255751');
    expect(pickStrongerUserId('86255751', '')).toBe('86255751');
  });
  it('数字を匿名より優先（既存が数字・incoming が a: は維持）', () => {
    expect(pickStrongerUserId('86255751', 'a:deadbeef')).toBe('86255751');
  });
  it('匿名から数字へアップグレード', () => {
    expect(pickStrongerUserId('a:deadbeef', '86255751')).toBe('86255751');
  });
  it('同強度・異なる値は incoming（誤検知修正）', () => {
    expect(pickStrongerUserId('999', '87654321')).toBe('87654321');
    expect(pickStrongerUserId('a:1', 'a:2')).toBe('a:2');
  });
  it('tiePrefer existing なら同強度は既存', () => {
    expect(pickStrongerUserId('11111', '22222', 'existing')).toBe('11111');
  });
  it('同強度・同一値', () => {
    expect(pickStrongerUserId('11111', '11111')).toBe('11111');
  });
});

describe('mergeUserIdForEnrichment', () => {
  it('汚染時は intercept 優先', () => {
    expect(
      mergeUserIdForEnrichment('99999999', 'a:real', true)
    ).toBe('a:real');
  });
  it('汚染時 intercept 空なら row', () => {
    expect(mergeUserIdForEnrichment('111', '', true)).toBe('111');
  });
  it('非汚染・同強度は row 優先', () => {
    expect(mergeUserIdForEnrichment('11111', '22222', false)).toBe('11111');
  });
  it('非汚染・intercept の方が強い', () => {
    expect(
      mergeUserIdForEnrichment('a:xx', '86255751', false)
    ).toBe('86255751');
  });
  it('非汚染・row の方が強い', () => {
    expect(
      mergeUserIdForEnrichment('86255751', 'a:xx', false)
    ).toBe('86255751');
  });
  it('両方空は null', () => {
    expect(mergeUserIdForEnrichment('', '', false)).toBeNull();
  });
  it('片方のみ', () => {
    expect(mergeUserIdForEnrichment('', 'a:y', false)).toBe('a:y');
    expect(mergeUserIdForEnrichment('a:y', '', false)).toBe('a:y');
  });
});
