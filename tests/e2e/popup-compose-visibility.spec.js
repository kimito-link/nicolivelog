import { test, expect, dismissExtensionUsageTermsGate } from './fixtures.js';

async function extensionIdFromContext(context) {
  let sw = context.serviceWorkers()[0];
  if (!sw) {
    sw = await context.waitForEvent('serviceworker', { timeout: 60_000 });
  }
  return new URL(sw.url()).hostname;
}

test.describe('popup compose / toolbar-only visibility', () => {
  test('通常ポップアップでは data-nl-toolbar-only のコメント補助セクションが表示される', async ({
    context
  }) => {
    const extensionId = await extensionIdFromContext(context);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000
    });
    await dismissExtensionUsageTermsGate(popup);

    const display = await popup.evaluate(() => {
      const el = document.querySelector(
        'section.nl-comment-compose[data-nl-toolbar-only]'
      );
      return el ? globalThis.getComputedStyle(el).display : null;
    });
    expect(display, '補助セクションが DOM にある').not.toBeNull();
    expect(display).not.toBe('none');
  });

  test('inline=1 では data-nl-toolbar-only セクションが非表示', async ({
    context
  }) => {
    const extensionId = await extensionIdFromContext(context);
    const popup = await context.newPage();
    await popup.goto(
      `chrome-extension://${extensionId}/popup.html?inline=1`,
      {
        waitUntil: 'domcontentloaded',
        timeout: 60_000
      }
    );
    await dismissExtensionUsageTermsGate(popup);

    const display = await popup.evaluate(() => {
      const el = document.querySelector(
        'section.nl-comment-compose[data-nl-toolbar-only]'
      );
      return el ? globalThis.getComputedStyle(el).display : null;
    });
    expect(display, '補助セクションが DOM にある').not.toBeNull();
    expect(display).toBe('none');
  });

  test('inline=1（watch 埋め込み）では primary の #commentInput が非表示・sidepanel では表示', async ({
    context
  }) => {
    const extensionId = await extensionIdFromContext(context);

    const embed = await context.newPage();
    await embed.goto(
      `chrome-extension://${extensionId}/popup.html?inline=1`,
      {
        waitUntil: 'domcontentloaded',
        timeout: 60_000
      }
    );
    await dismissExtensionUsageTermsGate(embed);
    const embedDisplay = await embed.evaluate(() => {
      const el = document.getElementById('commentInput');
      return el ? globalThis.getComputedStyle(el).display : null;
    });
    expect(embedDisplay).toBe('none');

    const side = await context.newPage();
    await side.goto(
      `chrome-extension://${extensionId}/popup.html?inline=1&dock=sidepanel`,
      {
        waitUntil: 'domcontentloaded',
        timeout: 60_000
      }
    );
    await dismissExtensionUsageTermsGate(side);
    const sideDisplay = await side.evaluate(() => {
      const el = document.getElementById('commentInput');
      return el ? globalThis.getComputedStyle(el).display : null;
    });
    expect(sideDisplay).not.toBe('none');
  });
});
