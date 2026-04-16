/**
 * H1-Perception（旧）→ H1-Retired: 記録 ON/OFF をファーストビュー hero に出す方針は撤回。
 * 現方針: recordToggle は <details id="nlPopupSettings"> 内に格納し、
 * ON/OFF の機械可読状態は `<html data-nl-recording>` で公開する（CSS / E2E 用フック）。
 * @see docs/ux-tdd-hypothesis-matrix.md
 */
import { test, expect, dismissExtensionUsageTermsGate } from './fixtures.js';

const KEY_RECORDING = 'nls_recording_enabled';

async function extensionServiceWorker(context) {
  const pickExt = () =>
    context.serviceWorkers().find((w) => w.url().startsWith('chrome-extension://'));
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const ext = pickExt();
    if (ext) return ext;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('extension service worker not found');
}

async function extensionIdFromContext(context) {
  const sw = await extensionServiceWorker(context);
  return new URL(sw.url()).hostname;
}

/**
 * @param {import('@playwright/test').BrowserContext} context
 * @param {boolean|null} enabled - true/false を保存。null ならキー削除（既定ON挙動）
 */
async function setRecordingStorage(context, enabled) {
  const sw = await extensionServiceWorker(context);
  await sw.evaluate(
    async ({ key, enabled: en }) => {
      if (en === null) {
        await chrome.storage.local.remove([key]);
      } else {
        await chrome.storage.local.set({ [key]: en });
      }
    },
    { key: KEY_RECORDING, enabled }
  );
}

test.describe('popup 記録状態（html[data-nl-recording] / 詳細設定の中）', () => {
  test('既定 ON: html[data-nl-recording=on] と recordToggle.checked が一致', async ({
    context
  }) => {
    await setRecordingStorage(context, null);
    const extensionId = await extensionIdFromContext(context);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000
    });
    await dismissExtensionUsageTermsGate(popup);

    const html = popup.locator('html');
    await expect(html).toHaveAttribute('data-nl-recording', 'on');

    // recordToggle は詳細設定の中にあるので、開いてから checked を確認
    await popup.locator('#nlPopupSettings > summary').click();
    const toggle = popup.locator('#recordToggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeChecked();
  });

  test('ストレージ false: html[data-nl-recording=off] になる', async ({
    context
  }) => {
    await setRecordingStorage(context, false);
    const extensionId = await extensionIdFromContext(context);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000
    });
    await dismissExtensionUsageTermsGate(popup);

    const html = popup.locator('html');
    await expect(html).toHaveAttribute('data-nl-recording', 'off');

    await popup.locator('#nlPopupSettings > summary').click();
    const toggle = popup.locator('#recordToggle');
    await expect(toggle).not.toBeChecked();
  });

  test('recordToggle に名前（aria-label）が残る（a11y）', async ({ context }) => {
    const extensionId = await extensionIdFromContext(context);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000
    });
    await dismissExtensionUsageTermsGate(popup);

    await popup.locator('#nlPopupSettings > summary').click();
    const toggle = popup.locator('#recordToggle');
    await expect(toggle).toHaveAttribute('aria-label', /.+/);
  });
});

test.describe('popup と inline=1 の記録表示一貫性（H2）', () => {
  test('同一ストレージで html[data-nl-recording] が popup と inline=1 で一致', async ({
    context
  }) => {
    await setRecordingStorage(context, false);
    const extensionId = await extensionIdFromContext(context);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000
    });
    await dismissExtensionUsageTermsGate(popup);
    await expect(popup.locator('html')).toHaveAttribute(
      'data-nl-recording',
      'off'
    );

    const inline = await context.newPage();
    await inline.goto(`chrome-extension://${extensionId}/popup.html?inline=1`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000
    });
    await dismissExtensionUsageTermsGate(inline);
    await expect(inline.locator('html')).toHaveAttribute(
      'data-nl-recording',
      'off'
    );

    await setRecordingStorage(context, true);
    await popup.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
    await dismissExtensionUsageTermsGate(popup);
    await inline.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
    await dismissExtensionUsageTermsGate(inline);

    await expect(popup.locator('html')).toHaveAttribute(
      'data-nl-recording',
      'on'
    );
    await expect(inline.locator('html')).toHaveAttribute(
      'data-nl-recording',
      'on'
    );
  });
});
