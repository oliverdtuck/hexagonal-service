// @ts-check

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['src/main.ts'],
      include: ['src/**/*.ts'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    restoreMocks: true,
    unstubEnvs: true,
  },
});
