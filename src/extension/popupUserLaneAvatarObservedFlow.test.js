import { describe, expect, it } from 'vitest';
import { mergeStoredCommentDedupeVariants } from '../lib/storedCommentDedupeMerge.js';
import { buildStoryUserLaneCandidateRow } from '../lib/storyUserLaneRowModel.js';
import { niconicoDefaultUserIconUrl } from '../lib/supportGrowthTileSrc.js';

const lanePickCtx = {
  yukkuriSrc: 'images/yukkuri.png',
  tvSrc: 'images/tv.svg',
  anonymousIdenticonEnabled: true,
  anonymousIdenticonDataUrl:
    'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E'
};

describe('popup ストレージ重複マージ → ユーザーレーン tier（avatarObserved 保持）', () => {
  it('同一 commentNo の先頭行に avatarObserved が無く、後続行に true があるときマージ後は tier 3', () => {
    const uid = '141965615';
    const nick = 'りん';
    const http = niconicoDefaultUserIconUrl(uid);
    expect(http).toMatch(/nicoaccount\/usericon\/s\//);

    const earlier = {
      liveId: 'lv123',
      commentNo: '42',
      text: '応援してます',
      userId: uid,
      nickname: nick,
      avatarUrl: http
    };
    const laterObserved = {
      ...earlier,
      avatarObserved: true
    };

    const merged = mergeStoredCommentDedupeVariants(
      /** @type {Record<string, unknown>} */ (earlier),
      /** @type {Record<string, unknown>} */ (laterObserved)
    );
    expect(merged.avatarObserved).toBe(true);

    const row = buildStoryUserLaneCandidateRow(
      merged,
      0,
      http,
      lanePickCtx
    );
    expect(row).not.toBeNull();
    expect(row?.profileTier).toBe(3);
  });

  it('マージで avatarObserved が落ちた場合は合成 canonical のみでは tier 2（退行の再発防止）', () => {
    const uid = '141965615';
    const http = niconicoDefaultUserIconUrl(uid);
    const entryMissingObserved = {
      liveId: 'lv123',
      commentNo: '99',
      text: 'test',
      userId: uid,
      nickname: 'りん',
      avatarUrl: http
    };
    const row = buildStoryUserLaneCandidateRow(
      entryMissingObserved,
      0,
      http,
      lanePickCtx
    );
    expect(row?.profileTier).toBe(2);
  });
});
