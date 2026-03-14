import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'studio-story',
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
          exclude: ['packages/**', '**/node_modules/**'],
        },
      },
      {
        test: {
          name: 'dzin',
          root: resolve(__dirname, 'packages/dzin/core'),
          environment: 'jsdom',
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        },
      },
    ],
  },
});
