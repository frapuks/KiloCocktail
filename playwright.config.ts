import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5173' },
  projects: [{ name: 'webkit', use: { ...devices['iPad (gen 7) landscape'] } }],
  webServer: {
    command: 'npm run dev:emulateurs -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
