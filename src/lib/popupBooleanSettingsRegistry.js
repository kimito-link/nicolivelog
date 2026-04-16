/**
 * popup のブール設定コントローラをまとめて扱うレジストリ。
 *
 * - `openBag` など、一括で `chrome.storage.local.get` した結果を全コントローラに配る
 * - `chrome.storage.onChanged` を全コントローラに配る
 * - `storage.local.get` に渡す key 一覧を生成する
 *
 * 純粋オブジェクト。DOM も chrome API も触らない。
 */

/** @typedef {import('./popupBooleanSettingController.js').BooleanSettingController} BooleanSettingController */

/**
 * @typedef {Object} BooleanSettingsRegistry
 * @property {(controller: BooleanSettingController) => BooleanSettingController} register
 * @property {() => string[]} keys
 * @property {(bag: Record<string, unknown>|null|undefined) => void} applyFromBag
 * @property {(changes: Record<string, {newValue?: unknown}>|null|undefined) => string[]} dispatchStorageChanges
 * @property {() => number} size
 */

/**
 * @returns {BooleanSettingsRegistry}
 */
export function createBooleanSettingsRegistry() {
  /** @type {BooleanSettingController[]} */
  const controllers = [];

  return {
    register(controller) {
      if (!controller || typeof controller.key !== 'string' || controller.key === '') {
        throw new Error('createBooleanSettingsRegistry#register: invalid controller');
      }
      controllers.push(controller);
      return controller;
    },
    keys() {
      return controllers.map((c) => c.key);
    },
    applyFromBag(bag) {
      for (const c of controllers) c.applyFromBag(bag);
    },
    dispatchStorageChanges(changes) {
      /** @type {string[]} */
      const hits = [];
      for (const c of controllers) {
        if (c.handleStorageChange(changes)) hits.push(c.key);
      }
      return hits;
    },
    size() {
      return controllers.length;
    }
  };
}
