/** @vitest-environment happy-dom */
import { describe, it, expect } from 'vitest';
import {
  extractEmbeddedDataProps,
  pickViewerCountFromEmbeddedData,
  pickWsUrlFromEmbeddedData
} from './embeddedDataExtract.js';

const SAMPLE_PROPS = JSON.stringify({
  site: {
    relive: {
      webSocketUrl:
        'wss://a.live2.nicovideo.jp/wsapi/v2/watch/lv345581403/timeshift?audience_token=abc'
    }
  },
  program: {
    statistics: { watchCount: 5200, commentCount: 310 },
    status: 'ON_AIR'
  },
  user: { isLoggedIn: true, isBroadcaster: false }
});

describe('extractEmbeddedDataProps', () => {
  it('#embedded-data の data-props から JSON を取得', () => {
    document.body.innerHTML = `<script id="embedded-data" data-props='${SAMPLE_PROPS}'></script>`;
    const obj = extractEmbeddedDataProps(document);
    expect(obj).not.toBeNull();
    expect(obj.site.relive.webSocketUrl).toContain('wss://');
  });

  it('&quot; エスケープされた data-props を処理', () => {
    const escaped = SAMPLE_PROPS.replace(/"/g, '&quot;');
    document.body.innerHTML = `<script id="embedded-data" data-props="${escaped}"></script>`;
    const obj = extractEmbeddedDataProps(document);
    expect(obj).not.toBeNull();
    expect(obj.program.status).toBe('ON_AIR');
  });

  it('要素が無い場合は null', () => {
    document.body.innerHTML = '<div>no data</div>';
    expect(extractEmbeddedDataProps(document)).toBeNull();
  });

  it('data-props が空の場合は null', () => {
    document.body.innerHTML = '<script id="embedded-data" data-props=""></script>';
    expect(extractEmbeddedDataProps(document)).toBeNull();
  });
});

describe('pickViewerCountFromEmbeddedData', () => {
  it('program.statistics.watchCount を返す', () => {
    const props = JSON.parse(SAMPLE_PROPS);
    expect(pickViewerCountFromEmbeddedData(props)).toBe(5200);
  });

  it('watchCount がなければ null', () => {
    expect(pickViewerCountFromEmbeddedData({})).toBeNull();
    expect(pickViewerCountFromEmbeddedData({ program: {} })).toBeNull();
    expect(
      pickViewerCountFromEmbeddedData({ program: { statistics: {} } })
    ).toBeNull();
  });

  it('負値は null', () => {
    const props = { program: { statistics: { watchCount: -1 } } };
    expect(pickViewerCountFromEmbeddedData(props)).toBeNull();
  });
});

describe('pickWsUrlFromEmbeddedData', () => {
  it('site.relive.webSocketUrl を返す', () => {
    const props = JSON.parse(SAMPLE_PROPS);
    expect(pickWsUrlFromEmbeddedData(props)).toContain('wss://');
  });

  it('パスが無ければ null', () => {
    expect(pickWsUrlFromEmbeddedData({})).toBeNull();
    expect(pickWsUrlFromEmbeddedData({ site: {} })).toBeNull();
  });
});
