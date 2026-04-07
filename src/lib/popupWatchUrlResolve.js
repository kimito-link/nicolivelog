import { isNicoLiveWatchUrl } from './broadcastUrl.js';

/**
 * アクティブタブ URL とストレージの最終 watch URL から、ポップアップが参照する URL を決める。
 *
 * @param {chrome.tabs.Tab|undefined} tab
 * @param {unknown} lastWatchUrlRaw
 * @returns {{ url: string, fromActiveTab: boolean }}
 */
export function resolveWatchUrlFromTabAndStash(tab, lastWatchUrlRaw) {
  const tabUrl = tab?.url || '';
  if (isNicoLiveWatchUrl(tabUrl)) {
    return { url: tabUrl, fromActiveTab: true };
  }
  if (
    typeof lastWatchUrlRaw === 'string' &&
    isNicoLiveWatchUrl(lastWatchUrlRaw)
  ) {
    return { url: lastWatchUrlRaw, fromActiveTab: false };
  }
  return { url: '', fromActiveTab: true };
}
