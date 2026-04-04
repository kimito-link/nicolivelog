/**
 * watch ページ DOM から「同時接続（ページ表示）」に近い視聴者数を読む（純関数・ベストエフォート）
 */

const MAX_REASONABLE_VIEWERS = 12_000_000;

/**
 * 全角数字・全角カンマを半角に（表記ゆれ対策）
 * @param {string} text
 */
export function normalizeDigitsForViewerScan(text) {
  let s = String(text || '');
  const fw = '０１２３４５６７８９，';
  const hw = '0123456789,';
  for (let i = 0; i < fw.length; i++) {
    s = s.split(fw[i]).join(hw[i]);
  }
  return s;
}

/**
 * メイン文書＋同一オリジン iframe 内＋開いている shadow root からテキストを集める（視聴者数探索用）
 * @param {Document} doc
 * @returns {string}
 */
export function gatherWatchPageTextForViewerScan(doc) {
  if (!doc) return '';
  /** @type {string[]} */
  const chunks = [];

  /** @param {Document|DocumentFragment|null|undefined} root */
  const pushRootText = (root) => {
    if (!root) return;
    try {
      const body = root instanceof Document ? root.body : root;
      if (body) {
        chunks.push(String(body.textContent || ''));
        if ('innerText' in body) {
          chunks.push(
            String(/** @type {HTMLElement} */ (body).innerText || '')
          );
        }
      }
    } catch {
      // no-op
    }
  };

  pushRootText(doc);

  try {
    doc.querySelectorAll('iframe').forEach((frame) => {
      try {
        const idoc = frame.contentDocument;
        if (idoc) pushRootText(idoc);
      } catch {
        // cross-origin
      }
    });
  } catch {
    // no-op
  }

  /** @param {ParentNode} root @param {number} depth */
  const pushShadowTexts = (root, depth) => {
    if (!root || depth < 0) return;
    try {
      root.querySelectorAll('*').forEach((el) => {
        const sr = /** @type {HTMLElement} */ (el).shadowRoot;
        if (sr) {
          chunks.push(String(sr.textContent || ''));
          pushShadowTexts(sr, depth - 1);
        }
      });
    } catch {
      // no-op
    }
  };
  try {
    if (doc.body) pushShadowTexts(doc.body, 8);
  } catch {
    // no-op
  }

  try {
    doc.querySelectorAll('[aria-label], [title]').forEach((el) => {
      chunks.push(String(el.getAttribute('aria-label') || ''));
      chunks.push(String(el.getAttribute('title') || ''));
    });
  } catch {
    // no-op
  }

  return chunks.join('\n');
}

/**
 * 任意の短文（メタ description 等）から視聴者数を試す（export して snapshot 側でも利用）
 * @param {string} chunk
 * @returns {number|null}
 */
export function parseViewerCountFromLooseText(chunk) {
  const raw = normalizeDigitsForViewerScan(chunk);
  const s = String(raw || '').replace(/\s+/g, ' ');
  const patterns = [
    /(\d[\d,]*)\s*人が視聴/,
    /(\d[\d,]*)\s*人\s*が\s*視聴/,
    /(\d[\d,]*)\s*人\s*視聴中/,
    /(\d[\d,]*)\s*名が視聴/,
    /視聴者数\s*[：:\u3000\s]*(\d[\d,]*)(?!\d)/,
    /視聴者\s*(\d[\d,]*)(?!\d)/,
    /(\d[\d,]*)\s*人\s*が\s*オンライン/,
    /同時視聴\s*[:：]?\s*(\d[\d,]*)(?!\d)/,
    /(\d[\d,]*)\s*人\s*が\s*見てます/,
    /([\d,]+)\s+viewers?\b/i,
    /(\d[\d,]*)\s*人(?=[^\d]{0,16}視聴)/,
    /視聴[^0-9]{0,40}(\d[\d,]*)\s*人/,
    /来場\s*(\d[\d,]*)\s*人/,
    /(\d[\d,]*)\s*人\s*来場/
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (!m?.[1]) continue;
    const n = parseInt(String(m[1]).replace(/,/g, ''), 10);
    if (!Number.isFinite(n) || n < 0 || n > MAX_REASONABLE_VIEWERS) continue;
    return n;
  }
  return null;
}

/**
 * @param {Document|null|undefined} doc
 * @returns {number|null}
 */
export function parseLiveViewerCountFromDocument(doc) {
  if (!doc || !doc.body) return null;
  const merged = gatherWatchPageTextForViewerScan(doc);
  const flat = merged.replace(/\s+/g, ' ');
  const fromMerged = parseViewerCountFromLooseText(flat);
  if (fromMerged != null) return fromMerged;

  const tags = 'span,div,p,strong,li,button,a,em,time,h2,h3,td,th,label';
  try {
    const nodes = doc.querySelectorAll(tags);
    for (const el of nodes) {
      const t = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.length > 200) continue;
      if (!/視聴|viewers?/i.test(t)) continue;
      const hit = parseViewerCountFromLooseText(t);
      if (hit != null) return hit;
    }
  } catch {
    // no-op
  }

  const fromScripts = parseViewerCountFromInlineScripts(doc);
  if (fromScripts != null) return fromScripts;

  return null;
}

/**
 * インライン script（JSON ブートストラップ等）に埋まった視聴者数を拾う
 * @param {Document|null|undefined} doc
 * @returns {number|null}
 */
export function parseViewerCountFromInlineScripts(doc) {
  if (!doc) return null;
  const maxLen = 800_000;
  try {
    const scripts = doc.querySelectorAll('script:not([src])');
    for (const s of scripts) {
      const t = String(s.textContent || '');
      if (t.length < 30 || t.length > maxLen) continue;
      if (!/viewer|watching|watchCount|viewCount|視聴|listen|audience/i.test(t)) {
        continue;
      }
      const res = [
        /"watching(?:User)?Count"\s*:\s*(\d+)/i,
        /"viewerCount"\s*:\s*(\d+)/i,
        /"viewCount"\s*:\s*(\d+)/i,
        /"watchCount"\s*:\s*(\d+)/i,
        /"watching_count"\s*:\s*(\d+)/i,
        /watchingCount["']?\s*:\s*(\d+)/i,
        /viewerCount["']?\s*:\s*(\d+)/i
      ];
      for (const re of res) {
        const m = t.match(re);
        if (!m?.[1]) continue;
        const n = parseInt(m[1], 10);
        if (
          Number.isFinite(n) &&
          n >= 0 &&
          n <= MAX_REASONABLE_VIEWERS
        ) {
          return n;
        }
      }
    }
  } catch {
    // no-op
  }
  return null;
}

/**
 * head の meta 値に視聴者らしき文言があれば拾う（DOM 本体が Shadow 内だけのときの救済）
 * @param {{ key: string, value: string }[]|null|undefined} metas
 * @returns {number|null}
 */
export function parseViewerCountFromSnapshotMetas(metas) {
  if (!Array.isArray(metas) || !metas.length) return null;
  /** @type {string[]} */
  const chunks = [];
  for (const m of metas) {
    const v = String(m?.value || '');
    if (!v) continue;
    if (/視聴|viewer/i.test(v)) chunks.push(v);
  }
  if (!chunks.length) return null;
  return parseViewerCountFromLooseText(chunks.join(' '));
}
