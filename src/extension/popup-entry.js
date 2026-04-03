import { extractLiveIdFromUrl, isNicoLiveWatchUrl } from '../lib/broadcastUrl.js';
import {
  KEY_LAST_WATCH_URL,
  KEY_RECORDING,
  commentsStorageKey
} from '../lib/storageKeys.js';
import {
  aggregateCommentsByUser,
  displayUserLabel,
  UNKNOWN_USER_KEY
} from '../lib/userRooms.js';

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderUserRooms(entries) {
  const ul = /** @type {HTMLUListElement} */ ($('userRoomList'));
  if (!ul) return;

  const rooms = aggregateCommentsByUser(entries);
  ul.innerHTML = '';

  if (!rooms.length) {
    const li = document.createElement('li');
    li.className = 'empty-hint';
    li.textContent = 'まだコメントがありません';
    ul.appendChild(li);
    return;
  }

  for (const r of rooms) {
    const li = document.createElement('li');
    const label = displayUserLabel(r.userKey);
    const isUnknown = r.userKey === UNKNOWN_USER_KEY;
    const hint = isUnknown
      ? `<div class="room-preview" style="font-size:10px;color:#9ca3af">ページが投稿者IDをDOMに出していないときはここにまとまります。拡張を更新して再読み込みするか、開発者ツールでコメント行のHTMLを共有すると改善できます。</div>`
      : '';
    li.innerHTML = `
      <div class="room-meta">
        <span class="room-name" title="${escapeHtml(r.userKey)}">${escapeHtml(label)}</span>
        <span class="room-count">${r.count}件</span>
      </div>
      ${
        r.lastText
          ? `<div class="room-preview">${escapeHtml(r.lastText)}</div>`
          : ''
      }
      ${hint}
    `;
    ul.appendChild(li);
  }
}

/** @returns {Promise<{ url: string, fromActiveTab: boolean }>} */
async function resolveWatchContextUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let url = tab?.url || '';
  if (isNicoLiveWatchUrl(url)) {
    return { url, fromActiveTab: true };
  }
  const stash = await chrome.storage.local.get(KEY_LAST_WATCH_URL);
  const last = stash[KEY_LAST_WATCH_URL];
  if (typeof last === 'string' && isNicoLiveWatchUrl(last)) {
    return { url: last, fromActiveTab: false };
  }
  return { url: '', fromActiveTab: true };
}

async function refresh() {
  const liveEl = $('liveId');
  const countEl = $('count');
  const toggle = /** @type {HTMLInputElement} */ ($('recordToggle'));
  const exportBtn = /** @type {HTMLButtonElement} */ ($('exportJson'));

  const { url, fromActiveTab } = await resolveWatchContextUrl();

  const bagRec = await chrome.storage.local.get(KEY_RECORDING);
  toggle.checked = bagRec[KEY_RECORDING] === true;
  toggle.disabled = false;

  if (!isNicoLiveWatchUrl(url)) {
    liveEl.textContent = '（ニコ生watchを開いてください）';
    countEl.textContent = '-';
    exportBtn.disabled = true;
    renderUserRooms([]);
    return;
  }

  const lv = extractLiveIdFromUrl(url);
  liveEl.textContent =
    lv && !fromActiveTab ? `${lv}（直近の視聴ページ）` : lv || '-';

  if (!lv) {
    countEl.textContent = '-';
    exportBtn.disabled = true;
    renderUserRooms([]);
    return;
  }

  const key = commentsStorageKey(lv);
  const data = await chrome.storage.local.get(key);
  const arr = Array.isArray(data[key]) ? data[key] : [];
  countEl.textContent = String(arr.length);
  exportBtn.disabled = arr.length === 0;
  exportBtn.dataset.liveId = lv;
  exportBtn.dataset.storageKey = key;
  renderUserRooms(arr);
}

async function downloadCommentsJson(liveId, storageKey) {
  const data = await chrome.storage.local.get(storageKey);
  const arr = Array.isArray(data[storageKey]) ? data[storageKey] : [];
  const payload = {
    exportedAt: new Date().toISOString(),
    liveId,
    count: arr.length,
    comments: arr
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nicolivelog-${liveId}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function initPopup() {
  const toggle = /** @type {HTMLInputElement} */ ($('recordToggle'));
  const exportBtn = /** @type {HTMLButtonElement} */ ($('exportJson'));

  toggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ [KEY_RECORDING]: toggle.checked });
    await refresh();
  });

  exportBtn.addEventListener('click', async () => {
    const lv = exportBtn.dataset.liveId;
    const key = exportBtn.dataset.storageKey;
    if (!lv || !key || exportBtn.disabled) return;
    try {
      await downloadCommentsJson(lv, key);
    } catch {
      // no-op
    }
  });

  refresh();
  chrome.storage.onChanged.addListener((_, area) => {
    if (area === 'local') refresh();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
