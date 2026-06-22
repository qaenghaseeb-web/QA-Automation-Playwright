// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Enterprise Playwright Configuration
 * QA Automation Framework for OCUS Website
 *
 * Supports: 3 browsers + 3 mobile devices
 * Features: Parallel execution, retries, traces, videos, screenshots
 */
module.exports = defineConfig({
  /* ─── Test Discovery ─── */
  testDir: './tests',
  testMatch: '**/*.spec.js',

  /* ─── Execution Settings ─── */
  fullyParallel: true,
  timeout: 60000, // 60s per test
  expect: {
    timeout: 10000, // 10s per assertion
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05, // 5% diff tolerance for visual tests
    },
  },

  /* ─── CI Safety ─── */
  forbidOnly: !!process.env.CI, // Prevent .only() in CI
  retries: process.env.CI ? 2 : 0, // 2 retries in CI, 0 locally
  workers: process.env.CI ? 2 : undefined, // Limit CI parallelism

  /* ─── Reporting ─── */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'], // Console output
    ['json', { outputFile: 'reports/test-results.json' }],
  ],

  /* ─── Output Directories ─── */
  outputDir: 'test-results/',

  /* ─── Shared Settings ─── */
  use: {
    /* Base URL — all page.goto('/path') will prepend this */
    baseURL: process.env.BASE_URL || 'https://www.ocus.com',

    /* Timeouts */
    actionTimeout: 10000,
    navigationTimeout: 30000,

    /* Evidence Collection */
    trace: 'on-first-retry', // Full trace on retry (saves storage)
    video: 'on-first-retry', // Video on retry only
    screenshot: 'only-on-failure', // Screenshot on every failure

    /* Browser Settings */
    ignoreHTTPSErrors: true,
    locale: 'en-US',
    timezoneId: 'UTC',

    /* Viewport */
    viewport: { width: 1920, height: 1080 },
  },

  /* ─── Browser Projects ─── */
  projects: [
    /* ── Desktop Browsers ── */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    /* ── Mobile Devices ── */
    {
      name: 'iPhone 13',
      use: {
        ...devices['iPhone 13'],
      },
    },
    {
      name: 'Pixel 7',
      use: {
        ...devices['Pixel 7'],
      },
    },
    {
      name: 'iPad Pro 11',
      use: {
        ...devices['iPad Pro 11'],
      },
    },
  ],
});
