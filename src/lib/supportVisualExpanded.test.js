import { describe, it, expect } from 'vitest';
import { normalizeSupportVisualExpanded } from './supportVisualExpanded.js';

describe('normalizeSupportVisualExpanded', () => {
  it('popup 既定: 未設定は false', () => {
    expect(normalizeSupportVisualExpanded(undefined, { inlineMode: false })).toBe(
      false
    );
    expect(normalizeSupportVisualExpanded(null, { inlineMode: false })).toBe(false);
  });

  it('インライン既定: 未設定は true', () => {
    expect(normalizeSupportVisualExpanded(undefined, { inlineMode: true })).toBe(
      true
    );
    expect(normalizeSupportVisualExpanded(null, { inlineMode: true })).toBe(true);
  });

  it('inlineMode 省略時は popup 扱い（false）', () => {
    expect(normalizeSupportVisualExpanded(undefined)).toBe(false);
    expect(normalizeSupportVisualExpanded(undefined, {})).toBe(false);
  });

  it('明示 true は常に true', () => {
    expect(normalizeSupportVisualExpanded(true, { inlineMode: false })).toBe(true);
    expect(normalizeSupportVisualExpanded(true, { inlineMode: true })).toBe(true);
  });

  it('明示 false は常に false', () => {
    expect(normalizeSupportVisualExpanded(false, { inlineMode: false })).toBe(
      false
    );
    expect(normalizeSupportVisualExpanded(false, { inlineMode: true })).toBe(
      false
    );
  });

  it('文字列や数値などは未設定と同じ既定', () => {
    expect(normalizeSupportVisualExpanded('true', { inlineMode: false })).toBe(
      false
    );
    expect(normalizeSupportVisualExpanded('false', { inlineMode: true })).toBe(
      true
    );
    expect(normalizeSupportVisualExpanded(1, { inlineMode: false })).toBe(false);
  });
});
