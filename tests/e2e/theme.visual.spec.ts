import { test, expect } from '@playwright/test';
import { storageResetInit, mockStaticData } from '../utils/testUtils';

// Validate classes and a representative computed style after theme switch

test.beforeEach(async ({ page }) => {
  await storageResetInit(page);
  await mockStaticData(page);
});

test('theme switch updates html class and representative color', async ({ page }) => {
  await page.goto('/1');
  const firstVerse = page.locator('#verses-block .verse').first();
  await firstVerse.waitFor({ timeout: 20000 });

  const htmlBefore = await page.locator('html').getAttribute('class');
  expect(htmlBefore || '').not.toContain('theme-6');

  // Switch theme to Midnight Blue (id 6)
  await page.getByTitle('Settings').click();
  await page.locator('#website-theme-setting button').click();
  await page.locator('#individual-setting').getByText('Midnight Blue', { exact: true }).click();
  await page.waitForFunction(() => document.documentElement.className.includes('theme-6'));

  const htmlAfter = await page.locator('html').getAttribute('class');
  expect(htmlAfter || '').toContain('theme-6');

  // Representative token: compute a background/text color on the verse container
  const colors = await firstVerse.evaluate((el) => {
    const cs = getComputedStyle(el as HTMLElement);
    return { color: cs.color, background: cs.backgroundColor };
  });
  // Sanity: colors are non-empty and valid rgb/rgba strings
  expect(colors.color).toMatch(/^rgb/);
  expect(colors.background).toMatch(/^rgba?|^rgb/);
});
