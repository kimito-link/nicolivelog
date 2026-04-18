/**
 * 旧パス：`src/lib/htmlEscape.js`
 *
 * Phase 1 以降の正本は `src/shared/html/escape.js` にある。
 * ここは transitional re-export として残してあり、新規 import は `shared/html/escape.js`
 * から行うこと（docs/lane-architecture-redesign.md §5 Phase 1 参照）。
 * Phase 5 で本ファイルは削除される予定。
 */

export { escapeHtml, escapeAttr } from '../shared/html/escape.js';
