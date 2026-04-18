import { describe, it, expect } from 'vitest';
import { createBooleanSettingController } from './popupBooleanSettingController.js';

/**
 * jsdom に依存せず、`getCheckbox` で注入したフェイク要素（`{checked: boolean}`）で検証する。
 */
function makeFakeCheckbox() {
  return { checked: false };
}

describe('createBooleanSettingController', () => {
  it('key が未指定だと throw', () => {
    // @ts-expect-error: 意図的な不正入力
    expect(() => createBooleanSettingController({})).toThrow();
    // @ts-expect-error: 意図的な不正入力
    expect(() => createBooleanSettingController({ key: '' })).toThrow();
  });

  it('省略時 normalize は `raw !== false`（true-by-default）', () => {
    const cb = makeFakeCheckbox();
    const ctrl = createBooleanSettingController({
      key: 'nls_test_v1',
      getCheckbox: () => /** @type {any} */ (cb)
    });
    expect(ctrl.applyRaw(undefined)).toBe(true);
    expect(cb.checked).toBe(true);
    expect(ctrl.applyRaw(null)).toBe(true);
    expect(ctrl.applyRaw(true)).toBe(true);
    expect(ctrl.applyRaw(false)).toBe(false);
    expect(cb.checked).toBe(false);
  });

  it('applyRaw は normalize → applyRuntime → checkbox の順で反映する', () => {
    const cb = makeFakeCheckbox();
    /** @type {Array<{phase: string, value?: boolean}>} */
    const log = [];
    const ctrl = createBooleanSettingController({
      key: 'nls_ordered_v1',
      normalize: (raw) => {
        log.push({ phase: 'normalize' });
        return raw === 'yes';
      },
      applyRuntime: (value) => {
        log.push({ phase: 'applyRuntime', value });
      },
      getCheckbox: () => {
        log.push({ phase: 'getCheckbox' });
        return /** @type {any} */ (cb);
      }
    });
    ctrl.applyRaw('yes');
    expect(log.map((e) => e.phase)).toEqual([
      'normalize',
      'applyRuntime',
      'getCheckbox'
    ]);
    expect(log[1]).toEqual({ phase: 'applyRuntime', value: true });
    expect(cb.checked).toBe(true);
  });

  it('applyFromBag は指定 key を引いて反映、bag が null でも落ちない', () => {
    const cb = makeFakeCheckbox();
    const ctrl = createBooleanSettingController({
      key: 'nls_bag_v1',
      normalize: (raw) => raw === true,
      getCheckbox: () => /** @type {any} */ (cb)
    });
    expect(ctrl.applyFromBag({ nls_bag_v1: true, nls_other: false })).toBe(true);
    expect(cb.checked).toBe(true);
    expect(ctrl.applyFromBag(null)).toBe(false);
    expect(cb.checked).toBe(false);
    expect(ctrl.applyFromBag(undefined)).toBe(false);
  });

  it('handleStorageChange は該当 key 変更時のみ true', () => {
    const cb = makeFakeCheckbox();
    /** @type {boolean[]} */
    const runtimeLog = [];
    const ctrl = createBooleanSettingController({
      key: 'nls_changes_v1',
      normalize: (raw) => raw === 1,
      applyRuntime: (v) => runtimeLog.push(v),
      getCheckbox: () => /** @type {any} */ (cb)
    });

    // 無関係 key は false、applyRuntime も呼ばれない
    expect(ctrl.handleStorageChange({ some_other_key: { newValue: 1 } })).toBe(false);
    expect(runtimeLog).toEqual([]);

    // 該当 key は true、newValue で反映
    expect(ctrl.handleStorageChange({ nls_changes_v1: { newValue: 1 } })).toBe(true);
    expect(runtimeLog).toEqual([true]);
    expect(cb.checked).toBe(true);

    // 該当 key で別 newValue
    expect(ctrl.handleStorageChange({ nls_changes_v1: { newValue: 0 } })).toBe(true);
    expect(runtimeLog).toEqual([true, false]);
    expect(cb.checked).toBe(false);

    // null / undefined / 空オブジェクト
    expect(ctrl.handleStorageChange(null)).toBe(false);
    expect(ctrl.handleStorageChange(undefined)).toBe(false);
    expect(ctrl.handleStorageChange({})).toBe(false);
  });

  it('getCheckbox が null を返してもクラッシュしない', () => {
    const ctrl = createBooleanSettingController({
      key: 'nls_nocb_v1',
      normalize: (raw) => raw === true,
      getCheckbox: () => null
    });
    expect(() => ctrl.applyRaw(true)).not.toThrow();
    expect(() => ctrl.applyFromBag({ nls_nocb_v1: true })).not.toThrow();
    expect(() =>
      ctrl.handleStorageChange({ nls_nocb_v1: { newValue: true } })
    ).not.toThrow();
  });

  it('applyRuntime が未指定でも動作する（checkbox のみ更新）', () => {
    const cb = makeFakeCheckbox();
    const ctrl = createBooleanSettingController({
      key: 'nls_noruntime_v1',
      normalize: (raw) => raw === 'on',
      getCheckbox: () => /** @type {any} */ (cb)
    });
    expect(ctrl.applyRaw('on')).toBe(true);
    expect(cb.checked).toBe(true);
  });

  it('key は hasOwnProperty で判定（プロトタイプ汚染を拾わない）', () => {
    const cb = makeFakeCheckbox();
    const ctrl = createBooleanSettingController({
      key: 'toString',
      getCheckbox: () => /** @type {any} */ (cb)
    });
    // 空オブジェクトに toString はあるが hasOwnProperty では false
    expect(ctrl.handleStorageChange({})).toBe(false);
    // 明示的に存在すれば true
    expect(ctrl.handleStorageChange({ toString: { newValue: true } })).toBe(true);
  });
});
