import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// Locally, use the system Chromium if there is one; CI installs Playwright's.
const systemChromium = ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4174/',
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      executablePath: process.env.CI ? undefined : systemChromium,
      // Software WebGL, so the suite runs on machines without a GPU.
      args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
