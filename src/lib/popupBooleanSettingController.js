/**
 * popup のブール設定 1 件を管理する純粋コントローラ。
 *
 * 現状の popup-entry.js では、ブール設定ごとに以下の 4 箇所を手書きしていた：
 *   1. `raw → boolean` への正規化
 *   2. runtime 変数への反映（＋キャッシュ無効化・再描画キー破棄などの副作用）
 *   3. checkbox DOM の `checked` 更新
 *   4. `chrome.storage.onChanged` リスナー内の分岐
 *
 * このコントローラは 1〜4 を 1 箇所の定義に集約する。write 側（`change`
 * イベントで `chrome.storage.local.set` を呼ぶ部分）と、write 後の
 * `safeRefresh()` などはコールサイトに残す（設定ごとに副作用が異なるため）。
 *
 * ブラウザ API（chrome.storage, document）への直接依存はここには置かず、
 * `getCheckbox` は callback で注入する。テストは jsdom なしで書ける。
 */

/**
 * @typedef {Object} BooleanSettingControllerSpec
 * @property {string} key chrome.storage.local key
 * @property {(raw: unknown) => boolean} [normalize] 正規化関数（省略時は `raw !== false`）
 * @property {() => (HTMLInputElement|null)} [getCheckbox] DOM アクセサ（省略時は無効化）
 * @property {(value: boolean) => void} [applyRuntime] runtime 副作用（キャッシュクリア等）
 */

/**
 * @typedef {Object} BooleanSettingController
 * @property {string} key
 * @property {(raw: unknown) => boolean} applyRaw raw 値から一連の反映を行う
 * @property {(bag: Record<string, unknown>|null|undefined) => boolean} applyFromBag bag からキーで引いて反映
 * @property {(changes: Record<string, {newValue?: unknown}>|null|undefined) => boolean} handleStorageChange 変更があれば反映して true
 */

/**
 * @param {BooleanSettingControllerSpec} spec
 * @returns {BooleanSettingController}
 */
export function createBooleanSettingController(spec) {
  if (!spec || typeof spec.key !== 'string' || spec.key === '') {
    throw new Error('createBooleanSettingController: spec.key is required');
  }
  const key = spec.key;
  /** @type {(raw: unknown) => boolean} */
  const normalize =
    typeof spec.normalize === 'function' ? spec.normalize : (raw) => raw !== false;
  /** @type {() => (HTMLInputElement|null)} */
  const getCheckbox =
    typeof spec.getCheckbox === 'function' ? spec.getCheckbox : () => null;
  /** @type {((value: boolean) => void)|null} */
  const applyRuntime =
    typeof spec.applyRuntime === 'function' ? spec.applyRuntime : null;

  /** @param {unknown} raw */
  function applyRaw(raw) {
    const value = normalize(raw);
    if (applyRuntime) applyRuntime(value);
    const cb = getCheckbox();
    if (cb) cb.checked = value;
    return value;
  }

  return {
    key,
    applyRaw,
    applyFromBag(bag) {
      return applyRaw(bag ? bag[key] : undefined);
    },
    handleStorageChange(changes) {
      if (!changes || !Object.prototype.hasOwnProperty.call(changes, key)) return false;
      applyRaw(changes[key].newValue);
      return true;
    }
  };
}
