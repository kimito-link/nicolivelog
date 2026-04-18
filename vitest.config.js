import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.js',
      // アーキテクチャレベルの不変条件（レイヤ依存など）は
      // docs/lane-architecture-redesign.md §5 Phase 0 で導入。
      'tests/contract/**/*.test.js'
    ]
  }
});
