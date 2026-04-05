import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeAttr } from './htmlEscape.js';

describe('escapeHtml', () => {
  it('タグ断片をエスケープしてスクリプト注入を防ぐ', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const out = escapeHtml(evil);
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;');
  });

  it('属性用エスケープは quote を含む', () => {
    expect(escapeAttr('a"b')).toContain('&quot;');
  });
});
