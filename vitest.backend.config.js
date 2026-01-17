import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/webhook.test.js'],
    environment: 'node',
  },
});
