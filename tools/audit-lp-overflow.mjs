/**
 * One-off LP overflow audit (run: node tools/audit-lp-overflow.mjs)
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lpHref = pathToFileURL(path.join(root, 'tsuioku-no-kirameki', 'index.html')).href;

const widths = [360, 390, 428, 768, 834, 1024, 1280, 1440, 1920];
const selectors = [
  'html',
  'body',
  'main',
  '.shell',
  '.hero-grid',
  '.hero-copy',
  '.hero-stage',
  '.topbar',
  '.lp-inapp-hint',
  '.footer-note',
  '.lp-coda__inner',
];

const browser = await chromium.launch();
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(lpHref, { waitUntil: 'domcontentloaded' });
  const bad = [];
  for (const sel of selectors) {
    const el = await page.locator(sel).first().elementHandle();
    if (!el) continue;
    const r = await el.evaluate((e) => ({
      sw: e.scrollWidth,
      cw: e.clientWidth,
    }));
    if (r.sw > r.cw + 2) bad.push({ sel, ...r, over: r.sw - r.cw });
  }
  console.log(`${w}px:`, bad.length ? bad : 'OK');
  await page.close();
}
await browser.close();
