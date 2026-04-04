import { describe, it, expect } from 'vitest';
import { commentComposeKeyAction } from './commentComposeShortcuts.js';

describe('commentComposeKeyAction', () => {
  const base = {
    key: 'Enter',
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    isComposing: false,
    enterSendsComment: false
  };

  it('Enter 以外は default', () => {
    expect(commentComposeKeyAction({ ...base, key: 'a' })).toBe('default');
  });

  it('IME 変換中は default', () => {
    expect(
      commentComposeKeyAction({ ...base, isComposing: true, enterSendsComment: true })
    ).toBe('default');
  });

  it('Ctrl+Enter は enterSendsComment に関係なく submit', () => {
    expect(commentComposeKeyAction({ ...base, ctrlKey: true })).toBe('submit');
  });

  it('Meta+Enter も submit', () => {
    expect(commentComposeKeyAction({ ...base, metaKey: true })).toBe('submit');
  });

  it('Enter のみ・enterSendsComment false は default', () => {
    expect(commentComposeKeyAction({ ...base })).toBe('default');
  });

  it('Enter のみ・enterSendsComment true は submit', () => {
    expect(commentComposeKeyAction({ ...base, enterSendsComment: true })).toBe(
      'submit'
    );
  });

  it('Shift+Enter は改行のため default', () => {
    expect(
      commentComposeKeyAction({ ...base, enterSendsComment: true, shiftKey: true })
    ).toBe('default');
  });

  it('Ctrl+Shift+Enter は submit', () => {
    expect(
      commentComposeKeyAction({
        ...base,
        ctrlKey: true,
        shiftKey: true,
        enterSendsComment: false
      })
    ).toBe('submit');
  });
});
