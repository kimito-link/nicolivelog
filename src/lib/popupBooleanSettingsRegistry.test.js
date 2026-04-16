import { describe, it, expect } from 'vitest';
import { createBooleanSettingController } from './popupBooleanSettingController.js';
import { createBooleanSettingsRegistry } from './popupBooleanSettingsRegistry.js';

function makeCb() {
  return { checked: false };
}

describe('createBooleanSettingsRegistry', () => {
  it('初期状態で size() === 0、keys() は空配列', () => {
    const reg = createBooleanSettingsRegistry();
    expect(reg.size()).toBe(0);
    expect(reg.keys()).toEqual([]);
  });

  it('register でコントローラが追加され、keys に反映される', () => {
    const reg = createBooleanSettingsRegistry();
    reg.register(
      createBooleanSettingController({
        key: 'nls_a_v1',
        normalize: (raw) => !!raw,
        getCheckbox: () => /** @type {any} */ (makeCb())
      })
    );
    reg.register(
      createBooleanSettingController({
        key: 'nls_b_v1',
        normalize: (raw) => !!raw,
        getCheckbox: () => /** @type {any} */ (makeCb())
      })
    );
    expect(reg.size()).toBe(2);
    expect(reg.keys()).toEqual(['nls_a_v1', 'nls_b_v1']);
  });

  it('register は返り値にコントローラをそのまま返す（チェーン可能）', () => {
    const reg = createBooleanSettingsRegistry();
    const ctrl = createBooleanSettingController({
      key: 'nls_chain_v1',
      normalize: (raw) => !!raw,
      getCheckbox: () => null
    });
    expect(reg.register(ctrl)).toBe(ctrl);
  });

  it('不正なコントローラ登録は throw', () => {
    const reg = createBooleanSettingsRegistry();
    // @ts-expect-error
    expect(() => reg.register(null)).toThrow();
    // @ts-expect-error
    expect(() => reg.register({})).toThrow();
    // @ts-expect-error
    expect(() => reg.register({ key: '' })).toThrow();
  });

  it('applyFromBag は全コントローラに bag を配る', () => {
    const reg = createBooleanSettingsRegistry();
    const cbA = makeCb();
    const cbB = makeCb();
    reg.register(
      createBooleanSettingController({
        key: 'nls_a_v1',
        normalize: (raw) => raw === 1,
        getCheckbox: () => /** @type {any} */ (cbA)
      })
    );
    reg.register(
      createBooleanSettingController({
        key: 'nls_b_v1',
        normalize: (raw) => raw === 'yes',
        getCheckbox: () => /** @type {any} */ (cbB)
      })
    );
    reg.applyFromBag({ nls_a_v1: 1, nls_b_v1: 'yes', irrelevant: 42 });
    expect(cbA.checked).toBe(true);
    expect(cbB.checked).toBe(true);

    reg.applyFromBag({ nls_a_v1: 0, nls_b_v1: 'no' });
    expect(cbA.checked).toBe(false);
    expect(cbB.checked).toBe(false);
  });

  it('dispatchStorageChanges は反応したコントローラの key 配列を返す', () => {
    const reg = createBooleanSettingsRegistry();
    const cbA = makeCb();
    const cbB = makeCb();
    /** @type {boolean[]} */
    const runtimeALog = [];
    /** @type {boolean[]} */
    const runtimeBLog = [];
    reg.register(
      createBooleanSettingController({
        key: 'nls_a_v1',
        normalize: (raw) => raw === true,
        applyRuntime: (v) => runtimeALog.push(v),
        getCheckbox: () => /** @type {any} */ (cbA)
      })
    );
    reg.register(
      createBooleanSettingController({
        key: 'nls_b_v1',
        normalize: (raw) => raw === true,
        applyRuntime: (v) => runtimeBLog.push(v),
        getCheckbox: () => /** @type {any} */ (cbB)
      })
    );

    expect(
      reg.dispatchStorageChanges({ nls_a_v1: { newValue: true } })
    ).toEqual(['nls_a_v1']);
    expect(runtimeALog).toEqual([true]);
    expect(runtimeBLog).toEqual([]);
    expect(cbA.checked).toBe(true);
    expect(cbB.checked).toBe(false);

    expect(
      reg.dispatchStorageChanges({
        nls_a_v1: { newValue: false },
        nls_b_v1: { newValue: true }
      })
    ).toEqual(['nls_a_v1', 'nls_b_v1']);

    expect(
      reg.dispatchStorageChanges({ unrelated_key: { newValue: 42 } })
    ).toEqual([]);
  });

  it('dispatchStorageChanges は null / undefined / 空 でも落ちない', () => {
    const reg = createBooleanSettingsRegistry();
    reg.register(
      createBooleanSettingController({
        key: 'nls_a_v1',
        normalize: (raw) => raw === true,
        getCheckbox: () => null
      })
    );
    expect(reg.dispatchStorageChanges(null)).toEqual([]);
    expect(reg.dispatchStorageChanges(undefined)).toEqual([]);
    expect(reg.dispatchStorageChanges({})).toEqual([]);
  });
});
