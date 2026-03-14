import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  '.',
  {
    test: {
      name: 'dzin',
      root: './packages/dzin/core',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      environment: 'node',
    },
  },
]);
