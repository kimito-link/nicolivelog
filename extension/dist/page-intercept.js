(() => {
  // src/lib/protobufVarint.js
  function readUint32Varint(bytes, offset) {
    if (offset < 0 || offset >= bytes.length) return null;
    let result = 0n;
    let shift = 0n;
    let o = offset;
    for (let i = 0; i < 10; i += 1) {
      const b = bytes[o];
      if (b === void 0) return null;
      o += 1;
      result |= BigInt(b & 127) << shift;
      if (result > 0xffffffffn) return null;
      if ((b & 128) === 0) {
        return { value: Number(result), length: o - offset };
      }
      shift += 7n;
    }
    return null;
  }

  // src/lib/lengthDelimitedStream.js
  function splitLengthDelimitedMessages(bytes) {
    if (!bytes.length) return [];
    const out = [];
    let offset = 0;
    while (offset < bytes.length) {
      const vr = readUint32Varint(bytes, offset);
      if (!vr) break;
      offset += vr.length;
      const len = vr.value;
      if (offset + len > bytes.length) break;
      out.push(bytes.subarray(offset, offset + len));
      offset += len;
    }
    return out;
  }

  // src/lib/interceptBinaryTextExtract.js
  var MAX_PAIR_DISTANCE = 600;
  var UID_RE = /"(?:user_id|userId|uid|hashed_user_id|hashedUserId|raw_user_id)"\s*:\s*"?(\w{5,26})"?/g;
  var NO_RE = /"(?:no|commentNo|comment_no)"\s*:\s*(\d+)/g;
  function extractPairsFromBinaryUtf8(text) {
    if (!text || text.length < 4) return [];
    const uids = [];
    const nos = [];
    let m;
    const uidRe = new RegExp(UID_RE.source, "g");
    while ((m = uidRe.exec(text)) !== null) {
      uids.push({ val: m[1], pos: m.index });
    }
    const noRe = new RegExp(NO_RE.source, "g");
    while ((m = noRe.exec(text)) !== null) {
      nos.push({ val: m[1], pos: m.index });
    }
    if (!uids.length || !nos.length) return [];
    const out = [];
    for (const u of uids) {
      let best = null;
      let bestDist = Infinity;
      for (const n of nos) {
        const dist = Math.abs(u.pos - n.pos);
        if (dist < bestDist) {
          bestDist = dist;
          best = n;
        }
      }
      if (best && bestDist < MAX_PAIR_DISTANCE) {
        out.push({ no: best.val, uid: u.val });
      }
    }
    return out;
  }

  // src/extension/page-intercept-entry.js
  (() => {
    "use strict";
    if (window.__NLS_PAGE_INTERCEPT__) return;
    window.__NLS_PAGE_INTERCEPT__ = true;
    const MSG_TYPE = "NLS_INTERCEPT_USERID";
    const batch = /* @__PURE__ */ new Map();
    let timer = null;
    const knownNames = /* @__PURE__ */ new Map();
    function flush() {
      if (!batch.size) return;
      const entries = [];
      for (const [no, v] of batch) {
        const name = v.name || knownNames.get(v.uid) || "";
        entries.push({ no, uid: v.uid, name });
      }
      batch.clear();
      window.postMessage({ type: MSG_TYPE, entries }, "*");
    }
    function enqueue(commentNo, userId, nickname) {
      const no = String(commentNo ?? "").trim();
      const uid = String(userId ?? "").trim();
      if (!no || !uid) return;
      const name = String(nickname ?? "").trim();
      if (name && uid) knownNames.set(uid, name);
      batch.set(no, { uid, name });
      if (!timer) timer = setTimeout(() => {
        timer = null;
        flush();
      }, 150);
    }
    function learnUser(userId, nickname) {
      const uid = String(userId ?? "").trim();
      const name = String(nickname ?? "").trim();
      if (uid && name) knownNames.set(uid, name);
    }
    const NO_KEYS = ["no", "commentNo", "comment_no", "number", "vpos_no"];
    const UID_KEYS = [
      "user_id",
      "userId",
      "uid",
      "raw_user_id",
      "hashedUserId",
      "hashed_user_id",
      "senderUserId",
      "accountId"
    ];
    const NAME_KEYS = [
      "name",
      "nickname",
      "userName",
      "user_name",
      "displayName",
      "display_name"
    ];
    function dig(obj, depth) {
      if (!obj || typeof obj !== "object" || depth > 5) return;
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
        if (obj[k] != null && typeof obj[k] === "string") {
          name = obj[k];
          break;
        }
      }
      const NESTED = ["chat", "comment", "data", "message", "body", "user", "sender"];
      if (no == null || uid == null || name == null) {
        for (const sub of NESTED) {
          const child = obj[sub];
          if (!child || typeof child !== "object" || Array.isArray(child)) continue;
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
              if (child[k] != null && typeof child[k] === "string") {
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
        if (v && typeof v === "object") dig(v, depth + 1);
      }
    }
    function extractFromBinaryText(text) {
      for (const p of extractPairsFromBinaryUtf8(text)) {
        enqueue(p.no, p.uid, "");
      }
    }
    function tryProcessBinaryBuffer(u8) {
      if (u8.byteLength < 8 || u8.byteLength > 2e6) return;
      const chunks = splitLengthDelimitedMessages(u8);
      const dec = new TextDecoder("utf-8", { fatal: false });
      if (chunks.length > 0) {
        for (const ch of chunks) {
          extractFromBinaryText(dec.decode(ch));
        }
      }
      extractFromBinaryText(dec.decode(u8));
    }
    function tryProcess(raw) {
      if (typeof raw === "string") {
        if (raw.length < 4 || raw.length > 1e6) return;
        try {
          dig(JSON.parse(raw), 0);
        } catch {
        }
        return;
      }
      if (raw instanceof ArrayBuffer || raw instanceof Uint8Array) {
        const buf = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
        tryProcessBinaryBuffer(buf);
        return;
      }
      if (typeof Blob !== "undefined" && raw instanceof Blob) {
        if (raw.size > 2e6) return;
        raw.arrayBuffer().then((ab) => tryProcess(ab)).catch(() => {
        });
      }
    }
    const OrigWS = window.WebSocket;
    try {
      window.WebSocket = new Proxy(OrigWS, {
        construct(target, args) {
          const ws = new target(...args);
          ws.addEventListener("message", (e) => {
            try {
              tryProcess(e.data);
            } catch {
            }
          });
          return ws;
        }
      });
      Object.defineProperty(window.WebSocket, "prototype", {
        value: OrigWS.prototype,
        writable: false,
        configurable: false
      });
    } catch {
    }
    const origFetch = window.fetch;
    window.fetch = function(...args) {
      return origFetch.apply(this, args).then((res) => {
        try {
          const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
          const isNico = url.includes("nicovideo.jp") || url.includes("nimg.jp") || url.includes("dmc.nico") || url.includes("nicolive") || url.includes("127.0.0.1:3456");
          if (isNico) {
            const ct = res.headers?.get("content-type") || "";
            if (ct.includes("json") || ct.includes("protobuf") || ct.includes("octet")) {
              const clone = res.clone();
              clone.arrayBuffer().then((ab) => tryProcess(ab)).catch(() => {
              });
            }
          }
        } catch {
        }
        return res;
      });
    };
  })();
})();
