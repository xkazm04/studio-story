import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '@': resolve(__dirname, 'src'),
          },
        },
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
