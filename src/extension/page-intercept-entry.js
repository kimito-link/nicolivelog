// @ts-nocheck — MAIN world IIFE; DOM/ページ型が広く any 相当
/**
 * MAIN world エントリ（esbuild で単一 IIFE にバンドルされる）
 */
import { splitLengthDelimitedMessages } from '../lib/lengthDelimitedStream.js';
import { extractPairsFromBinaryUtf8 } from '../lib/interceptBinaryTextExtract.js';

(() => {
  'use strict';
  if (window.__NLS_PAGE_INTERCEPT__) return;
  window.__NLS_PAGE_INTERCEPT__ = true;

  const MSG_TYPE = 'NLS_INTERCEPT_USERID';

  /** @type {Map<string, { uid: string, name: string }>} */
  const batch = new Map();
  /** @type {number|null} */
  let timer = null;

  /** userId→nickname の補助マップ（ユーザー情報メッセージ用） */
  /** @type {Map<string, string>} */
  const knownNames = new Map();

  function flush() {
    if (!batch.size) return;
    const entries = [];
    for (const [no, v] of batch) {
      const name = v.name || knownNames.get(v.uid) || '';
      entries.push({ no, uid: v.uid, name });
    }
    batch.clear();
    window.postMessage({ type: MSG_TYPE, entries }, '*');
  }

  function enqueue(commentNo, userId, nickname) {
    const no = String(commentNo ?? '').trim();
    const uid = String(userId ?? '').trim();
    if (!no || !uid) return;
    const name = String(nickname ?? '').trim();
    if (name && uid) knownNames.set(uid, name);
    batch.set(no, { uid, name });
    if (!timer) timer = setTimeout(() => { timer = null; flush(); }, 150);
  }

  /** ユーザー情報だけのメッセージ（コメント番号なし）を蓄積 */
  function learnUser(userId, nickname) {
    const uid = String(userId ?? '').trim();
    const name = String(nickname ?? '').trim();
    if (uid && name) knownNames.set(uid, name);
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

    const NESTED = ['chat', 'comment', 'data', 'message', 'body', 'user', 'sender'];
    if (no == null || uid == null || name == null) {
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
      }
    }

    if (uid != null && no != null) {
      enqueue(no, uid, name);
    } else if (uid != null && name != null) {
      learnUser(uid, name);
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
      enqueue(p.no, p.uid, '');
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

  /** @param {unknown} raw */
  function tryProcess(raw) {
    if (typeof raw === 'string') {
      if (raw.length < 4 || raw.length > 1_000_000) return;
      try {
        dig(JSON.parse(raw), 0);
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
  window.fetch = function (...args) {
    return origFetch.apply(this, args).then((res) => {
      try {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        const isNico =
          url.includes('nicovideo.jp') ||
          url.includes('nimg.jp') ||
          url.includes('dmc.nico') ||
          url.includes('nicolive') ||
          url.includes('127.0.0.1:3456');
        if (isNico) {
          const ct = res.headers?.get('content-type') || '';
          if (ct.includes('json') || ct.includes('protobuf') || ct.includes('octet')) {
            const clone = res.clone();
            clone.arrayBuffer().then((ab) => tryProcess(ab)).catch(() => {});
          }
        }
      } catch {
        /* never break fetch */
      }
      return res;
    });
  };
})();
