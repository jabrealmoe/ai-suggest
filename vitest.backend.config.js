import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/webhook.test.js', 'src/resolvers/applySuggestion.test.js'],
    environment: 'node',
  },
});
