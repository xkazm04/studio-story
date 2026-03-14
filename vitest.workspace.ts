import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      '.',
      {
        test: {
          name: 'dzin',
          root: './packages/dzin/core',
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
          environment: 'node',
        },
      },
    ],
  },
});
