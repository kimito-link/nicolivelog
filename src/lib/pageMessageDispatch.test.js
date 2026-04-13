import { describe, it, expect } from 'vitest';
import { PAGE_MSG_TYPES, findPageMessageHandler } from './pageMessageDispatch.js';

describe('PAGE_MSG_TYPES', () => {
  it('7つのメッセージタイプを持つ', () => {
    expect(PAGE_MSG_TYPES).toHaveLength(7);
  });

  it('全タイプが NLS_INTERCEPT_ で始まる', () => {
    for (const t of PAGE_MSG_TYPES) {
      expect(t).toMatch(/^NLS_INTERCEPT_/);
    }
  });

  const expectedTypes = [
    'NLS_INTERCEPT_SCHEDULE',
    'NLS_INTERCEPT_STATISTICS',
    'NLS_INTERCEPT_VIEWER_JOIN',
    'NLS_INTERCEPT_EMBEDDED_DATA',
    'NLS_INTERCEPT_CHAT_ROWS',
    'NLS_INTERCEPT_GIFT_USERS',
    'NLS_INTERCEPT_USERID'
  ];
  for (const type of expectedTypes) {
    it(`${type} が含まれる`, () => {
      expect(PAGE_MSG_TYPES).toContain(type);
    });
  }
});

describe('findPageMessageHandler', () => {
  it('既知のタイプに対してハンドラ定義を返す', () => {
    const h = findPageMessageHandler('NLS_INTERCEPT_SCHEDULE');
    expect(h).toBeDefined();
    expect(h.type).toBe('NLS_INTERCEPT_SCHEDULE');
  });

  it('未知のタイプに対して undefined を返す', () => {
    expect(findPageMessageHandler('NLS_UNKNOWN')).toBeUndefined();
  });

  it('全タイプにハンドラが存在する', () => {
    for (const type of PAGE_MSG_TYPES) {
      expect(findPageMessageHandler(type)).toBeDefined();
    }
  });
});
