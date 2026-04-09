/**
 * ポップアップのコメント送信 UI を、watch 接続状態と入力状態から一貫して決める。
 */

/**
 * @param {{
 *   hasWatchUrl?: boolean;
 *   hasLiveId?: boolean;
 *   hasText?: boolean;
 *   isSubmitting?: boolean;
 *   panelStatusCode?: string | null | undefined;
 * }} input
 * @returns {{
 *   mode: 'no_watch' | 'no_live_id' | 'panel_warning' | 'empty' | 'ready' | 'submitting';
 *   buttonDisabled: boolean;
 *   buttonLabel: string;
 *   placeholder: string;
 *   statusMessage: string;
 *   statusKind: 'idle' | 'error' | 'success';
 * }}
 */
export function deriveCommentPostUiState(input) {
  const hasWatchUrl = Boolean(input?.hasWatchUrl);
  const hasLiveId = Boolean(input?.hasLiveId);
  const hasText = Boolean(input?.hasText);
  const isSubmitting = Boolean(input?.isSubmitting);
  const panelStatusCode = String(input?.panelStatusCode || '').trim();

  if (!hasWatchUrl) {
    return {
      mode: 'no_watch',
      buttonDisabled: true,
      buttonLabel: 'コメント送信',
      placeholder: 'watchページを開くとコメント送信できます',
      statusMessage: 'watchページを開くとコメント送信できます。',
      statusKind: 'idle'
    };
  }

  if (!hasLiveId) {
    return {
      mode: 'no_live_id',
      buttonDisabled: true,
      buttonLabel: 'コメント送信',
      placeholder: '放送IDを確認できたらコメント送信できます',
      statusMessage: '放送IDを確認できません。watchページを開き直してください。',
      statusKind: 'error'
    };
  }

  if (isSubmitting) {
    return {
      mode: 'submitting',
      buttonDisabled: true,
      buttonLabel: '送信中…',
      placeholder: 'コメントを入力して送信',
      statusMessage: '送信中…',
      statusKind: 'idle'
    };
  }

  if (panelStatusCode === 'no_comment_panel') {
    return {
      mode: 'panel_warning',
      buttonDisabled: !hasText,
      buttonLabel: 'コメント送信',
      placeholder: 'コメント欄が見えないときは再読み込み後に送信できます',
      statusMessage: 'コメント欄を見失っています。watchページを再読み込みしてから再試行してください。',
      statusKind: 'error'
    };
  }

  if (!hasText) {
    return {
      mode: 'empty',
      buttonDisabled: true,
      buttonLabel: 'コメント送信',
      placeholder: 'コメントを入力して送信',
      statusMessage: '',
      statusKind: 'idle'
    };
  }

  return {
    mode: 'ready',
    buttonDisabled: false,
    buttonLabel: 'コメント送信',
    placeholder: 'コメントを入力して送信',
    statusMessage: '',
    statusKind: 'idle'
  };
}
