import { defineConfig } from '@playwright/test';

/*
 * Doc 10's layer table puts a browser under "visual regression, slow". Two
 * findings moved it forward: the layer spike showed jsdom cannot answer where
 * focus goes, and the token cascade bug showed it cannot answer what colour an
 * element ended up. Both are core guarantees, so a real browser is not the
 * slow optional layer — it is the only instrument for a whole class of rule.
 */
export default defineConfig({
  testDir: './e2e',
  // A failing colour assertion must not be shrugged off as flakiness.
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:6006' },
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:6006',
    // Locally, reuse whatever the developer already has open.
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000
  }
});
