import type { Page } from '@playwright/test';

// Shared utilities for Playwright E2E tests.
// - storageResetInit: clears localStorage/session and best-effort IndexedDB once per test run
// - mockStaticData: proxies real static data endpoints and allows optional overrides
// - mockSearchApi: proxies real search API results with optional fixture overrides

/**
 * Inject a script that clears storage once per browser context creation.
 * Use in test.beforeEach: await storageResetInit(page)
 */
export async function storageResetInit(page: Page) {
  await page.addInitScript(() => {
    const alreadyCleared = sessionStorage.getItem('__e2e_storage_cleared');
    if (!alreadyCleared) {
      localStorage.clear();
      sessionStorage.setItem('__e2e_storage_cleared', '1');
        indexedDB?.databases?.().then((dbs) => dbs?.forEach((db) => db.name && indexedDB.deleteDatabase(db.name)));
      }
  });
}

type OverrideHandler = (args: { url: URL; path: string }) => Promise<unknown> | unknown;

/**
 * Route static.quranwbw.com requests to real data by default, with optional inline overrides.
 * Pass an overrides object with handlers by URL-suffix (string) or regex string key.
 */
export async function mockStaticData(page: Page, overrides: Record<string, OverrideHandler> = {}) {
  await page.route('https://static.quranwbw.com/data/v4/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    for (const [key, handler] of Object.entries(overrides)) {
      let matches = false;
      if (key.startsWith('re:')) {
        const rx = new RegExp(key.slice(3));
        matches = rx.test(path);
      } else {
        matches = path.endsWith(key);
      }
      if (matches) {
        const res = await handler({ url, path });
        return route.fulfill({ json: res as any });
      }
    }

    return route.fallback();
  });
}

/**
 * Route the search API; by default, allow real API. Optionally provide fixture results.
 */
export async function mockSearchApi(page: Page, fixtureResults: any[] | null = null) {
  await page.route('https://api.kalimat.dev/search**', async (route) => {
    if (fixtureResults) {
      return route.fulfill({ json: fixtureResults });
    }
    return route.fallback();
  });
}

/**
 * Stub HTMLMediaElement audio methods to avoid playback errors in CI.
 * Call early in a test (before interactions that trigger audio).
 */
export async function mockAudio(page: Page) {
  await page.addInitScript(() => {
    const proto = window.HTMLMediaElement && window.HTMLMediaElement.prototype;
    if (!proto) return;
    const noop = () => {};
    // Some browsers throw NotAllowedError for play without gesture; make it a no-op that resolves
    if (!proto.play || (proto.play && !('__e2ePatched' in proto.play))) {
      const play = function () {
        return Promise.resolve();
      } as any;
      (play as any).__e2ePatched = true;
      Object.defineProperty(proto, 'play', { configurable: true, writable: true, value: play });
    }
    if (!proto.pause) Object.defineProperty(proto, 'pause', { configurable: true, writable: true, value: noop });
    if (!Object.getOwnPropertyDescriptor(proto, 'muted')) {
      Object.defineProperty(proto, 'muted', { configurable: true, writable: true, value: true });
    }
    if (!Object.getOwnPropertyDescriptor(proto, 'volume')) {
      Object.defineProperty(proto, 'volume', { configurable: true, writable: true, value: 0 });
    }
  });
}

/**
 * Convenience: warm chapter cache by visiting a chapter and waiting for verses.
 */
export async function warmChapterCache(page: Page, chapter = 1) {
  await page.goto(`/${chapter}`);
  await page.locator('#chapter-block').waitFor({ timeout: 15000 });
  await page.locator('#verses-block .verse').first().waitFor({ timeout: 20000 });
}

export async function simulateOffline(page: Page) {
  await page.route('**/*', route => {
    route.abort('failed'); // block all network requests
  });
}