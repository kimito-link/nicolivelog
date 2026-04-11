import { describe, it, expect } from 'vitest';
import {
  KEY_INLINE_PANEL_FLOAT_TO_DOCK_MIGRATED,
  KEY_INLINE_PANEL_PLACEMENT,
  INLINE_PANEL_PLACEMENT_DOCK_BOTTOM,
  INLINE_PANEL_PLACEMENT_FLOATING
} from './storageKeys.js';
import { migrateFloatingInlinePanelToDockOnce } from './migrateInlinePanelFloatToDock.js';

describe('migrateFloatingInlinePanelToDockOnce', () => {
  it('floating なら dock_bottom にしフラグを立てる', async () => {
    const sets = [];
    const storage = {
      async get(keys) {
        expect(keys).toContain(KEY_INLINE_PANEL_PLACEMENT);
        return {
          [KEY_INLINE_PANEL_PLACEMENT]: INLINE_PANEL_PLACEMENT_FLOATING,
          [KEY_INLINE_PANEL_FLOAT_TO_DOCK_MIGRATED]: undefined
        };
      },
      async set(o) {
        sets.push(o);
      }
    };
    const r = await migrateFloatingInlinePanelToDockOnce(storage);
    expect(r.changed).toBe(true);
    expect(sets).toHaveLength(1);
    expect(sets[0][KEY_INLINE_PANEL_PLACEMENT]).toBe(
      INLINE_PANEL_PLACEMENT_DOCK_BOTTOM
    );
    expect(sets[0][KEY_INLINE_PANEL_FLOAT_TO_DOCK_MIGRATED]).toBe(true);
  });

  it('既に移行済みなら何もしない', async () => {
    let setCalls = 0;
    const storage = {
      async get() {
        return {
          [KEY_INLINE_PANEL_PLACEMENT]: INLINE_PANEL_PLACEMENT_FLOATING,
          [KEY_INLINE_PANEL_FLOAT_TO_DOCK_MIGRATED]: true
        };
      },
      async set() {
        setCalls += 1;
      }
    };
    const r = await migrateFloatingInlinePanelToDockOnce(storage);
    expect(r.changed).toBe(false);
    expect(setCalls).toBe(0);
  });

  it('floating 以外は触らない', async () => {
    let setCalls = 0;
    const storage = {
      async get() {
        return {
          [KEY_INLINE_PANEL_PLACEMENT]: 'below',
          [KEY_INLINE_PANEL_FLOAT_TO_DOCK_MIGRATED]: undefined
        };
      },
      async set() {
        setCalls += 1;
      }
    };
    const r = await migrateFloatingInlinePanelToDockOnce(storage);
    expect(r.changed).toBe(false);
    expect(setCalls).toBe(0);
  });
});
