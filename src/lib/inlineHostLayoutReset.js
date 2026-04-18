/**
 * インラインパネルの placement（below / beside / floating / dock_bottom）を切り替える際に、
 * 前モードで付けたインラインスタイル・クラスをすべて落とすための純関数群。
 *
 * 旧実装は clearInlineHostFloatingLayout が「floating / dock_bottom を外すとき」だけの
 * 前提で部分的に reset しており、以下のようなバグ #3「パネル位置を変えるとおかしくなる」
 * の原因になっていた:
 *
 *   - renderInlinePanelFloatingHost が clearInlineHostFloatingLayout を呼ばないまま
 *     width / marginLeft / boxSizing / display / opacity / pointerEvents を上書き
 *   - clearInlineHostFloatingLayout が width / maxWidth / marginLeft / boxSizing を
 *     reset リストに入れていない
 *   - renderPageFrameOverlay が below/beside → floating の遷移で cleanup を通らない
 *
 * これらを一発で直すため、「placement 切替時に消すべきインラインスタイル名の正本 list」
 * と「placement 切替時に剥がすべきクラス名の正本 list」をこのモジュールで一元管理する。
 * DOM への適用側（content-entry.js）は applyResetToHost() 経由で使う。
 */

/**
 * placement 切替時に空文字でクリアすべき host 要素のインラインスタイル名リスト。
 * 順序には意味はないが、追加漏れを防ぐ意図で floating / dock_bottom が set する
 * プロパティを網羅する。
 */
export const INLINE_HOST_RESETTABLE_STYLE_PROPERTIES = Object.freeze([
  'position',
  'top',
  'right',
  'left',
  'bottom',
  'width',
  'maxWidth',
  'maxHeight',
  'marginLeft',
  'boxSizing',
  'overflow',
  'overflowX',
  'overflowY',
  'boxShadow',
  'borderRadius',
  'background',
  'zIndex',
  'display',
  'opacity',
  'pointerEvents'
]);

/** placement 切替時に必ず外すクラス名リスト（現状は floating / dock-bottom のみ）。 */
export const INLINE_HOST_PLACEMENT_CLASSES = Object.freeze([
  'nls-inline-host--floating',
  'nls-inline-host--dock-bottom'
]);

/**
 * プレーンオブジェクトや HTMLElement に対して placement reset を適用する。
 * classList / style.property への write を行うだけの副作用関数。
 *
 * テストやコールサイトの単純化のため、host が HTMLElement でなくても
 * classList.remove / style[prop] = '' の shape だけ満たせば動くようにしてある。
 *
 * @param {{
 *   classList?: { remove: (name: string) => void },
 *   style?: Record<string, string>,
 *   removeAttribute?: (name: string) => void
 * } | null | undefined} host
 */
export function applyInlineHostPlacementReset(host) {
  if (!host) return;
  if (host.classList && typeof host.classList.remove === 'function') {
    for (const cls of INLINE_HOST_PLACEMENT_CLASSES) {
      host.classList.remove(cls);
    }
  }
  if (host.style) {
    for (const prop of INLINE_HOST_RESETTABLE_STYLE_PROPERTIES) {
      host.style[prop] = '';
    }
  }
  // aria-hidden は placement によって別途書き換えるため、ここでは落としておく。
  if (typeof host.removeAttribute === 'function') {
    host.removeAttribute('aria-hidden');
  }
}
