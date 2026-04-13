import { describe, expect, it } from 'vitest';
import { shouldSkipStoryUserLaneCandidateByContamination } from './storyUserLaneContaminationGuard.js';

describe('shouldSkipStoryUserLaneCandidateByContamination', () => {
  it('自己投稿は viewer/broadcaster と一致しても除外しない', () => {
    expect(
      shouldSkipStoryUserLaneCandidateByContamination({
        candidateUserId: '12345',
        viewerUserId: '12345',
        broadcasterUserId: '99999',
        isOwnPosted: true
      })
    ).toBe(false);
  });

  it('viewerUserId と一致し自己投稿でなければ除外する', () => {
    expect(
      shouldSkipStoryUserLaneCandidateByContamination({
        candidateUserId: '12345',
        viewerUserId: '12345',
        broadcasterUserId: '',
        isOwnPosted: false
      })
    ).toBe(true);
  });

  it('broadcasterUserId と一致し自己投稿でなければ除外する', () => {
    expect(
      shouldSkipStoryUserLaneCandidateByContamination({
        candidateUserId: '99999',
        viewerUserId: '12345',
        broadcasterUserId: '99999',
        isOwnPosted: false
      })
    ).toBe(true);
  });

  it('どちらにも一致しなければ除外しない', () => {
    expect(
      shouldSkipStoryUserLaneCandidateByContamination({
        candidateUserId: '77777',
        viewerUserId: '12345',
        broadcasterUserId: '99999',
        isOwnPosted: false
      })
    ).toBe(false);
  });
});
