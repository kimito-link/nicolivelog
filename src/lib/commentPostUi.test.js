import { describe, expect, it } from 'vitest';
import { deriveCommentPostUiState } from './commentPostUi.js';

describe('deriveCommentPostUiState', () => {
  it('watch 未接続では disabled と案内を返す', () => {
    expect(
      deriveCommentPostUiState({
        hasWatchUrl: false,
        hasLiveId: false,
        hasText: false
      })
    ).toMatchObject({
      mode: 'no_watch',
      buttonDisabled: true,
      placeholder: 'watchページを開くとコメント送信できます',
      statusMessage: 'watchページを開くとコメント送信できます。'
    });
  });

  it('lv 未取得では再読込を促す', () => {
    expect(
      deriveCommentPostUiState({
        hasWatchUrl: true,
        hasLiveId: false,
        hasText: true
      })
    ).toMatchObject({
      mode: 'no_live_id',
      buttonDisabled: true,
      statusKind: 'error'
    });
  });

  it('送信中はラベルと disabled を切り替える', () => {
    expect(
      deriveCommentPostUiState({
        hasWatchUrl: true,
        hasLiveId: true,
        hasText: true,
        isSubmitting: true
      })
    ).toMatchObject({
      mode: 'submitting',
      buttonDisabled: true,
      buttonLabel: '送信中…',
      statusMessage: '送信中…'
    });
  });

  it('コメント欄見失い警告中は text があれば送信自体は試せる', () => {
    expect(
      deriveCommentPostUiState({
        hasWatchUrl: true,
        hasLiveId: true,
        hasText: true,
        panelStatusCode: 'no_comment_panel'
      })
    ).toMatchObject({
      mode: 'panel_warning',
      buttonDisabled: false,
      statusKind: 'error'
    });
  });

  it('通常時は空欄で disabled、入力後に ready', () => {
    expect(
      deriveCommentPostUiState({
        hasWatchUrl: true,
        hasLiveId: true,
        hasText: false
      }).buttonDisabled
    ).toBe(true);
    expect(
      deriveCommentPostUiState({
        hasWatchUrl: true,
        hasLiveId: true,
        hasText: true
      })
    ).toMatchObject({
      mode: 'ready',
      buttonDisabled: false
    });
  });
});
