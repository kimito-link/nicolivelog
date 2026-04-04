// @ts-nocheck — MAIN world IIFE; DOM/ページ型が広く any 相当
/**
 * MAIN world エントリ（esbuild で単一 IIFE にバンドルされる）
 */
import { splitLengthDelimitedMessages } from '../lib/lengthDelimitedStream.js';
import { extractPairsFromBinaryUtf8 } from '../lib/interceptBinaryTextExtract.js';

(() => {
  'use strict';
  if (window.__NLS_PAGE_INTERCEPT__) return;
  const host = String(window.location?.host || '');
  const path = String(window.location?.pathname || '');
  const isNicoHost = host.endsWith('.nicovideo.jp') || host === 'nicovideo.jp';
  const isWatchPage = isNicoHost && (path.startsWith('/watch/') || path.startsWith('/embed/'));
  const isLocalDev = host === '127.0.0.1:3456' || host === 'localhost:3456';
  if (!isWatchPage && !isLocalDev) return;
  window.__NLS_PAGE_INTERCEPT__ = true;

  const MSG_TYPE = 'NLS_INTERCEPT_USERID';
  const MSG_STATISTICS = 'NLS_INTERCEPT_STATISTICS';

  /** @type {Map<string, { uid?: string, name?: string, av?: string }>} */
  const batch = new Map();
  /** @type {number|null} */
  let timer = null;

  /** userId→nickname の補助マップ（ユーザー情報メッセージ用） */
  /** @type {Map<string, string>} */
  const knownNames = new Map();
  /** @type {Map<string, string>} */
  const knownAvatars = new Map();

  function flush() {
    if (!batch.size) return;
    const entries = [];
    for (const [no, v] of batch) {
      const uid = String(v?.uid || '').trim();
      const name =
        String(v?.name || '').trim() ||
        (uid ? String(knownNames.get(uid) || '').trim() : '');
      const av =
        String(v?.av || '').trim() ||
        (uid ? String(knownAvatars.get(uid) || '').trim() : '');
      if (!uid && !name && !av) continue;
      entries.push({
        no,
        ...(uid ? { uid } : {}),
        ...(name ? { name } : {}),
        ...(av ? { av } : {})
      });
    }
    batch.clear();
    if (entries.length > 0) {
      window.postMessage({ type: MSG_TYPE, entries }, '*');
    }
  }

  function normalizeAvatarUrl(url) {
    const s = String(url ?? '').trim();
    if (!/^https?:\/\//i.test(s)) return '';
    return s;
  }

  function enqueue(commentNo, userId, nickname, avatarUrl = '') {
    const no = String(commentNo ?? '').trim();
    const uid = String(userId ?? '').trim();
    if (!no) return;
    const name = String(nickname ?? '').trim();
    const av = normalizeAvatarUrl(avatarUrl);
    if (!uid && !name && !av) return;
    if (name && uid) knownNames.set(uid, name);
    if (av && uid) knownAvatars.set(uid, av);
    const prev = batch.get(no);
    const prevUid = String(prev?.uid || '').trim();
    const prevName = String(prev?.name || '').trim();
    const prevAv = String(prev?.av || '').trim();
    const nextUid = uid || prevUid;
    const nextName = name || prevName;
    const nextAv = av || prevAv;
    batch.set(no, {
      ...(nextUid ? { uid: nextUid } : {}),
      ...(nextName ? { name: nextName } : {}),
      ...(nextAv ? { av: nextAv } : {})
    });
    if (!timer) timer = setTimeout(() => { timer = null; flush(); }, 150);
  }

  /** ユーザー情報だけのメッセージ（コメント番号なし）を蓄積 */
  function learnUser(userId, nickname, avatarUrl = '') {
    const uid = String(userId ?? '').trim();
    const name = String(nickname ?? '').trim();
    const av = normalizeAvatarUrl(avatarUrl);
    if (uid && name) knownNames.set(uid, name);
    if (uid && av) knownAvatars.set(uid, av);
  }

  const NO_KEYS = ['no', 'commentNo', 'comment_no', 'number', 'vpos_no'];
  const UID_KEYS = [
    'user_id',
    'userId',
    'uid',
    'raw_user_id',
    'hashedUserId',
    'hashed_user_id',
    'senderUserId',
    'accountId'
  ];
  const NAME_KEYS = [
    'name',
    'nickname',
    'userName',
    'user_name',
    'displayName',
    'display_name'
  ];
  const AVATAR_KEYS = [
    'iconUrl',
    'icon_url',
    'avatarUrl',
    'avatar_url',
    'userIconUrl',
    'user_icon_url',
    'thumbnailUrl',
    'thumbnail_url'
  ];

  /** @param {unknown} obj */
  function dig(obj, depth) {
    if (!obj || typeof obj !== 'object' || depth > 5) return;
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length && i < 500; i++) dig(obj[i], depth + 1);
      return;
    }
    let no = null;
    let uid = null;
    let name = null;
    let av = '';
    for (const k of NO_KEYS) {
      if (obj[k] != null) {
        no = obj[k];
        break;
      }
    }
    for (const k of UID_KEYS) {
      if (obj[k] != null) {
        uid = obj[k];
        break;
      }
    }
    for (const k of NAME_KEYS) {
      if (obj[k] != null && typeof obj[k] === 'string') {
        name = obj[k];
        break;
      }
    }
    for (const k of AVATAR_KEYS) {
      if (obj[k] != null && typeof obj[k] === 'string') {
        av = normalizeAvatarUrl(obj[k]);
        if (av) break;
      }
    }

    const NESTED = ['chat', 'comment', 'data', 'message', 'body', 'user', 'sender'];
    if (no == null || uid == null || name == null || !av) {
      for (const sub of NESTED) {
        const child = obj[sub];
        if (!child || typeof child !== 'object' || Array.isArray(child)) continue;
        if (no == null) {
          for (const k of NO_KEYS) {
            if (child[k] != null) {
              no = child[k];
              break;
            }
          }
        }
        if (uid == null) {
          for (const k of UID_KEYS) {
            if (child[k] != null) {
              uid = child[k];
              break;
            }
          }
        }
        if (name == null) {
          for (const k of NAME_KEYS) {
            if (child[k] != null && typeof child[k] === 'string') {
              name = child[k];
              break;
            }
          }
        }
        if (!av) {
          for (const k of AVATAR_KEYS) {
            if (child[k] != null && typeof child[k] === 'string') {
              av = normalizeAvatarUrl(child[k]);
              if (av) break;
            }
          }
        }
      }
    }

    if (no != null && (uid != null || av)) {
      enqueue(no, uid, name, av);
    } else if (uid != null && name != null) {
      learnUser(uid, name, av);
    }

    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length && i < 30; i++) {
      const v = obj[keys[i]];
      if (v && typeof v === 'object') dig(v, depth + 1);
    }
  }

  /** @param {string} text */
  function extractFromBinaryText(text) {
    for (const p of extractPairsFromBinaryUtf8(text)) {
      enqueue(p.no, p.uid, '', '');
    }
  }

  /** @param {Uint8Array} u8 */
  function tryProcessBinaryBuffer(u8) {
    if (u8.byteLength < 8 || u8.byteLength > 2_000_000) return;
    const chunks = splitLengthDelimitedMessages(u8);
    const dec = new TextDecoder('utf-8', { fatal: false });
    if (chunks.length > 0) {
      for (const ch of chunks) {
        extractFromBinaryText(dec.decode(ch));
      }
    }
    extractFromBinaryText(dec.decode(u8));
  }

  const VIEWER_KEYS = ['viewers', 'watchCount', 'watching', 'watchingCount', 'viewerCount', 'viewCount'];
  const COMMENT_KEYS = ['comments', 'commentCount'];
  function pickNum(obj, keys, max) {
    for (const k of keys) {
      const r = obj[k];
      if (r == null) continue;
      const n = typeof r === 'number' ? r : parseInt(String(r), 10);
      if (Number.isFinite(n) && n >= 0 && (!max || n <= max)) return n;
    }
    return null;
  }

  /**
   * パース済み JSON からビューア数・コメント数を検出して転送。
   * type:"statistics" だけでなく、既知キーがあれば広く拾う。
   * @param {unknown} obj
   */
  function tryForwardStatistics(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    const o = /** @type {Record<string, unknown>} */ (obj);
    const d = o.data;
    const target =
      d && typeof d === 'object' && !Array.isArray(d)
        ? /** @type {Record<string, unknown>} */ (d)
        : o;
    let viewers = pickNum(target, VIEWER_KEYS, 50_000_000);
    let comments = pickNum(target, COMMENT_KEYS);
    if (viewers == null && target !== o) {
      viewers = pickNum(o, VIEWER_KEYS, 50_000_000);
      comments = comments ?? pickNum(o, COMMENT_KEYS);
    }
    if (viewers == null) return;
    window.postMessage(
      { type: MSG_STATISTICS, viewers, comments },
      '*'
    );
  }

  /** @param {unknown} raw */
  function tryProcess(raw) {
    if (typeof raw === 'string') {
      if (raw.length < 4 || raw.length > 1_000_000) return;
      try {
        const parsed = JSON.parse(raw);
        tryForwardStatistics(parsed);
        dig(parsed, 0);
      } catch {
        /* not JSON */
      }
      return;
    }
    if (raw instanceof ArrayBuffer || raw instanceof Uint8Array) {
      const buf = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
      tryProcessBinaryBuffer(buf);
      return;
    }
    if (typeof Blob !== 'undefined' && raw instanceof Blob) {
      if (raw.size > 2_000_000) return;
      raw.arrayBuffer().then((ab) => tryProcess(ab)).catch(() => {});
    }
  }

  const OrigWS = window.WebSocket;
  try {
    window.WebSocket = new Proxy(OrigWS, {
      construct(target, args) {
        const ws = new target(...args);
        ws.addEventListener('message', (/** @type {MessageEvent} */ e) => {
          try {
            tryProcess(e.data);
          } catch {
            /* never break the page */
          }
        });
        return ws;
      }
    });
    Object.defineProperty(window.WebSocket, 'prototype', {
      value: OrigWS.prototype,
      writable: false,
      configurable: false
    });
  } catch {
    /* Proxy 失敗は無視 */
  }

  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function (...args) {
      let p;
      try {
        p = origFetch.apply(this, args);
      } catch (syncErr) {
        throw syncErr;
      }
      void (async () => {
        try {
          const res = await p;
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
          const isNico =
            url.includes('nicovideo.jp') ||
            url.includes('nimg.jp') ||
            url.includes('dmc.nico') ||
            url.includes('nicolive') ||
            url.includes('127.0.0.1:3456') ||
            url.includes('localhost:3456');
          if (isNico) {
            const ct = res.headers?.get('content-type') || '';
            if (ct.includes('json') || ct.includes('protobuf') || ct.includes('octet')) {
              const clone = res.clone();
              try { tryProcess(await clone.arrayBuffer()); } catch { /* no-op */ }
            }
          }
        } catch {
          /* fetch rejection — ignore */
        }
      })();
      return p;
    };
  }

  const MSG_EMBEDDED_DATA = 'NLS_INTERCEPT_EMBEDDED_DATA';
  function tryReadEmbeddedData() {
    try {
      const el = document.getElementById('embedded-data');
      if (!el) return;
      let raw = el.getAttribute('data-props') || '';
      if (!raw) return;
      if (raw.includes('&quot;')) raw = raw.replace(/&quot;/g, '"');
      if (raw.includes('&amp;')) raw = raw.replace(/&amp;/g, '&');
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return;
      const wc = obj?.program?.statistics?.watchCount;
      const viewers =
        wc != null && Number.isFinite(Number(wc)) && Number(wc) >= 0
          ? Number(wc)
          : null;
      window.postMessage(
        { type: MSG_EMBEDDED_DATA, viewers },
        '*'
      );
    } catch {
      /* no-op */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryReadEmbeddedData, { once: true });
  } else {
    tryReadEmbeddedData();
  }
})();
