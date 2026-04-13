import { describe, it, expect } from 'vitest';
import {
  PIPELINE_LOG_PREFIX,
  formatPipelinePhase
} from './commentPipelineLog.js';

describe('formatPipelinePhase', () => {
  it('start: liveId と件数を含む', () => {
    const msg = formatPipelinePhase('start', {
      liveId: 'lv123456',
      existingCount: 50,
      incomingCount: 10
    });
    expect(msg).toContain(PIPELINE_LOG_PREFIX);
    expect(msg).toContain('lv123456');
    expect(msg).toContain('50');
    expect(msg).toContain('10');
  });

  it('merge: 追加件数と touched を含む', () => {
    const msg = formatPipelinePhase('merge', {
      added: 7,
      storageTouched: true
    });
    expect(msg).toContain(PIPELINE_LOG_PREFIX);
    expect(msg).toContain('7');
    expect(msg).toContain('true');
  });

  it('commit: 書き込みキー数を含む', () => {
    const msg = formatPipelinePhase('commit', { keysWritten: 3 });
    expect(msg).toContain(PIPELINE_LOG_PREFIX);
    expect(msg).toContain('3');
  });

  it('done: 合計件数と経過時間を含む', () => {
    const msg = formatPipelinePhase('done', {
      totalCount: 120,
      elapsedMs: 42
    });
    expect(msg).toContain(PIPELINE_LOG_PREFIX);
    expect(msg).toContain('120');
    expect(msg).toContain('42');
  });

  it('skip: 理由を含む', () => {
    const msg = formatPipelinePhase('skip', { reason: 'no changes' });
    expect(msg).toContain(PIPELINE_LOG_PREFIX);
    expect(msg).toContain('no changes');
  });

  it('未知 phase は JSON フォールバック', () => {
    const msg = formatPipelinePhase('custom', { foo: 'bar' });
    expect(msg).toContain(PIPELINE_LOG_PREFIX);
    expect(msg).toContain('custom');
    expect(msg).toContain('"foo"');
  });
});
