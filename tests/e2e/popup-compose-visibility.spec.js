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

  test('inline=1（watch 埋め込み）でも primary のコメント入力と送信ボタンを表示する', async ({
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
    const embedVisibility = await embed.evaluate(() => {
      const input = document.getElementById('commentInput');
      const post = document.getElementById('postCommentBtn');
      return {
        inputDisplay: input ? globalThis.getComputedStyle(input).display : null,
        postDisplay: post ? globalThis.getComputedStyle(post).display : null
      };
    });
    expect(embedVisibility.inputDisplay).not.toBe('none');
    expect(embedVisibility.postDisplay).not.toBe('none');

    const side = await context.newPage();
    await side.goto(
      `chrome-extension://${extensionId}/popup.html?inline=1&dock=sidepanel`,
      {
        waitUntil: 'domcontentloaded',
        timeout: 60_000
      }
    );
    await dismissExtensionUsageTermsGate(side);
    const sideVisibility = await side.evaluate(() => {
      const input = document.getElementById('commentInput');
      const post = document.getElementById('postCommentBtn');
      return {
        inputDisplay: input ? globalThis.getComputedStyle(input).display : null,
        postDisplay: post ? globalThis.getComputedStyle(post).display : null
      };
    });
    expect(sideVisibility.inputDisplay).not.toBe('none');
    expect(sideVisibility.postDisplay).not.toBe('none');
  });
});
