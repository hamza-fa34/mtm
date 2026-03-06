import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['api/**', 'node_modules/**', 'dist/**', 'migrated_prompt_history/**'],
  },
});
