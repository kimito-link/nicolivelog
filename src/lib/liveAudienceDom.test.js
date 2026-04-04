/** @vitest-environment happy-dom */
import { describe, it, expect } from 'vitest';
import {
  parseLiveViewerCountFromDocument,
  normalizeDigitsForViewerScan,
  gatherWatchPageTextForViewerScan,
  parseViewerCountFromSnapshotMetas,
  parseViewerCountFromLooseText,
  parseViewerCountFromInlineScripts
} from './liveAudienceDom.js';

function docFromHtml(html) {
  document.body.innerHTML = html;
  return document;
}

describe('parseLiveViewerCountFromDocument', () => {
  it('「人が視聴」直前の数値（カンマ付き）', () => {
    const doc = docFromHtml(
      '<div class="root"><p>現在 <strong>2,731人が視聴中</strong></p></div>'
    );
    expect(parseLiveViewerCountFromDocument(doc)).toBe(2731);
  });

  it('視聴者ラベル＋数値', () => {
    const doc = docFromHtml('<span>視聴者 1,024</span>');
    expect(parseLiveViewerCountFromDocument(doc)).toBe(1024);
  });

  it('視聴者数：ラベル（コロン全角）', () => {
    const doc = docFromHtml('<div>視聴者数：3,456</div>');
    expect(parseLiveViewerCountFromDocument(doc)).toBe(3456);
  });

  it('コメント件数だけではマッチしない', () => {
    const doc = docFromHtml(
      '<div class="ga-ns-comment-panel"><span>コメント 952</span></div>'
    );
    expect(parseLiveViewerCountFromDocument(doc)).toBeNull();
  });

  it('該当テキストが無ければ null', () => {
    const doc = docFromHtml('<div>hello</div>');
    expect(parseLiveViewerCountFromDocument(doc)).toBeNull();
  });

  it('異常に大きい数は弾く（誤検知抑制）', () => {
    const doc = docFromHtml('<p>999999999人が視聴</p>');
    expect(parseLiveViewerCountFromDocument(doc)).toBeNull();
  });

  it('全角数字を解釈する', () => {
    const doc = docFromHtml('<p>２，７３１人が視聴中</p>');
    expect(parseLiveViewerCountFromDocument(doc)).toBe(2731);
  });

  it('aria-label から拾う', () => {
    const doc = docFromHtml(
      '<button type="button" aria-label="現在 4,321人が視聴中">▶</button>'
    );
    expect(parseLiveViewerCountFromDocument(doc)).toBe(4321);
  });

  it('shadow root 内のテキストを見る', () => {
    document.body.innerHTML = '';
    const host = document.createElement('div');
    document.body.appendChild(host);
    const sr = host.attachShadow({ mode: 'open' });
    sr.innerHTML = '<span>9,876人が視聴</span>';
    expect(parseLiveViewerCountFromDocument(document)).toBe(9876);
  });

  // 実ブラウザでは同一オリジン iframe の body も走査する（happy-dom では contentDocument が空になりがちなため省略）
});

describe('normalizeDigitsForViewerScan', () => {
  it('全角数字と全角カンマ', () => {
    expect(normalizeDigitsForViewerScan('１，２３４')).toBe('1,234');
  });
});

describe('gatherWatchPageTextForViewerScan', () => {
  it('本文に shadow 文言が含まれる', () => {
    document.body.innerHTML = '';
    const host = document.createElement('div');
    document.body.appendChild(host);
    const sr = host.attachShadow({ mode: 'open' });
    sr.innerHTML = 'shadow内7,777人が視聴';
    const t = gatherWatchPageTextForViewerScan(document);
    expect(t).toContain('7,777人が視聴');
  });
});

describe('parseViewerCountFromSnapshotMetas', () => {
  it('og:description に視聴者表記があれば拾う', () => {
    const n = parseViewerCountFromSnapshotMetas([
      { key: 'og:description', value: '番組説明。現在 8,888人が視聴中。' }
    ]);
    expect(n).toBe(8888);
  });
});

describe('parseViewerCountFromLooseText', () => {
  it('英語 viewers', () => {
    expect(parseViewerCountFromLooseText('Live now · 3,210 viewers')).toBe(3210);
  });
});

describe('parseViewerCountFromInlineScripts', () => {
  it('JSON 内の viewerCount', () => {
    document.body.innerHTML =
      '<script type="application/json">{"meta":{"viewerCount":6543,"x":1}}</script>';
    expect(parseViewerCountFromInlineScripts(document)).toBe(6543);
  });
});
