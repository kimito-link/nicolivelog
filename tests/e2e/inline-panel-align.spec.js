import { test, expect } from './fixtures.js';

const MOCK_WATCH = 'http://127.0.0.1:3456/watch/lv888888888/';
const INLINE_HOST_ID = 'nls-inline-popup-host';

/**
 * インラインパネルが <video> の表示幅に合わせ、親内で左オフセットが付くこと（装飾ラッパーより狭い映像に寄せる）
 */
test.describe('inline panel alignment', () => {
  test('video が親より狭いときホストに margin-left が付く', async ({ context }) => {
    let sw = context.serviceWorkers()[0];
    if (!sw) {
      sw = await context.waitForEvent('serviceworker', { timeout: 60_000 });
    }

    const page = await context.newPage();
    await page.goto(MOCK_WATCH, { waitUntil: 'load', timeout: 60_000 });

    await page.evaluate(() => {
      const doc = globalThis.document;
      const win = globalThis.window;
      const old = doc.getElementById('e2e-mock-video');
      if (old) old.remove();

      const wrap = doc.createElement('section');
      wrap.id = 'mock-player-wrap';
      wrap.style.cssText =
        'width:500px;margin:12px 0;display:flex;flex-direction:column;align-items:center;background:#111;';

      const v = doc.createElement('video');
      v.setAttribute('playsinline', '');
      v.setAttribute('width', '400');
      v.setAttribute('height', '225');
      v.style.cssText = 'display:block;width:400px;height:225px;';
      wrap.appendChild(v);

      doc.body.prepend(wrap);
      win.scrollTo(0, 0);
      win.dispatchEvent(new Event('resize'));
    });

    await page.waitForTimeout(2000);

    const metrics = await page.evaluate((hostId) => {
      const host = globalThis.document.getElementById(hostId);
      if (!host) return null;
      const st = globalThis.getComputedStyle(host);
      return {
        display: st.display,
        marginLeft: st.marginLeft,
        width: st.width
      };
    }, INLINE_HOST_ID);

    expect(metrics, 'インラインホストが DOM にある').not.toBeNull();
    expect(metrics.display).toBe('block');
    const ml = Number.parseFloat(metrics.marginLeft);
    expect(ml).toBeGreaterThan(30);
    expect(ml).toBeLessThan(70);
    const w = Number.parseFloat(metrics.width);
    expect(w).toBeGreaterThan(380);
    expect(w).toBeLessThanOrEqual(420);
  });
});
