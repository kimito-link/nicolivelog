import { describe, it, expect } from 'vitest';
import {
  validateCommentText,
  deriveSubmitResult,
  diagnosePersistGate
} from './commentSubmitSteps.js';

describe('validateCommentText', () => {
  it('正常テキスト → { ok: true, text }', () => {
    expect(validateCommentText('hello')).toEqual({ ok: true, text: 'hello' });
  });
  it('前後空白は trim', () => {
    expect(validateCommentText('  hello  ')).toEqual({ ok: true, text: 'hello' });
  });
  it('空文字 → { ok: false }', () => {
    expect(validateCommentText('')).toEqual(expect.objectContaining({ ok: false }));
    expect(validateCommentText('').error).toBeTruthy();
  });
  it('空白のみ → { ok: false }', () => {
    expect(validateCommentText('   ')).toEqual(expect.objectContaining({ ok: false }));
  });
  it('null → { ok: false }', () => {
    expect(validateCommentText(null)).toEqual(expect.objectContaining({ ok: false }));
  });
  it('undefined → { ok: false }', () => {
    expect(validateCommentText(undefined)).toEqual(expect.objectContaining({ ok: false }));
  });
});

describe('deriveSubmitResult', () => {
  it('editorCleared=true → 成功', () => {
    expect(deriveSubmitResult(true, false)).toEqual({ ok: true });
  });
  it('editorCleared=false, timeout=true → タイムアウト失敗', () => {
    const r = deriveSubmitResult(false, true);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('timeout');
  });
  it('editorCleared=false, timeout=false → 未確認', () => {
    const r = deriveSubmitResult(false, false);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('unconfirmed');
  });
});

describe('diagnosePersistGate', () => {
  it('全条件 true → empty failures', () => {
    const d = diagnosePersistGate({
      hasRows: true,
      recording: true,
      liveId: 'lv123',
      locationAllows: true,
      hasExtensionContext: true
    });
    expect(d.pass).toBe(true);
    expect(d.failures).toEqual([]);
  });

  it('recording=false → "recording" が failures に含まれる', () => {
    const d = diagnosePersistGate({
      hasRows: true,
      recording: false,
      liveId: 'lv123',
      locationAllows: true,
      hasExtensionContext: true
    });
    expect(d.pass).toBe(false);
    expect(d.failures).toContain('recording');
  });

  it('liveId 空 → "liveId" が failures に含まれる', () => {
    const d = diagnosePersistGate({
      hasRows: true,
      recording: true,
      liveId: '',
      locationAllows: true,
      hasExtensionContext: true
    });
    expect(d.pass).toBe(false);
    expect(d.failures).toContain('liveId');
  });

  it('hasRows=false → "hasRows" が failures に含まれる', () => {
    const d = diagnosePersistGate({
      hasRows: false,
      recording: true,
      liveId: 'lv123',
      locationAllows: true,
      hasExtensionContext: true
    });
    expect(d.pass).toBe(false);
    expect(d.failures).toContain('hasRows');
  });

  it('複数条件 false → 全て failures に含まれる', () => {
    const d = diagnosePersistGate({
      hasRows: false,
      recording: false,
      liveId: '',
      locationAllows: false,
      hasExtensionContext: false
    });
    expect(d.pass).toBe(false);
    expect(d.failures).toHaveLength(5);
  });
});
