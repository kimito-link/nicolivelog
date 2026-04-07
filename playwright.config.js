import { defineConfig } from '@playwright/test';

/**
 * 拡張機能の読み込みは Chromium の永続コンテキストが必要で、多くの環境では headless 非対応。
 * ローカルでの操作確認（ヘッド付き既定）: test:e2e:headed / test:e2e:interaction / test:e2e:smoke / test:e2e:monkey / test:e2e:ui
 * SKIP_E2E=1 は npm スクリプト `scripts/run-e2e.mjs` 側で処理（playwright 自体を起動しない）。
 *
 * E2E_NO_WEBSERVER=1 … モック watch 用の静的サーバを立てない（chrome-extension:// のみの spec 向け）。
 */
const e2eNoWebServer = process.env.E2E_NO_WEBSERVER === '1';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    // 既定はヘッド付き（ブラウザが見える）。CI は xvfb など仮想ディスプレイで同設定を流用。
    headless: false,
    trace: 'on-first-retry'
  },
  ...(e2eNoWebServer
    ? {}
    : {
        webServer: {
          command: 'npx serve tests/e2e/fixtures -l 3456 --no-request-logging',
          url: 'http://127.0.0.1:3456/watch/lv888888888/',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000
        }
      })
});
