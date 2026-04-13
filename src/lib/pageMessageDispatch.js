/**
 * page-intercept → content-entry の postMessage ディスパッチテーブル。
 * 星野ロミ式「データ駆動ルール配列」パターンで if/else チェーンを排除。
 */

/** @type {string[]} */
export const PAGE_MSG_TYPES = [
  'NLS_INTERCEPT_SCHEDULE',
  'NLS_INTERCEPT_STATISTICS',
  'NLS_INTERCEPT_VIEWER_JOIN',
  'NLS_INTERCEPT_EMBEDDED_DATA',
  'NLS_INTERCEPT_CHAT_ROWS',
  'NLS_INTERCEPT_GIFT_USERS',
  'NLS_INTERCEPT_USERID'
];

/**
 * @typedef {{ type: string, run?: (data: any, state: any) => void }} PageMessageHandlerDef
 */

/** @type {PageMessageHandlerDef[]} */
const HANDLERS = PAGE_MSG_TYPES.map((type) => ({ type }));

/**
 * @param {string} type
 * @returns {PageMessageHandlerDef|undefined}
 */
export function findPageMessageHandler(type) {
  return HANDLERS.find((h) => h.type === type);
}
