import { describe, expect, it } from 'vitest';
import {
  buildStoryAvatarDiagHtml,
  formatStoryAvatarDiagLine,
  interceptExportCodeUserLabel
} from './storyAvatarDiagLine.js';

const base = {
  total: 10,
  withUid: 10,
  withAvatar: 2,
  uniqueAvatar: 2,
  resolvedAvatar: 3,
  resolvedUniqueAvatar: 2,
  selfShown: 0,
  selfSaved: 0,
  selfPending: 0,
  selfPendingMatched: 0,
  interceptItems: 5,
  interceptWithUid: 5,
  interceptWithAvatar: 0,
  mergedPatched: 0,
  mergedUidReplaced: 0,
  stripped: 0
};

describe('interceptExportCodeUserLabel', () => {
  it('ok_empty は平易な日本語', () => {
    expect(interceptExportCodeUserLabel('ok_empty')).toContain('まだ行がありません');
  });
});

describe('formatStoryAvatarDiagLine', () => {
  it('total が 0 以下なら null', () => {
    expect(formatStoryAvatarDiagLine({ ...base, total: 0 })).toBeNull();
    expect(formatStoryAvatarDiagLine({ ...base, total: -1 })).toBeNull();
  });

  it('技術用1行を返す', () => {
    const line = formatStoryAvatarDiagLine(base);
    expect(line).toContain('診断(技術):');
    expect(line).toContain('保存アイコンURL 2/10');
    expect(line).toContain('表示に使えたアイコン 3/10');
    expect(line).toContain('ページから拾った補助 5件');
    expect(line).toContain('後から補完 0件');
    expect(line).not.toContain('ID差し替え');
    expect(line).not.toContain('不整合除去');
  });

  it('ID差し替えと不整合除去', () => {
    const line = formatStoryAvatarDiagLine({
      ...base,
      mergedUidReplaced: 2,
      stripped: 1
    });
    expect(line).toContain('（ID差し替え 2）');
    expect(line).toContain('不整合除去 1件');
  });

  it('一時対応表・取り込みのサフィックス', () => {
    const line = formatStoryAvatarDiagLine({
      ...base,
      interceptMapOnPage: 12,
      interceptExportRows: 0,
      interceptExportCode: 'ok_empty',
      interceptExportDetail: 'test'
    });
    expect(line).toContain('ページ内の一時対応表 12件');
    expect(line).toContain('直近の取り込み 0行');
    expect(line).toContain('[ok_empty]');
    expect(line).toContain('(test)');
  });
});

describe('buildStoryAvatarDiagHtml', () => {
  it('total が 0 以下なら null', () => {
    expect(buildStoryAvatarDiagHtml({ ...base, total: 0 })).toBeNull();
  });

  it('平易なリードと折りたたみを含む', () => {
    const h = buildStoryAvatarDiagHtml(base);
    expect(h).toContain('nl-story-diag__lead');
    expect(h).toContain('記録している応援コメント');
    expect(h).toContain('内訳・用語（詳しく見る）');
    expect(h).toContain('視聴ページの通信から拾った利用者情報');
  });
});
