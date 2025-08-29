import { test, expect } from '@playwright/test';
import { storageResetInit, mockStaticData, mockSearchApi } from '../utils/testUtils';

// Use real APIs by default; override with fixtures later if needed
test.beforeEach(async ({ page }) => {
  await storageResetInit(page);
  await mockStaticData(page);
  await mockSearchApi(page, [
    { type: 'quran_chapter', id: '1', score: 0.99 },
    { type: 'quran_page', id: 'p1', score: 0.9 },
  ]);
});

// After search, clicking a navigation result should go to a chapter page and render verses
(test as any).describe.configure({ mode: 'serial' });

test('search and navigate to a verse/chapter', async ({ page, context }) => {
  await page.goto('/search');
  await page.locator('#search-input').fill('Allah');
  await page.getByTitle('Search').click();

  const results = page.locator('#navigation-results a');
  await expect(results.first()).toBeVisible({ timeout: 15000 });

  // Links open in a new tab (target=_blank), capture popup
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    results.first().click()
  ]);
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  await expect(popup.locator('#verses-block .verse').first()).toBeVisible({ timeout: 20000 });
});
