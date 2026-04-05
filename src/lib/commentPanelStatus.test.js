import { describe, it, expect } from 'vitest';
import {
  parseCommentPanelStatusPayload,
  commentPanelStatusRelevantToLiveId
} from './commentPanelStatus.js';

describe('parseCommentPanelStatusPayload', () => {
  it('ok:false と updatedAt があれば解釈する', () => {
    const p = parseCommentPanelStatusPayload({
      ok: false,
      updatedAt: 1,
      liveId: 'lv1',
      code: 'no_comment_panel'
    });
    expect(p).toEqual({
      ok: false,
      updatedAt: 1,
      liveId: 'lv1',
      code: 'no_comment_panel'
    });
  });

  it('ok が true や欠如なら null', () => {
    expect(parseCommentPanelStatusPayload({ ok: true, updatedAt: 1 })).toBeNull();
    expect(parseCommentPanelStatusPayload({ updatedAt: 1 })).toBeNull();
  });

  it('updatedAt が無効なら null', () => {
    expect(parseCommentPanelStatusPayload({ ok: false })).toBeNull();
  });
});

describe('commentPanelStatusRelevantToLiveId', () => {
  it('liveId なしは常に対象', () => {
    expect(commentPanelStatusRelevantToLiveId({ ok: false, updatedAt: 1 }, 'lv1')).toBe(
      true
    );
  });

  it('viewer 空は常に対象', () => {
    expect(
      commentPanelStatusRelevantToLiveId(
        { ok: false, updatedAt: 1, liveId: 'lv9' },
        ''
      )
    ).toBe(true);
  });

  it('同一 lv（大小）で対象', () => {
    expect(
      commentPanelStatusRelevantToLiveId(
        { ok: false, updatedAt: 1, liveId: 'LV88' },
        'lv88'
      )
    ).toBe(true);
  });

  it('別 lv は非対象', () => {
    expect(
      commentPanelStatusRelevantToLiveId(
        { ok: false, updatedAt: 1, liveId: 'lv1' },
        'lv2'
      )
    ).toBe(false);
  });
});
