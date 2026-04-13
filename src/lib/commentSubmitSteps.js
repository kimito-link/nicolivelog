/**
 * コメント送信パイプラインの純粋な判定ロジック。
 * DOM 操作は content-entry.js に残し、テスト可能な判定部分だけを抽出。
 */

/**
 * @param {unknown} rawText
 * @returns {{ ok: true, text: string } | { ok: false, error: string }}
 */
export function validateCommentText(rawText) {
  const text = String(rawText ?? '').trim();
  if (!text) return { ok: false, error: 'コメントが空です。' };
  return { ok: true, text };
}

/**
 * @param {boolean} editorCleared
 * @param {boolean} timeout
 * @returns {{ ok: true } | { ok: false, reason: 'timeout'|'unconfirmed' }}
 */
export function deriveSubmitResult(editorCleared, timeout) {
  if (editorCleared) return { ok: true };
  return { ok: false, reason: timeout ? 'timeout' : 'unconfirmed' };
}

/**
 * @typedef {{ hasRows: boolean, recording: boolean, liveId: string, locationAllows: boolean, hasExtensionContext: boolean }} PersistGateInput
 * @param {PersistGateInput} input
 * @returns {{ pass: boolean, failures: string[] }}
 */
export function diagnosePersistGate(input) {
  /** @type {{ key: keyof PersistGateInput, check: (v: any) => boolean }[]} */
  const CHECKS = [
    { key: 'hasRows', check: (v) => !!v },
    { key: 'recording', check: (v) => !!v },
    { key: 'liveId', check: (v) => !!v },
    { key: 'locationAllows', check: (v) => !!v },
    { key: 'hasExtensionContext', check: (v) => !!v }
  ];
  const failures = CHECKS.filter((c) => !c.check(input[c.key])).map((c) => c.key);
  return { pass: failures.length === 0, failures };
}
