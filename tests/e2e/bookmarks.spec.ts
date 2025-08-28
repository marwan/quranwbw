import { test, expect } from '@playwright/test';

import { storageResetInit } from '../utils/testUtils';

test.beforeEach(async ({ page }) => {
  await storageResetInit(page);
});

test('bookmark persists across reload', async ({ page }) => {
  await page.goto('/1');
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 20000 });
  const optionsBtn = page.getByRole('button', { name: 'Options' }).first();
  await optionsBtn.click();
  await page.getByText(/Bookmark|Unbookmark/).first().click();

  await page.goto('/bookmarks');
  await expect(page.locator('#individual-verses-block')).toBeVisible();

  await page.reload();
  await expect(page.locator('#individual-verses-block')).toBeVisible();
});
