import { test, expect } from '@playwright/test';
import { storageResetInit, mockStaticData } from '../utils/testUtils';

// --- Helper function ---
async function expectFifteenLines(page, pageNum: number) {
  const lines = page.locator('#page-block .line');

  const count = await lines.count();

  expect(count, `Expected at least 1 lines on page ${pageNum}, but found ${count}`).toBeGreaterThanOrEqual(1);
}

function getRandomPage(min = 3, max = 604) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

test.beforeEach(async ({ page }) => {
  await storageResetInit(page);
  await mockStaticData(page);
});

test('navigate to mushaf page and verify content', async ({ page }) => {
  const randomPage = getRandomPage();
  await page.goto(`/page/${randomPage}`);

  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  expect(page.url()).toContain(`/page/${randomPage}`);

  const pageContent = page.locator('#page-block');
  await expect(pageContent).toBeVisible();

  await expectFifteenLines(page, randomPage);
});

test('mushaf page navigation between pages', async ({ page }) => {
  const randomPage = getRandomPage();
  await page.goto(`/page/${randomPage}`);
  await page.waitForLoadState('domcontentloaded');

  // Navigate forward one page
  await page.goto(`/page/${randomPage + 1}`);
  await page.waitForLoadState('domcontentloaded');

  expect(page.url()).toContain(`/page/${randomPage + 1}`);
  await expect(page.locator('#page-block')).toBeVisible();

  await expectFifteenLines(page, randomPage + 1);
});

test('mushaf responsive design on different screen sizes', async ({ page }) => {
  const randomPage = getRandomPage();

  // Desktop
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(`/page/${randomPage}`);
  await page.waitForLoadState('domcontentloaded');

  const pageContent = page.locator('#page-block');
  await expect(pageContent).toBeVisible();
  await expectFifteenLines(page, randomPage);

  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  await expect(pageContent).toBeVisible();

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await expect(pageContent).toBeVisible();
});

test('direct page number navigation', async ({ page }) => {
  const testPages = [1, 2, getRandomPage()];

  for (const pageNum of testPages) {
    await page.goto(`/page/${pageNum}`);
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain(`/page/${pageNum}`);
    const pageContent = page.locator('#page-block');
    await expect(pageContent).toBeVisible();

    await expectFifteenLines(page, pageNum);

    await page.waitForTimeout(300);
  }
});

