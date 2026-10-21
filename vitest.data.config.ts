import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/data/**/*.test.ts', 'tests/regles/**/*.test.ts'],
    fileParallelism: false,
  },
})
